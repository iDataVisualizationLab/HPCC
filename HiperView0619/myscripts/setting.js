// system variable
var jobList=[];
var serviceList = ["Temperature","Job_load","Memory_usage","Fans_speed","Power_consum","Job_scheduling"];
var serviceList_selected = ["Temperature","Job_load","Memory_usage","Fans_speed","Power_consum"];
var serviceListattr = ["arrTemperature","arrCPU_load","arrMemory_usage","arrFans_health","arrPower_usage","arrJob_scheduling"];


var FIELD_MACHINE_ID = "name";
var VARIABLES = [];
/**Configuration**/
const oneWay = true;
const smooth = false;
const stepPenalty = false;


var serviceAttr = {arrTemperature: {key: "Temperature", val: ["arrTemperatureCPU1","arrTemperatureCPU2"]},
    arrCPU_load: {key: "CPU_load", val: ["arrCPU_load"]},
    arrMemory_usage: {key: "Memory_usage", val: ["arrMemory_usage"]},
    arrFans_health: {key: "Fans_speed", val: ["arrFans_speed1","arrFans_speed2"]},
    arrPower_usage:{key: "Power_consumption", val: ["arrPower_usage"]}};
var thresholds = [[3,98], [0,10], [0,99], [1050,17850],[0,200] ];
var serviceQuery ={
    nagios_old: ["temperature","cpu+load" ,"memory+usage" ,"fans+health" ,"power+usage"],
    nagios: {
        "Temperature":{
            format: (d)=> `CPU${d} Temp`,
            "numberOfEntries":2,
            "type":"json",
            "query":"CPU_Temperature"
        },
        "Job_load":{
            format: ()=> "cpuusage",
            "numberOfEntries":1,
            "type":"json",
            "query":"CPU_Usage"
        },
        "Memory_usage":{
            "format":()=>"memoryusage",
            "numberOfEntries":1,
            "type":"json",
            "query":"Memory_Usage",
            "rescale": 1/191.908,
        },
        "Fans_speed":{
            format: (d)=> `FAN_${d}`,
            "numberOfEntries":4,
            "type":"json",
            "query":"Fan_Speed"
        },
        "Power_consum":{
            "format": ()=>"powerusage_watts",
            "numberOfEntries":1,
            "type":"json",
            "query":"Node_Power_Usage",
            "rescale": 1/3.2,
        }
    },
    influxdb: {
        "Temperature":{
            "CPU_Temperature" : {
                format: (d) => `CPU${d} Temp`,
                "numberOfEntries": 2,
            },
            "Inlet_Temperature" : {
                format: () => `Inlet Temp`,
                "numberOfEntries": 1,
            }
        },
        "Job_load":{
            "CPU_Usage": {
                format: () => "cpuusage",
                "numberOfEntries": 1,
            }
        },
        "Memory_usage":{
            "Memory_Usage": {
                format: () => "memoryusage",
                "numberOfEntries": 1,
                "rescale": 100 / 191.908,
            }
        },
        "Fans_speed":{
            "Fan_Speed" : {
                format: (d) => `FAN_${d}`,
                "numberOfEntries": 4,
            }
        },
        "Power_consum":{
            "Node_Power_Usage" : {
                "format": () => "powerusage_watts",
                "numberOfEntries": 1,
                "rescale": 1 / 3.2,
            }
        },
        "Job_scheduling":{
            "Job_Info" : {
                "format": () => "job_data",
                "numberOfEntries": 1,
                "type": 'object',
            }
        }
    },
};
function getstringQueryAll_influx (ip){
    let count = 0;
    return serviceList.map(s=> {
        return d3.keys(serviceQuery.influxdb[s]).map(ser=>{
            const subs = serviceQuery.influxdb[s][ser];
            let str = "SELECT ";
            str +=  d3.range(subs.numberOfEntries).map(i=>'"'+subs.format(i+1)+'"').join(',');
            str +=  ',"host" FROM '+ser+' WHERE host=\''+ip+'\' ORDER BY time DESC LIMIT 1';
            serviceQuery.influxdb[s][ser].statement_id = count;
            count++;
            return str;
        }).join('%3B')
    }).join('%3B');
}

function getstringQuery_influx (ip,serviceI,timerange,timestep){
    const s = serviceList[serviceI];
    return d3.keys(serviceQuery.influxdb[s]).map(ser=>{
            const subs = serviceQuery.influxdb[s][ser];
            let str = "SELECT ";
            if (timestep)
                if(subs.type==="object")
                    str +=  d3.range(subs.numberOfEntries).map(i=> i? ('"'+subs.format(i+1)+'"'):('DISTINCT("'+subs.format(i+1)+'") as "'+subs.format(i+1)+'"')).join(',');
                else
                    str +=  d3.range(subs.numberOfEntries).map(i=> i? ('"'+subs.format(i+1)+'"'):('MAX("'+subs.format(i+1)+'") as "'+subs.format(i+1)+'"')).join(',');
            else
                str +=  d3.range(subs.numberOfEntries).map(i=> '"'+subs.format(i+1)+'"').join(',');
            if(subs.type==="object")
                str +=  ' FROM '+ser+' WHERE host=\''+ip+'\'';
            else
                str +=  ',"host","error" FROM '+ser+' WHERE host=\''+ip+'\'';
            if (timerange){
                str += 'AND time > \''+timerange[0]+'\'';
                if (timerange[1])
                    str += ' AND time < \''+timerange[1]+'\'';
                else
                    str += ' LIMIT 1';
                if (timestep)
                    str += ' GROUP BY time('+timestep+'),* SLIMIT 1';
            }else {
                str += ' ORDER BY time DESC LIMIT 1';
            }
            return str;
        }).join('%3B');
}

function processData_influxdb(result, serviceName) {
    const serviceAttribute = serviceQuery[db][serviceName];
    const query_return = d3.keys(serviceAttribute);
    if (result) {
        let val = result.results;
        return d3.merge(query_return.map((s, i) => {
            if (val[i].series) // no error
            {
                const subob = _.object(val[i].series[0].columns, val[i].series[0].values[0]);
                if (subob.error === "None" || subob.error === null || serviceAttribute[s].type==='object')
                    return d3.range(serviceAttribute[s].numberOfEntries).map(d => {
                        const localVal = subob[serviceAttribute[s].format(d + 1)];
                        if (localVal != null) {
                            if (serviceAttribute[s].type==='object')
                                return string2JSON(localVal);
                            return localVal * (serviceAttribute[s].rescale || 1);
                        }
                        else return undefined;
                    });
                else
                    return d3.range(serviceAttribute[s].numberOfEntries).map(d => undefined);
            } else {
                return d3.range(serviceAttribute[s].numberOfEntries).map(d => undefined);
            }
        }));
    }
    return d3.merge(query_return.map((s, i) => {
            return d3.range(serviceAttribute[s].numberOfEntries).map(d => undefined);
    }));
}
function string2JSON (str){
    try {
        return JSON.parse("["+str.replace(/'/g,'"').replace(/;/g,',')+"]")
    }catch(e){
        return undefined;
    }
}
function processData_nagios(str, serviceName) {
    const serviceAttribute = serviceQuery[db][serviceName];
    const query_return_type = serviceAttribute.type;
    if (query_return_type === "json"){
        try {
            const val = JSON.parse(str.replace(/'/g, "\"")).fields;
            if (val.error!=="None"&&val.error!==undefined) {
                //error fill
                return d3.range(serviceAttribute.numberOfEntries).map(d=> val[serviceAttribute.format(d+1)]);
            } else{
                return d3.range(serviceAttribute.numberOfEntries).map(d=> val[serviceAttribute.format(d+1)]*(serviceAttribute.rescale||1));
            }
        }catch(e){
            return d3.range(serviceAttribute.numberOfEntries).map(d=> undefined);
        }
    } else {
        return serviceAttribute.format(str);
    }
}
function processData_old(str, serviceName) {
    if (serviceName === serviceList[0]){
        var a = [];
        if (str.indexOf("timed out")>=0 || str.indexOf("(No output on stdout)")>=0 || str.indexOf("UNKNOWN")>=0 ){
            a[0] = undefinedValue;
            a[1] = undefinedValue;
            a[2] = undefinedValue;
        }
        else{
            var arrString =  str.split(" ");
            a[0] = +arrString[2]||undefinedValue;
            a[1] = +arrString[6]||undefinedValue;
            a[2] = +arrString[10]||undefinedValue;
        }
        return a;
    }
    else if (serviceName == serviceList[1]){
        var a = [];
        if (str.indexOf("timed out")>=0 || str.indexOf("(No output on stdout)")>=0 || str.indexOf("UNKNOWN")>=0
            || str.indexOf("CPU Load: null")>=0){
            a[0] = undefinedValue;
            a[1] = undefinedValue;
            a[2] = undefinedValue;
        }
        else{
            var arrString =  str.split("CPU Load: ")[1];
            a[0] = +arrString;
            a[1] = undefinedValue;
            a[2] = undefinedValue;
        }
        return a;
    }
    else if (serviceName == serviceList[2]) {
        var a = [];
        if (str.indexOf("timed out")>=0 || str.indexOf("(No output on stdout)")>=0 || str.indexOf("UNKNOWN")>=0 ){
            a[0] = undefinedValue;
            a[1] = undefinedValue;
            a[2] = undefinedValue;
        }
        else{
            var arrString =  str.split(" Usage Percentage = ")[1].split(" :: ")[0];
            a[0] = +arrString;
            a[1] = undefinedValue;
            a[2] = undefinedValue;
        }
        return a;
    }
    else if (serviceName == serviceList[3]) {
        var a = [];
        if (str.indexOf("timed out")>=0 || str.indexOf("(No output on stdout)")>=0 || str.indexOf("UNKNOWN")>=0 ){
            a[0] = undefinedValue;
            a[1] = undefinedValue;
            a[2] = undefinedValue;
            a[3] = undefinedValue;
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
            a[0] = undefinedValue;
            a[1] = undefinedValue;
            a[2] = undefinedValue;
        }
        else{
            var maxConsumtion = 3.2;  // over 100%
            var arr4 =  str.split(" ");
            a[0] = +arr4[arr4.length-2]/maxConsumtion;
            a[1] = undefinedValue;
            a[2] = undefinedValue;
        }
        return a;
    }
}

function simulateResults2(hostname,iter, s){
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
        if (sampleS[hostname]["arrPower_usage"]== undefined && db!="influxdb") {
            var simisval = handlemissingdata(hostname,iter);
            sampleS[hostname]["arrPower_usage"] = [simisval];
        }else if (sampleS[hostname]["arrPower_usage"][iter]== undefined  && db!="influxdb"){
            var simisval = handlemissingdata(hostname,iter);
            sampleS[hostname]["arrPower_usage"][iter] = simisval;
        }
        newService = sampleS[hostname]["arrPower_usage"][iter];
    }
    if (newService === undefined){
        newService ={}
        newService.result = {};
        newService.result.query_time = query_time;
        newService.data = {};
        newService.data.service={};
        newService.data.service.host_name = hostname;
        newService.data.service.plugin_output = undefined;
    }else {
        if (db === "influxdb")
            try {
                newService.result.query_time = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ")(newService.result.query_time).getTime();
            }catch(e){

            }
    }
    return newService;
}

function handlemissingdata(hostname,iter){
    var simisval = jQuery.extend(true, {}, sampleS[hostname]["arrTemperature"][iter]);
    var simval = processData(simisval.data.service.plugin_output, serviceList[0]);
    // simval = (simval[0]+simval[1])/2;
    simval = (simval[0]+simval[1]+20);
    var tempscale = d3.scaleLinear().domain([thresholds[0][0],thresholds[0][1]]).range([thresholds[4][0],thresholds[4][1]]);
    if (simval!==undefinedValue && !isNaN(simval) )
    //simisval.data.service.plugin_output = "OK - The average power consumed in the last one minute = "+Math.round(tempscale(simval)*3.2)+" W";
        simisval.data.service.plugin_output = "OK - The average power consumed in the last one minute = "+Math.floor(simval*3.2)+" W";
    else
        simisval.data.service.plugin_output = "UNKNOWN";
    return simisval;
}