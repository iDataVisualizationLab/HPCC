importScripts("../../js/d3.v4.js","../../js/underscore-min.js","../setting.js");
let undefinedValue,
globalTrend=false,
    hosts,processData,db;
processData = processData_old;
addEventListener('message',function ({data}){
    switch (data.action) {
        case 'init':
            undefinedValue = thresholds.map(d=>(d[1]-d[0])/2);
            hosts = data.value.hosts;
            db = data.value.db;
            break;
        case 'isRealtime':
            db = data.db;
            if(data.value) {

                processData = eval('processData_' + data.db);
            }else {
                if (db ==='influxdb')
                    processData = eval('processData_' + data.db);
                else
                    processData = processData_old;
            }
            break;
        case 'getbatchData':
            const arr = plotTsne(data.value.hostResults,data.value.lastIndex);
            postMessage({action:'returnData', result: {arr: arr, nameh: data.value.host, index: data.value.lastIndex}});
            postMessage({action:data.action, status:"done" });
            break;
    }
});
function plotTsne(hostResults,lastIndex){
    if (globalTrend)
        startIndex =0;
    else
        startIndex = lastIndex;
    let arr =[];
    for(var h = 0;h < hosts.length;h++)
    {
        var name = hosts[h].name;
        var r = hostResults[name];
        var arrServices = [];
        for (var stepIndex = startIndex; stepIndex<= lastIndex; stepIndex++) {
            serviceList_selected.forEach((ser, indx) => {
                var a;
                if (r[serviceListattr[indx]][stepIndex]) {
                    a = processData(r[serviceListattr[indx]][stepIndex].data.service.plugin_output, ser);
                }else {
                    a = predict (r[serviceListattr[indx]],ser)
                }
                var scale = d3.scaleLinear()
                    .domain([thresholds[indx][0],thresholds[indx][1]])
                    .range([0,1]);
                a = a.map(d=>scale(d)||0.5);
                switch(indx){
                    case 0:
                    case 3:
                        arrServices = d3.merge([arrServices,a]);
                        break;
                    default:
                        arrServices.push(a[0]||0.5)
                }
            })
        }
        arrServices.name = name;
        arr.push(arrServices);
    }
    return arr;
}



function predict (arr,ser){
    try{
        return processData(arr[arr.length-1].data.service.plugin_output,ser);
    } catch(e){
        let average = 0;
        switch (ser){
            case serviceList[0]:
                average = undefinedValue[0]
                return [average,average,average];
            case serviceList[1]:
                average = undefinedValue[1]
                return [average,average,average];
            case serviceList[2]:
                average = undefinedValue[2]
                return [average,average,average];
            case serviceList[3]:
                average = undefinedValue[3]
                return [average,average,average,average];
            case serviceList[4]:
                average = undefinedValue[4]
                return [average,average,average];
            default:
                return [0,0,0];
        }
    }
}