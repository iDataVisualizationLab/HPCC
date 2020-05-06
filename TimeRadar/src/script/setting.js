var application_name ='Joblist';
var jobList=[];
var cluster_info,clusterDescription,clusterGroup={};
var hostList;
var serviceList = ["Temperature","Memory_usage","Fans_speed","Power_consum","Job_scheduling"];
var serviceList_selected = [{"text":"Temperature","index":0},{"text":"Memory_usage","index":1},{"text":"Fans_speed","index":2},{"text":"Power_consum","index":3}];

var sampleS,tsnedata,outlyingList = [],shap={};
outlyingList.pointObject = {};

var serviceListattr = ["arrTemperature","arrMemory_usage","arrFans_health","arrPower_usage","arrJob_scheduling"];
var serviceLists = [{"text":"Temperature","id":0,"enable":true,"sub":[{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]}]},{"text":"Memory_usage","id":1,"enable":true,"sub":[{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]}]},{"text":"Fans_speed","id":2,"enable":true,"sub":[{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]}]},{"text":"Power_consum","id":3,"enable":true,"sub":[{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]}];
var serviceLists_or = [{"text":"Temperature","id":0,"enable":true,"sub":[{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]}]},{"text":"Memory_usage","id":1,"enable":true,"sub":[{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]}]},{"text":"Fans_speed","id":2,"enable":true,"sub":[{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]}]},{"text":"Power_consum","id":3,"enable":true,"sub":[{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]}];
var serviceFullList = serviceLists2serviceFullList(serviceLists);

var serviceFullList_Fullrange = serviceLists2serviceFullList(serviceLists);

srcpath = '../HiperView/';

var variableCorrelation;
let jobMap_opt = {
    margin:{top:90,bottom:20,left:20,right:20},
    width: 1000,
    height:500,
    node:{
        r: 5,
    },
    job: {
        r: 10,
        r_inside: 2,
    },user:{
        r: 10,
    },
    radaropt : {
        // summary:{quantile:true},
        mini:true,
        levels:6,
        gradient:true,
        w:40,
        h:40,
        showText:false,
        margin: {top: 0, right: 0, bottom: 0, left: 0},
    },
}
let jobMap_runopt = {
    compute:{type:'radar',clusterJobID:true,clusterJobID_info:{groupBy:1800000},clusterNode:true,},
    graphic:{colorBy:'group'},
    histodram:{resolution:11},
    mouse:{auto:true, lensing: false}
}
function zoomtoogle(event) {
    let oldvval = d3.select(event).classed('lock');
    jobMap.zoomtoogle(!oldvval);
    d3.select(event).classed('lock',!oldvval);
}
function getClusterName (name,index){
    return (sampleS[name].arrcluster||[])[index];
}
function islastimestep(index){
    if(isRealtime)
        return false;
    else
        return index>sampleS.timespan.length-1;
}

// overide getjoblist
function getJoblist (iteration,reset){
    try {
        iteration = iteration||lastIndex
        if (reset===true || reset===undefined)
            jobList = [];
        jobList = sampleJobdata.filter(s=>new Date(s.startTime)<sampleS.timespan[iteration]&&(s.endTime?new Date(s.endTime)>sampleS.timespan[iteration]:true));

    }catch(e){}
}
function current_userData () {
    try {
        let jobByuser = d3.nest().key(function (uD) {
            return uD.user
        }).entries(jobList);
        jobByuser.forEach(d => d.unqinode = _.chain(d.values).map(d => d.nodes).flatten().uniq().value());
        return jobByuser;
    }catch(e){
        return [];
    }
}
function systemFormat() {
    jobList=[];
    serviceList = ["Temperature","Memory_usage","Fans_speed","Power_consum","Job_scheduling"];
    serviceList_selected = [{"text":"Temperature","index":0},{"text":"Memory_usage","index":1},{"text":"Fans_speed","index":2},{"text":"Power_consum","index":3}];

    serviceListattr = ["arrTemperature","arrMemory_usage","arrFans_health","arrPower_usage","arrJob_scheduling"];
    serviceLists = [{"text":"Temperature","id":0,"enable":true,"sub":[{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]}]},{"text":"Memory_usage","id":1,"enable":true,"sub":[{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]}]},{"text":"Fans_speed","id":2,"enable":true,"sub":[{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]}]},{"text":"Power_consum","id":3,"enable":true,"sub":[{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]}];
    serviceFullList = serviceLists2serviceFullList(serviceLists);
    serviceListattrnest = [
        {key:"arrTemperature", sub:["CPU1 Temp","CPU2 Temp","Inlet Temp"]},
        {key:"arrMemory_usage", sub:["Memory usage"]},
        {key:"arrFans_health", sub:["Fan1 speed","Fan2 speed","Fan3 speed","Fan4 speed"]},
        {key:"arrPower_usage", sub:["Power consumption"]}];
    serviceAttr = {arrTemperature: {key: "Temperature", val: ["arrTemperatureCPU1","arrTemperatureCPU2"]},
        arrMemory_usage: {key: "Memory_usage", val: ["arrMemory_usage"]},
        arrFans_health: {key: "Fans_speed", val: ["arrFans_speed1","arrFans_speed2"]},
        arrPower_usage:{key: "Power_consumption", val: ["arrPower_usage"]}};
    thresholds = [[3,98], [0,99], [1050,17850],[0,200] ];
    serviceFullList_Fullrange = _.cloneDeep(serviceFullList);
}
function inithosts(){
    hostList = {data:{hostlist:{}}};
    const host_list = _.without(Object.keys(sampleS),'timespan');
    host_list.forEach((nameh,i)=>{
        hostList.data.hostlist [nameh] = {
            rack: nameh.split('-')[1],
            node: nameh.split('-')[2],
            id : i,
        };
    })
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

        hosts.push(h);
    }
    hostResults = sampleS;
}

function initTsnedata() {
    tsnedata = {};
    hosts.forEach(h => {
        tsnedata[h.name] = sampleS.timespan.map((t, i) => {
            let array_withNull = [];
            let array_normalize = _.flatten(serviceLists.map(a => d3.range(0, a.sub.length).map(vi => {
                let v = sampleS[h.name][serviceListattr[a.id]][i][vi];
                let sval =  v === null? undefined:d3.scaleLinear().domain(a.sub[0].range)(v);
                array_withNull.push(sval);
                return sval || 0;
            })));
            array_normalize.name = h.name;
            array_normalize.timestep = i;
            array_normalize.__valwithNull = array_withNull;
            return array_normalize;
        })
    });
}

function isStrickCluster(d){
    return radarRatio<1?d.minDist<cluster_info[d.cluster].radius*radarRatio:true;
}
