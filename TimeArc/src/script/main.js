/* MIT License
 *
 * Copyright (c) 2020 Tommy Dang, Ngan V.T. Nguyen
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 *     The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 *     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


// NEW: data obj

let data_info = {
    filename: '',
    timesteps: 0,
    totalStep: 0,
    totalHost: 0
};
var sampleS
// job parameter
let sampleJobdata =[];
let init = true;
// Set the dimensions of the canvas / graph
var margin = {top: 5, right: 0, bottom: 10, left: 0};
var svg = d3.select(".mainsvg"),
    width = +document.getElementById("mainBody").offsetWidth,
    height = window.innerHeight-(+$('.pushpin-demo-nav')[0].offsetHeight)-10,
    heightdevice = window.innerHeight;

// other component setting
// summaryGroup
let summaryGroup_op ={
    margin : {top: 5, right: 0, bottom: 0, left: 0},
    height: 280,
}
let Radarplot_opt = {
    clusterMethod: 'leaderbin',
}
let group_opt = {
    clusterMethod: 'leaderbin',
    bin:{
        startBinGridSize: 5,
        range: [9,10]
    }
};

var svgsum;


// Parse the date / time
var parseTime = d3.timeParse("%m/%d/%y");

// Set the ranges
var x = d3.scaleTime().range([0, width-margin.left*2]);
var xNew = d3.scaleTime().range([0, width/2-margin.left]);

var y = d3.scaleLinear().range([height, 0]);
var yAxis= d3.scaleLinear().range([height, 0]);

// HPCC
var hosts = [];
var hostResults = {};
var links =[];
var node,link;

// log variable
var timelog=[];

// START: loader spinner settings ****************************
var opts = {
    lines: 25, // The number of lines to draw
    length: 15, // The length of each line
    width: 5, // The line thickness
    radius: 25, // The radius of the inner circle
    color: '#f00', // #rgb or #rrggbb or array of colors
    speed: 2, // Rounds per second
    trail: 50, // Afterglow percentage
    className: 'spinner', // The CSS class to assign to the spinner
};
var target = document.getElementById('loadingSpinner');
var spinner = new Spinner(opts).spin(target);
// END: loader spinner settings ****************************

var simulation, link, node;
var dur = 400;  // animation duration
var startDate = new Date("4/1/2018");
var endtDate = new Date("1/1/2019");
var today = new Date();

var maxHostinRack= 30;//60;
var h_rack = 580;//980;
var w_rack = (width-23)/10-1;
var w_gap =0;
var node_size = 6;

var top_margin = summaryGroup_op.height+summaryGroup_op.margin.top+31;  // Start rack spiatial layout


var users = [];
var racks = [];
var racksnewor = [];

var xTimeScale;
var baseTemperature =60;

var interval2;
var simDuration =0;
var simDurationinit = 0;
// var simDuration =0;
// var simDurationinit = 0;
var numberOfMinutes = 26*60;

var iterationstep = 1;
var maxstack = 7;
var normalTs =0.6; //time sampling
// var timesteppixel = 0.1; // for 4
var timesteppixel = 0.1; // for 26

var isRealtime = false;
var db = 'nagios';
if (isRealtime){
    simDuration = 200;
    simDurationinit = 200;
    numberOfMinutes = 26*60;
}

var currentMiliseconds;
var query_time;
var lastIndex;
var currentHostname,currentMeasure;
var currentHostX = 0;
// var currentHosty = 0;
let layout = {
    VERTICAL : 0,
    HORIZONTAL : 1};

var graphicControl ={
    charType : "None",
    sumType : "None",
    mode : layout.HORIZONTAL
};

let globalTrend = false; // get data from index 0 current work with worker

//***********************

var initialService = "Temperature";
var selectedService;

let colorScaleList = {
    n: 7,
    rainbow: ["#000066", "#4400ff", "#00ddff", "#00ddaa", "#00dd00", "#aadd00", "#ffcc00", "#ff8800", "#ff0000", "#660000"],
    soil: ["#2244AA","#4A8FC2", "#76A5B1", "#9DBCA2", "#C3D392", "#F8E571", "#F2B659", "#eb6424", "#D63128", "#660000"],
    customschemeCategory:  ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#bcbd22", "#17becf"],
    customFunc: function(name,arr,num){
        const n= num||this.n;
        const arrColor = arr||this[name];
        let colorLength = arrColor.length;
        const arrThresholds=d3.range(0,colorLength).map(e=>e/(colorLength-1));
        let colorTemperature = d3.scaleLinear()
            .domain(arrThresholds)
            .range(arrColor)
            .interpolate(d3.interpolateHcl);

        return d3.range(0,n).map(e=>colorTemperature(e/(n-1)))
    },
    d3colorChosefunc: function(name,num){
        const n = num|| this.n;
        if (d3[`scheme${name}`]) {
            if (typeof (d3[`scheme${name}`][0]) !== 'string') {
                colors = (d3[`scheme${name}`][n]||d3[`scheme${name}`][d3[`scheme${name}`].length-1]).slice();
            }
            else
                colors=  d3[`scheme${name}`].slice();
        } else {
            const interpolate = d3[`interpolate${name}`];
            colors = [];
            for (let i = 0; i < n; ++i) {
                colors.push(d3.rgb(interpolate(i / (n - 1))).hex());
            }
        }
        colors = this.customFunc(undefined,colors,n);
        return colors;
    },
},colorArr = {Radar: [
        {val: 'rainbow',type:'custom',label: 'Rainbow'},
        {val: 'RdBu',type:'d3',label: 'Blue2Red',invert:true},
        {val: 'soil',type:'custom',label: 'RedYelBlu'},
        {val: 'Viridis',type:'d3',label: 'Viridis'},
        {val: 'Greys',type:'d3',label: 'Greys'}],
    Cluster: [{val: 'Category10',type:'d3',label: 'D3'},{val: 'Paired',type:'d3',label: 'Blue2Red'}]};


//var arrColor = ['#00c', '#1a9850','#fee08b', '#d73027'];
// var arrColor = ['#110066','#4400ff', '#00cccc', '#00dd00','#ffcc44', '#ff0000', '#660000'];
// let arrColor = colorScaleList.customFunc('rainbow');
let arrColor = colorScaleList.d3colorChosefunc('Greys');
let colorCluster  = d3.scaleOrdinal().range(d3.schemeCategory20);
var arrThresholds;
var dif, mid,left;
var color,opa;
setColorsAndThresholds(initialService);

//********tooltip***************
var niceOffset = true;
//***********************
var undefinedValue = undefined;
// var undefinedColor = "#666";
var undefinedColor = "#c6c6c6";
var undefinedResult = "timed out";
//*** scale
var xTimeSummaryScale;
var xLinearSummaryScale;

var filterhost;
var filterhost_user;

var TsnePlotopt  = {
    margin: {top: 0, right: 0, bottom: 0, left: 0},
    offset: {top: top_margin},
    width: width,
    height: height-top_margin,
    scalezoom: 1,
    widthView: function(){return this.width*this.scalezoom},
    heightView: function(){return this.height*this.scalezoom},
    widthG: function(){return this.widthView()-this.margin.left-this.margin.right},
    heightG: function(){return this.heightView()-this.margin.top-this.margin.bottom},
    dotRadius: 30,
    opt:{
        epsilon : 40, // epsilon is learning rate (10 = default)
        perplexity : 30, // roughly how many neighbors each point influences (30 = default)
        dim : 2, // dimensionality of the embedding (2 = default)
        maxtries: 50
    },
    eventpad: {
        size: 8,
    },
    display:{
        symbol:{
            type: 'path',
            radius: 30,
        }
    },
    radaropt : {
        // summary:{quantile:true},
        mini:true,
        levels:6,
        gradient:true,
        w:30,
        h:30,
        showText:false,
        margin: {top: 0, right: 0, bottom: 0, left: 0},
    },
    top10:{
        details :{
            circle: {
                attr: {
                    r : 2,
                },
                style: {
                    opacity: 0.2
                }
            },
            path: {
                style: {
                    'stroke': 'black',
                    'stroke-width': 0.5,
                }
            },
            clulster: {
                attr: {
                }
                ,
                style: {
                    stroke: 'white'
                }
            }
        }
    },
    runopt:{
        zoom:30,
        simDuration: 1000,
        clusterDisplay: 'alpha',
        clusterProject: 'bin',
        displayMode: 'tsne',

    }
}
var timeArcopt = {width:width,height:Math.min(height,400), margin: {top: 10, right: 10, bottom: 0, left: 350},
    offset: {top: 0}};
var runopt ={ // run opt global
    suddenGroup:0,
    minMax: 0,
};
var Scatterplot = d3.Scatterplot();
var Radarplot = d3.radar();
var distance = distanceL2;

var MetricController = radarController();
let getDataWorker;
let isbusy = false, imageRequest = false, isanimation=false;
let dataInformation={filename:'',size:0,timerange:[],interval:'',totalstep:0,hostsnum:0,datanum:0};
function makedataworker(){
    if (getDataWorker)
        getDataWorker.terminate();
    getDataWorker = new Worker ('src/script/worker/getDataWorker.js');
}
var vizMode = 'timeArc'; // 0 timeradar, 1 tsne, 2 pca, 3 umap
let handle_data_TimeSpace;
let timeArc = TimeArcSetting()
let mainviz = timeArc;
function initDataWorker(){
    getDataWorker.postMessage({action:"init",value:{
            hosts:hosts,
            db:db,
            tsnedata:tsnedata,
            cluster_info:cluster_info,
            serviceFullList:serviceFullList,
            serviceLists:serviceLists,
            serviceList_selected :serviceList_selected,
            serviceListattr:serviceListattr
        }});
    getDataWorker.addEventListener('message',({data})=>{
        if (data.status==='done') {
            isbusy = false;
        }
        if (imageRequest){
            playchange();
            d3.select('.cover').classed('hidden', false);
            d3.select('.progressDiv').classed('hidden', false);
            imageRequest = false;
            onSavingbatchfiles(data.result.arr,onSavingFile); // saveImages.js
        }
        if (data.action==='returnData'){
            if (data.result.hindex!==undefined && data.result.index < lastIndex) {
                if (graphicControl.sumType === "RadarSummary" ) {
                    Radarplot.data(data.result.arr).drawSummarypoint(data.result.index, data.result.hindex);
                }
            }

        }else if (data.action==='returnDataHistory'){
            if (data.result.hindex!==undefined&& data.result.index < lastIndex+1) {
                if (graphicControl.sumType === "RadarSummary") {
                    Radarplot.data(data.result.arr).drawSummarypoint(data.result.index, data.result.hindex);
                }
                MetricController.data(data.result.arr).drawSummary(data.result.hindex);
            }
        }
        if (data.action==='DataServices') {
            if (lastIndex === sampleS.timespan.length)
                MetricController.datasummary(data.result.arr);
        }
        if (data.action==='Correlation') {
            variableCorrelation = data.result.arr;
            preloader(true,undefined,'Calculate variable correlation....');
            setTimeout(()=>{
                orderByCorrelation();
                MetricController.axisSchema(serviceFullList).datasummary(undefined).update();
                preloader(false);
                enableVariableCorrelation(true);
            },0);
        }
    }, false);
}
function setColorsAndThresholds(s) {
    for (var i=0; i<serviceList_selected.length;i++){
        let range = serviceLists[serviceList_selected[i].index].sub[0].range;
        if (s == serviceList_selected[i].text && serviceList_selected[i].text==='Job_load'){  // CPU_load
            dif = (range[1]-range[0])/4;
            mid = range[0]+(range[1]-range[0])/2;
            left=0;
            arrThresholds = [left,range[0], 0, range[0]+2*dif, 10, range[1], range[1]];
            color = d3.scaleLinear()
                .domain(arrThresholds)
                .range(arrColor)
                .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb
            opa = d3.scaleLinear()
                .domain([left,range[0],range[0]+dif, range[0]+2*dif, range[0]+3*dif, range[1], range[1]+dif])
                .range([1,1,0.3,0.06,0.3,1,1]);

        }
        else if (s == serviceList_selected[i].text && serviceList_selected[i].text==='Memory_usage'){  // Memory_usage
            dif = (range[1]-range[0])/4;
            mid = range[0]+(range[1]-range[0])/2;
            left=0;
            arrThresholds = [left,range[0], 0, range[0]+2*dif, 98, range[1], range[1]];
            color = d3.scaleLinear()
                .domain(arrThresholds)
                .range(arrColor)
                .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb
            opa = d3.scaleLinear()
                .domain([left,range[0],range[0]+dif, range[0]+2*dif, range[0]+3*dif, range[1], range[1]+dif])
                .range([1,1,0.3,0.06,0.3,1,1]);

        }
        else if (s == serviceList_selected[i].text){
            dif = (range[1]-range[0])/4;
            mid = range[0]+(range[1]-range[0])/2;
            left = range[0]-dif;
            if (left<0 && i!=0) // Temperature can be less than 0
                left=0;
            arrThresholds = [left,range[0], range[0]+dif, range[0]+2*dif, range[0]+3*dif, range[1], range[1]+dif];
            color = d3.scaleLinear()
                .domain(arrThresholds)
                .range(arrColor)
                .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb
            opa = d3.scaleLinear()
                .domain([left,range[0],range[0]+dif, range[0]+2*dif, range[0]+3*dif, range[1], range[1]+dif])
                .range([1,1,0.3,0.06,0.3,1,1]);
            break;
        }
    }
}
//***********************
var gaphost = 7;

function main() {
    mainviz.stop();
    inithostResults ();

    // disabled graph option
    let control_jobdisplay = d3.select('#compDisplay_control');
        control_jobdisplay.node().options.selectedIndex = 0;
        control_jobdisplay.attr('disabled', '').dispatch('change');

    initDataWorker();
    request();
}
var currentlastIndex;
var speedup= 0;
function drawsummarypoint(harr){
    lastIndex = currentlastIndex;
    query_time = hostResults['timespan'][currentlastIndex];

    // var h = harr[harr.length-1];
    // var name = hosts[h].name;
}

function updatetimeline(index) {
    if (recordonly) {
        const timearr= d3.scaleTime().domain(timerange.map(d => new Date(d))).ticks(formatRealtime);
        if(!hostResults['timespan'])
            hostResults['timespan'] = [];
        hostResults['timespan'] = d3.merge([hostResults['timespan'],timearr.map(d=>new Date(d))]);
        expectedLength += timearr.length;
    }
    else {
        // if(!hostResults['timespan'])
        //     hostResults['timespan']=[];
        // if (isRealtime)
        //     hostResults['timespan'].push(new Date());
        // else
        //     hostResults['timespan']=sampleS['timespan'].slice(0,index+1)
        expectedLength++;
    }
}

function request(){
    init=false;
    var count = 0;
    var countbuffer = 0;
    var iteration = 0;
    var haveMiddle = false;
    currentMiliseconds = new Date();  // For simulation
    query_time=currentMiliseconds;
    lastIndex = 0;
    currentlastIndex = 0;
    var countarr = [];
    var requeststatus =true;
    var countrecord = 0;
    let hasjob = sampleJobdata[0].user!=="dummyJob";

    isanimation = false;
    timerequest();
    console.log('____________read data______________')
    let times = performance.now();
    interval2 = new IntervalTimer(timerequest , 0);
    firstTime = false;
    function timerequest() {
        var midlehandle = function (ri){
            let returniteration = ri[0];
            let returnCount = ri[1];
            countarr.push(returnCount);
            count += 1;
        };
        var midlehandle_full = function (ri){
            countarr = d3.range(0,hosts.length);
            count = hosts.length;
        };
        var drawprocess = function ()  {
            if (islastimestep(lastIndex+1)) {
                isanimation = true;
                getData(_.last(hosts).name,lastIndex,true,true);
                d3.select('#compDisplay_control').attr('disabled',null);
                console.log('Time load: ',performance.now() -times)
                getData(_.last(hosts).name,lastIndex)
            }

            drawsummarypoint(countarr);
            countarr.length = 0;
            // fullset draw
            if (count > (hosts.length-1)) {// Draw the summary Box plot ***********************************************************

                if(hasjob)
                    currentlastIndex = iteration+iterationstep-1;
                else
                    currentlastIndex = Math.min(iteration+iterationstep-1+sampleS.timespan.length-3,sampleS.timespan.length-1);

                lastIndex = currentlastIndex+1;

                count = 0;
                countbuffer = 0;
                requeststatus = true;
                haveMiddle = false;
                iteration += iterationstep;
            }
            currentlastIndex = iteration;
            // stop condition
            if (islastimestep(lastIndex)) {
                console.log("done");
                preloader(false);
                interval2.stop();
            }

        };
        if (requeststatus) {
            try {
                var oldrack = hosts[countbuffer].hpcc_rack;
                if (isRealtime) {
                    step(iteration, countbuffer).then((ri) => {
                        midlehandle(ri);
                        if (!recordonly)
                            drawprocess();
                        else {
                            countrecord = countrecord + 1;
                            if (countbuffer >= (hosts.length)) {
                                console.log("done");
                                interval2.stop();
                            }
                        }
                    });
                    countbuffer++;
                }
                else {
                    do {
                        // let ri = step_full(iteration);
                        midlehandle_full();
                        if(countbuffer===0) {
                            if (islastimestep(lastIndex+1)&&hasjob)
                                getJoblist();
                        }
                        countbuffer+=hosts.length;
                    } while ((countbuffer < hosts.length) && (speedup === 2 || (hosts[countbuffer].hpcc_rack === oldrack)) && speedup);
                    speedup = 0;
                    drawprocess();
                }
            }catch(e){

            }
            if (countbuffer>= (hosts.length))
                requeststatus = false; //stop request

        }
    }
    var count3=0;
}

function scaleThreshold(i){
    return i<maxstack?i:(maxstack-2);
}



function decimalColorToHTMLcolor(number) {
    //converts to a integer
    var intnumber = number - 0;

    // isolate the colors - really not necessary
    var red, green, blue;

    // needed since toString does not zero fill on left
    var template = "#000000";

    // in the MS Windows world RGB colors
    // are 0xBBGGRR because of the way Intel chips store bytes
    red = (intnumber&0x0000ff) << 16;
    green = intnumber&0x00ff00;
    blue = (intnumber&0xff0000) >>> 16;

    // mask out each color and reverse the order
    intnumber = red|green|blue;

    // toString converts a number to a hexstring
    var HTMLcolor = intnumber.toString(16);

    //template adds # for standard HTML #RRGGBB
    HTMLcolor = template.substring(0,7 - HTMLcolor.length) + HTMLcolor;

    return HTMLcolor;
}

function simulateResults2(hostname,iter, s){
    var newService;
    let serviceIndex =  serviceList.findIndex(d=>d===s);
    newService = (sampleS[hostname][serviceListattr[serviceIndex]]||[])[iter];
    if (serviceList[serviceIndex] === 'Job_scheduling') {
        if (sampleJobdata.length)
            return sampleJobdata.filter(s=>s.nodes.find(e=>e===hostname)&&new Date(s.startTime)<sampleS.timespan[iter]&&(s.endTime?new Date(s.endTime)>sampleS.timespan[iter]:true))
    }
    if (newService===undefined)
        newService = [undefined];
    else
        newService = newService.map(d=>d===null?undefined:d);
    return newService;
}

function handlemissingdata(hostname,iter){
    // var simisval = jQuery.extend(true, {}, sampleS[hostname]["arrTemperature"][iter]);
    var simisval = sampleS[hostname]["arrTemperature"][iter];
    var simval = simisval.slice(0);
    simval = (simval[0]+simval[1]+20);
    if (simval!==undefinedValue && !isNaN(simval) )
        simisval= [Math.floor(simval)];
    else
        simisval= [];
    return simisval;
}
function gaussianRand() {
    var rand = 0;
    for (var i = 0; i < 6; i += 1) {
        rand += Math.random();
    }
    return rand / 6;
}

function gaussianRandom(start, end) {
    return Math.floor(start + gaussianRand() * (end - start + 1));
}
var minTime,maxTime;
var hostfirst;
function getRackx(hpcc_rack,hpcc_node,isVertical){
    if (isVertical)
        return racksnewor[(hpcc_rack - 1)*2 + (hpcc_node%2?0:1)].x;
    return racksnewor[hpcc_rack - 1].x;
}

function initTime() {
// Check if we should reset the starting point
    if (firstTime) {
        currentMiliseconds = hostResults['timespan'][0];
        hostfirst = hosts[0].name;
        xTimeScale = d3.scaleLinear()
            .domain([0, maxstack - 1]);
        // get Time
        minTime = currentMiliseconds;  // some max number
    }
    firstTime = false;
}

function plotResult(result,name,index) {

    if (hostResults['timespan'][index||lastIndex])
        query_time = hostResults['timespan'][index||lastIndex]||query_time;  // for drawing current timeline in Summary panel
    else
        hostResults['timespan'][index||lastIndex] = new Date (query_time.getTime() + (hostResults['timespan'][1].getTime()-hostResults['timespan'][0].getTime()));
    currentHostname = name;

    // Process the array data ***************************************
    var r = hostResults[name];
    var hpcc_rack = hostList.data.hostlist[name].rack|| (+name.split("-")[1]);
    var hpcc_node = hostList.data.hostlist[name].node|| (+name.split("-")[2].split(".")[0]);




    // Process the array of historical temperatures ***************************************
    var arr = [];
    var startinde = 0;
    // while(maxstackminute)
    if ((r.arr.length>maxstack)||(r.arr.length === maxstack)){
        startinde = (r.arr.length-maxstack);

    }

    maxTime =query_time;
    // if (maxTime-minTime>0.8*numberOfMinutes*60*1000)  // Limit time to STOP***********************
    //     playchange();

    switch (graphicControl.charType) {
        case "Heatmap":
        case "Area Chart":
            var xStart = getRackx(hpcc_rack,hpcc_node,graphicControl.mode)+15;

            // var xStart = racks[hpcc_rack - 1].x+15;
            if (graphicControl.mode===layout.HORIZONTAL)
                xTimeScale.range([xStart, xStart+Math.min(w_rack/2-2*node_size-20,node_size*maxstack)]); // output
            else
                xTimeScale.domain([0,1]).range([xStart, xStart+node_size]); // output
            // .range([xStart, xStart+w_rack/2-2*node_size]); // output
            var y = getHostY(hpcc_rack,hpcc_node,hpcc_node%2);


            for (var i=startinde; i<r.arr.length;i++){
                let a  = r.arr[i];
                var obj = {};
                obj.temp1 = a[0];
                obj.temp2 = a[1];
                obj.temp3 = a[2];
                obj.query_time =hostResults.timespan[i];
                obj.x = xTimeScale(i-startinde);
                arr.push(obj);
                currentHostX = obj.x ;
                currentMeasure = obj.temp1;
            }

            currentHostY = y;
            if (graphicControl.mode===layout.HORIZONTAL)
                initDetailView();
            if (graphicControl.charType === "Heatmap")
                plotHeat(arr, name, hpcc_rack, hpcc_node, xStart, y,graphicControl.mode===layout.VERTICAL);
            else
                plotArea(arr, name, hpcc_rack, hpcc_node, xStart, y,serviceList.indexOf( selectedService));
            break;

        default:
            if (!speedup) {
                getData(name,index||lastIndex,true,true);
            }
            break;
    }


}


function getData(nameh,index,skip,usepast){
    if(!isbusy || skip === true) {
        isbusy = true;
        getDataWorker.postMessage({
            action: "getbatchData", value: {
                lastIndex: index,
                // hostResults: hostResults,
                host: nameh,
                usepast: usepast
            }
        });
    }
}
function getcorrelation(){
    M.toast({html: 'The variable correlation calculated in the background'});
    enableVariableCorrelation(false);
    getDataWorker.postMessage({
        action: "correlationCal", value: {
            serviceEnable: serviceFullList.map(d=>d.enable)
        }
    });
}

function pauseRequest(){
    // clearInterval(interval2);
    var e = d3.select('.pause').node();
    if (e.value=="false"){
        playchange();
    }else {
        clearclone();
        pausechange();
    }

}

function realTimesetting (option,db,init,data,separate){
    isRealtime = option;
    getDataWorker.postMessage({action:'isRealtime',value:option,db: db,hostList:hostList,separate:separate});
    if (option){
        processData = eval('processData_'+db);
        simDuration = 200;
        simDurationinit = 200;
        numberOfMinutes = 26*60;
    }else{
        processData = db?eval('processData_'+db):processData_old;
        simDuration =1;
        simDurationinit = 1;
        numberOfMinutes = 26*60;
    }
    if (!init)
        resetRequest();
}
function playchange(){
    var e = d3.select('.pause').node();
    if (interval2)
        interval2.pause();
    e.value = "true";
    $(e).addClass('active');
    $(e.querySelector('i')).removeClass('fa-pause pauseicon').addClass('fa-play pauseicon');
}
function onCalculateClusterAction() {
    recalculateCluster(group_opt,onchangeCluster);
}

function exit_warp () {
    timeSpacedata = undefined
    playchange();
}
function pausechange(){
    var e = d3.select('.pause').node();
    if (interval2)
        interval2.resume();
    e.value = "false";
    $(e).removeClass('active');
    $(e.querySelector('i')).removeClass('fa-play pauseicon').addClass('fa-pause pauseicon');
}

function resetRequest(){
    mainviz.stop();
    pausechange();
    inithostResults();
    tool_tip.hide();
    firstTime = true;
    if (interval2)
        interval2.stop();
    expectedLength = 0;
    formatRealtime = getformattime(+timestep_query.split(/[a-z]/)[0],timeshortconvert(timestep_query.match(/[a-z]/)[0]));
    var count =0;


    Radarplot.init();
    let control_jobdisplay = d3.select('#compDisplay_control');
    control_jobdisplay.attr('disabled', '').dispatch('change');

    timelog = [];
    jobList = undefined;
    // updateTimeText();
    request();
    requestRedraw();
}

function loadNewData(d,init) {

    selectedService = d;
    const trig = d3.select("#datasetsSelectTrigger");
    trig.select('img').attr('src',"images/"+selectedService+".png");
    trig.select('span').text(selectedService);
    setColorsAndThresholds(selectedService);
    drawLegend(selectedService,arrThresholds, arrColor,dif);
    if (!init) {
        resetRequest();
    }
    tool_tip.hide();
}

// speed up process
function fastForwardRequest() {
    speedup = 1;
}
function extremefastForwardRequest() {

    speedup = 2;
}

function requestServicenagios(count,serin) {
    return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    var result = processResult(JSON.parse(this.responseText),serviceList[serin]);
                    var name = result.data.service.host_name;
                    hostResults[name][serviceListattr[serin]].push(result);
                    if (selectedService === serviceList[serin]) {
                        hostResults[name].arr = hostResults[name][serviceListattr[serin]];
                        plotResult(result);
                    }
                    resolve(xhr.response);
                } else {
                    reject(xhr.status);
                }
            }
        };
        xhr.ontimeout = function () {
            reject('timeout');
        };
        // xhr.open('get', "http://10.10.1.4/nagios/cgi-bin/statusjson.cgi?query=service&hostname=" + hosts[count].name + "&servicedescription=check+"+serviceQuery[db][serin], true);
        xhr.open('get', "http://10.10.1.4/nagios/cgi-bin/statusjson.cgi?query=service&hostname=" + hosts[count].name + "&servicedescription="+serviceQuery[db][serviceList[serin]].query, true);
        xhr.send();
    })
}
function ip2hostname (address) {
    const strArr = address.split(".");
    return "compute-"+ strArr[2] + "-" + strArr[3];
}
let expectedLength = 0;
function requestServiceinfluxdb(count,serin) {
    return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();
        const ip = "10.101."+ hosts[count].hpcc_rack +"." + hosts[count].hpcc_node;
        var name = hosts[count].name;
        const returnLength = expectedLength - hostResults[name][serviceListattr[serin]].length;
        xhr.onreadystatechange = function(e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const responseJSON = JSON.parse(this.responseText);
                    let index = 0;
                    if (!recordonly){
                        var result = processResult(responseJSON,name,undefined,serviceList[serin]);
                        hostResults[name][serviceListattr[serin]].push(result);
                    }else {
                        if (responseJSON.results[0].series) {
                            // responseJSON.results[0].series[0].values = _(responseJSON.results[0].series[0].values).uniq(d=>d[0]);
                            // const returnLength = responseJSON.results[0].series[0].values.length;
                            for (let i = 0; i < returnLength; i++)
                                hostResults[name][serviceListattr[serin]].push(processResult(responseJSON, name, i,serviceList[serin]));
                        }else
                            for (let i = 0; i < returnLength; i++)
                                hostResults[name][serviceListattr[serin]].push(processResult(undefined, name,undefined,serviceList[serin]));
                    }
                    if (selectedService === serviceList[serin]) {
                        hostResults[name].arr = hostResults[name][serviceListattr[serin]];
                        if (!recordonly)
                            plotResult(result,hosts[count].name);
                    }
                    resolve(xhr.response);
                } else {
                    for (let i = 0; i < returnLength; i++){
                        var result = processResult(undefined,name,undefined,serviceList[serin]);
                        hostResults[name][serviceListattr[serin]].push(result);
                    }
                    reject(xhr.status);
                }
            }
        };
        xhr.ontimeout = function () {
            for (let i = 0; i < returnLength; i++){
                var result = processResult(undefined,name,undefined,serviceList[serin]);
                hostResults[name][serviceListattr[serin]].push(result);
            }
            reject('timeout');
        };
        let query;
        if (recordonly)
            query = getstringQuery_influx(ip,serin,timerange,timestep_query);
        else
            query = getstringQuery_influx(ip,serin);
        console.log(query);
        xhr.open('get', "http://10.10.1.4:8086/query?db=hpcc_monitoring_db&q=" + query, true);
        xhr.send();
    })
}
let requestService = eval('requestService'+db);
// let timerange = ["2019-03-21T14:00:00Z","2019-03-21T17:30:00Z"]; // event 21 march 2019
let timerange = ["2019-04-26T00:00:00Z","2019-04-27T00:00:00Z"];
let timestep_query = "5m";
let formatRealtime = getformattime(+timestep_query.split(/[a-z]/)[0],timeshortconvert(timestep_query.match(/[a-z]/)[0]));
function timeshortconvert(us){
    switch(us){
        case 'm': return 'Minute';
        case 'h': return 'Hour';
        case 'w': return 'Week';
    }
}

function requestRT(iteration,count) {
    var promises;
    promises = serviceList.map(function (d, i) {
        return requestService(count, i);
    });
    // new data metrix
    // promises.push(requestService(count, i));
    return Promise.all(promises).then(() => {
        return [iteration, count];
    });
}
var recordonly = false;

function step_full (iteration){
    for (var count =0;count<hosts.length;count++) {
        if (isRealtime) {
            return requestRT(iteration, count);
        }
        else {
            // var result = simulateResults(hosts[count].name);
            var tmp = iteration;
            for (i = 0; i < iterationstep; i++) {
                var result = simulateResults2(hosts[count].name, iteration, selectedService);
                // Process the result
                var name = hosts[count].name;
                if(hostResults[name].arr.length<(iteration+1)) {
                    hostResults[name].arr.push(result);
                    // console.log(hosts[count].name+" "+hostResults[name]);
                    serviceList_selected.forEach((s) => {
                        // var result = simulateResults2(hosts[count].name, iteration, serviceLists[s.index].text);
                        var result = sampleS[hosts[count].name][serviceListattr[s.index]][iteration];//, serviceLists[s.index].text);
                        hostResults[name][serviceListattr[s.index]].push(result);
                    });
                    if (cluster_info) {
                        var cluster = getClusterName(hosts[count].name, iteration);
                        if (cluster !== undefined&& cluster !== -1) {
                            if (!cluster_info[cluster].arr[iteration])
                                cluster_info[cluster].arr[iteration] = [];
                            cluster_info[cluster].arr[iteration].push(name);
                        }
                    }
                }
                // plotResult(result, name, iteration);
                iteration++;
            }
            iteration = tmp;
        }
    }
    initTime();
    // plotResult(undefined, hosts[hosts.length-1].name, iteration);
    return [iteration];
    //return [iteration, count];
}

d3.select("html").on("keydown", function() {
    switch(d3.event.keyCode){
        case 27:
            tool_tip.hide();
            break;
        case 13:
            pauseRequest();
            break;
    }

});



function onChangeMinMaxFunc(choice){
    preloader(true);
    exit_warp();

    // change the range of service here
    if (choice) {
        runopt.minMax = true;
        calculateServiceRange();
    }else{
        runopt.minMax = false;
        serviceFullList.forEach((s,si)=>s.range = serviceFullList_Fullrange[si].range.slice());
    }

    MetricController.axisSchema(serviceFullList, true).update();
    makedataworker();
    initTsnedata();
    // initDataWorker();
    recalculateCluster(group_opt,function(){
        handle_dataRaw();
        initDataWorker();
        if (!init)
            resetRequest();
        preloader(false);
    });
}
function formatService(init){
    if (runopt.minMax)
        calculateServiceRange();
    else if(!init)
        serviceFullList.forEach((s,si)=>s.range = serviceFullList_Fullrange[si].range.slice());
    if (init)
        serviceFullList_Fullrange = _.cloneDeep(serviceFullList);
}
function handle_dataRaw() {

    cluster_info.forEach(d => (d.arr = [],d.total=0,d.radius = d.radius||0, d.__metrics.forEach(e => (e.minval = undefined, e.maxval = undefined)),d.leadername=undefined));
    // tsnedata = {};
    hosts.forEach(h => {
        // tsnedata[h.name] = [];
        let lastCluster = undefined;
        sampleS[h.name].arrcluster = sampleS.timespan.map((t, i) => {
            // let nullkey = false;
            // let axis_arr = _.flatten(serviceLists.map(a => d3.range(0, a.sub.length).map(vi => (v = sampleS[h.name][serviceListattr[a.id]][i][vi], d3.scaleLinear().domain(a.sub[0].range)(v === null ? (nullkey = true, undefined) : v) || 0))));
            // axis_arr.name = h.name;
            // axis_arr.timestep = i;
            // reduce time step
            axis_arr = tsnedata[h.name][i];
            if(axis_arr.outlier) {
                let outlierinstance = outlyingList.pointObject[h.name + '_' + i];
                if (outlierinstance) {
                    return outlierinstance.cluster;
                }
            }
            // assign cluster
            let index = 0;
            // let cluster_inRange = {}; // this node belong to how many cluster
            let minval = Infinity;
            cluster_info.find((c, ci) => {
                const val = distance(c.__metrics.normalize, axis_arr);
                if(val===0&&c.leadername===undefined)
                    c.leadername = {name:h.name,timestep:i};
                // if( val < c.radius/2)
                //     cluster_inRange[ci] =val;
                if (minval > val) {
                    index = ci;
                    minval = val;
                }
                return !val;
            });

            // enhance unchange status
            // if (cluster_inRange[lastCluster]!==undefined){
            //     if (index!==lastCluster)
            //         console.log(val,cluster_inRange)
            //     index = lastCluster;
            // }
            //--- end assign cluster
            if (!cluster_info[index].arr[i])
                cluster_info[index].arr[i]=[];
            cluster_info[index].arr[i].push(h.name);
            cluster_info[index].total = 1 + cluster_info[index].total || 0;
            cluster_info[index].__metrics.forEach((m, i) => {
                if (m.minval === undefined || m.minval > axis_arr[i])
                    m.minval = axis_arr[i];
                if (m.maxval === undefined || m.maxval < axis_arr[i])
                    m.maxval = axis_arr[i];
            });
            // axis_arr.cluster = index;
            tsnedata[h.name][i].cluster = index;
            // tsnedata[h.name][i].multiClusters = Object.keys(cluster_inRange).length>1;
            // tsnedata[h.name][i].strickCluster = minval<cluster_info[index].radius/2;
            tsnedata[h.name][i].minDist = minval;
            lastCluster = index;
            return index;
            // return cluster_info.findIndex(c=>distance(c.__metrics.normalize,axis_arr)<=c.radius);
        })
    });
    cluster_info.forEach(c => c.mse = ss.sum(c.__metrics.map(e => (e.maxval - e.minval) * (e.maxval - e.minval))));
    cluster_map(cluster_info);
    radarChartclusteropt.schema = serviceFullList;
    handle_clusterinfo();
}

function requestRedraw() {
    if (!init) {
        onchangeVizType();
    }
}

function onchangeCluster() {
    cluster_info.forEach(d => (d.total=0,d.__metrics.forEach(e => (e.minval = undefined, e.maxval = undefined))));
    // tsnedata = {};
    hosts.forEach(h => {
        // tsnedata[h.name] = [];
        sampleS[h.name].arrcluster = sampleS.timespan.map((t, i) => {
            let nullkey = false;
            // let axis_arr = _.flatten(serviceLists.map(a => d3.range(0, a.sub.length).map(vi => (v = sampleS[h.name][serviceListattr[a.id]][i][vi], d3.scaleLinear().domain(a.sub[0].range)(v === null ? (nullkey = true, undefined) : v) || 0))));
            let axis_arr = tsnedata[h.name][i];
            // axis_arr.name = h.name;
            // axis_arr.timestep = i;
            // reduce time step
            if(axis_arr.outlier) {
                let outlierinstance = outlyingList.pointObject[h.name + '_' + i];
                if (outlierinstance) {
                    return outlierinstance.cluster;
                }
            }

            let index = 0;
            let minval = Infinity;
            cluster_info.forEach((c, i) => {
                const val = distance(c.__metrics.normalize, axis_arr);
                if (minval > val) {
                    index = i;
                    minval = val;
                }
            });
            cluster_info[index].total = 1 + cluster_info[index].total || 0;
            cluster_info[index].__metrics.forEach((m, i) => {
                if (m.minval === undefined || m.minval > axis_arr[i])
                    m.minval = axis_arr[i];
                if (m.maxval === undefined || m.maxval < axis_arr[i])
                    m.maxval = axis_arr[i];
            });
            // axis_arr.cluster = index;

            // timeline precalculate
            tsnedata[h.name][i].cluster = index;

            return index;
            // return cluster_info.findIndex(c=>distance(c.__metrics.normalize,axis_arr)<=c.radius);
        })
    });
    cluster_info.forEach(c => c.mse = ss.sum(c.__metrics.map(e => (e.maxval - e.minval) * (e.maxval - e.minval))));
    cluster_map(cluster_info);
    handle_clusterinfo();

    //tsne
    requestRedraw();
}
function onchangeVizType(){
    switch (vizMode) {
        case 'timeArc':
            mainviz = timeArc;
            return true;
        default:
            mainviz = timeArc;
            return false;
    }
}
function onchangeVizdata(){
    switch (vizMode) {
        case 'timeArc':
            handle_data_TimeSpace = handle_data_timeArc;
            handle_data_TimeSpace(tsnedata);
            return true;
        default:
            return false;
    }
}

$( document ).ready(function() {
    console.log('ready');
    makedataworker();
    // set tooltip
    let tipopt= {position: {
            x: 'right',
            y: 'center'
        },
        outside: 'x',
        adjustPosition: true,
        adjustTracker: true,
        theme: 'TooltipBorderThick',
        addClass:'informationDetail',
        getTitle:'data-title'
    };
    d3.selectAll('.information, .toolTip').each(function() {
        const hasTarget = d3.select(this).attr('data-target');
        const hasImage = d3.select(this).attr('data-image');
        let positiont = d3.select(this).attr('tooltip-pos');
        if (hasTarget||hasImage){
            tipopt.addClass ='informationDetail';
            tipopt.position = {
                x: 'right',
                y: 'center'
            }
            tipopt.outside= 'x';
            delete tipopt.offset;
        }else{
            tipopt.addClass = 'informationDetail mini';
            if (!positiont) {
                tipopt.offset = {y: -15};
                delete tipopt.position;
                tipopt.outside = "y";
            }else{
                tipopt.position = {
                    x: 'right',
                    y: 'center'
                }
                tipopt.outside= 'x';
                delete tipopt.offset;
            }
        }
        let tip = $(this).jBox('Tooltip',_.defaults({
            pointer: (hasTarget||hasImage)?"top:20":(positiont?false:"center")
        }, tipopt));
        if (hasTarget)
            tip.setContent($('#datainformation'));
        else if(hasImage)
            tip.setContent(`<img src="src/images/${hasImage}" width="100%"></img>`);

    });
    // set event for viz type
    $('input[type=radio][name=viztype]').change(function() {
        updateViztype(this.value);
    });

    d3.select('#majorGroupDisplay_control').on('change',function() {
        switch ($(this).val()) {
            case "0":
                radarChartclusteropt.boxplot = false;
                d3.selectAll('#clusterDisplay .radarPlot').style('opacity',null);
                cluster_map(cluster_info);
                break;
            case "1":
                radarChartclusteropt.boxplot = true;
                d3.selectAll('#clusterDisplay .radarPlot').style('opacity',null);
                cluster_map(cluster_info);
                break;
            case "2":
                d3.selectAll('#clusterDisplay .radarPlot').style('opacity',0.2);
                onClusterHistogram();
                break;
        }
    });

    $('.fixed-action-btn').floatingActionButton({
        direction: 'left',
        hoverEnabled: false,
    });
    $('.collapsible').collapsible({
        inDuration:1000,
        outDuration:1000
    });
    $('.collapsible.expandable').collapsible({
        accordion: false,
        inDuration:1000,
        outDuration:1000,
    });
    $('.modal').modal();
    $('.dropdown-trigger').dropdown();
    $('.tabs').tabs({'onShow':function(){

            if (this.$activeTabLink.text()==='Video') {
                $('#videoIn')[0].play();
                d3.select('#timelineTool').classed('hide',true);
                d3.select('.overlaySide').classed('hide',true);
                closeNav();
            }else{
                $('#videoIn')[0].pause();
                d3.select('#timelineTool').classed('hide',false);
                d3.select('.overlaySide').classed('hide',false);
            }
        }});
    $('.sidenav').sidenav();
    discovery('#sideNavbtn');
    //$('.tap-target').tapTarget({onOpen: discovery});

    d3.select("#DarkTheme").on("click",switchTheme);
    changeRadarColor(colorArr.Radar[4]);
    // color scale create
    creatContain(d3.select('#RadarColor').select('.collapsible-body>.pickercontain'), colorScaleList, colorArr.Radar, onClickRadarColor);

    d3.select('#enableVariableCorrelation').on('click',function(){
        getcorrelation();
    });

    d3.select('#distributeLayout').on('click',function(){
        let temp = serviceFullList.filter((s,i)=>s.enable).map(s=>({angle:s.anglr,data:s}));
        temp.sort((a,b)=>a.angle-b.angle);
        temp.forEach((d,i)=>d.data.angle=i*2*Math.PI/temp.length);
        MetricController.axisSchema(serviceFullList).datasummary(undefined).update();
    });
    d3.select('#clusterMethod').on('change',function(){
        Radarplot_opt.clusterMethod = this.value;
        Radarplot.binopt(Radarplot_opt);
        // updateSummaryChartAll();
        d3.selectAll('.clusterProfile').classed('hide',true);
        d3.select(`#${this.value}profile`).classed('hide',false);
    });
    d3.select('#chartType_control').on("change", function () {
        var sect = document.getElementById("chartType_control");
        graphicControl.charType = sect.options[sect.selectedIndex].value;
    });

    d3.select('#compDisplay_control').on("change", function () {
        preloader(true,undefined,'Change visualization...');
        setTimeout(()=>{
            var sect = document.getElementById("compDisplay_control");

            vizMode = sect.options[sect.selectedIndex].getAttribute('value2');
            onchangeVizType();
            onchangeVizdata();

            preloader(false);
        });
    });
    // cluster init
    initClusterUi();

    // outlier detection
    d3.select('#outlierDection').on('change',function(){
        if ($(this).prop('checked')){
            outlyingList = outlier();
            onCalculateClusterAction();
        }else{
            clusterGroup={};
            onCalculateClusterAction();
        }
    });

    // spinner = new Spinner(opts).spin(target);


    setTimeout(() => {
        formatService(true);
        MetricController.graphicopt({width:365,height:365})
            .div(d3.select('#RadarController'))
            .tablediv(d3.select('#RadarController_Table'))
            .axisSchema(serviceFullList)
            .onChangeValue(onSchemaUpdate)
            .onChangeFilterFunc(onfilterdata)
            .onChangeMinMaxFunc(onChangeMinMaxFunc)
            .init();
    },0);
});
function updateClusterControlUI(n) {
    if(n) {
        group_opt.bin.range[0] = n;
        group_opt.bin.k = n;
        group_opt.bin.range[1] = n + 1;
    }
    if (group_opt.bin.range) {
        $('#lowrange').val(group_opt.bin.range[0]);
        $('#highrange').val(group_opt.bin.range[1]);
    }
    if(group_opt.bin.k)
        $('#knum').val(group_opt.bin.k);

}
let profile = {};

function onfilterdata(schema) {
    preloader(true)
    setTimeout(()=>{
        if(schema) {
            serviceFullList.forEach((s, si) => {
                s.filter = schema.axis[s.text].filter;
                s.norm_filter = (s.filter ? s.filter.map(d => d3.scaleLinear().domain(s.range)(d)) : s.filter)
            });
            mainviz.schema(serviceFullList);
        }
        onchangeVizdata();
        preloader(false);
    },0)
    // data_filtered = tsnedata.filter(d=>schema.axisList.map(s=> s.filter!=null?(d[s.data.text]>=s.filter[0])&&(d[s.data.text]<=s.filter[1]):true).reduce((p,c)=>c&&p))
}
function onSchemaUpdate(schema){
    serviceFullList.forEach(ser=>{
        ser.angle = schema.axis[ser.text].angle();
        ser.enable = schema.axis[ser.text].data.enable;
    });
    radarChartOptions.schema = serviceFullList;
    Radarplot.schema(serviceFullList,firstTime);
    if (cluster_info){
        radarChartclusteropt.schema = serviceFullList;}
    if (!firstTime) {
        // updateSummaryChartAll();
        MetricController.drawSummary();
        if (cluster_info) {
            cluster_map(cluster_info);
            mainviz.draw();
        }
    }
    // }
    if (db!=='csv')
        SaveStore();
}

function onFinishInterval(data) {
    //Process all the rSqared
    let similarityResults = [];
    let similarityParts = [];
    for (let i = 0; i < maxWorkers; i++) {
        similarityParts.push([]);
    }
    let similarityCounter = 0;
    for (let i = 0; i < hosts.length - 1; i++) {
        for (let j = i + 1; j < hosts.length; j++) {
            let keyI = hosts[i].name;
            let keyJ = hosts[j].name;
            let valuesI = data[keyI];
            let valuesJ = data[keyJ];
            let sd = {x1: valuesI, x2: valuesJ};
            similarityParts[similarityCounter % maxWorkers].push(sd);
            similarityCounter++;
        }
    }
    let similarityResultCounter = 0;
    //Now start a worker for each of the part
    VARIABLES = [selectedService];
    similarityParts.forEach((part, i) => {
        startWorker('myscripts/worker/similarity_worker.js', {
            variables: VARIABLES,
            data: part
        }, onSimilarityResult, i);
    })

    function onSimilarityResult(evt) {
        similarityResultCounter += 1;
        similarityResults = similarityResults.concat(evt);
        if (similarityResultCounter === similarityParts.length) {
            resetWorkers();
            onCompleteSimilarityCal(similarityResults);
        }
    }

    function onCompleteSimilarityCal(similarityResults) {
        let orderParts = VARIABLES.map((theVar) => {
            return similarityResults.map(similarity => {
                return {
                    source: similarity.source,
                    target: similarity.target,
                    weight: similarity.weights[theVar]
                }
            });
        });
        orderParts.forEach((part, i) => {
            //Build the best order.
            startWorker('myscripts/worker/similarityorder_worker.js', {
                theVar: VARIABLES[i],
                machines: hosts.map(h=>h.name),
                links: part
            }, onOrderResult, i);
        });
        let orderingResultCounter = 0;

        let totalDraws = VARIABLES.length;
        let drawingResultCounter = 0;

        function onOrderResult(orderResults) {

            orderingResultCounter += 1;
            if (orderingResultCounter === orderParts.length) {
                doneOrdering = new Date();
                resetWorkers();
            }
            processOrderResults(orderResults);
        }

        function processOrderResults(orderResults) {
            let theVar = orderResults.variable;
            let order = orderResults.order;
            console.log(order);
            order.forEach((name,i)=>{
                const rack = name.split('-')[1];
                racksnewor[rack-1].hosts.find(h=>h.name===name).y = i*gaphost;
                d3.selectAll('.hostID_'+name).transition().duration(500).attr('y',i*gaphost);
                d3.selectAll('.'+name).transition().duration(500).attr('y',i*gaphost);
                d3.selectAll('.measure_'+name).transition().duration(100).attr('y',i*gaphost);
            });
        }
    }

}

let radarChartclusteropt  = {
    margin: {top: 0, right: 0, bottom: 0, left: 0},
    w: 180,
    h: 180,
    radiuschange: false,
    levels:6,
    dotRadius:2,
    strokeWidth:1,
    maxValue: 0.5,
    isNormalize:true,
    showHelperPoint: false,
    roundStrokes: true,
    ringStroke_width: 0.15,
    ringColor:'black',
    fillin:0.5,
    boxplot:true,
    animationDuration:1000,
    events:{
        axis: {
            mouseover: function(){
                try {
                    const d = d3.select(d3.event.detail || this).datum();
                    d3.selectAll('#clusterDisplay .axis' + d.idroot + '_' + d.id).classed('highlight', true);
                    d3.selectAll('#clusterDisplay .axisText').remove();
                    if (d3.select(this.parentNode).select('.axisText').empty())
                        d3.select(this.parentNode).append('text').attr('class','axisText').attr('transform','rotate(-90) translate(5,-5)');
                    d3.select(this.parentNode).select('.axisText').text(d.text);
                    $('.tablesvg').scrollTop($('table .axis' + d.idroot + '_' + d.id)[0].offsetTop);
                }catch(e){}
            },
            mouseleave: function(){
                const d = d3.select(d3.event.detail||this).datum();
                d3.selectAll('#clusterDisplay .axis'+d.idroot+'_'+d.id).classed('highlight',false);
                d3.selectAll('#clusterDisplay .axisText').remove();
            },
        },
    },
    showText: false};
function cluster_map (dataRaw) {
    let data = dataRaw.map((c,i)=>{
        let temp = c.__metrics.slice();
        temp.name = c.labels;
        temp.text = c.text;
        temp.total = c.total;
        temp.mse = c.mse;
        let temp_b = [temp];
        temp_b.id = c.name;
        temp_b.order = i;
        return temp_b;
    });
    let orderSimilarity = similarityCal(data);
    data.sort((a,b)=>( orderSimilarity.indexOf(a.order)-orderSimilarity.indexOf(b.order))).forEach((d,i)=>{
        d.order = i;
        dataRaw.find(c=>c.name===d.id).orderG = i;
    });
    //--shoudn't here
    dataRaw.forEach(c=>{
        let matchitem = data.find(d=>d.id===c.name);
        // c.text = c.text.replace(`Group ${c.index+1}`,`Group ${matchitem.order+1}`);
        matchitem[0].text =  c.text;
    });
    data.forEach(d=>d[0].name = dataRaw.find(c=>d.id===c.name).text);
    //--end
    let dir = d3.select('#clusterDisplay');
    setTimeout(()=>{
        let r_old = dir.selectAll('.radarCluster').data(data,d=>d.id).order();
        r_old.exit().remove();
        let r_new = r_old.enter().append('div').attr('class','radarCluster')
            .on('mouseover',function(d){
                mainviz.highlight(d.id);
                d3.select(this).classed('focus',true);
            }).on('mouseleave',function(d){
                mainviz.unhighlight(d.id);
                d3.select(this).classed('focus',false);
            })
            .append('div')
            .attr('class','label')
            .styles({'position':'absolute',
                'color':'black',
                'width': radarChartclusteropt.w+'px',
                height: '1rem',
                padding: '10px'
                // overflow: 'hidden',
            });
        // r_new.append('span').attr('class','clusterlabel truncate center-align col s12');
        r_new.append('i').attr('class','editbtn material-icons tiny col s1').style('cursor', 'Pointer').text('edit').on('click',function(){
            let active = d3.select(this).classed('clicked');
            active = !active;
            d3.select(this).classed('clicked',active);
            const parent = d3.select(this.parentNode);
            parent.select('span.clusterlabel').classed('hide',active);
            parent.select('input.clusterlabel').classed('hide',!active);
        });
        r_new.append('span').attrs({'class':'clusterlabel truncate left-align col s11','type':'text'});
        r_new.append('input').attrs({'class':'clusterlabel browser-default hide truncate center-align col s11','type':'text'}).on('change',function(d){
            clusterDescription[d.id].text = $(this).val();
            d3.select(this).classed('hide',true);
            const parent = d3.select(this.parentNode);
            parent.select('.editbtn').classed('clicked',false);
            parent.select('span.clusterlabel').text(clusterDescription[d.id].text).classed('hide',false);
            updateclusterDescription(d.id,clusterDescription[d.id].text);
        });
        r_new.append('span').attr('class','clusternum center-align col s12');
        r_new.append('span').attr('class','clusterMSE center-align col s12');
        dir.selectAll('.radarCluster')
            .attr('class',(d,i)=>'flex_col valign-wrapper radarCluster radarh'+d.id)
            .style('position','relative')
            .each(function(d,i){
                radarChartclusteropt.color = function(){return colorCluster(d.id)};
                RadarChart(".radarh"+d.id, d, radarChartclusteropt,"").select('.axisWrapper .gridCircle').classed('hide',true);
            });
        d3.selectAll('.radarCluster').classed('first',(d,i)=>!i);
        d3.selectAll('.radarCluster').select('span.clusterlabel').attr('data-order',d=>d.order+1).text(d=>d[0].text);
        d3.selectAll('.radarCluster').select('input.clusterlabel').attr('value',d=>d[0].text).each(function(d){$(this).val(d[0].text)});
        d3.selectAll('.radarCluster').select('span.clusternum').text(d=>(d[0].total||0).toLocaleString());
        d3.selectAll('.radarCluster').select('span.clusterMSE').classed('hide',!radarChartclusteropt.boxplot).text(d=>d3.format(".2")(d[0].mse||0));
    }, 0);
    outlier_map(outlyingList)
}
function outlier_map (data) {
    //--end
    let outlyingopt = _.cloneDeep(radarChartclusteropt);
    outlyingopt.fillin = 0;
    outlyingopt.boxplot = false;
    outlyingopt.schema = serviceFullList;
    let dir = d3.select('#outlierDisplay');
    setTimeout(()=>{
        let r_old = dir.selectAll('.radarCluster').data(data,d=>d.labels);
        r_old.exit().remove();
        let r_new = r_old.enter().append('div').attr('class','radarCluster')
            .append('div')
            .attr('class','label')
            .styles({'position':'absolute',
                'color':'black',
                'width': radarChartclusteropt.w+'px',
                height: '1rem',
                padding: '10px'
            });
        r_new.append('span').attrs({'class':'outlierLabel truncate left-align col s11','type':'text'});
        r_new.append('span').attr('class','clusternum center-align col s12');

        dir.selectAll('.radarCluster')
            .attr('class',(d,i)=>
                'flex_col valign-wrapper radarCluster radarhoutlying'+(-d.labels))
            .each(function(d,i){
                outlyingopt.color = function(){return 'black'};
                RadarChart(".radarhoutlying"+(-d.labels), d.arr, outlyingopt,"").select('.axisWrapper .gridCircle').classed('hide',true);
            });
        dir.selectAll('.radarCluster').select('span.clusternum').text(d=>(d.arr.length).toLocaleString());
        dir.selectAll('.radarCluster').select('span.outlierLabel').text(d=>`Outlying group ${-d.labels}`);

    }, 0);
}
function updateclusterDescription (name,text){
    if (name)
        cluster_info.find(c=>c.name===name).text = text;
    else {
        cluster_info.forEach(c => c.text = clusterDescription[c.name].text);
        cluster_map(cluster_info)
    }
    mainviz.clusterDataLabel(cluster_info)
}

function updateViztype (viztype_in){
    viztype = viztype_in;
    $('#vizController span').text(`${viztype} Controller`);
    $('#mouseAction input[value="showseries"]+span').text(`Show ${viztype} series`)
    $('#vizController .icon').removeClass (function (index, className) {
        return (className.match (/(^|\s)icon-\S+/g) || []).join(' ');
    }).addClass(`icon-${viztype}Shape`);
    RadarChart = eval(`${viztype}Chart_func`);
    d3.selectAll('.radarPlot .radarWrapper').remove();
    if (!init) {
        // updateSummaryChartAll();
        MetricController.charType(viztype).drawSummary();
        if (cluster_info) {
            cluster_map(cluster_info);
            if (!vizMode)
                mainviz.draw();
        }
    }
}

let clustercalWorker;
function recalculateCluster (option,calback,customCluster) {
    preloader(true,10,'Process grouping...','#clusterLoading');
    group_opt = option;
    distance = group_opt.normMethod==='l1'?distanceL1:distanceL2;
    if (clustercalWorker)
        clustercalWorker.terminate();
    clustercalWorker = new Worker ('src/script/worker/clustercal.js');
    clustercalWorker.postMessage({
        binopt:group_opt,
        sampleS:tsnedata,
        timeMax:sampleS.timespan.length,
        hosts:hosts,
        serviceFullList: serviceFullList,
        serviceLists:serviceLists,
        serviceList_selected:serviceList_selected,
        serviceListattr:serviceListattr,
        customCluster: customCluster // 1 25 2020 - Ngan
    });
    clustercalWorker.addEventListener('message',({data})=>{
        if (data.action==='done') {
            try {
                M.Toast.dismissAll();
            }catch(e){}
            data.result.forEach(c=>c.arr = c.arr.slice(0,lastIndex));
            cluster_info = data.result;
            if (!customCluster) {
                clusterDescription = {};
                recomendName(cluster_info);
            }else{
                let new_clusterDescription = {};
                cluster_info.forEach((d,i)=>{
                    new_clusterDescription[`group_${i+1}`] = {id:`group_${i+1}`,text:clusterDescription[d.name].text};
                    d.index = i;
                    d.labels = ''+i;
                    d.name = `group_${i+1}`;
                });
                clusterDescription = new_clusterDescription;
                updateclusterDescription();
            }
            recomendColor (cluster_info);
            if (!calback) {
                cluster_map(cluster_info);
                handle_clusterinfo();
            }
            preloader(false, undefined, undefined, '#clusterLoading');
            clustercalWorker.terminate();
            if (calback)
                calback();
        }
        if (data.action==='returnData'){
            onloaddetermire({process:data.result.process,message:data.result.message},'#clusterLoading');
        }
    }, false);

}



function enableVariableCorrelation(isenable){
    d3.select('#enableVariableCorrelation').attr('disabled',!isenable?'':null)
}


// test zone
function onMergeSuperGroup() {
    clusterGroup = {9:0,2:0,5:0,8:0};
    // testing ----------
    hosts.forEach(h => {
        tsnedata[h.name].forEach(d=>{
            if (clusterGroup[d.cluster]!==undefined)
                d.cluster = clusterGroup[d.cluster];
        })
    })
}
function onVisibleGroup(groupName,ishide){
    cluster_info.find(d=>d.name==groupName).hide = ishide;
    requestRedraw();
}
