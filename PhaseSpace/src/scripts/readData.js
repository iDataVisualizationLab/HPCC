var serviceList = ["Temperature","Job_load","Memory_usage","Fans_speed","Power_consum"];
var serviceLists = [{text: "Temperature", id: 0,
    sub:[{text: 'Temperature - CPU1', id: 0},{text: 'Temperature - CPU2', id: 1},{text: 'Temperature - Intel', id: 2}]},
    {text: "Job_load", id: 1,sub:[{text: 'Job_load', id: 0}]},
    {text: "Memory_usage", id: 2,sub:[{text: 'Memory_usage', id: 0}]},
    {text: "Fans_speed", id: 3,sub:[{text: 'Fan1', id: 0},{text: 'Fan2', id: 1},{text: 'Fan3', id: 2},{text: 'Fan4', id: 3}]},
    {text: "Power_consum", id: 4,sub:[{text: 'Power_consum', id: 0}]}];
var serviceListattr = ["arrTemperature","arrCPU_load","arrMemory_usage","arrFans_health","arrPower_usage"];
var thresholds = [[3,98], [0,10], [0,99], [1050,17850],[0,200] ];
var chosenService = 0;
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
        hosts.push(h);
        readDataList(count,0);
        count++;

        function readDataList(count,iteration) {
            for (i = 0; i < iterationstep; i++) {
                serviceListattr.forEach((sv,si)=> {
                    var result = simulateResults2(hosts[count].name, iteration, serviceList[si]);
                    var name = result.data.service.host_name;
                    hostResults[name][sv].push(processData(result.data.service.plugin_output, serviceList[si]));
                });
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