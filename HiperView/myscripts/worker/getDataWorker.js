importScripts("../../js/d3.v4.js","../../js/underscore-min.js","../setting.js");
let undefinedValue,
globalTrend=false,
hosts,db;
addEventListener('message',function ({data}){
    switch (data.action) {
        case 'init':
            undefinedValue = thresholds.map(d=>(d[1]-d[0])/2);
            hosts = data.value.hosts;
            db = data.value.db;
            break;
        case 'isRealtime':
            if (db==='csv')
            {
                systemFormat();
                hostList = data.hostList;
                inithostResults(true);
            }
            console.log(hosts)
            db = data.db;
            console.log(data)
            if(data.db==='csv'){
                hostList = data.hostList;
                inithostResults(true);
                newdatatoFormat(data.data);
                processData = eval('processData_' + data.db);
            }else if(data.value) {
                processData = eval('processData_' + data.db);
            }else {
                if (db ==='influxdb')
                    processData = eval('processData_' + data.db);
                else
                    processData = processData_old;
            }
            break;
        case 'getbatchData':
            const arr = plotTsne(data.value.hostResults,data.value.lastIndex,data.value.usepast);
            if (data.value.host===undefined)
                data.value.host = hosts[hosts.length-1].name;
            const hostIndex = hosts.findIndex(d=>d.name===data.value.host);
            postMessage({action:'returnData', result: {arr: arr, nameh: data.value.host, hindex: hostIndex, index: data.value.lastIndex}});
            postMessage({action: data.action, status:"done" });
            break;
    }
});

function plotTsne(hostResults,lastIndex,isPredict){
    if (globalTrend)
        startIndex =0;
    else
        startIndex = lastIndex;
    let arr =[];
    for(var h = 0;h < hosts.length;h++)
    {
        var name = hosts[h].name;
        var arrServices = getDataByName(hostResults, name, startIndex, lastIndex,isPredict);
        arr.push(arrServices);
    }
    return arr;
}



