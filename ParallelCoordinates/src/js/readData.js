var serviceList = ["Temperature","Job_load","Memory_usage","Fans_speed","Power_consum"];
var serviceLists = [{text: "Temperature", id: 0, enable:true,
    sub:[{text: 'CPU1 Temp', id: 0, enable:true},{text: 'CPU2 Temp', id: 1, enable:true},{text: 'Inlet Temp', id: 2, enable:true}]},
    {text: "Job_load", id: 1, enable:true ,sub:[{text: 'Job load', id: 0, enable:true}]},
    {text: "Memory_usage", id: 2 , enable:true ,sub:[{text: 'Memory usage', id: 0, enable:true}]},
    {text: "Fans_speed", id: 3 , enable:true ,sub:[{text: 'Fan1 speed', id: 0, enable:true},{text: 'Fan2 speed', id: 1, enable:true},{text: 'Fan3 speed', id: 2, enable:true},{text: 'Fan4 speed', id: 3, enable:true}]},
    {text: "Power_consum", id: 4 , enable:true ,sub:[{text: 'Power consumption', id: 0, enable:true}]}];
var serviceListattr = ["arrTemperature","arrCPU_load","arrMemory_usage","arrFans_health","arrPower_usage"];
var serviceListattrnest = [
    {key:"arrTemperature", sub:["CPU1 Temp","CPU2 Temp","Inlet Temp"]},
    {key:"arrCPU_load", sub:["Job load"]},
    {key:"arrMemory_usage", sub:["Memory usage"]},
    {key:"arrFans_health", sub:["Fan1 speed","Fan2 speed","Fan3 speed","Fan4 speed"]},
    {key:"arrPower_usage", sub:["Power consumption"]}];
var thresholds = [[3,98], [0,10], [0,99], [1050,17850],[0,200] ];
var chosenService = 0;
var conf={};
conf.serviceList = serviceList;
conf.serviceLists = serviceLists;
conf.serviceListattr = serviceListattr;
conf.serviceListattrnest = serviceListattrnest;
//***********************
checkConf('serviceList');
checkConf('serviceLists');
checkConf('serviceListattr');
checkConf('serviceListattrnest');
//***********************
var undefinedValue = undefined;
var undefinedColor = "#666";
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
                var query_time = undefined;
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
        function processData(str, serviceName) {
            if (serviceName == serviceList[0]) {
                var a = [];
                if (str.indexOf("timed out") >= 0 || str.indexOf("(No output on stdout)") >= 0 || str.indexOf("UNKNOWN") >= 0) {
                    a[0] = undefinedValue;
                    a[1] = undefinedValue;
                    a[2] = undefinedValue;
                }
                else {
                    var arrString = str.split(" ");
                    a[0] = +arrString[2] || undefinedValue;
                    a[1] = +arrString[6] || undefinedValue;
                    a[2] = +arrString[10] || undefinedValue;
                }
                return a;
            }
            else if (serviceName == serviceList[1]) {
                var a = [];
                if (str.indexOf("timed out") >= 0 || str.indexOf("(No output on stdout)") >= 0 || str.indexOf("UNKNOWN") >= 0
                    || str.indexOf("CPU Load: null") >= 0) {
                    a[0] = undefinedValue;
                    a[1] = undefinedValue;
                    a[2] = undefinedValue;
                }
                else {
                    var arrString = str.split("CPU Load: ")[1];
                    a[0] = +arrString;
                    a[1] = undefinedValue;
                    a[2] = undefinedValue;
                }
                return a;
            }
            else if (serviceName == serviceList[2]) {
                var a = [];
                if (str.indexOf("timed out") >= 0 || str.indexOf("(No output on stdout)") >= 0 || str.indexOf("UNKNOWN") >= 0) {
                    a[0] = undefinedValue;
                    a[1] = undefinedValue;
                    a[2] = undefinedValue;
                }
                else {
                    var arrString = str.split(" Usage Percentage = ")[1].split(" :: ")[0];
                    a[0] = +arrString;
                    a[1] = undefinedValue;
                    a[2] = undefinedValue;
                }
                return a;
            }
            else if (serviceName == serviceList[3]) {
                var a = [];
                if (str.indexOf("timed out") >= 0 || str.indexOf("(No output on stdout)") >= 0 || str.indexOf("UNKNOWN") >= 0) {
                    a[0] = undefinedValue;
                    a[1] = undefinedValue;
                    a[2] = undefinedValue;
                    a[3] = undefinedValue;
                }
                else {
                    var arr4 = str.split(" RPM ");
                    a[0] = +arr4[0].split("FAN_1 ")[1];
                    a[1] = +arr4[1].split("FAN_2 ")[1];
                    a[2] = +arr4[2].split("FAN_3 ")[1];
                    a[3] = +arr4[3].split("FAN_4 ")[1];
                }
                return a;
            }
            else if (serviceName == serviceList[4]) {
                var a = [];
                if (str.indexOf("timed out") >= 0 || str.indexOf("(No output on stdout)") >= 0 || str.indexOf("UNKNOWN") >= 0) {
                    a[0] = undefinedValue;
                    a[1] = undefinedValue;
                    a[2] = undefinedValue;
                }
                else {
                    var maxConsumtion = 3.2;  // over 100%
                    var arr4 = str.split(" ");
                    a[0] = +arr4[arr4.length - 2] / maxConsumtion;
                    a[1] = undefinedValue;
                    a[2] = undefinedValue;
                }
                return a;
            }
        }
        function simulateResults2(hostname, iter, s) {
            var newService;
            if (s == serviceList[0])
                newService = sampleS[hostname].arrTemperature[iter];
            else if (s == serviceList[1])
                newService = sampleS[hostname].arrCPU_load[iter];
            else if (s == serviceList[2])
                newService = sampleS[hostname].arrMemory_usage[iter];
            else if (s == serviceList[3])
                newService = sampleS[hostname].arrFans_health[iter];
            else if (s == serviceList[4]) {
                if (sampleS[hostname]["arrPower_usage"] == undefined) {
                    var simisval = handlemissingdata(hostname, iter);
                    sampleS[hostname]["arrPower_usage"] = [simisval];
                } else if (sampleS[hostname]["arrPower_usage"][iter] == undefined) {
                    var simisval = handlemissingdata(hostname, iter);
                    sampleS[hostname]["arrPower_usage"][iter] = simisval;
                }
                newService = sampleS[hostname]["arrPower_usage"][iter];
            }


            function handlemissingdata(hostname, iter) {
                var simisval = jQuery.extend(true, {}, sampleS[hostname]["arrTemperature"][iter]);
                var simval = processData(simisval.data.service.plugin_output, serviceList[0]);
                // simval = (simval[0]+simval[1])/2;
                simval = (simval[0] + simval[1] + 20);
                var tempscale = d3.scaleLinear().domain([thresholds[0][0], thresholds[0][1]]).range([thresholds[4][0], thresholds[4][1]]);
                if (simval !== undefinedValue && !isNaN(simval))
                //simisval.data.service.plugin_output = "OK - The average power consumed in the last one minute = "+Math.round(tempscale(simval)*3.2)+" W";
                    simisval.data.service.plugin_output = "OK - The average power consumed in the last one minute = " + Math.floor(simval * 3.2) + " W";
                else
                    simisval.data.service.plugin_output = "UNKNOWN";
                return simisval;
            }

            return newService;
        }
    })
    return hostResults;

}

function object2Data(ob){
    return d3.entries(ob);
}
var colorscale = d3.scaleOrdinal(d3.schemeCategory10);
var colors = d3.scaleOrdinal();
var color,opa;
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
            eachIn.timestep = new Date(d3.timeFormat("%B %d %Y %H:%M")(com.value['arrTime'][i]));
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