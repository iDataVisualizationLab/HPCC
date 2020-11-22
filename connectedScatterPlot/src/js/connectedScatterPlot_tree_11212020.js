var timeArcopt = {width:1400,height:700, margin: {top: 10, right: 10, bottom: 0, left: 350},
    offset: {top: 0}};
let ConnectedScatterPlot = function (){
    let graphicopt = {
        contain: '#Chartcontent',
        offset: {top: 0},
        margin: {top: 10, right: 120, bottom: 10, left: 40},
        width: 1000,
        height: 800,
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
        scatterplot:{
            margin: {top: 0, right: 0, bottom: 0, left: 0},
            width: 20,
            height: 20,
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
            }
        },
        dx:20,
        dy:159,
        display: {
            links: {
                'stroke-opacity': 0.5
            }
        },
        selectedOpt: 0
    };
    let scheme={};
    let contain = d3.select(graphicopt.contain);
    let svg,g,gLink,gNode,root,tree;
    let diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x)
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
        svg = contain.select('svg');
        if (svg.empty()){
            svg=contain.append('svg').attr('class','svg-main')
                .attr("viewBox", [-graphicopt.margin.left, -graphicopt.margin.top, graphicopt.width, graphicopt.dx])
                .style('width','100%')
                .style("font", "10px sans-serif")
                .style("user-select", "none");
            gLink = svg.append("g")
                .attr("fill", "none")
                .attr("stroke", "#555")
                .attr("stroke-opacity", 0.4)
                .attr("stroke-width", 1.5);

            gNode = svg.append("g")
                .attr("cursor", "pointer")
                .attr("pointer-events", "all");
        }
        graphicopt.dy = graphicopt.widthG()/6;
        tree = d3.tree().nodeSize([graphicopt.dx, graphicopt.dy]);
        return master;
    };
    function drawElement(contain,data){
        graphicopt.scatterplot.width=graphicopt.dx;
        graphicopt.scatterplot.height=graphicopt.dx;
        const line = d3.line().x(d=>d[0]*graphicopt.scatterplot.widthG()).y(d=>graphicopt.scatterplot.heightG()*(1-d[1]))
            .curve(d3.curveCatmullRom.alpha(0.5))
            .defined(d=>d&&(_.isNumber(d[0])&&_.isNumber(d[1])));
        contain.select('g.content').remove();
        const svg = contain.style('border','1px solid gray')
            .style('background-color',d=>color(d.measure)).attr('width',graphicopt.scatterplot.width).attr('height',graphicopt.scatterplot.height)
            .style('width',graphicopt.scatterplot.width+'px').style('height',graphicopt.scatterplot.height+'px')
            .style('overflow','visible');
        const g = svg.append('g').attr('class','content').attr('transform',`translate(${[graphicopt.scatterplot.margin.left,graphicopt.scatterplot.margin.top]})`);
        debugger
        if (data.measure>=0){
            g.append('rect').attr('width',graphicopt.scatterplot.widthG())
                .attr('height',graphicopt.scatterplot.heightG())
                .attr('fill',d=>color(data.measure))
                .attr('stroke','black')
            g.selectAll('path').data([data.value])
                .join('path')
                .attr('d',line)
                .attr('fill','none').attr('stroke','#4c4c4c');
            const pointdata = data.value.filter(d=>d&&(_.isNumber(d[0])&&_.isNumber(d[1])))
            g.selectAll('circle').data([pointdata[0],pointdata[pointdata.length-1]])
                .join('circle')
                .attr('r',2)
                .attr('cx',d=>d[0]*graphicopt.scatterplot.widthG())
                .attr('cy',d=>graphicopt.scatterplot.heightG()*(1-d[1]))
                .attr('opacity',(d,i)=>i?1:0.2)
                .attr('fill',(d,i)=>i?'green':'black');
            // g.append('text').attr('x',graphicopt.scatterplot.widthG()/2).attr('y',graphicopt.scatterplot.heightG()/2)
            //     .attr('text-anchor','middle')
            //     .text(d3.format('.2f')(data.measure));
        }
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


        update(root)

        updateProcess();
    };
    function update(source){
        const duration = d3.event && d3.event.altKey ? 2500 : 250;
        const nodes = root.descendants().reverse();
        const links = root.links();

        // Compute the new tree layout.
        tree(root);

        let left = root;
        let right = root;
        root.eachBefore(node => {
            if (node.x < left.x) left = node;
            if (node.x > right.x) right = node;
        });

        const height = right.x - left.x + graphicopt.margin.top + graphicopt.margin.bottom;

        const transition = svg.transition()
            .duration(duration)
            .attr("viewBox", [-graphicopt.margin.left, left.x - graphicopt.margin.top, graphicopt.width, height])
            .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));

        // Update the nodes…
        const node = gNode.selectAll("g.el")
            .data(nodes, d => d.id);

        // Enter any new nodes at the parent's previous position.
        const nodeEnter = node.enter().append("g")
            .attr('class','el')
            .attr("transform", d => `translate(${source.y0},${source.x0})`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0)
            .on("click", (d) => {
                d.children = d.children ? null : d._children;
                update(d);
            });

        nodeEnter.filter(d=>!d.data.value).append("circle")
            .attr("r", 2.5)
            .attr("fill", d => d._children ? "#555" : "#999")
            .attr("stroke-width", 10);
        nodeEnter.filter(d=>d.data.value)
            .append('g')
            .attr('class','scatter')
            .attr('transform',`translate(0,${-graphicopt.scatterplot.height/2})`)
                .append('svg')
                .each(function(d){
                    drawElement(d3.select(this),d.data);
                });


        nodeEnter.append("text")
            .attr("graphicopt.dy", "0.31em")
            .attr("x", d => d._children ? -6 : (d.data.value?(6+graphicopt.scatterplot.width):6))
            .attr("text-anchor", d => d._children ? "end" : "start")
            .text(d => d.data.name)
            .clone(true).lower()
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 3)
            .attr("stroke", "white");

        // Transition nodes to their new position.
        const nodeUpdate = node.merge(nodeEnter).transition(transition)
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .attr("fill-opacity", 1)
            .attr("stroke-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        const nodeExit = node.exit().transition(transition).remove()
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0);

        // Update the links…
        const link = gLink.selectAll("path")
            .data(links, d => d.target.id);

        // Enter any new links at the parent's previous position.
        const linkEnter = link.enter().append("path")
            .attr("d", d => {
                const o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            });

        // Transition links to their new position.
        link.merge(linkEnter).transition(transition)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition(transition).remove()
            .attr("d", d => {
                const o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
            });

        // Stash the old positions for transition.
        root.eachBefore(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }
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
            if (__.data){
                root = d3.hierarchy(scheme.data);
                root.x0 = graphicopt.dy / 2;
                root.y0 = 0;
                root.descendants().forEach((d, i) => {
                    d._children=d.children;
                    d.id = i;
                    if (d.data.plotID!==undefined)
                        d.data.measure = getMeasure(d.data);
                    if (d.depth>0)
                        d.children = null;
                });
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
    scheme.data={name:'hpc',children:[]};
    scheme.data.timespan = keys;
    const selectedService = ['CPU1 Temp','Memory usage'];
    scheme.data.selectedService = selectedService;
    // let userlist = ['hge', 'presmcdo', 'adegbalo', 'juandomi'];
    // let userlist = ['hge'];
    let userlist = Object.keys(Layout.usersStatic);
    scheme.range = [[Infinity,-Infinity],[Infinity,-Infinity]];
    const dataArray = [];
    userlist.forEach(u=>{
        const datauser = {
            name: u, children:
                Layout.usersStatic[u].jobMain
                    .map(j => {
                        if (Layout.jobsStatic[j])
                            return addComp(u,j);
                        else
                            return {name: j, children: Layout.usersStatic[u].job.filter(js=>js.split('.')[0]===j).map(j=>addComp(u,j))};
                    }
                    )
        };
        scheme.data.children.push(datauser);
    });
    function addComp(u,j){

        return {
            name: Layout.jobsStatic[j].job_name, children: Layout.jobsStatic[j].node_list.map(comp => {
            const value1 = Layout.ranking.byComputer[comp][selectedService[0]];
            const value2 = Layout.ranking.byComputer[comp][selectedService[1]];
            const item = {
                name: comp, jobID: j, user:u, valueRaw: keys.map((t, i) => {
                    const val1 = value1[i] || undefined;
                    const val2 = value2[i] || undefined;
                    scheme.range[0][0] = (val1 < scheme.range[0][0]) ? val1 : scheme.range[0][0];
                    scheme.range[0][1] = (val1 > scheme.range[0][1]) ? val1 : scheme.range[0][1];
                    scheme.range[1][0] = (val2 < scheme.range[1][0]) ? val2 : scheme.range[1][0];
                    scheme.range[1][1] = (val2 > scheme.range[1][1]) ? val2 : scheme.range[1][1];
                    return [val1, val2];
                })
            };
            dataArray.push(item);
            return item
        })
        }
    }
    // format files
    const files = [[],[],[]];
    files[0].columns=['user','userid','Type'];
    keys.forEach(d=>files[0].columns.push(''+d));
    files[1].columns= ["code", "name"];
    files[2].columns= ["code", "name"];
    selectedService.forEach(s=>{files[2].push({code:s,name:s})});
    const selectedScale = selectedService.map((s,si)=>d3.scaleLinear().domain(scheme.range[si]));
    const normalizeData = [];
    dataArray.forEach(e=>{
        const  u =e.user;
        const  comp =e.name;
        const  j =e.jobID;
        const obj1 = {'user':u+comp+j,'userid':u+comp+j, 'Type': selectedService[0]};
        const obj2 = {'user':u+comp+j,'userid':u+comp+j, 'Type': selectedService[1]};
        e.plotID = normalizeData.length;
        e.invalid = true;
        let count=0;
        normalizeData[e.plotID] = [[],[]];
        e.value= e.valueRaw.map((d,ti)=>{
            const val1 = d[0]?selectedScale[0](d[0]):undefined;
            const val2 = d[1]?selectedScale[1](d[1]):undefined;
            if (count<30) {
                if (val1 !== undefined && val2 !== undefined)
                    count++;
            }else
                e.invalid= false;
            if (val1===undefined){
                obj1[keys[ti]] = '';
                normalizeData[e.plotID][0][ti] = -Infinity;
            }else{
                obj1[keys[ti]] = val1;
                normalizeData[e.plotID][0][ti] = val1;
            }
            if (val2===undefined) {
                obj2[keys[ti]] = '';
                normalizeData[e.plotID][1][ti] = -Infinity;
            }else{
                obj2[keys[ti]] = val2;
                normalizeData[e.plotID][1][ti] = val2;
            }
            return [val1,val2,keys[ti]]
        });
        files[0].push(obj1);
        files[0].push(obj2);
        files[1].push({code:u.key+e.key+e.jobID,name:u.key+e.key+e.jobID});
    });

    let myData = new Data_processing(files);
    myData.read();
    let compute = new Visual_feature_2D({smooth:false,experiment:myData.experiment});
    compute.Loop();

    const index2instance = new Map();
    files[1].forEach((f,i)=>index2instance.set(i,f['code']));
    const index2dim = new Map();
    files[2].forEach((f,i)=>index2dim.set(i,f['code']));
    scheme.measure = calculateMeasure2D({data:normalizeData,index2instance,index2dim,experiment:compute.experiment})

    subObject.scheme(scheme).draw();
}
