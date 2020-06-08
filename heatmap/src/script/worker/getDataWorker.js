importScripts("../../../../HiperView/js/d3.v4.js","../../../../HiperView/js/underscore-min.js","../../../../HiperView/myscripts/setting.js","../setting.js",
    "../../../../HiperView/js/simple-statistics.min.js","../../../../HiperView/myscripts/correlation.js");
let undefinedValue,
    outlierMultiply = 5,
globalTrend=false,
hosts,db;

let h = d3.scaleLinear();
addEventListener('message',function ({data}){
    switch (data.action) {
        case 'init':
            undefinedValue = thresholds.map(d=>(d[1]-d[0])/2);
            hosts = data.value.hosts;
            db = data.value.db;
            serviceFullList = data.value.serviceFullList;
            serviceLists=data.value.serviceLists;
            serviceList_selected = data.value.serviceList_selected;
            serviceListattr= data.value.serviceListattr;
            serviceFull_selected =[];
            serviceList_selected.forEach(s=>serviceLists[s.index].sub.forEach(sub=>serviceFull_selected.push(sub)));
            tsnedata = data.value.tsnedata;
            break;
        case 'isRealtime':
            if (db==='csv')
            {
                // systemFormat();
                hostList = data.hostList;
                inithostResults(true);
                // serviceFull_selected =[];
                // serviceList_selected.forEach(s=>serviceLists[s.index].sub.forEach(sub=>serviceFull_selected.push(sub)))
            }
            db = data.db;

            if(data.db==='csv'){
                hostList = data.hostList;
                inithostResults(true);
                // newdatatoFormat(data.data,data.separate);
                processData = eval('processData_' + data.db);
            }else if(data.value) {
                processData = eval('processData_' + data.db);
            }else {
                if (db ==='influxdb')
                    processData = eval('processData_' + data.db);
                else
                    processData = processData_old;
            }
            // sampleS = data.data;
            // serviceFull_selected =[];
            // serviceList_selected.forEach(s=>serviceLists[s.index].sub.forEach(sub=>serviceFull_selected.push(sub)));
            break;
        case 'correlationCal':
            postMessage({
                action: 'Correlation',
                result: {
                    arr: correlationCal(dataMetric,data.value.serviceEnable),
                    index: data.value.lastIndex
                }
            });
            postMessage({action: data.action, status:"done" });
            break;
        case 'getbatchData':
            const arr = plotTsne(undefined,data.value.lastIndex,data.value.usepast);
            if (data.value.host===undefined)
                data.value.host = hosts[hosts.length-1].name;
            const hostIndex = hosts.findIndex(d=>d.name===data.value.host);
            if (data.value.usepast) {
                postMessage({
                    action: 'returnDataHistory',
                    result: {arr: arr, nameh: data.value.host, hindex: hostIndex, index: data.value.lastIndex}
                });
            }else {
                postMessage({
                    action: 'returnData',
                    result: {arr: arr, nameh: data.value.host, hindex: hostIndex, index: data.value.lastIndex}
                });
            }
            postMessage({action: 'DataServices',
                result: {
                    arr: getsummaryservice(),
                    index: data.value.lastIndex
                }
            });
            postMessage({action: data.action, status:"done" });
            break;
    }
});
let serviceFull_selected =[];
let dataMetric;
function getsummaryservice(){
    // let dataf = _.reduce(_.chunk(_.unzip(data),serviceFull_selected.length),function(memo, num){ return memo.map((d,i)=>{d.push(num[i]); return _.flatten(d); })});
    let dataf = _.unzip(_.flatten(_.keys(tsnedata).map(e=>tsnedata[e].map(e=>e.__valwithNull)),1));
    dataMetric = dataf;
    let ob = {};
    dataf.forEach((d,i)=>{
        d=d.filter(e=>e!==undefined).sort((a,b)=>a-b);
        let r;
        if (d.length){
            var x = d3.scaleLinear()
                .domain(d3.extent(d));
            var histogram = d3.histogram()
                .domain(x.domain())
                .thresholds(x.ticks(histodram.resolution))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
                .value(d => d);
            let hisdata = histogram(d);

            let sumstat = hisdata.map((d,i)=>[d.x0+(d.x1-d.x0)/2,(d||[]).length]);
            r = {
                axis: serviceFull_selected[i].text,
                q1: ss.quantileSorted(d,0.25) ,
                q3: ss.quantileSorted(d,0.75),
                median: ss.medianSorted(d) ,
                // outlier: ,
                arr: sumstat};
            if (d.length>4)
            {
                const iqr = r.q3-r.q1;
                r.outlier = _.unique(d.filter(e=>e>(r.q3+outlierMultiply*iqr)||e<(r.q1-outlierMultiply*iqr)));
            }else{
                r.outlier =  _.unique(d);
            }
        }else{
            r = {
                axis: serviceFull_selected[i].text,
                q1: undefined ,
                q3: undefined,
                median: undefined ,
                outlier: [],
                arr: []};
        }
        ob[r.axis] = r;

    });
    return ob;
}
function correlationCal(data,serviceEnable){
    let indexActiveService =[];
    const activeservice = serviceFullList.filter((s,si)=>{
        if(serviceEnable[si])
            indexActiveService.push(si);
        return serviceEnable[si]});
    const n = activeservice.length;
    let simMatrix = [];
    for (let i = 0;i<n; i++){
        let temp_arr = [];
        // temp_arr.total = 0;
        for (let j=i+1; j<n; j++){
            let tempval = pearsonCorcoef(data[indexActiveService[i]],data[indexActiveService[j]]);
            // temp_arr.total += tempval;
            temp_arr.push(tempval)
        }
        // for (let j=0;j<i;j++)
        //     temp_arr.total += simMatrix[j][i-1-j];
        temp_arr.name = serviceFullList[indexActiveService[i]].text;
        temp_arr.index = i;
        temp_arr.index_s = indexActiveService[i];
        simMatrix.push(temp_arr)
    }
    return simMatrix;
}
function plotTsne(hostResults,lastIndex,isPredict,startIndex_Input,undefinedValue){
    if (globalTrend)
        startIndex =0;
    else
        startIndex = lastIndex;
    if (startIndex_Input!=undefined)
        startIndex = startIndex_Input;
    let arr =[];
    for(var h = 0;h < hosts.length;h++)
    {
        var name = hosts[h].name;
        // var arrServices = getDataByName(hostResults, name, startIndex, lastIndex,isPredict,undefinedValue==='undefined'?undefined:0.5);
        var arrServices = _.flatten(tsnedata[name].slice(startIndex,lastIndex+1));
        arr.push(arrServices);
    }
    return arr;
}



