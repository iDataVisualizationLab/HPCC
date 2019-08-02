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
            if (db==='csv')
            {
                systemFormat();
            }
            db = data.db||'old';
            processData = eval('processData_' + db);
            if(!data.value) {
                if (db==='nagios_old'||db===undefined)
                    processData = processData_old;
            }
            if(db==='csv'){
                hostList = data.hostList;
                inithostResults();
                newdatatoFormat(data.data);
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



