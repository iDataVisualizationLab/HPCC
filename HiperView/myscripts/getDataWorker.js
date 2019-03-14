importScripts("../js/d3.v4.js");
let serviceList,serviceListattr,thresholds,undefinedValue,
globalTrend=false,
    hosts;

addEventListener('message',function ({data}){
    switch (data.action) {
        case 'init':
            serviceList = data.value.serviceList;
            serviceListattr = data.value.serviceListattr;
            thresholds = data.value.thresholds;
            undefinedValue = thresholds.map(d=>(d[1]-d[0])/2);
            hosts = data.value.hosts;
            break;
        case 'getbatchData':
            const arr = plotTsne(data.value.hostResults,data.value.lastIndex);
            postMessage({action:'returnData', result: {arr: arr, nameh: data.value.host}});
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
            serviceList.forEach((ser, indx) => {
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

function processData(str, serviceName) {
    if (serviceName == serviceList[0]){
        var a = [];
        if (str.indexOf("timed out")>=0 || str.indexOf("(No output on stdout)")>=0 || str.indexOf("UNKNOWN")>=0 ){
            a[0] = undefinedValue[0];
            a[1] = undefinedValue[0];
            a[2] = undefinedValue[0];
        }
        else{
            var arrString =  str.split(" ");
            a[0] = +arrString[2]||undefinedValue[0];
            a[1] = +arrString[6]||undefinedValue[0];
            a[2] = +arrString[10]||undefinedValue[0];
        }
        return a;
    }
    else if (serviceName == serviceList[1]){
        var a = [];
        if (str.indexOf("timed out")>=0 || str.indexOf("(No output on stdout)")>=0 || str.indexOf("UNKNOWN")>=0
            || str.indexOf("CPU Load: null")>=0){
            a[0] = undefinedValue[1];
            a[1] = undefinedValue[1];
            a[2] = undefinedValue[1];
        }
        else{
            var arrString =  str.split("CPU Load: ")[1];
            a[0] = +arrString;
            a[1] = undefinedValue[1];
            a[2] = undefinedValue[1];
        }
        return a;
    }
    else if (serviceName == serviceList[2]) {
        var a = [];
        if (str.indexOf("timed out")>=0 || str.indexOf("(No output on stdout)")>=0 || str.indexOf("UNKNOWN")>=0 ){
            a[0] = undefinedValue[2];
            a[1] = undefinedValue[2];
            a[2] = undefinedValue[2];
        }
        else{
            var arrString =  str.split(" Usage Percentage = ")[1].split(" :: ")[0];
            a[0] = +arrString;
            a[1] = undefinedValue[2];
            a[2] = undefinedValue[2];
        }
        return a;
    }
    else if (serviceName == serviceList[3]) {
        var a = [];
        if (str.indexOf("timed out")>=0 || str.indexOf("(No output on stdout)")>=0 || str.indexOf("UNKNOWN")>=0 ){
            a[0] = undefinedValue[3];
            a[1] = undefinedValue[3];
            a[2] = undefinedValue[3];
            a[3] = undefinedValue[3];
        }
        else{
            var arr4 =  str.split(" RPM ");
            a[0] = +arr4[0].split("FAN_1 ")[1];
            a[1] = +arr4[1].split("FAN_2 ")[1];
            a[2] = +arr4[2].split("FAN_3 ")[1];
            a[3] = +arr4[3].split("FAN_4 ")[1];
        }
        return a;
    }
    else if (serviceName == serviceList[4]) {
        var a = [];
        if (str.indexOf("timed out")>=0 || str.indexOf("(No output on stdout)")>=0 || str.indexOf("UNKNOWN")>=0 ){
            a[0] = undefinedValue[4];
            a[1] = undefinedValue[4];
            a[2] = undefinedValue[4];
        }
        else{
            var maxConsumtion = 3.2;  // over 100%
            var arr4 =  str.split(" ");
            a[0] = +arr4[arr4.length-2]/maxConsumtion;
            a[1] = undefinedValue[4];
            a[2] = undefinedValue[4];
        }
        return a;
    }
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