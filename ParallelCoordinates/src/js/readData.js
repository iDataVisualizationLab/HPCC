var query_time
function readData() {
    let hostResults = {}, hosts=[];
    let hostsList =d3.keys(sampleS);
    let count = 0;
    let comphost;
    let lengthData = sampleS[hostsList[hostsList.length-1]].arrTemperature.length;
    let iterationstep =lengthData;
    hostsList.forEach(att => {
        var h = {};
        h.name = att;
        h.hpcc_rack = +att.split("-")[1];
        h.hpcc_node = +att.split("-")[2].split(".")[0];
        h.index = hosts.length;

        // to contain the historical query results
        hostResults[h.name] = {};
        hostResults[h.name].index = h.index;
        hostResults[h.name].arrTemperature = [];
        hostResults[h.name].arrCPU_load = [];
        hostResults[h.name].arrMemory_usage = [];
        hostResults[h.name].arrFans_health = [];
        hostResults[h.name].arrPower_usage = [];
        hostResults[h.name].arrTime = [];
        hosts.push(h);
        readDataList(count,0);
        count++;

        function readDataList(count,iteration) {
            for (i = 0; i < iterationstep; i++) {
                query_time = undefined;
                var name= undefined;
                serviceListattr.forEach((sv,si)=> {
                    var result = simulateResults2(hosts[count].name, iteration, serviceList[si]);
                    query_time = result.result.query_time||query_time;
                    name = result.data.service.host_name||name;
                    hostResults[name][sv].push(processData(result.data.service.plugin_output, serviceList[si]));
                });
                hostResults[name]['arrTime'].push(query_time);
                iteration++;
            }
            return iteration;
        }

    })
    return hostResults;

}

function object2Data(ob){
    return d3.entries(ob);
}

function object2DataPrallel(ob){
    var temp = object2Data(ob);
    var count = 0;
    var newdata =[];
    temp.forEach(com=>{
        var comlength = com.value[serviceListattrnest[0].key].length;
        var namet = com.key.split('-');
        var rack = namet[1];
        var host = namet[2];
        for (i = 0; i<comlength; i++){
            var eachIn = {};
            serviceListattrnest.forEach(s=>{
                s.sub.forEach((sub,sj)=>{
                    eachIn[sub] = com.value[s.key][i][sj]
                });
            });
            eachIn.Time = new Date(d3.timeFormat("%B %d %Y %H:%M")(com.value['arrTime'][i]));
            eachIn.rack = "Rack "+rack;
            eachIn.compute = com.key;
            eachIn.group = "Rack "+rack;
            eachIn.name = com.key+', '+d3.timeFormat("%B %d %Y %H:%M")(com.value['arrTime'][i]);
            eachIn.id = com.key+"-"+count;
            count++;
            newdata.push(eachIn);
        }

    });
    return newdata;
}

function colorbyCategory(data,key) {
    var listKey = _(data).unique(key).map(d=>d[key]).naturalSort();
    var listcolor= listKey.map(colorscale);
    colors.domain(listKey).range(listcolor);
    color = colors;
}
function colorbyValue(order) {
    var listcolor= order.map(d=>color(d.value));
    colors.domain(order.map(d=>d.text)).range(listcolor);
}