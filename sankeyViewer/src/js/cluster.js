let group_opt = {
    clusterMethod: 'leaderbin',
    bin:{
        startBinGridSize: 5,
        range: [9,10]
    }
};
let radarChartclusteropt  = {
    margin: {top: 0, right: 0, bottom: 0, left: 0},
    w: 110,
    h: 110,
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
let cluster_info,clusterDescription={},clusterGroup={},clusterInfo={},outlyingBins;
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
    Layout.tree.children.forEach(d=>{
        d.children.forEach(e=>{
            getCluster(e);
        })
    });
    createdata();
    currentDraw();
}
function cluster_map (dataRaw) {
    let isNameChangeable = false;
    radarChartclusteropt.schema = serviceFullList;
    let data = dataRaw.map((c,i)=>{
        let temp = c.__metrics.slice();
        temp.name = c.labels;
        temp.text = c.text;
        temp.total = c.total;
        temp.mse = c.mse;
        let temp_b;
        if (temp[0].axis){
            temp_b = [temp];
            radarChartclusteropt.fillin = 0.5;
        }else{
            temp_b = temp;
            radarChartclusteropt.fillin = 0
        }
        temp_b.id = c.name;
        temp_b.total = c.total;
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

    let clusterSumDiv = d3.select("#clusterSummary");
    clusterSumDiv.html(`Cluster inputdata: ${clusterInfo.input} (${d3.format(",.1%")(clusterInfo.input/clusterInfo.total)})<br/>
            Cluster calculation time: ${Math.round(clusterInfo.clusterCalTime??0)} ms <br/>
            Total MSE: ${d3.format('.2f')(clusterInfo.totalMSE??0)}`)

    let dir = d3.select('#clusterDisplay');

    function drawRadar(dir,data,renderRadar) {
        let r_old = dir.selectAll('.radarCluster').data(data, d => d.id).order();
        r_old.exit().remove();
        let r_new = r_old.enter().append('div').attr('class', 'radarCluster')
            .on('mouseover', function (d) {
                // if (!jobMap.runopt().mouse.disable) {
                //     mainviz.highlight(d.id);
                // }
                d3.select(this).classed('focus', true);
            }).on('mouseleave', function (d) {
                // if (!jobMap.runopt().mouse.disable) {
                //     mainviz.unhighlight(d.id);
                // }
                d3.select(this).classed('focus', false);
            })
            .append('div')
            .attr('class', 'label')
            .styles({
                'position': 'absolute',
                'color': 'black',
                'width': radarChartclusteropt.w + 'px',
                height: '1rem',
                padding: '10px'
                // overflow: 'hidden',
            });
        //
        if (isNameChangeable)
            r_new.append('i').attr('class', 'editbtn material-icons tiny col s1').style('cursor', 'Pointer').text('edit').on('click', function () {
                let active = d3.select(this).classed('clicked');
                active = !active;
                d3.select(this).classed('clicked', active);
                const parent = d3.select(this.parentNode);
                parent.select('span.clusterlabel').classed('hide', active);
                parent.select('input.clusterlabel').classed('hide', !active);
            });
        r_new.append('span').attrs({
            'class': 'clusterlabel truncate left-align col ' + (isNameChangeable ? 's11' : 's12'),
            'type': 'text'
        })
            .style('padding', 0)
            .style('display', 'block');
        if (isNameChangeable) {
            r_new.append('input').attrs({
                'class': 'clusterlabel browser-default hide truncate center-align col s11',
                'type': 'text'
            })
                .on('change', function (d) {
                    clusterDescription[d.id].text = $(this).val();
                    d3.select(this).classed('hide', true);
                    const parent = d3.select(this.parentNode);
                    parent.select('.editbtn').classed('clicked', false);
                    parent.select('span.clusterlabel').text(clusterDescription[d.id].text).classed('hide', false);
                    updateclusterDescription(d.id, clusterDescription[d.id].text);
                });
        }
        r_new.append('span').attr('class', 'clusternum center-align col s12').style('display', 'block');
        ;

        renderRadar = renderRadar ?? function renderRadar(d) {
            let datadraw = d.map(e => {
                let temp = e.map(e => ({axis: e.axis, value: Math.max(e.value, 0)}));
                temp.name = e.name;
                temp.text = e.text;
                return temp;
            });
            // datadraw[0].name = d[0].name;
            // datadraw[0].text = d[0].text;
            datadraw.id = d.id;
            radarChartclusteropt.color = function () {
                return colorCluster(d.id)
            };
            RadarChart(".radarh" + d.id, datadraw, radarChartclusteropt, "").select('.axisWrapper .gridCircle').classed('hide', true);
        }

// r_new.append('span').attr('class','clusterMSE center-align col s12');
        dir.selectAll('.radarCluster')
            .attr('class', (d, i) => 'flex_col valign-wrapper radarCluster radarh' + d.id)
            .attr('data-toggle', "tooltip")
            .attr('data-placement', "top")
            .attr('title', d => d[0].text)
            .style('position', 'relative')
            .each(function (d, i) {
                renderRadar(d);
            });
        d3.selectAll('.radarCluster').classed('first', (d, i) => !i);
        d3.selectAll('.radarCluster').select('span.clusterlabel').attr('data-order', d => d.order + 1).text(d => d[0].text);
        d3.selectAll('.radarCluster').select('span.clusternum').text(d => (d[0].total || d.total || 0).toLocaleString());
        if (isNameChangeable) {
            d3.selectAll('.radarCluster').select('input.clusterlabel').attr('value', d => d[0].text).each(function (d) {
                $(this).val(d[0].text)
            });
            d3.selectAll('.radarCluster').select('span.clusterMSE').classed('hide', !radarChartclusteropt.boxplot).text(d => d3.format(".2")(d[0].mse || 0));
        }
    }

    setTimeout(()=>{
        drawRadar(dir,data);

        // draw outlier
        let outlierDiv = d3.select('#outlierDisplay');
        if (outlyingBins){
            outlierDiv.style('display','unset');
            outlierDiv.select('h5.title').html(`Outliers: ${outlyingBins?Object.keys(outlyingBins.pointObject).length:0} temporal instances`);
            let outlieropt = {...radarChartclusteropt};
            outlieropt.fillin=0;
            outlieropt.events={
                axis: {
                    mouseover: function(){
                        try {
                            const d = d3.select(d3.event.detail || this).datum();
                            d3.selectAll('#outlierDisplay .axis' + d.idroot + '_' + d.id).classed('highlight', true);
                            d3.selectAll('#outlierDisplay .axisText').remove();
                            if (d3.select(this.parentNode).select('.axisText').empty())
                                d3.select(this.parentNode).append('text').attr('class','axisText').attr('transform','rotate(-90) translate(5,-5)');
                            d3.select(this.parentNode).select('.axisText').text(d.text);
                            $('.tablesvg').scrollTop($('table .axis' + d.idroot + '_' + d.id)[0].offsetTop);
                        }catch(e){}
                    },
                    mouseleave: function(){
                        const d = d3.select(d3.event.detail||this).datum();
                        d3.selectAll('#outlierDisplay .axis'+d.idroot+'_'+d.id).classed('highlight',false);
                        d3.selectAll('#outlierDisplay .axisText').remove();
                    },
                },
            }
            drawRadar(outlierDiv,outlyingBins.map((c,i)=>{
                let temp = c.arr.slice();
                temp.name = c.labels;
                temp.text = c.text;
                temp.total = c.total;
                temp.mse = c.mse;
                let temp_b = temp;
                temp_b.id = 'Outlier'+(-c.index);
                temp_b.total = c.arr.length;
                temp_b.order = i;

                return temp_b;
            }),(d)=>{
                let datadraw = d;
                datadraw.id = d.id;
                outlieropt.color = function () {
                    return colorCluster('outlier')
                };
                RadarChart(".radarh" + d.id, datadraw, outlieropt, "").select('.axisWrapper .gridCircle').classed('hide', true);
            });
        }else{
            outlierDiv.style('display','none');
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
function calculateCluster (data,dimensions,binopt,calbackMiddle) {
    const startTime = performance.now();
    let bin;

    let distance = binopt.normMethod === 'l1' ? distanceL1 : distanceL2;
    let _data = data.filter(d => !d.outlier);
    let dataSpider3 = _data;

    const adjust = dataSpider3.map((d, i) => {
        var dd = d.map((d,i)=>serviceFullList[i].enable?d:0);
        dd.data = {name: d.name, id: i, timestep: d.timestep};
        dd.name = d.name;
        dd.timestep = d.timestep;
        return dd;
    });
    let cluster = [];
    if (dataSpider3.length) {
        switch (binopt.clusterMethod) {
            case 'leaderbin':
                let estimateSize = Math.max(2, Math.pow(binopt.bin.range[1], 1 / dataSpider3[0].length));
                bin = binnerN().startBinGridSize(estimateSize).isNormalized(true).minNumOfBins(binopt.bin.range[0]).maxNumOfBins(binopt.bin.range[1]).distanceMethod(binopt.normMethod).coefficient({
                    reduce_coefficient: 0.3,
                    reduce_offset: 0,
                    increase_coefficient: 2,
                    increase_offset: 0
                }).data([]);
                break;
            case 'binarybin':
                bin = binarybin([], {isNormalized: true});
                break;
            default:
                bin = kmeanCluster.k(binopt.bin.k).distanceMethod(binopt.normMethod).iterations(binopt.bin.iterations);
                break;
        }
        let process = 50;
        let w = 25;
        bin.callback(function (iteration) {
            process = process + w;
            w = w / 2;
            calbackMiddle({iteration, process});
        });

        bin.data(adjust)
            .calculate();
        const binRadius = bin.binRadius;
        let keys = dimensions.map(d => d.text);
        cluster = bin.bins.map((d, i) => {
            var temp;
            if (bin.normalizedFun)
                temp = bin.normalizedFun.scaleBackPoint(d.val).map((e, i) => {
                    return {
                        axis: keys[i],
                        value: (e<0)?undefined:e,
                        enable: dimensions[i].enable,
                        angle: dimensions[i].angle ?? 0,
                        minval: 0,
                        maxval: 0,
                        mean: 0,
                    }
                });
            else
                temp = d.val.map((e, i) => {
                    return {
                        axis: keys[i], value: e,
                        minval: 0,
                        maxval: 0,
                        mean: 0,
                        enable: dimensions[i].enable,
                        angle: dimensions[i].angle ?? 0,
                    }
                });

            temp.bin = {
                name: d.map((f) => f.data.name),
                id: d.map((f) => f.data.id),
                nameob: d.map((f) => {
                    return {name: f.data.name, timestep: f.data.indexSamp}
                }),
                scaledval: d,
                distancefunc: (e) => d3.max(e.map(function (p) {
                    return distance(e[0], p)
                })),
                distance: 0,
            };
            // @ts-ignore
            if (bin.normalizedFun)
                temp.bin.val = bin.normalizedFun.scaleBackPoints(d);
            else
                temp.bin.val = d.slice();


            let temp2 = {
                labels: i,
                radius: binRadius || temp.bin.distance,
                mse: temp.bin.mse,
                index: i,
                __metrics: temp,
                arr: [],
                total: temp.bin.id.length
            };

            temp.forEach((s, i) => temp2[dimensions[i].text] = (s.value < 0) ? undefined : dimensions[i].scale.invert(s.value));
            temp2.index = i;
            temp2.__metrics = temp.slice();
            temp2.__metrics.normalize = temp2.__metrics.map((e, i) => e.value);
            return temp2;
        });
    }else{

    }

    let clusterDescription = recomendName(cluster);
    let colorCluster = recomendColor (cluster);
    adjust.forEach((d,i)=>{
        getCluster(_data[i],d,cluster,distance);
    });

    let totalMSE = 0;
    cluster.forEach((c)=>{
        c.__metrics.forEach((d,i)=>{
            d.minval = d3.min(c.arr,(e)=> e[i]);
            d.maxval = d3.max(c.arr,(e)=> e[i]);
            d.mean = d3.mean(c.arr,(e)=> e[i])??0;
        });
        c.mse = d3.sum(c.__metrics.map(e => (e.maxval - e.minval) * (e.maxval - e.minval)).filter(d=>d!==undefined))??0;
        totalMSE+=c.mse;
    });
    // silhouetteScore
    totalMSE= totalMSE/cluster.length;//silhouetteScore(_data,adjust.map((d)=>d.cluster))//totalMSE/cluster.length;
    const endTime = performance.now();
    return {cluster,clusterDescription,colorCluster, clusterInfo:{clusterCalTime:endTime-startTime, totalMSE, input:_data.length, total: data.length}}
}
function recalculateCluster (option,calback) {
    // preloader(true,10,'Process grouping...','#clusterLoading');

    group_opt = option;
    distance = group_opt.normMethod==='l1'?distanceL1:distanceL2;
    const result = calculateCluster(_.flatten(Object.values(tsnedata),1),serviceFullList,group_opt,()=>{}); //{cluster,clusterDescription,colorCluster,clusterInfo}
    cluster_info = result.cluster;
    clusterDescription = result.clusterDescription;
    colorCluster = result.colorCluster;
    clusterInfo = result.clusterInfo;
    updateclusterDescription();

    if (!calback) {
        cluster_map(cluster_info);
        jobMap.clusterData(cluster_info).colorCluster(colorCluster).data(undefined,undefined,undefined,true).draw().drawComp();
        handle_clusterinfo();
    }
    if (calback)
        calback();

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
    return clusterDescription;
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
    colorarray.push('gray');
    orderarray.push('outlier');
    colorarray.push('black');
    orderarray.push('missing');
    colorCluster.range(colorarray).domain(orderarray)
    return colorCluster
}

function handle_clusterinfo () {
    let data_info = [['Grouping Method:',group_opt.clusterMethod]];
    d3.select(`#${group_opt.clusterMethod}profile`).selectAll('label').each(function(d,i) {
        data_info.push([d3.select(this).text(), group_opt.bin[Object.keys(group_opt.bin)[i]]])
    });
    data_info.push(['#group calculated:',cluster_info.length]);
}
let getCluster = getMathCluster;
function getMathCluster(oardinal,axis_arr,cluster_info,distance){
    // calculate cluster here
    if (!oardinal.outlier) {
        axis_arr = axis_arr ? axis_arr : oardinal;
        let index = 0;
        let minval = Infinity;
        cluster_info.find((c, ci) => {
            const val = distance(c.__metrics.normalize, axis_arr);
            if (val === 0 && c.leadername === undefined) {
                c.leadername = {name: axis_arr.name, timestep: axis_arr.timestep};
            }
            if (minval > val) {
                index = ci;
                minval = val;
            }
            return !val;
        });
        // @ts-ignore
        cluster_info[index].arr.push(oardinal);
        // axis_arr.metrics.Radar = cluster_info[index].name;
        oardinal.cluster = cluster_info[index].name;
        oardinal.clusterIndex = index;
        return cluster_info[index]
    }else{
        oardinal.cluster = 'missing';
        return undefined;
    }
}
function calJobNameCluster(){
    groupbyProperty('jobByNames')
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
