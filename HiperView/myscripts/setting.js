// read variable
const TIMEKEY = "Time";
const TIMEFORMAT = d3.timeFormat("%B %d %Y %H:%M");

var stickKey = TIMEKEY;
var stickKeyFormat = TIMEFORMAT;
// system variable
var application_name ='HiperView';
var jobList=[];
var hostList;
var serviceList = ["Temperature","Job_load","Memory_usage","Fans_speed","Power_consum","Job_scheduling"];
var serviceList_selected = [{"text":"Temperature","index":0},{"text":"Job_load","index":1},{"text":"Memory_usage","index":2},{"text":"Fans_speed","index":3},{"text":"Power_consum","index":4}];

var serviceListattr = ["arrTemperature","arrCPU_load","arrMemory_usage","arrFans_health","arrPower_usage","arrJob_scheduling"];
var serviceLists = [{"text":"Temperature","id":0,"enable":true,"sub":[{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.834386356666759,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.4487989505128276,"range":[3,98]}]},{"text":"Job_load","id":1,"enable":true,"sub":[{"text":"Job load","id":0,"enable":true,"idroot":1,"angle":1.2566370614359172,"range":[0,10]}]},{"text":"Memory_usage","id":2,"enable":true,"sub":[{"text":"Memory usage","id":0,"enable":true,"idroot":2,"angle":1.8849555921538759,"range":[0,99]}]},{"text":"Fans_speed","id":3,"enable":true,"sub":[{"text":"Fan1 speed","id":0,"enable":true,"idroot":3,"angle":2.4751942119192307,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":3,"angle":2.9239931624320583,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":3,"angle":3.372792112944886,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":3,"angle":3.8215910634577135,"range":[1050,17850]}]},{"text":"Power_consum","id":4,"enable":true,"sub":[{"text":"Power consumption","id":0,"enable":true,"idroot":4,"angle":4.71238898038469,"range":[0,200]}]}];
var serviceLists_or = [{"text":"Temperature","id":0,"enable":true,"sub":[{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.834386356666759,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.4487989505128276,"range":[3,98]}]},{"text":"Job_load","id":1,"enable":true,"sub":[{"text":"Job load","id":0,"enable":true,"idroot":1,"angle":1.2566370614359172,"range":[0,10]}]},{"text":"Memory_usage","id":2,"enable":true,"sub":[{"text":"Memory usage","id":0,"enable":true,"idroot":2,"angle":1.8849555921538759,"range":[0,99]}]},{"text":"Fans_speed","id":3,"enable":true,"sub":[{"text":"Fan1 speed","id":0,"enable":true,"idroot":3,"angle":2.4751942119192307,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":3,"angle":2.9239931624320583,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":3,"angle":3.372792112944886,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":3,"angle":3.8215910634577135,"range":[1050,17850]}]},{"text":"Power_consum","id":4,"enable":true,"sub":[{"text":"Power consumption","id":0,"enable":true,"idroot":4,"angle":4.71238898038469,"range":[0,200]}]}];
var serviceFullList = serviceLists2serviceFullList(serviceLists);
var singleDataAxis=[];
function serviceLists2serviceFullList (serviceLists){
    let temp = [];
    serviceLists.forEach(s=>s.sub.forEach(sub=>{
        sub.idroot = s.id;
        sub.enable = s.enable&&(sub.enable===undefined?true:sub.enable);
        temp.push(sub);}));
    return temp;
}
var serviceListattrnest = [
    {key:"arrTemperature", sub:["CPU1 Temp","CPU2 Temp","Inlet Temp"]},
    {key:"arrCPU_load", sub:["Job load"]},
    {key:"arrMemory_usage", sub:["Memory usage"]},
    {key:"arrFans_health", sub:["Fan1 speed","Fan2 speed","Fan3 speed","Fan4 speed"]},
    {key:"arrPower_usage", sub:["Power consumption"]}];
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
                format: () => "cpuusage(load)",
                format2: () => "cpuusage",
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
                'mainkey': 'jobID',
                "numberOfEntries": 1,
                "type": 'object',
            }
        }
    },
};
function systemFormat() {
    jobList=[];
    serviceList = ["Temperature","Job_load","Memory_usage","Fans_speed","Power_consum","Job_scheduling"];
    serviceList_selected = [{"text":"Temperature","index":0},{"text":"Job_load","index":1},{"text":"Memory_usage","index":2},{"text":"Fans_speed","index":3},{"text":"Power_consum","index":4}];

    serviceListattr = ["arrTemperature","arrCPU_load","arrMemory_usage","arrFans_health","arrPower_usage","arrJob_scheduling"];
    serviceLists = [{"text":"Temperature","id":0,"enable":true,"sub":[{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.834386356666759,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.4487989505128276,"range":[3,98]}]},{"text":"Job_load","id":1,"enable":true,"sub":[{"text":"Job load","id":0,"enable":true,"idroot":1,"angle":1.2566370614359172,"range":[0,10]}]},{"text":"Memory_usage","id":2,"enable":true,"sub":[{"text":"Memory usage","id":0,"enable":true,"idroot":2,"angle":1.8849555921538759,"range":[0,99]}]},{"text":"Fans_speed","id":3,"enable":true,"sub":[{"text":"Fan1 speed","id":0,"enable":true,"idroot":3,"angle":2.4751942119192307,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":3,"angle":2.9239931624320583,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":3,"angle":3.372792112944886,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":3,"angle":3.8215910634577135,"range":[1050,17850]}]},{"text":"Power_consum","id":4,"enable":true,"sub":[{"text":"Power consumption","id":0,"enable":true,"idroot":4,"angle":4.71238898038469,"range":[0,200]}]}];
    serviceFullList = serviceLists2serviceFullList(serviceLists);
    serviceListattrnest = [
        {key:"arrTemperature", sub:["CPU1 Temp","CPU2 Temp","Inlet Temp"]},
        {key:"arrCPU_load", sub:["Job load"]},
        {key:"arrMemory_usage", sub:["Memory usage"]},
        {key:"arrFans_health", sub:["Fan1 speed","Fan2 speed","Fan3 speed","Fan4 speed"]},
        {key:"arrPower_usage", sub:["Power consumption"]}];
    serviceAttr = {arrTemperature: {key: "Temperature", val: ["arrTemperatureCPU1","arrTemperatureCPU2"]},
        arrCPU_load: {key: "CPU_load", val: ["arrCPU_load"]},
        arrMemory_usage: {key: "Memory_usage", val: ["arrMemory_usage"]},
        arrFans_health: {key: "Fans_speed", val: ["arrFans_speed1","arrFans_speed2"]},
        arrPower_usage:{key: "Power_consumption", val: ["arrPower_usage"]}};
    thresholds = [[3,98], [0,10], [0,99], [1050,17850],[0,200] ];
}
function newdatatoFormat (data,separate){
    separate = separate||"-";
    serviceList = [];
    serviceLists = [];
    serviceListattr = [];
    serviceAttr={}
    hostList ={data:{hostlist:{}}};
    // FIXME detect format
    const variables = _.without(Object.keys(data[0]),'timestamp','time');
    data.forEach(d=>variables.forEach(k=>d[k] = d[k]===""?null:(+d[k]))) // format number
    let keys ={};
    if (variables.find(k=>k.split(separate).length>1)===undefined)
        separate = "-";
    variables.forEach((k,ki)=>{
        let split_string = k.split(separate);
        const nameh = split_string.shift();
        hostList.data.hostlist [nameh] = {
            rack: 1,//nameh.split('.')[2],
            node: 1,//.split('.')[3],
            id : nameh,
        };
        let currentkey = split_string.join(separate);
        const keys_replace =Object.keys(basic_service).map(k=>extractWordsCollection(getTermsArrayCollection(k),currentkey,k)).filter(d=>Object.keys(d).length);
        if(!keys[currentkey])
            keys[currentkey] = {r:undefined,vi:[]};
        if (keys_replace.length)
            keys[currentkey].r = Object.keys(keys_replace[0])[0]||0;
        keys[currentkey].vi.push(ki)
    });
    // check unionkeys
    d3.keys(hostList.data.hostlist).forEach(hname=>{
        Object.keys(keys).forEach((k,i)=>{
            if (data.columns.find(c=>c===hname+separate+k)===undefined)
                delete keys[k];
        })
    });

    serviceQuery["csv"]= serviceQuery["csv"]||{};
    Object.keys(keys).forEach((k,i)=>{
        serviceQuery["csv"][k]={};
        serviceQuery["csv"][k][k]={
            type : 'number',
            format : () =>k,
            numberOfEntries: 1};
        serviceAttr[k] = {
            key: k,
            val:[k]
        };
        serviceList.push(k);
        serviceListattr.push(k);
        let range =[+Infinity,-Infinity];
        keys[k].vi.forEach(vi=>{
            let temprange = d3.extent(data,d=>d[variables[vi]]);
            if (temprange[0]<range[0])
                range[0] = temprange[0];
            if (temprange[1]>range[1])
                range[1] = temprange[1];
        });
        // let range = d3.extent(data,d=>d[variables[i]]);
        if (keys[k].r) {
            let suggest_range = serviceLists_or.find(d => d.text === keys[k].r).sub[0].range;
            if (suggest_range[0]<=range[0]&&suggest_range[1]>=range[1])
                range = suggest_range;
        }
        const temp = {"text":k,"id":i,"enable":true,"sub":[{"text":k,"id":0,"enable":true,"idroot":i,"angle":i*2*Math.PI/(Object.keys(keys).length-1),"range":range}]};
        thresholds.push(range);
        serviceLists.push(temp);
    });
    serviceList_selected = serviceList.map((d,i)=>{return{text:d,index:i}});
    serviceFullList = serviceLists2serviceFullList(serviceLists);
    // scaleService = serviceFullList.map(d=>d3.scaleLinear().domain(d.range));
    scaleService = serviceLists.map(d=>d.sub.map(sub=>d3.scaleLinear().domain(sub.range)));
    const host_name = Object.keys(hostList.data.hostlist);
    sampleS = {};
    tsnedata = {};
    sampleS['timespan'] = data.map(d=>new Date(d.time||d.timestamp))
    data.forEach(d=>{
        host_name.forEach(h=> {
            serviceListattr.forEach((attr,i) => {
                 if (sampleS[h]===undefined) {
                     sampleS[h] = {};
                     tsnedata[h] = [];
                 }
                sampleS[h][attr] = sampleS[h][attr]||[];
                 let currentIndex = sampleS[h][attr].length;
                 if (tsnedata[h][currentIndex]===undefined){
                     tsnedata[h][currentIndex] = [];
                     tsnedata[h][currentIndex].name = h;
                     tsnedata[h][currentIndex].timestep =currentIndex;
                 }
                 let retievedData = processResult_csv(d[h+separate+attr],attr);
                sampleS[h][attr].push(retievedData);
                retievedData.forEach((r,sub_index)=> {
                    tsnedata[h][currentIndex].push(r === null ? 0 : scaleService[i][sub_index](r) || 0);
                });
            });
        })
    });
}
function newdatatoFormat_noSuggestion (data,separate){
    separate = separate||"-";
    serviceList = [];
    serviceLists = [];
    serviceListattr = [];
    serviceAttr={};
    hostList ={data:{hostlist:{}}};
    // FIXME detect format
    const variables = _.without(Object.keys(data[0]),'timestamp','time');
    data.forEach(d=>variables.forEach(k=>d[k] = d[k]===""?null:(+d[k]))) // format number
    // test sepatate

    if (variables.find(k=>k.split(separate).length>1)===undefined)
        separate = "-";


    let keys ={};
    variables.forEach((k,ki)=>{
        let split_string = k.split(separate);
        const nameh = split_string.shift();
        hostList.data.hostlist [nameh] = {
            rack: 1,//nameh.split('.')[2],
            node: 1,//.split('.')[3],
            id : nameh,
        };
        let currentkey = split_string.join(separate);
        // const keys_replace =Object.keys(basic_service).map(k=>extractWordsCollection(getTermsArrayCollection(k),currentkey,k)).filter(d=>Object.keys(d).length);
        if(!keys[currentkey])
            keys[currentkey] = {r:undefined,vi:[]};
        // if (keys_replace.length)
        //     keys[currentkey].r = Object.keys(keys_replace[0])[0]||0;
        keys[currentkey].vi.push(ki)
    });
    // check unionkeys
    d3.keys(hostList.data.hostlist).forEach(hname=>{
        Object.keys(keys).forEach((k,i)=>{
            if (data.columns.find(c=>c===hname+separate+k)===undefined)
                delete keys[k];
        })
    });

    serviceQuery["csv"]= serviceQuery["csv"]||{};

    let validAxis = 0;
    Object.keys(keys).forEach((k,i)=>{
        serviceQuery["csv"][k]={};
        serviceQuery["csv"][k][k]={
            type : 'number',
            format : () =>k,
            numberOfEntries: 1};
        serviceAttr[k] = {
            key: k,
            val:[k]
        };
        serviceList.push(k);
        serviceListattr.push(k);
        let range =[+Infinity,-Infinity];
        keys[k].vi.forEach(vi=>{
            let temprange = d3.extent(data,d=>d[variables[vi]]);
            if (temprange[0]<range[0])
                range[0] = temprange[0];
            if (temprange[1]>range[1])
                range[1] = temprange[1];
        });
        // let range = d3.extent(data,d=>d[variables[i]]);
        if (keys[k].r) {
            let suggest_range = serviceLists_or.find(d => d.text === keys[k].r).sub[0].range;
            if (suggest_range[0]<=range[0]&&suggest_range[1]>=range[1])
                range = suggest_range;
        }
        if (range[0]!==range[1]){
            validAxis++;
        }else{
            singleDataAxis.push(i);
        }
        const temp = {"text":k,"id":i,"enable":range[0]!==range[1],"sub":[{"text":k,"id":0,"enable":true,"idroot":i,"angle":i*2*Math.PI/(Object.keys(keys).length),"range":range}]};
        thresholds.push(range);
        serviceLists.push(temp);
    });
    serviceList_selected = serviceList.map((d,i)=>{return{text:d,index:i}});
    serviceFullList = serviceLists2serviceFullList(serviceLists);
    scaleService = serviceFullList.map(d=>d3.scaleLinear().domain(d.range));
    let currentValidAxis = 0;
    serviceFullList.forEach(d=>{
        d.enable = d.range[0]!==d.range[1];
        if (d.enable) {
            d.angle = currentValidAxis * 2 * Math.PI / validAxis;
            currentValidAxis++;
        }else
            d.angle = 0;
    });
    const host_name = Object.keys(hostList.data.hostlist);
    sampleS = {};
    tsnedata = {};
    sampleS['timespan'] = data.map(d=>new Date(d.time||d.timestamp))
    data.forEach(d=>{
        host_name.forEach(h=> {
            serviceListattr.forEach((attr,i) => {
                if (sampleS[h]===undefined) {
                    sampleS[h] = {};
                    tsnedata[h] = [];
                }
                sampleS[h][attr] = sampleS[h][attr]||[];
                let currentIndex = sampleS[h][attr].length;
                if (tsnedata[h][currentIndex]===undefined){
                    tsnedata[h][currentIndex] = [];
                    tsnedata[h][currentIndex].name = h;
                    tsnedata[h][currentIndex].timestep =currentIndex;
                }
                let retievedData = processResult_csv(d[h+separate+attr],attr);
                // let retievedData = d[h+separate+attr];
                sampleS[h][attr].push(retievedData);
                tsnedata[h][currentIndex].push(retievedData[0]===null?0:scaleService[i](retievedData[0])||0);
            });
        })
    });
}
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
                    str +=  d3.range(subs.numberOfEntries).map(i=> i? ('"'+(subs.format2||subs.format)(i+1)+'"'):('DISTINCT("'+(subs.format2||subs.format)(i+1)+'") as "'+(subs.format2||subs.format)(i+1)+'"')).join(',');
                else
                    str +=  d3.range(subs.numberOfEntries).map(i=> i? ('"'+(subs.format2||subs.format)(i+1)+'"'):('MAX("'+(subs.format2||subs.format)(i+1)+'") as "'+(subs.format2||subs.format)(i+1)+'"')).join(',');
            else
                str +=  d3.range(subs.numberOfEntries).map(i=> '"'+(subs.format2||subs.format)(i+1)+'"').join(',');
            if(subs.type==="object")
                str +=  ' FROM '+ser+' WHERE host=\''+ip+'\'';
            else
                str +=  ',"host","error" FROM '+ser+' WHERE host=\''+ip+'\'';
            if (timerange){
                str += 'AND time >= \''+timerange[0]+'\'';
                if (timerange[1])
                    str += ' AND time <= \''+timerange[1]+'\'';
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

function processData_csv(result, serviceName) {
    const serviceAttribute = serviceQuery[db][serviceName];
    const query_return = d3.keys(serviceAttribute);
    if (result!==undefined) {
        let val = result;
        return d3.merge(query_return.map((s, i) => {
            if ((val!=null&&val[i]!=undefined)||(val!=undefined&&i===0)) // no error
            {
                const subob = val;
                if(serviceAttribute[s].type==='number')
                    return [+subob];
                else if (subob.error === "None" || subob.error === null || serviceAttribute[s].type==='object')
                    return d3.range(serviceAttribute[s].numberOfEntries).map(d => {
                        const localVal = subob[serviceAttribute[s].format(d + 1)]||(serviceAttribute[s].format2&&subob[serviceAttribute[s].format2(d + 1)]);
                        if (localVal != null && localVal != undefined) {
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
                        let localVal,key;
                        try {
                            localVal = subob[serviceAttribute[s].format2(d + 1)];
                            key = serviceAttribute[s].format2(d + 1);
                        }catch(e){
                            localVal = subob[serviceAttribute[s].format(d + 1)];
                            key = serviceAttribute[s].format(d + 1);
                        }
                        if (localVal != null && localVal !== undefined) {
                            if (serviceAttribute[s].type==='object') {
                                let result_temp = string2JSON(localVal);
                                if (result_temp.length)
                                    result_temp = d3.nest().key(function(uD){return uD[serviceAttribute[s].mainkey]}).entries( result_temp).map(u=>u.values[0]);
                                return result_temp
                            }
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
        if (str===undefined||str.indexOf("timed out")>=0 || str.indexOf("(No output on stdout)")>=0 || str.indexOf("UNKNOWN")>=0 ){
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
    if (s == 'Temperature')
        newService = sampleS[hostname].arrTemperature[iter];
    else if (s == "Job_load")
        newService = sampleS[hostname].arrCPU_load[iter];
    else if (s == "Memory_usage")
        newService = sampleS[hostname].arrMemory_usage[iter];
    else if (s == "Fans_speed")
        newService = sampleS[hostname].arrFans_health[iter];
    else if (s == "Power_consum") {
        if (sampleS[hostname]["arrPower_usage"]== undefined && db!="influxdb") {
            var simisval = handlemissingdata(hostname,iter);
            sampleS[hostname]["arrPower_usage"] = [simisval];
        }else if ((sampleS[hostname]["arrPower_usage"][iter]=== undefined || sampleS[hostname]["arrPower_usage"][iter][0]=== undefined || sampleS[hostname]["arrPower_usage"][iter][0]=== null)  && db!="influxdb"){
            var simisval = handlemissingdata(hostname,iter);
            sampleS[hostname]["arrPower_usage"][iter] = simisval;
        }
        newService = sampleS[hostname]["arrPower_usage"][iter];
    }
    if (newService === undefined){
        // newService ={}
        // newService.result = {};
        // newService.result.query_time = query_time;
        // newService.data = {};
        // newService.data.service={};
        // newService.data.service.host_name = hostname;
        // newService.data.service.plugin_output = undefined;
        newService = [undefined];
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
    if(sampleS[hostname]["arrTemperature"]) {
        var simisval = sampleS[hostname]["arrTemperature"][iter].slice();
        var simval = simisval.slice(0);
        simval = (simval[0] + simval[1] + 20);
        if (simval !== undefinedValue && !isNaN(simval))
            simisval = [Math.floor(simval)];
        else
            simisval = [];
    }else
        simisval=[];
    return simisval;
}

function getDataByName_withLabel (hostResults, name,startIndex, lastIndex,undefinedValue) {
    let data = getDataByName(hostResults, name,startIndex, lastIndex,undefined,undefinedValue);
    if (startIndex===lastIndex)
        return serviceFullList.map((d,i)=>{return {axis: d.text, value:data[i]}});
    else {
        return serviceFullList.map((d, i) => {
            return {axis: d.text, value: d3.range(0, lastIndex - startIndex + 1).map(inx => data[inx * +i])}
        });
    }
}
function getDataByName(hostResults, name,startIndex, lastIndex, isPredict,undefinedValue) {
    startIndex = startIndex||0;
    var r = hostResults[name];
    var arrServices = [];
    for (var stepIndex = startIndex; stepIndex <= lastIndex; stepIndex++) {
        serviceList_selected.forEach((ser) => {
            let indx = ser.index;
            var a;
            let requiredLength=  serviceLists[indx].sub.length;
            try{
                r[serviceListattr[indx]][stepIndex]
            }catch(err){
                console.log(serviceListattr)
                console.log(indx)
                console.log(serviceListattr[indx])
                console.log(r[serviceListattr[indx]])
            }
            if (r[serviceListattr[indx]][stepIndex]) {
                a = r[serviceListattr[indx]][stepIndex].slice(0,requiredLength);
                d3.range(0,requiredLength - a.length).forEach(d=> a.push(undefined));
            }
            else {
                a = predict(r[serviceListattr[indx]], ser.text, isPredict===undefined?false:!isPredict,undefinedValue);
                a = a.slice(0,requiredLength);
                d3.range(0,requiredLength - a.length).forEach(d=> a.push(undefined));
            }
            var scale = d3.scaleLinear()
                .domain(serviceLists[indx].sub[0].range)
                .range([0, 1]);

            a = a.map(d => scale(d)===0? 0: (scale(d==null?undefined:d) ||  undefinedValue));
            // switch (indx) {
            //     case 0:
            //     case 3:
                    arrServices = d3.merge([arrServices, a]);
                //     break;
                // default:
                //     arrServices.push(a[0] ===0? 0: (a[0]|| undefinedValue))
            // }
        })
    }
    arrServices.name = name;
    return arrServices;
}
function predict (arr,ser, notUsepastValue,undefinedValue){
    try{
        if (notUsepastValue || arr[arr.length-1]==undefined)
            throw 'notusepast';
        return arr[arr.length-1]; // getdata from the past
    } catch(e){
        let average = 0;
        let serviceMain = serviceLists.find(s=>s.text===ser);
        let service = serviceMain.sub[0];
        if (service) {
            average = undefinedValue? (service.undefinedValue ===undefined?((service.range[1]-service.range[0])/2+service.range[0]):service.undefinedValue):undefined;
           return  d3.range(serviceMain.sub.length).map(a=>average);
        }
            return [0,0,0];
    }
}

function inithostResults (worker) {

    hosts = [];
    const hostdata = hostList.data.hostlist;
    hostResults ={};
    for (var att in hostdata) {
        var h = {};
        h.name = att;
        h.hpcc_rack = hostdata[att].rack?hostdata[att].rack:(+att.split("-")[1]);
        h.hpcc_node = hostdata[att].node?hostdata[att].node:+att.split("-")[2].split(".")[0];
        h.index = hosts.length;

        // to contain the historical query results
        if (!worker) {
            hostResults[h.name] = {};
            hostResults[h.name].index = h.index;
            hostResults[h.name].arr = [];
            serviceListattr.forEach(d => hostResults[att][d] = []);
        }
        hosts.push(h);
    }
    hostResults.timespan =[]
    hosts.sort((a, b) => {

        var rackx = a.hpcc_rack;
        var racky = b.hpcc_rack;
        var x = a.hpcc_node;
        var y = b.hpcc_node;
        if (rackx !== racky) {
            return rackx - racky;
        } else {
            if (x % 2 - y % 2) {
                return y % 2 - x % 2
            } else {
                return x - y
            }
        }
    });
}

// Delete unnecessary files
let processResult = processResult_old;
// function processResult_influxdb(r,hostname,index){
//     var obj = {};
//     obj.result = {};
//     if (r.results[0].series){
//         obj.result.query_time = new Date(r.results[0].series[0].values[index||0][0]);
//     }else
//         obj.result.query_time = new Date();
//     obj.data = {};
//     obj.data.service={};
//     obj.data.service.host_name = hostname;
//     if (index !== undefined ) {
//         obj.data.service.plugin_output = {results: r.results.map(d => {
//                 let temp = {};
//                 temp.statement_id = d.statement_id;
//                 temp.series = [];
//                 let tempsub = {};
//                 const series = d.series[0];
//                 tempsub.name = series.name;
//                 tempsub.columns = series.columns;
//                 tempsub.values = [series.values[index]];
//                 temp.series.push(tempsub);
//                 return temp;
//             })};
//     } else
//         obj.data.service.plugin_output = r;
//     return obj;
// }
// function processResult_old(r){
//     var obj = {};
//     obj.result = {};
//     obj.result.query_time = r.result.query_time;
//     obj.data = {};
//     obj.data.service={};
//     obj.data.service.host_name = r.data.service.host_name;
//     obj.data.service.plugin_output = r.data.service.plugin_output;
//     return obj;
// }
function processResult_influxdb(r,hostname,index,servicename){
    let temp={};
    if (index !== undefined ) {
        temp = {results: r.results.map(d => {
                let temp = {};
                temp.statement_id = d.statement_id;
                temp.series = [];
                let tempsub = {};
                if (d.series) {
                    const series = d.series[0];
                    tempsub.name = series.name;
                    tempsub.columns = series.columns;
                    if (servicename==="Job_scheduling") {
                        tempsub.values = [[hostResults.timespan[index].toISOString (),series.values.filter(f=>new Date(f[0]).toISOString()===hostResults.timespan[index].toISOString ()&& f[1]!== 'idle').map(e=>e[1]).join(';')]]
                    }else
                        tempsub.values = [series.values[index]];
                }
                temp.series.push(tempsub);
                return temp;
            })};
    } else
        temp = r;
    let results_ob = processData_influxdb(temp, servicename);
    if (servicename!=="Job_scheduling") {
        return results_ob;
    }else{
        let newestdata = hostResults[hostname].arrJob_scheduling[hostResults[hostname].arrJob_scheduling.length-1];
        return results_ob;
    }
}
function processResult_old(r){
    return processData_nagios(r.data.service.plugin_output);
    // return obj;
}
function processResult_csv(r,serviceName){

    return processData_csv(r,serviceName);
}
const processResult_nagios = processResult_old;



let processData = processData_old;







// // 2 functions needed for kernel density estimate
    function kernelDensityEstimator(kernel, X) {
        return function(V) {
            return X.map(function(x) {
                return [x, d3.mean(V, function(v) { return kernel(x - v); })];
            });
        };
    }

    function kernelEpanechnikov(k) {
        return function(v) {
            return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
        };
    }

function getformattime (rate,unit){
    return d3["time"+unit].every(rate);
}

let basic_service = {"Temperature":['temp'],
    "Job_load":['job'],
    "Memory_usage":['memory','cups'],
    "Fans_speed":['fan'],
    "Power_consum":['power','Voltage']};

function extractWordsCollection (terms,data,keyk) {
    let message = data;
    let collection = {};
    terms.forEach(t=>{
        t.value.find(
            k => {
                if ((new RegExp(k,'gi')).test(message)) {
                    collection[t.key] = keyk;
                    return true;
                }
                return false;

            })

    });
    return collection;
}

function getTermsArrayCollection(header){
    return basic_service[header].map(d=>{return {key:header, value: [d]}});
}

function getJoblist (iteration,reset){
    try {
        if (reset===true || reset===undefined)
            jobList = [];
        hosts.forEach(h => {
            var result = simulateResults2(h.name, iteration||lastIndex, "Job_scheduling");
            const resultObj = result[0];
            if (resultObj) {
                resultObj.forEach(d=>{
                    d.nodes= _.isArray( d.nodes) ? d.nodes:d.nodes.split(',')});
                jobList = _.union(jobList, resultObj);
            }
        });
        // handle dupliacte jobID
        jobList = _.chain(jobList)
            .groupBy(d=>d.jobID).values().map(d=>d.reduce((a,b)=>{a.nodes = _.union(a.nodes,b.nodes); return a;})).value();
        //draw userlist data
        TSneplot.drawUserlist(query_time);
    }catch(e){}
}

function current_userData () {
    let jobByuser = d3.nest().key(function(uD){return uD.user}).entries( jobList);
    jobByuser.forEach(d=>d.unqinode= _.chain(d.values).map(d=>d.nodes).flatten().uniq().value());
    return jobByuser;
}
function fixstr(s) {
    return s.replace(/ |#/gi,'');
}
let histodram = {
    resolution:20,
    outlierMultiply: 3
};

function getHistdata(d, name, marker) {
    d = d.filter(e => e !== undefined).sort((a, b) => a - b);
    let r;
    if (d.length) {
        var x = d3.scaleLinear()
            .domain(d3.extent(d));
        var histogram = d3.histogram()
            .domain(x.domain())
            .thresholds(x.ticks(histodram.resolution))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
            .value(d => d);
        let hisdata = histogram(d);

        let sumstat = hisdata.map(d => [d.x0 + (d.x1 - d.x0) / 2, (d || []).length]);
        r = {
            axis: name,
            q1: ss.quantileSorted(d, 0.25),
            q3: ss.quantileSorted(d, 0.75),
            median: ss.medianSorted(d),
            // outlier: ,
            arr: sumstat
        };
        if (d.length > 4) {
            const iqr = r.q3 - r.q1;
            const lowLimit = r.q3 + histodram.outlierMultiply * iqr;
            const upLimit = r.q1 - histodram.outlierMultiply * iqr;
            r.outlier = _.uniq(d.filter(e => e > lowLimit || e < upLimit));
            if (marker&&d.length>marker){
                let sum = d.length;
                let markerIndex = sumstat.findIndex(d=>(sum-=d[1],sum)<marker);
                if (markerIndex!==-1)
                    r.marker = markerIndex;
            }
        } else {
            r.outlier = _.uniq(d);
        }
    } else {
        r = {
            axis: name,
            q1: undefined,
            q3: undefined,
            median: undefined,
            outlier: [],
            arr: []
        };
    }
    return r;
}
function orderByCorrelation(){
    let simMatrix = variableCorrelation;
    const orderMatrix = simMatrix.map(d=>d.index);
    let mapIndex = [];
    simMatrix.forEach((v,i)=>{
        v.total =0;
        mapIndex.push(i);
        orderMatrix.forEach((j,jj)=>{
            if (i!==j) {
                if (j-i>0)
                    v.total += v[j-i-1];
                else
                    v.total += simMatrix[jj][i-1-j];
            }
        })
    });
    mapIndex.sort((a,b)=> simMatrix[a].total-simMatrix[b].total);
    // let undefinedposition = data.findIndex(d=>d[0].text.match(': undefined'))
    // mapIndex.sort((a,b)=>
    //     b===undefinedposition?1:(a===undefinedposition?-1:0)
    // )
    let current_index = mapIndex.pop();
    let orderIndex = [simMatrix[current_index].index_s];

    do{
        let maxL = -Infinity;
        let maxI = 0;
        mapIndex.forEach((d)=>{
            let temp;
            if (orderMatrix[d]>simMatrix[current_index].index ){
                temp = simMatrix[current_index][orderMatrix[d]-simMatrix[current_index].index -1];
            }else{
                temp = simMatrix[d][simMatrix[current_index].index -orderMatrix[d]-1]
            }
            if (maxL<temp){
                maxL = temp;
                maxI = d;
            }
        });
        orderIndex.push(simMatrix[maxI].index_s);
        current_index = maxI;
        mapIndex = mapIndex.filter(d=>d!=maxI);
    } while(mapIndex.length);
    orderIndex.forEach((o,i)=>{
        serviceFullList[o].angle = i*2*Math.PI/(orderIndex.length);
    });
}

function enableVariableCorrelation(isenable){
    d3.select('#enableVariableCorrelation').attr('disabled',!isenable?'':null)
}

function distanceL2(a, b){
    let dsum = 0;
    a.forEach((d,i)=> {dsum +=(d-b[i])*(d-b[i])});
    return Math.round(Math.sqrt(dsum)*Math.pow(10, 10))/Math.pow(10, 10);
}
function distanceL1(a,b) {
    let dsum = 0;
    a.forEach((d,i)=> {dsum +=Math.abs(d-b[i])}); //modified
    return Math.round(dsum*Math.pow(10, 10))/Math.pow(10, 10);
}

function handle_clusterinfo () {
    let data_info = [['Grouping Method:',group_opt.clusterMethod]];
    d3.select(`#${group_opt.clusterMethod}profile`).selectAll('label').each(function(d,i) {
        data_info.push([d3.select(this).text(), group_opt.bin[Object.keys(group_opt.bin)[i]]])
    });
    data_info.push(['#group calculated:',cluster_info.length]);
    let table = d3.select('#clusterinformation').select('table tbody');
    let tr=table
        .selectAll('tr')
        .data(data_info);
    tr.exit().remove();
    let tr_new = tr.enter().append('tr');
    let td = table.selectAll('tr').selectAll('td').data(d=>d);
    td.exit().remove();
    td.enter().append('td')
        .merge(td)
        .text(d=>d);
}

function recomendName (clusterarr,haveDescription){
    clusterarr.forEach((c,i)=>{
        c.index = i;
        c.axis = [];
        c.labels = ''+i;
        c.name = `group_${i+1}`;
        let zero_el = c.__metrics.filter(f=>!f.value);
        let name='';
        if (zero_el.length && zero_el.length<c.__metrics.normalize.length){
            c.axis = zero_el.map(z=>{return{id:z.axis,description:'undefined'}});
            name += `${zero_el.length} metric(s) undefined `;
        }else if(zero_el.length===c.__metrics.normalize.length){
            c.text = `undefined`;
            if(!clusterDescription[c.name])
                clusterDescription[c.name] = {};
            clusterDescription[c.name].id = c.name;
            clusterDescription[c.name].text = c.text;
            return;
        }
        name += c.__metrics.filter(f=>f.value>0.75).map(f=>{
            c.axis.push({id:f.axis,description:'high'});
            return 'High '+f.axis;
        }).join(', ');
        name = name.trim();
        if (name==='')
            c.text = ``;
        else
            c.text = `${name}`;
        if(!haveDescription || !clusterDescription[c.name]){
            if(!clusterDescription[c.name])
                clusterDescription[c.name] = {};
            clusterDescription[c.name].id = c.name;
            clusterDescription[c.name].text = c.text;
        }
    });
}

function recomendColor (clusterarr) {
    let colorCa = colorScaleList['customschemeCategory'].slice();
    if (clusterarr.length>10 && clusterarr.length<21)
        colorCa = d3.schemeCategory20;
    else if (clusterarr.length>20)
        colorCa = clusterarr.map((d,i)=>d3.interpolateTurbo(i/(clusterarr.length-1)));
    let colorcs = d3.scaleOrdinal().range(colorCa);
    let colorarray = [];
    let orderarray = [];
    // clusterarr.filter(c=>!c.text.match('undefined'))
    clusterarr.filter(c=>c.text!=='undefined')
        .forEach(c=>{
            colorarray.push(colorcs(c.name));
            orderarray.push(c.name);
        });
    clusterarr.filter(c=>c.text==='undefined').forEach(c=>{
        colorarray.push('gray');
        orderarray.push(c.name);
    });
    colorCluster.range(colorarray).domain(orderarray)
}

function similarityCal(data){
    const n = data.length;
    let simMatrix = [];
    let mapIndex = [];
    for (let i = 0;i<n; i++){
        let temp_arr = [];
        temp_arr.total = 0;
        for (let j=i+1; j<n; j++){
            let tempval = similarity(data[i][0],data[j][0]);
            temp_arr.total += tempval;
            temp_arr.push(tempval)
        }
        for (let j=0;j<i;j++)
            temp_arr.total += simMatrix[j][i-1-j];
        temp_arr.name = data[i][0].name;
        temp_arr.index = i;
        mapIndex.push(i);
        simMatrix.push(temp_arr)
    }
    mapIndex.sort((a,b)=> simMatrix[a].total-simMatrix[b].total);
    // let undefinedposition = data.findIndex(d=>d[0].text.match(': undefined'))
    // mapIndex.sort((a,b)=>
    //     b===undefinedposition?1:(a===undefinedposition?-1:0)
    // )
    let current_index = mapIndex.pop();
    let orderIndex = [simMatrix[current_index].index];

    do{
        let maxL = Infinity;
        let maxI = 0;
        mapIndex.forEach((d)=>{
            let temp;
            if (d>simMatrix[current_index].index ){
                temp = simMatrix[current_index][d-current_index-1];
            }else{
                temp = simMatrix[d][current_index-d-1]
            }
            if (maxL>temp){
                maxL = temp;
                maxI = d;
            }
        });
        orderIndex.push(simMatrix[maxI].index);
        current_index = maxI;
        mapIndex = mapIndex.filter(d=>d!=maxI);} while(mapIndex.length);
    return orderIndex;
    function similarity (a,b){
        return Math.sqrt(d3.sum(a,(d,i)=>(d.value-b[i].value)*(d.value-b[i].value)));
    }
}

function onClusterHistogram(){
    let h = 50;
    let w = radarChartclusteropt.w*0.85;
    let interval = sampleS.timespan[1]-sampleS.timespan[0];
    let violiin_chart = d3.histChart().graphicopt({width:w,height:h,opt:{dataformated:true},tick:{visibile:false},
        formatx:(d)=>millisecondsToStr(d*sampleS.timespan.length*interval),
        middleAxis:{'stroke-width':0.5},displayDetail:true});
    var scale = d3.scaleTime().domain([interval,interval*sampleS.timespan.length]).range([1,sampleS.timespan.length]);
    var histogram = d3.histogram()
        .domain([1,sampleS.timespan.length])
        // .thresholds(d3.range(0,20).map(d=>scale(d)))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
        .thresholds(scale.ticks(11).map(s=>scale(s)))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
        .value(d => d);
    let nestCluster = d3.nest().key(d=>d['clusterName']).rollup(d=>getHist(d.map(e=>e.__deltaTimestep),d[0].clusterName,_.uniq(d.map(e=>e.name)).length)).object(timeSpacedata?timeSpacedata:handle_data_model(tsnedata,undefined,true));
    const customrangeY = [0,d3.max(d3.values(nestCluster),e=>d3.max(e.arr,d=>d[1]))];

    d3.select('#clusterDisplay').selectAll('.radarCluster').append('svg')
        .attr('class','clusterHist')
        .attrs({width: w,height:h})
        .styles({
            'transform':'translateY(-50%)',
            'position': 'absolute',
            'top':'50%',
            'overflow':'visible'
        })
        .each(function(d){
            violiin_chart.graphicopt({color:(i)=>colorCluster(d.id),title:[{text:`${nestCluster[d.id].total} state${nestCluster[d.id].total>1?'s':''}`}
                    ,{text:`${nestCluster[d.id].extra} node${nestCluster[d.id].total>1?'s':''}`}]}).rangeY(customrangeY).data([nestCluster[d.id]]).draw(d3.select(this))
        });
    function getHist(v,name,nodes){
        let hisdata = histogram(v);
        let sumstat = hisdata.map((d, i) => [(d.x0 + (d.x1 - d.x0) / 2)/sampleS.timespan.length, (d || []).length]);
        return {axis: name,arr:sumstat,total:v.length,extra:nodes};
    }
}

function calculateServiceRange() {
    serviceFullList_Fullrange = _.cloneDeep(serviceFullList);
    serviceList_selected.forEach((s, si) => {
        const sa = serviceListattr[s.index]
        let min = +Infinity;
        let max = -Infinity;
        _.without(Object.keys(sampleS),'timespan').map(h => {
            let temp_range = d3.extent(_.flatten(sampleS[h][sa]));
            if (temp_range[0] < min)
                min = temp_range[0];
            if (temp_range[1] > max)
                max = temp_range[1];
        });
        serviceLists[si].sub.forEach(sub => sub.range = [min, max]);
    })
}

// ------------------------UI------------------------------
function initClusterUi() {
    $('#clusterMethod').val(group_opt.clusterMethod);
    $('#startBinGridSize').val(group_opt.bin.startBinGridSize || 10);
    $('#lowrange').val(group_opt.bin.range[0] || 9);
    $('#highrange').val(group_opt.bin.range[1] || 11);
    $('#knum').val(group_opt.bin.k || 5);
    $('#kiteration').val(group_opt.bin.iterations || 50);
}
