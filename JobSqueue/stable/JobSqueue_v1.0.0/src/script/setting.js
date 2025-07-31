var application_name ='Joblist';

var sampleS,outlyingList = [];
outlyingList.pointObject = {};

var jobList=[];
var cluster_info,clusterDescription,clusterGroup={};
var hostList;
var serviceList = ["Temperature","Memory_usage","Fans_speed","Power_consum","Job_scheduling"];
var serviceList_selected = [{"text":"Temperature","index":0},{"text":"Memory_usage","index":1},{"text":"Fans_speed","index":2},{"text":"Power_consum","index":3}];

var serviceListattr = ["arrTemperature","arrMemory_usage","arrFans_health","arrPower_usage","arrJob_scheduling"];
var serviceLists = [{"text":"Temperature","id":0,"enable":true,"sub":[{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]}]},{"text":"Memory_usage","id":1,"enable":true,"sub":[{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]}]},{"text":"Fans_speed","id":2,"enable":true,"sub":[{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]}]},{"text":"Power_consum","id":3,"enable":true,"sub":[{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]}];
var serviceLists_or = [{"text":"Temperature","id":0,"enable":true,"sub":[{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]}]},{"text":"Memory_usage","id":1,"enable":true,"sub":[{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]}]},{"text":"Fans_speed","id":2,"enable":true,"sub":[{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]}]},{"text":"Power_consum","id":3,"enable":true,"sub":[{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]}];
var serviceFullList = serviceLists2serviceFullList(serviceLists);

var serviceFullList_Fullrange = serviceLists2serviceFullList(serviceLists);

srcpath = '';

var variableCorrelation=[];
let IDkey = 'atID';
let SUBJECTS = ['wt','stop1'];
let SUBJECTSob = {"wt":0,"stop1":1}
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
        //draw userlist data
        TSneplot.drawUserlist(query_time);
    }catch(e){}
}
function current_userData () {
    let jobByuser = d3.nest().key(function(uD){return uD.user}).entries( jobList);
    jobByuser.forEach(d=>d.unqinode= _.chain(d.values).map(d=>d.nodes).flatten().uniq().value());
    return jobByuser;
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
let blackGenes=undefined;
function newdatatoFormat (data,notSplit,customformat){
    preloader(true, 0, 'reading file...');
    serviceList = [];
    serviceLists = [];
    serviceListattr = [];
    serviceAttr={};
    hosts =[];
    let variables = Object.keys(data[0]);
    IDkey = variables.shift();
    // if(blackGenes)
    //     data = data.filter(d=>!blackGenes.find(b=>new RegExp(b).test(d[IDkey])));
    let SUBJECTSob = {};
    SUBJECTS = [];
    if (notSplit){
        SUBJECTSob[""] = 0;
        SUBJECTS=[""];
    }
    // TODO remove this function
    serviceQuery["csv"]= serviceQuery["csv"]||{};
    let global_range = [0,0];
    variables.forEach((k,i)=>{
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

        range = d3.extent(data,d=>d[k]);
        if (range[1]<=1)
            range[1] = 1;
        else{
            if (range[0]>=0 && range[1]>global_range[1])
                global_range[1]=range[1]
        }
        if (range[0]>=0)
            range[0] = 0;
        else if (range[0]>=-1)
            range[0] = -1;

        const temp = {"text":k,"id":i,"enable":true,"sub":[{"text":k,"id":0,"enable":true,"idroot":i,"angle":i*2*Math.PI/(variables.length),"range":range}]};
        thresholds.push([0,1]);
        serviceLists.push(temp);
    });
    serviceLists.forEach(s=>{
        if (s.sub[0].range[1]>1&&s.sub[0].range[0]>=0)
            s.sub[0].range = global_range
    });
    serviceList_selected = serviceList.map((d,i)=>{return{text:d,index:i}});
    serviceFullList = serviceLists2serviceFullList(serviceLists);
    scaleService = serviceFullList.map(d=>d3.scaleLinear().domain(d.range));
    sampleS = {};
    tsnedata = {};
    sampleS['timespan'] = [new Date()];


    data.forEach(d=>{
        variables.forEach(k=>d[k] = d[k]===""?null:(+d[k]))// format number
        const name = d[IDkey];
        const fixname = name.replace('|','__');
        if (!sampleS[fixname]) {
            let sub = name.split('|')[1] || "";
            if (!notSplit) {
                if (SUBJECTSob[sub] === undefined) {
                    SUBJECTSob[sub] = SUBJECTS.length;
                    SUBJECTS.push(sub);
                }
            }
            const category = SUBJECTSob[sub];
            hosts.push({
                name: fixname,
                genese: notSplit ? fixname : fixname.split('__')[0],
                category: category,
                index: hosts.length,
            });

            serviceListattr.forEach((attr, i) => {
                if (sampleS[fixname] === undefined) {
                    sampleS[fixname] = {};
                    tsnedata[fixname] = [[]];
                    tsnedata[fixname][0].name = fixname;
                    tsnedata[fixname][0].timestep = 0;
                    tsnedata[fixname][0].category = category;
                }
                const value = d[variables[i]];
                sampleS[fixname][attr] = [[value]];
                tsnedata[fixname][0].push(value === null ? 0 : scaleService[i](value) || 0);
            });
        }
    }); // format number
    if (keyLeader&&globalFilter[keyLeader]){
        hosts.sort((a,b)=>-globalFilter[keyLeader].indexOf(a.genese)+globalFilter[keyLeader].indexOf(b.genese))
    }
    // find outliers
    preloader(true, 0, 'Prepare data...');
    // outlyingList = outlier();
}
// summary metrics
// let histodram = {
//     resolution:20,
//     outlierMultiply: 3
// };
function inithostResults (worker) {
    hostResults = sampleS;
}
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
function getsummaryservice(){
    // let dataf = _.reduce(_.chunk(_.unzip(data),serviceFull_selected.length),function(memo, num){ return memo.map((d,i)=>{d.push(num[i]); return _.flatten(d); })});
    let dataf = _.unzip(_.flatten(_.values(tsnedata),1));
    let ob = {};
    serviceList_selected.forEach((s,i)=>{
        let r = getHistdata(dataf[i], s.text);
        ob[r.axis] = r;

    });
    return ob;
}
function correlationCal(){
    let data =  _.unzip(_.flatten(_.values(tsnedata),1));
    const n = serviceFullList.length;
    let simMatrix = [];
    for (let i = 0;i<n; i++){
        let temp_arr = [];
        // temp_arr.total = 0;
        for (let j=i+1; j<n; j++){
            let tempval = pearsonCorcoef(data[i],data[j]);
            // temp_arr.total += tempval;
            temp_arr.push(tempval)
        }
        // for (let j=0;j<i;j++)
        //     temp_arr.total += simMatrix[j][i-1-j];
        temp_arr.name = serviceFullList[i].text;
        temp_arr.index = i;
        simMatrix.push(temp_arr)
    }
    variableCorrelation =  simMatrix;


}
function getsummaryRadar(){
    return _.flatten(_.values(tsnedata))//_.flatten(tsnedata[name].slice(startIndex,lastIndex+1));
}
function readFilecsv(filename,notSplit) {
    dataInformation.filename = filename+'.csv';
    let filePath = srcpath+`data/${filename}.csv`;
    exit_warp();
    preloader(true);
    d3.csv(filePath)
        .then(function (data) {

            db = "csv";
            newdatatoFormat(data,notSplit);

            inithostResults();
            formatService(true);
            processResult = processResult_csv;

            // draw Metric summary on left panel
            MetricController.axisSchema(serviceFullList, true).update();
            MetricController.datasummary(getsummaryservice());
            MetricController.data(getsummaryRadar()).drawSummary(hosts.length);
            correlationCal();
            updateDatainformation(sampleS['timespan']);
            sampleJobdata = [{
                jobID: "1",
                name: "1",
                nodes: hosts.map(h=>h.name),
                startTime: new Date(_.last(sampleS.timespan)-100).toString(),
                submitTime: new Date(_.last(sampleS.timespan)-100).toString(),
                user: "dummyJob"
            }];

            d3.select(".currentDate")
            // .text("" + (sampleS['timespan'][0]).toDateString());
                .text(dataInformation.filename);
            preloader(true, 0, 'Calculate clusters...');
            loadPresetCluster(`${dataInformation.filename.replace('.csv','')}`,(status)=>{loadclusterInfo= status;

                // // debug
                //     loadclusterInfo = false;
                if(loadclusterInfo){
                    updateClusterControlUI(cluster_info.length)
                    handle_dataRaw();
                    if (!init)
                        resetRequest();
                    else
                        setTimeout(main,0);
                    preloader(false)
                }else {
                    onCalculateClusterAction();
                }

            })


        })
}

function enableVariableCorrelation(isenable){
    d3.select('#enableVariableCorrelation').attr('disabled',!isenable?'':null)
}
function orderByCorrelation(){
    let simMatrix = variableCorrelation.filter(v=>(v.total=0,serviceFullList[v.index].enable));
    const orderMatrix = simMatrix.map(d=>d.index);
    let mapIndex = [];
    simMatrix.forEach((v,i)=>{
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
    mapIndex.sort((a,b)=> -simMatrix[a].total+simMatrix[b].total);
    // let undefinedposition = data.findIndex(d=>d[0].text.match(': undefined'))
    // mapIndex.sort((a,b)=>
    //     b===undefinedposition?1:(a===undefinedposition?-1:0)
    // )
    let current_index = mapIndex.pop();
    let orderIndex = [simMatrix[current_index].index];

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
        orderIndex.push(simMatrix[maxI].index);
        current_index = maxI;
        mapIndex = mapIndex.filter(d=>d!=maxI);
    } while(mapIndex.length);
    orderIndex.forEach((o,i)=>{
        serviceFullList[o].angle = i*2*Math.PI/(orderIndex.length);
    });
}
