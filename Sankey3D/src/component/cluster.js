/*eslint no-unused-expressions: "error"*/
import binnerN from "./binnerN.min";
import kmeanCluster from "./kmean";
import * as d3 from "d3"
import {colorScaleList, undefinedValue} from "./ulti";


function distanceL2(a, b){
    let dsum = 0;
    a.forEach((d,i)=> {dsum +=(d-b[i])*(d-b[i])});
    return Math.round(Math.sqrt(dsum)*Math.pow(10, 10))/Math.pow(10, 10);
}
function distanceL1(a, b) {
    let dsum = 0;
    a.forEach((d,i)=> {dsum +=Math.abs(d-b[i])}); //modified
    return Math.round(dsum*Math.pow(10, 10))/Math.pow(10, 10);
}

export function calculateCluster ({data=[],dimensions=[],binopt={},calbackMiddle=(()=>{}),calbackEnd}) {
    const startTime = performance.now();
    let bin;

    let distance = binopt.normMethod === 'l1' ? distanceL1 : distanceL2;
    let _data = data.filter(d => !d.outlier);
    let dataSpider3 = _data;

    const adjust = dataSpider3.map((d, i) => {
        var dd = d.map((d,i)=>dimensions[i].enable?d:0);

        dd.data = {name: d.name, id: i, timestep: d.timestep};

        dd.name = d.name;

        dd.timestep = d.timestep;
        return dd;
    });
    let cluster = [];
    console.log(binopt)
    if (dataSpider3.length) {
        switch (binopt.clusterMethod) {
            case 'leaderbin':
                let estimateSize = Math.max(2, Math.pow(binopt.range[1], 1 / dataSpider3[0].length));
                // @ts-ignore
                bin = window.binnerN().startBinGridSize(estimateSize).isNormalized(true).minNumOfBins(binopt.range[0]).maxNumOfBins(binopt.range[1]).distanceMethod(binopt.normMethod).coefficient({
                    reduce_coefficient: 0.3,
                    reduce_offset: 0,
                    increase_coefficient: 2,
                    increase_offset: 0
                }).data([]);
                break;
            // case 'binarybin':
            //     bin = binarybin([], {isNormalized: true});
            //     break;
            default:
                bin = window.kmeanCluster.k(binopt.k).distanceMethod(binopt.normMethod).iterations(binopt.iterations);
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
            d.minval = d3.min(c.arr,(e)=> e[i] ) ;
            d.maxval = d3.max(c.arr,(e)=> e[i] ) ;
            d.mean = d3.mean(c.arr,(e)=> e[i])??0;
        });
        c.mse = d3.sum(c.__metrics.map(e => (e.maxval - e.minval) * (e.maxval - e.minval)).filter(d=>d!==undefined))??0;
        totalMSE+=c.mse;
    });
    // silhouetteScore
    totalMSE= totalMSE/cluster.length;//silhouetteScore(_data,adjust.map((d:any)=>d.cluster))//totalMSE/cluster.length;
    const endTime = performance.now();
    return {cluster,clusterDescription,colorCluster, clusterInfo:{clusterCalTime:endTime-startTime, totalMSE, input:_data.length, total: data.length}}
}
function recomendName (clusterarr,haveDescription){
    let clusterDescription = {};
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
        colorCa = colorScaleList.schemeCategory20;
    else if (clusterarr.length>20)
        colorCa = colorScaleList.schemeCategory20;
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
    let colorCluster  = d3.scaleOrdinal().range(colorarray).domain(orderarray);
    return colorCluster
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
                // @ts-ignore
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
