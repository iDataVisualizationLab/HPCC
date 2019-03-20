var serviceList = ["Temperature","Job_load","Memory_usage","Fans_speed","Power_consum"];
var serviceListattr = ["arrTemperature","arrCPU_load","arrMemory_usage","arrFans_health","arrPower_usage"];

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
                "rescale": 1 / 191.908,
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
            str +=  ',"host" FROM '+ser+' WHERE host=\''+ip+'\' ORDER BY DESC LIMIT 1';
            serviceQuery.influxdb[s][ser].statement_id = count;
            count++;
            return str;
        }).join('%3B')
    }).join('%3B');
}

function getstringQuery_influx (ip,serviceI){
    const s = serviceList[serviceI];
    return d3.keys(serviceQuery.influxdb[s]).map(ser=>{
            const subs = serviceQuery.influxdb[s][ser];
            let str = "SELECT ";
            str +=  d3.range(subs.numberOfEntries).map(i=>'"'+subs.format(i+1)+'"').join(',');
            str +=  ',"host" FROM '+ser+' WHERE host=\''+ip+'\' ORDER BY DESC LIMIT 1';
            return str;
        }).join('%3B');
}

function processData_influxdb(result, serviceName) {
    let val = result.results;
    const serviceAttribute = serviceQuery[db][serviceName];
    const query_return = d3.keys(serviceAttribute);
    return d3.merge(query_return.map((s,i)=>{
        if (val[i].series) // no error
        {
            const subob = _.object(val[i].series[0].columns, val[i].series[0].values[0]);
            return d3.range(serviceAttribute[s].numberOfEntries).map(d =>{
                const localVal = subob[serviceAttribute[s].format(d + 1)];
                if (localVal!=null)
                    return subob[serviceAttribute[s].format(d + 1)]*(serviceAttribute[s].rescale||1);
                else return undefined;
            });
        }else{
            return d3.range(serviceAttribute[s].numberOfEntries).map(d => undefined);
        }
    }));
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
    if (serviceName == serviceList[0]){
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