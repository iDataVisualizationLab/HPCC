let group_opt = {
    clusterMethod: 'leaderbin',
    bin:{
        startBinGridSize: 5,
        range: [9,10]
    }
};
let radarChartclusteropt  = {
    margin: {top: 0, right: 0, bottom: 0, left: 0},
    w: 130,
    h: 130,
    radiuschange: false,
    levels:6,
    dotRadius:2,
    strokeWidth:1,
    maxValue: 0.5,
    isNormalize:true,
    showHelperPoint: false,
    roundStrokes: true,
    ringStroke_width: 0.15,
    ringColor:'black',
    fillin:0.5,
    boxplot:false,
    animationDuration:1000,
    events:{
        axis: {
            mouseover: function(){
                try {
                    const d = d3.select(d3.event.detail || this).datum();
                    d3.selectAll('#clusterDisplay .axis' + d.idroot + '_' + d.id).classed('highlight', true);
                    d3.selectAll('#clusterDisplay .axisText').remove();
                    if (d3.select(this.parentNode).select('.axisText').empty())
                        d3.select(this.parentNode).append('text').attr('class','axisText').attr('transform','rotate(-90) translate(5,-5)');
                    d3.select(this.parentNode).select('.axisText').text(d.text);
                    $('.tablesvg').scrollTop($('table .axis' + d.idroot + '_' + d.id)[0].offsetTop);
                }catch(e){}
            },
            mouseleave: function(){
                const d = d3.select(d3.event.detail||this).datum();
                d3.selectAll('#clusterDisplay .axis'+d.idroot+'_'+d.id).classed('highlight',false);
                d3.selectAll('#clusterDisplay .axisText').remove();
            },
        },
    },
    showText: false};
let cluster_info,clusterDescription,clusterGroup={};
let clustercalWorker;
let colorCluster  = d3.scaleOrdinal().range(d3.schemeCategory20);
function initClusterUI(){
    $('#clusterMethod').val(group_opt.clusterMethod);
    $('#startBinGridSize').val(group_opt.bin.startBinGridSize || 10);
    $('#lowrange').val(group_opt.bin.range[0] || 9);
    $('#highrange').val(group_opt.bin.range[1] || 11);
    $('#knum').val(group_opt.bin.k || 5);
    $('#kiteration').val(group_opt.bin.iterations || 50);
    d3.select('#clusterMethod').on('change',function(){
        group_opt.clusterMethod = this.value;
        const el = this.selectedOptions[0];
        d3.selectAll('.clusterProfile').classed('hide',true);
        d3.select(`#${this.value}profile`).classed('hide',false);
        const assignFunction = d3.select(el).attr('assign-function');
        if (assignFunction){
            getCluster = _.partial(eval(assignFunction), d3.select(el).attr('value'));
        }else{
            getCluster = getMathCluster;
        }
        const calculateFunction = d3.select(el).attr('cluster-function');
        group_opt.recall=false;
        if (calculateFunction){
            group_opt.recall=eval(calculateFunction);
            eval(calculateFunction)();
        }
        onchangeCluster()
    });
}

function onCalculateClusterAction() {
    recalculateCluster(group_opt,onchangeCluster);
}
function handle_dataRaw() {

    cluster_info.forEach(d => (d.arr = [],d.total=0,d.radius = d.radius||0, d.__metrics.forEach(e => (e.minval = undefined, e.maxval = undefined)),d.leadername=undefined));
    // tsnedata = {};
    hosts.forEach(h => {
        // tsnedata[h.name] = [];
        let lastCluster = undefined;
        sampleS[h.name].arrcluster = sampleS.timespan.map((t, i) => {
            axis_arr = tsnedata[h.name][i];
            if(axis_arr.outlier) {
                let outlierinstance = outlyingList.pointObject[h.name + '_' + i];
                if (outlierinstance) {
                    return outlierinstance.cluster;
                }
            }
            // assign cluster
            let index = 0;
            // let cluster_inRange = {}; // this node belong to how many cluster
            let minval = Infinity;
            cluster_info.find((c, ci) => {
                const val = distance(c.__metrics.normalize, axis_arr);
                if(val===0&&c.leadername===undefined)
                    c.leadername = {name:h.name,timestep:i};
                // if( val < c.radius/2)
                //     cluster_inRange[ci] =val;
                if (minval > val) {
                    index = ci;
                    minval = val;
                }
                return !val;
            });
            //--- end assign cluster
            if (!cluster_info[index].arr[i])
                cluster_info[index].arr[i]=[];
            cluster_info[index].arr[i].push(h.name);
            cluster_info[index].total = 1 + cluster_info[index].total || 0;
            cluster_info[index].__metrics.forEach((m, i) => {
                if (m.minval === undefined || m.minval > axis_arr[i])
                    m.minval = axis_arr[i];
                if (m.maxval === undefined || m.maxval < axis_arr[i])
                    m.maxval = axis_arr[i];
            });
            // axis_arr.cluster = index;
            tsnedata[h.name][i].cluster = index;
            tsnedata[h.name][i].minDist = minval;
            lastCluster = index;
            return index;
        })
    });
    cluster_info.forEach(c => c.mse = ss.sum(c.__metrics.map(e => (e.maxval - e.minval) * (e.maxval - e.minval))));
    cluster_map(cluster_info);
    jobMap.clusterData(cluster_info).colorCluster(colorCluster);
    radarChartclusteropt.schema = serviceFullList;
    handle_clusterinfo();
}
function onchangeCluster() {
    cluster_map(cluster_info);
    handle_clusterinfo();
    // Layout.tree.children.forEach(d=>{
    //     d.children.forEach(e=>{
    //         getCluster(e);
    //     })
    // }
    udateClusterInfo();
    // currentDraw();
}
function cluster_map (dataRaw,divId,customopt,callback) {
    divId = divId??'#clusterDisplay';
    const _radarChartclusteropt = {...radarChartclusteropt,...customopt};
    const className = customopt?(customopt.className?customopt.className:'radarh'):'radarh';
    let isNameChangeable = false;
    _radarChartclusteropt.schema = serviceFullList;
    let data = dataRaw.map((c,i)=>{
        let temp = c.__metrics.slice();
        temp.name = c.labels;
        temp.text = c.text;
        temp.total = c.total;
        temp.mse = c.mse;
        let temp_b;
        if (temp[0].axis){
            temp_b = [temp];
            _radarChartclusteropt.fillin = 0.5;
        }else{
            temp_b = temp;
            _radarChartclusteropt.fillin = 0
        }
        temp_b.id = c.name;
        temp_b.total = c.total;
        temp_b.data = c;
        temp_b.order = i;
        return temp_b;
    });
    // let orderSimilarity = similarityCal(data);
    // data.sort((a,b)=>( orderSimilarity.indexOf(a.order)-orderSimilarity.indexOf(b.order)))
    data.forEach((d,i)=>{
        d.order = i;
        dataRaw.find(c=>c.name===d.id).orderG = i;
    });
    //--shoudn't here
    dataRaw.forEach(c=>{
        let matchitem = data.find(d=>d.id===c.name);
        // c.text = c.text.replace(`Group ${c.index+1}`,`Group ${matchitem.order+1}`);
        matchitem[0].text =  c.text;
    });
    data.forEach(d=>d[0].name = dataRaw.find(c=>d.id===c.name).text);
    //--end
    let dir = d3.select(divId);
    setTimeout(()=>{
        let r_old = dir.selectAll('.radarCluster').data(data,d=>d.id).order();
        r_old.exit().remove();
        let r_new = r_old.enter().append('div').attr('class','radarCluster')
            .on('mouseover',function(d){
                // if (!jobMap.runopt().mouse.disable) {
                //     mainviz.highlight(d.id);
                // }
                d3.select(this).classed('focus',true);
            }).on('mouseleave',function(d){
                // if (!jobMap.runopt().mouse.disable) {
                //     mainviz.unhighlight(d.id);
                // }
                d3.select(this).classed('focus',false);
            })
            .append('div')
            .attr('class','label')
            .style('position','absolute')
            .style('color','black')
            .style('width',_radarChartclusteropt.w+'px')
            .style('height','1rem')
            .style('padding', '10px');
        //
        if (isNameChangeable)
            r_new.append('i').attr('class','editbtn material-icons tiny col s1').style('cursor', 'Pointer').text('edit').on('click',function(){
                let active = d3.select(this).classed('clicked');
                active = !active;
                d3.select(this).classed('clicked',active);
                const parent = d3.select(this.parentNode);
                parent.select('span.clusterlabel').classed('hide',active);
                parent.select('input.clusterlabel').classed('hide',!active);
            });
        r_new.append('span')
            .attr('class','clusterlabel truncate left-align col '+(isNameChangeable?'s11':'s12'))
            .attr('type','text')
            .style('padding',0)
            .style('display','block');
        if(isNameChangeable)
        {
            r_new.append('input')
                .attr('class','clusterlabel browser-default hide truncate center-align col s11')
                .attr('type','text')
                .on('change',function(d){
                    clusterDescription[d.id].text = $(this).val();
                    d3.select(this).classed('hide',true);
                    const parent = d3.select(this.parentNode);
                    parent.select('.editbtn').classed('clicked',false);
                    parent.select('span.clusterlabel').text(clusterDescription[d.id].text).classed('hide',false);
                    updateclusterDescription(d.id,clusterDescription[d.id].text);
                });
        }
        r_new.append('span').attr('class','clusternum center-align col s12').style('display','block');;
        // r_new.append('span').attr('class','clusterMSE center-align col s12');
        dir.selectAll('.radarCluster')
            .attr('class',(d,i)=>'flex_col valign-wrapper radarCluster '+className+d.id)
            .attr('data-toggle',"tooltip")
            .attr('data-placement',"top")
            .attr('title',d=>d[0].text)
            .style('position','relative')
            .each(function(d,i){
                let datadraw = d.map(e=>{
                    let temp = e.map(e=>({axis:e.axis,value:Math.max(e.value,0)}));
                    temp.name = e.name;
                    temp.text = e.text;
                    return temp;
                });
                // datadraw[0].name = d[0].name;
                // datadraw[0].text = d[0].text;
                datadraw.id = d.id;
                _radarChartclusteropt.color = function(){return colorCluster(d.id)};
                RadarChart("."+className+d.id, datadraw, _radarChartclusteropt,"").select('.axisWrapper .gridCircle').classed('hide',true);
            });
        d3.selectAll('.radarCluster').classed('first',(d,i)=>!i);
        d3.selectAll('.radarCluster').select('span.clusterlabel').attr('data-order',d=>d.order+1).text(d=>d[0].text);
        d3.selectAll('.radarCluster').select('span.clusternum').text(d=>(d[0].total||d.total||0).toLocaleString());
        if(isNameChangeable){
            d3.selectAll('.radarCluster').select('input.clusterlabel').attr('value',d=>d[0].text).each(function(d){$(this).val(d[0].text)});
            d3.selectAll('.radarCluster').select('span.clusterMSE').classed('hide',!_radarChartclusteropt.boxplot).text(d=>d3.format(".2")(d[0].mse||0));
        }
        if (callback){
            callback();
        }
    }, 0);
    // outlier_map(outlyingList)
}
function updateclusterDescription (name,text){
    if (name)
        cluster_info.find(c=>c.name===name).text = text;
    else {
        cluster_info.forEach(c => c.text = clusterDescription[c.name].text);
        cluster_map(cluster_info)
    }
}
function recalculateCluster (option,calback,customCluster) {
    // preloader(true,10,'Process grouping...','#clusterLoading');
    updateProcess({percentage:5,text:'Process grouping...'})

    group_opt = option;
    distance = group_opt.normMethod==='l1'?distanceL1:distanceL2;
    if (clustercalWorker)
        clustercalWorker.terminate();
    clustercalWorker = new Worker ('src/js/worker/clustercal.js');
    clustercalWorker.postMessage({
        binopt:group_opt,
        sampleS:tsnedata,
        timeMax:Layout.timespan.length,
        hosts:d3.keys(tsnedata).map(h=>({name:h})),
        serviceFullList: serviceFullList,
        serviceLists:serviceLists,
        serviceList_selected:serviceList_selected,
        serviceListattr:serviceListattr,
        customCluster: customCluster // 1 25 2020 - Ngan
    });
    clustercalWorker.addEventListener('message',({data})=>{
        if (data.action==='done') {
            $('.toast').toast('dispose')
            // data.result.forEach(c=>c.arr = c.arr.slice(0,lastIndex));
            cluster_info = data.result;
            debugger
            if (!customCluster) {
                clusterDescription = {};
                recomendName(cluster_info);
            }else{
                let new_clusterDescription = {};
                cluster_info.forEach((d,i)=>{
                    new_clusterDescription[`group_${i+1}`] = {id:`group_${i+1}`,text:clusterDescription[d.name].text};
                    d.index = i;
                    d.labels = ''+i;
                    d.name = `group_${i+1}`;
                });
                clusterDescription = new_clusterDescription;
                updateclusterDescription();
            }
            recomendColor (cluster_info);
            if (!calback) {
                debugger
                cluster_map(cluster_info);
                jobMap.clusterData(cluster_info).colorCluster(colorCluster).data(undefined,undefined,undefined,true).draw().drawComp();
                handle_clusterinfo();
            }
            // preloader(false, undefined, undefined, '#clusterLoading');
            updateProcess();
            clustercalWorker.terminate();
            if (calback)
                calback();
        }
        // if (data.action==='returnData'){
        //     onloaddetermire({process:data.result.process,message:data.result.message},'#clusterLoading');
        // }
    }, false);

}
// radar draw
function createRadar_func(datapoint, bg, data, customopt,className,radaropt,colorscale) {
    className = className||"compute linkLineg ";
    let size_w = customopt?(customopt.size?customopt.size:radaropt.w):radaropt.w;
    let size_h = customopt?(customopt.size?customopt.size:radaropt.h):radaropt.h;
    let colorfill = (customopt&&customopt.colorfill)?(customopt.colorfill===true?0.5:customopt.colorfill):false;
    let radar_opt = {
        w: size_w,
        h: size_h,
        schema: serviceFullList,
        margin: {left:0,right:0,top:0,bottom:0},
        levels: 6,
        mini:true,
        showText: false,
        radiuschange: false,
        isNormalize: customopt.isNormalize!==undefined?customopt.isNormalize:true,
        maxValue: 0.5,
        fillin: colorfill,
    };


    if (datapoint.empty()) {
        datapoint = bg
            .append("g")
            .datum(data)
            .attr("class", d => className+" " + fixName2Class(d.name));

    }

    // replace thumnail with radar mini
    if(data)
        datapoint.data([data])
    datapoint.each(function(d){
        d3.select(this).attr('transform',`translate(${-radar_opt.w/2},${-radar_opt.h/2})`)
        if (colorfill)
            radar_opt.color = function(){return d.color||colorscale(d.name)};
        RadarChart(this, [d], radar_opt,"");
    });
    return datapoint;
}
function distanceL2(a, b){
    let dsum = 0;
    a.forEach((d,i)=> {dsum +=(d-b[i])*(d-b[i])});
    return Math.round(Math.sqrt(dsum)*Math.pow(10, 10))/Math.pow(10, 10);
}
function distanceL1(a,b) {
    let dsum = 0;
    a.forEach((d,i)=> {dsum +=Math.abs(d-b[i])}); //modified
    return Math.round(dsum*Math.pow(10, 10))/Math.pow(10, 10);
}
function recomendName (clusterarr,haveDescription){
    clusterarr.forEach((c,i)=>{
        c.index = i;
        c.axis = [];
        c.labels = ''+i;
        c.name = `group_${i+1}`;
        let zero_el = c.__metrics.filter(f=>!f.value);
        let name='';
        if (zero_el.length && zero_el.length<c.__metrics.normalize.length){
            c.axis = zero_el.map(z=>{return{id:z.axis,description:'undefined'}});
            name += `${zero_el.length} metric(s) undefined `;
        }else if(zero_el.length===c.__metrics.normalize.length){
            c.text = `undefined`;
            if(!clusterDescription[c.name])
                clusterDescription[c.name] = {};
            clusterDescription[c.name].id = c.name;
            clusterDescription[c.name].text = c.text;
            return;
        }
        name += c.__metrics.filter(f=>f.value>0.75).map(f=>{
            c.axis.push({id:f.axis,description:'high'});
            return 'High '+f.axis;
        }).join(', ');
        name = name.trim();
        if (name==='')
            c.text = ``;
        else
            c.text = `${name}`;
        if(!haveDescription || !clusterDescription[c.name]){
            if(!clusterDescription[c.name])
                clusterDescription[c.name] = {};
            clusterDescription[c.name].id = c.name;
            clusterDescription[c.name].text = c.text;
        }
    });
}

function recomendColor (clusterarr) {
    let colorCa = colorScaleList['customschemeCategory'].slice();
    if (clusterarr.length>9 && clusterarr.length<21)
        colorCa = d3.schemeCategory20;
    else if (clusterarr.length>20)
        colorCa = d3.schemeCategory20;
        // colorCa = clusterarr.map((d,i)=>d3.interpolateTurbo(i/(clusterarr.length-1)));
    let colorcs = d3.scaleOrdinal().range(colorCa);
    let colorarray = [];
    let orderarray = [];
    // clusterarr.filter(c=>!c.text.match('undefined'))
    clusterarr.filter(c=>c.text!=='undefined')
        .forEach(c=>{
            colorarray.push(colorcs(c.name));
            orderarray.push(c.name);
        });
    clusterarr.filter(c=>c.text==='undefined').forEach(c=>{
        colorarray.push('gray');
        orderarray.push(c.name);
    });
    colorCluster.range(colorarray).domain(orderarray)
}

function handle_clusterinfo () {
    let data_info = [['Grouping Method:',group_opt.clusterMethod]];
    d3.select(`#${group_opt.clusterMethod}profile`).selectAll('label').each(function(d,i) {
        data_info.push([d3.select(this).text(), group_opt.bin[Object.keys(group_opt.bin)[i]]])
    });
    data_info.push(['#group calculated:',cluster_info.length]);
}
let getCluster = getMathCluster;
function getMathCluster(e){
    // calculate cluster here
    // let axis_arr = tsnedata[e.id][e.ti];
    // let index = 0;
    // let minval = Infinity;
    // cluster_info.find((c, ci) => {
    //     const val = distance(c.__metrics.normalize, axis_arr);
    //     if(val===0&&c.leadername===undefined)
    //         c.leadername = {name:e.name,timestep:0};
    //     if (minval > val) {
    //         index = ci;
    //         minval = val;
    //     }
    //     return !val;
    // });
    // cluster_info[index].arr[e.ti].push(e.id);
    // if (!e.metrics)
    //     e.metrics = {};
    // e.metrics.Radar = cluster_info[index].name;
    // e.cluster = cluster_info[index];
    let index = 0;
    cluster_info.find((c,ci)=>{
        if (c.arr[e.ti].find(n=>n===e.id))
        {
            index = ci;
            return true;
        }
        return false
    });
    e.cluster = index;
}
function calJobNameCluster(){
    groupbyProperty('jobByNames');
    recomendColor(cluster_info)
}

function groupbyProperty(key) {
    cluster_info = d3.entries(Layout[key]).map((j, ji) => {
        let c = {
            arr: [],
            axis: [],
            index: ji,
            labels: '' + ji,
            mse: +'a',
            name: "group_" + (ji + 1),
            orderG: 0,
            text: j.key,
            total: j.value.node.length,
            __metrics: []
        };
        let data = j.value.node.map(n => tsnedata[n][0]);
        c._metricsSum = 0;
        c.__metrics = [];
        c.__metrics.summary = [];
        data.forEach(d => {
            let _temp = [];
            serviceFullList.forEach((s, si) => {
                let val = Math.max(0, d[si]);
                c[s.text] = d3.scaleLinear().range(s.range)(val);
                _temp.push({axis: s.text, value: val});
            });
            c.__metrics.push(_temp);
        })
        serviceFullList.forEach((s, si) => {
            let _temp = data.filter(d => d[si] >= 0).map(d => d[si]);
            let val = d3.mean(_temp);
            c._metricsSum += val;
            c[s.text] = d3.scaleLinear().range(s.range)(val);
            c.__metrics.summary.push({
                axis: s.text,
                maxval: d3.max(_temp),
                mean: val,
                minval: d3.min(_temp),
                value: val
            });
        });

        return c
    });
    cluster_info.sort((a, b) => b._metricsSum - a._metricsSum)
        .forEach((c, ci) => {
            c.index = ci;
            c.labels = ci;
            c.name = "group_" + (ci + 1);
            c.order = ci;
        });
}

function calUserNameCluster(){
    debugger
    groupbyProperty('users');
    recomendColor(cluster_info)
}
function getJobNameCluster(key,e){
    let index = [];
    cluster_info.filter((c, ci) => {
        e[key].forEach(jobn=> {
            if (jobn === c.text) {
                c.arr.push(e.name);
                index.push(ci);
                if (index.length === 1) {
                    e.metrics.Radar = c.name;
                    e.cluster = c;
                } else if (index.length === 2) {
                    e.metrics.Radar = [e.metrics.Radar,c.name];
                    e.cluster = [e.cluster,c];
                } else {
                    e.metrics.Radar.push(c.name);
                    e.cluster.push(c);
                }
                return true;
            }
        })
    });
}
