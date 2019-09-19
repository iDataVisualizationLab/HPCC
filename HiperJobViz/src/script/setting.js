var application_name ='Joblist';
var jobList=[];
var cluster_info;
var hostList;
var serviceList = ["Temperature","Memory_usage","Fans_speed","Power_consum","Job_scheduling"];
var serviceList_selected = [{"text":"Temperature","index":0},{"text":"Memory_usage","index":1},{"text":"Fans_speed","index":2},{"text":"Power_consum","index":3}];

var serviceListattr = ["arrTemperature","arrMemory_usage","arrFans_health","arrPower_usage","arrJob_scheduling"];
var serviceLists = [{"text":"Temperature","id":0,"enable":true,"sub":[{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]}]},{"text":"Memory_usage","id":1,"enable":true,"sub":[{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]}]},{"text":"Fans_speed","id":2,"enable":true,"sub":[{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]}]},{"text":"Power_consum","id":3,"enable":true,"sub":[{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]}];
var serviceLists_or = [{"text":"Temperature","id":0,"enable":true,"sub":[{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]}]},{"text":"Memory_usage","id":1,"enable":true,"sub":[{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]}]},{"text":"Fans_speed","id":2,"enable":true,"sub":[{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]}]},{"text":"Power_consum","id":3,"enable":true,"sub":[{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]}];
var serviceFullList = serviceLists2serviceFullList(serviceLists);

srcpath = '../HiperView/';


let jobMap_opt = {
    margin:{top:20,bottom:20,left:20,right:20},
    width: 1000,
    height:500,
    node:{
        r: 5,
    },
    job: {
        r: 20,
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
    compute:{type:'radar',clusterJobID:false,clusterJobID_info:{groupBy:300000},clusterNode:false},
    histodram:{resolution:11}
}
function zoomtoogle(event) {
    let oldvval = d3.select(event).classed('lock');
    jobMap.zoomtoogle(!oldvval);
    d3.select(event).classed('lock',!oldvval);
}
function distance(a, b){
    let dsum = 0;
    a.forEach((d,i)=> {dsum +=(d-b[i])*(d-b[i])});
    return Math.round(Math.sqrt(dsum)*Math.pow(10, 10))/Math.pow(10, 10);
}
