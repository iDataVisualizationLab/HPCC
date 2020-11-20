var timeArcopt = {width:1400,height:700, margin: {top: 10, right: 10, bottom: 0, left: 350},
    offset: {top: 0}};
let ConnectedScatterPlot = function (){
    let graphicopt = {
        contain: '#Chartcontent',
        margin: {top: 0, right: 0, bottom: 0, left: 0},
        offset: {top: 0},
        width: 50,
        height: 50,
        scalezoom: 1,
        widthView: function () {
            return this.width * this.scalezoom
        },
        heightView: function () {
            return this.height * this.scalezoom
        },
        widthG: function () {
            return this.widthView() - this.margin.left - this.margin.right
        },
        heightG: function () {
            return this.heightView() - this.margin.top - this.margin.bottom
        },
        display: {
            links: {
                'stroke-opacity': 0.5
            }
        },
        selectedOpt: 0
    };
    let scheme={};
    let contain = d3.select(graphicopt.contain);
    let table,tbody;
    let master = {};
    let isFirst = true;
    let color = d3.scaleLinear()
        .range(colorScaleList.scag.slice())
        .interpolate(d3.interpolateHcl);
    color.domain(color.range().map((d,i)=>i/(color.range().length-1)));
    let colorP = d3.scaleLinear()
        .range(['black','green'])
        .interpolate(d3.interpolateHcl);
    let layout={};
    master.reset = function(){

        return master;
    };
    master.mouseover = [];
    master.mouseover.dict={};
    master.mouseout = [];
    master.mouseout.dict={};
    master.click = [];
    master.click.dict={};
    master.mouseoverAdd = function(id,func){
        if (master.mouseover.dict[id]!==undefined)
            master.mouseover[master.mouseover.dict[id]] = func;
        else {
            master.mouseover.push(func);
            master.mouseover.dict[id] = master.mouseover.length-1;
        }
    }
    master.mouseoutAdd = function(id,func){
        if (master.mouseout.dict[id]!==undefined)
            master.mouseout[master.mouseout.dict[id]] = func;
        else {
            master.mouseout.push(func)
            master.mouseout.dict[id] = master.mouseout.length-1;
        }
    }
    master.clickAdd = function(id,func){
        if (master.click.dict[id]!==undefined)
            master.click[master.click.dict[id]] = func;
        else {
            master.click.push(func)
            master.click.dict[id] = master.click.length-1;
        }
    }
    master.init = function () {
        table = contain.select('table');
        if (table.empty()){
            table=contain.append('table').attr('class','table table-bordered table-striped');
            table.append('tbody');
        }
        tbody = table.select('tbody');
        return master;
    };
    function drawElement(contain,data){
        const line = d3.line().x(d=>d[0]*graphicopt.widthG()).y(d=>graphicopt.heightG()*(1-d[1]))
            .curve(d3.curveCatmullRom.alpha(0.5))
            .defined(d=>d&&(_.isNumber(d[0])&&_.isNumber(d[1])));
        contain.select('g.content').remove();
        let svg = contain.style('border','1px solid gray')
            .style('background-color',d=>color(d.measure)).attr('width',graphicopt.width).attr('height',graphicopt.height)
            .style('width',graphicopt.width+'px').style('height',graphicopt.height+'px')
            .style('overflow','visible');
        g = svg.append('g').attr('class','content').attr('transform',`translate(${[graphicopt.margin.left,graphicopt.margin.top]})`);
        g.selectAll('path').data([data.value])
            .join('path')
            .attr('d',line)
            .attr('fill','none').attr('stroke','#4c4c4c');
        const pointdata = data.value.filter(d=>d&&(_.isNumber(d[0])&&_.isNumber(d[1])))
        g.selectAll('circle').data([pointdata[0],pointdata[pointdata.length-1]])
            .join('circle')
            .attr('r',2)
            .attr('cx',d=>d[0]*graphicopt.widthG())
            .attr('cy',d=>graphicopt.heightG()*(1-d[1]))
            .attr('opacity',(d,i)=>i?1:0.2)
            .attr('fill',(d,i)=>i?'green':'black');
        g.append('text').attr('x',graphicopt.widthG()/2).attr('y',graphicopt.heightG()/2)
            .attr('text-anchor','middle')
            .text(d3.format('.2f')(data.measure))
        g.append('title').text(d=>`node: ${data.key} /n ${d3.extent(pointdata,e=>e[2])}`)
    }
    function drawLargeElement(contain,data){
        const scale = 6;
        const width = graphicopt.width*scale;
        const height = graphicopt.height*scale;
        const w = graphicopt.widthG()*scale;
        const h = graphicopt.heightG()*scale;
        const margin = {};
        d3.entries(graphicopt.margin).forEach(k=>margin[k]*scale);
        const line = d3.line().x(d=>d[0]*w).y(d=>h*(1-d[1]))
            .curve(d3.curveCatmullRom.alpha(0.5))
            .defined(d=>d&&(_.isNumber(d[0])&&_.isNumber(d[1])));
        contain.select('g.content').remove();
        let svg = contain.datum(data).style('border','1px solid gray')
            .style('background-color',d=>color(d.measure)).attr('width',width).attr('height',height)
            .style('width',width+'px').style('height',height+'px')
            .style('overflow','visible');
        g = svg.append('g').attr('class','content').attr('transform',`translate(${[margin.left,margin.top]})`);
        g.selectAll('path').data([data.value])
            .join('path')
            .attr('d',line)
            .attr('fill','none').attr('stroke','#4c4c4c');
        const pointdata = data.value.filter(d=>d&&(_.isNumber(d[0])&&_.isNumber(d[1])))
        g.selectAll('circle').data(pointdata)
            .join('circle')
            .attr('r',2)
            .attr('cx',d=>d[0]*w)
            .attr('cy',d=>h*(1-d[1]))
            .attr('opacity',(d,i)=>i===(pointdata.length-1)?1:0.2)
            .attr('fill',(d,i)=>i===(pointdata.length-1)?'green':'black');
        g.append('text').attr('x',w/2).attr('y',h/2)
            .attr('text-anchor','middle')
            .text(d3.format('.2f')(data.measure));
    }
    function getMeasure(d){
        if (d.invalid)
            return undefined;
        const val = scheme.measure[graphicopt.selectedOpt][d.plotID][0][2];
        if (_.isNaN(val)||val===-1)
            return undefined;
        return val
    }
    master.stop = function (){

    };

    master.draw = function () {
        if (isFirst) {
            master.init();
            isFirst = false;
        }
        scheme.data.forEach(u=>{
            u.value.forEach(d=>d.measure = getMeasure(d));
            u.value.sort((a,b)=>(a.measure??-1)-(b.measure??-1))
        })
        const tr = tbody.selectAll('tr').data(scheme.data)
            .join('tr');
        const th = tr.selectAll('th').data(d=>[d.key]).join('th').text(d=>d);
        const td = tr.selectAll('td').data(d=>[d.value.filter(e=>e.measure!==undefined)])
            .join('td');
        td.selectAll('svg').data(d=>d)
            .join('svg')
            .on('click',d=>drawLargeElement(d3.select('#mini_plot'),d))
            .each(function(d){
            drawElement(d3.select(this),d);
        });

        // TimeArc.runopt(scheme).data(scheme.data).draw();

        updateProcess();
    };
    master.graphicopt = function (__) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in __) {
                if ('undefined' !== typeof __[i]) {
                    graphicopt[i] = __[i];
                }
            }
            return master;
        }else {
            return graphicopt;
        }

    };
    let isNeedRender = true;
    master.scheme = function (__) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in __) {
                if ('undefined' !== typeof __[i]) {
                    scheme[i] = __[i];
                }
            }
            return master;
        }else {
            return scheme;
        }

    };
    master.getColorScale = function(_data) {
        return arguments.length?(getColorScale=_data?_data:function(){return color},master):getColorScale;
    };
    master.schema = function (){
        isNeedRender = true;
    };
    master.layout = function(d){
        layout = {};
        d.forEach(k=>layout[k.Name]= _.flatten(k.value).filter(d=>d))
    };
    return master;
};
function handle_data_timeArc () {
    const graphicopt = subObject.graphicopt();
    const keys = Layout.timespan//.slice(0,10);
    let scheme ={limitColums : [0,10],
        limitTime : [keys[0],keys[keys.length-1]],
        time: {rate:5,unit:'Minute'},
        // timeLink: {rate:5,unit:'Minute'},
        timeformat: d3.timeDay.every(1),
    };
    scheme.data=[];
    scheme.data.timespan = keys;
    const selectedService = ['CPU1 Temp','Memory usage'];
    scheme.data.selectedService = selectedService;
    // let userlist = ['hge', 'presmcdo', 'adegbalo', 'juandomi'];
    let userlist = Object.keys(Layout.usersStatic);
    scheme.range = [[Infinity,-Infinity],[Infinity,-Infinity]];
    userlist.forEach(u=>{
        scheme.data.push({key:u,value:d3.entries(Layout.ranking.byUser[u][selectedService[0]])
            .map(comp=>{
                return {key:comp.key,valueRaw:keys.map((t,i)=>{
                    const v1 = comp.value[i];
                    const val1 = v1||undefined;
                    const val2 = Layout.ranking.byUser[u][selectedService[1]][comp.key][i]||undefined;
                    scheme.range[0][0] = (val1<scheme.range[0][0])?val1:scheme.range[0][0];
                    scheme.range[0][1] = (val1>scheme.range[0][1])?val1:scheme.range[0][1];
                    scheme.range[1][0] = (val2<scheme.range[1][0])?val2:scheme.range[1][0];
                    scheme.range[1][1] = (val2>scheme.range[1][1])?val2:scheme.range[1][1];
                    return [val1,val2];
                })}
            })})
    });
    debugger
    // format files
    const files = [[],[],[]];
    files[0].columns=['user','userid','Type'];
    keys.forEach(d=>files.push(''+d));
    files[1].columns= ["code", "name"];
    files[2].columns= ["code", "name"];
    selectedService.forEach(s=>{files[2].push({code:s,name:s})});
    const selectedScale = selectedService.map((s,si)=>d3.scaleLinear().domain(scheme.range[si]));
    const normalizeData = [];
    scheme.data.forEach(u=>{
        u.value.forEach(e=>{
            e.value= e.valueRaw.map((d,ti)=>[d[0]?selectedScale[0](d[0]):undefined,d[1]?selectedScale[1](d[1]):undefined,keys[ti]]);
            e.invalid = e.value.filter(d=>(d[0]!==undefined)&&(d[1]!==undefined)).length<30;
            const obj1 = {'user':u.key+e.key,'userid':u.key+e.key, 'Type': selectedService[0]};
            const obj2 = {'user':u.key+e.key,'userid':u.key+e.key, 'Type': selectedService[1]};
            keys.forEach((k,ki)=>{
                obj1[k] = e.value[ki][0]??'';
                obj2[k] = e.value[ki][1]??'';
            });
            e.plotID = normalizeData.length;
            normalizeData.push([e.value.map(d=>d[0]===undefined?-Infinity:d[0]),e.value.map(d=>d[1]===undefined?-Infinity:d[1])]);
            files[0].push(obj1);
            files[0].push(obj2);
            files[1].push({code:u.key+e.key,name:u.key+e.key});
        });
    });

    let myData = new Data_processing(files);
    myData.read();
    let compute = new Visual_feature_2D({smooth:false,experiment:myData.experiment});
    compute.Loop();
    debugger
    const index2instance = new Map();
    files[1].forEach((f,i)=>index2instance.set(i,f['code']));
    const index2dim = new Map();
    files[2].forEach((f,i)=>index2dim.set(i,f['code']));
    scheme.measure = calculateMeasure2D({data:normalizeData,index2instance,index2dim,experiment:compute.experiment})
debugger
    subObject.scheme(scheme).draw();
}
