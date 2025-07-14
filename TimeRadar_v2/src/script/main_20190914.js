/* MIT License
 *
 * Copyright (c) 2019 Tommy Dang, Ngan V.T. Nguyen
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


// Set the dimensions of the canvas / graph
var margin = {top: 5, right: 0, bottom: 10, left: 0};

var svg = d3.select(".mainsvg"),
    width = +document.getElementById("mainBody").offsetWidth,
    height = +svg.attr("height")-margin.top-margin.bottom,
    heightdevice = + document.getElementById("mainBody").offsetHeight,

    svg = svg
        .attrs({
            width: width,
        })
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
jobMap_opt.width = width;
jobMap_opt.height = height;


// other component setting
// summaryGroup
let summaryGroup_op ={
    margin : {top: 5, right: 0, bottom: 0, left: 0},
    height: 280,
}
let Radarplot_opt = {
    clusterMethod: 'leaderbin',
}

var svgStore={};
var svgsum;
//.call(d3.zoom()
//    .scaleExtent([1, 8])
//    .on("zoom", zoom));
//function zoom() {
//   svg.attr("transform", d3.event.transform);
//}


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
var spinner;
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

let globalTrend = false;
//***********************

var initialService = "Temperature";
var selectedService;

let colorScaleList = {
    n: 7,
    rainbow: ["#000066", "#4400ff", "#00ddff", "#00ddaa", "#00dd00", "#aadd00", "#ffcc00", "#ff8800", "#ff0000", "#660000"],
    soil: ["#2244AA","#4A8FC2", "#76A5B1", "#9DBCA2", "#C3D392", "#F8E571", "#F2B659", "#eb6424", "#D63128", "#660000"],
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
            if (typeof (d3[`scheme${name}`][0]) != 'string') {
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
        {val: 'Viridis',type:'d3',label: 'Viridis'}],
    Cluster: [{val: 'Category10',type:'d3',label: 'D3'},{val: 'Paired',type:'d3',label: 'Blue2Red'}]};

var arrThresholds;
var dif, mid,left;
var color,opa;
//var arrColor = ['#00c', '#1a9850','#fee08b', '#d73027'];
// var arrColor = ['#110066','#4400ff', '#00cccc', '#00dd00','#ffcc44', '#ff0000', '#660000'];
// let arrColor = colorScaleList.customFunc('rainbow');
let arrColor = colorScaleList.d3colorChosefunc('Viridis');

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
};
var Scatterplot = d3.Scatterplot();
var Radarplot = d3.radar();
var TSneplot = d3.Tsneplot().graphicopt(TsnePlotopt).runopt(TsnePlotopt.runopt);
let jobMap = JobMap().svg(d3.select('#jobmap')).graphicopt(jobMap_opt).runopt(jobMap_runopt);
var MetricController = radarController();
let getDataWorker = new Worker ('../HiperView/myscripts/worker/getDataWorker.js');
let isbusy = false, imageRequest = false;

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

    inithostResults ();

    jobMap.color(colorTemperature).schema(serviceFullList).init()

    getDataWorker.postMessage({action:"init",value:{
            hosts:hosts,
            db:db,
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
                if (graphicControl.charType === "T-sne Chart")
                    TSneplot.data(data.result.arr).draw(data.result.nameh, data.result.index);
                jobMap.dataComp(data.result.arr).drawComp();
                if (graphicControl.sumType === "RadarSummary") {
                    Radarplot.data(data.result.arr).drawSummarypoint(data.result.index, data.result.hindex);
                }
                MetricController.data(data.result.arr).drawSummary(data.result.hindex);
            }
        }
        if (data.action==='DataServices') {
            MetricController.datasummary(data.result.arr);
        }
    }, false);
    request();
}
var currentlastIndex;
var speedup= 0;
function drawsummarypoint(harr){
    var arr = [];
    var xx;
    lastIndex = currentlastIndex;
    query_time = hostResults['timespan'][currentlastIndex];
    //xx = xTimeSummaryScale(query_time);
    //updateTimeText();

    switch (graphicControl.sumType) {
        case "Boxplot":
            break;
        case "Scatterplot":
            break;
        case "Radar":
            for (var i in harr) {
                var h  = harr[i];
                var name = hosts[h].name;
                arrServices = getDataByName_withLabel(hostResults, name, lastIndex, lastIndex,0.5);
                arrServices.name = name;
                arr.push(arrServices);
            }
            Radarplot.data(arr).drawpoint(lastIndex);
            // Radar Time
            //drawRadarsum(svg, arr, lastIndex, xx-radarsize);
            break;
        case "RadarSummary":
            getData(name,lastIndex)
            // Radarplot.data(arr).drawSummarypoint(lastIndex);
            break;
        default:
            jobMap.getharr(harr);
            for (var i in harr) {
                var h  = harr[i];
                var name = hosts[h].name;
                arrServices = getDataByName_withLabel(hostResults, name, lastIndex, lastIndex,0.5);
                arrServices.name = name;
                arr.push(arrServices);
            }
            jobMap.dataComp_points(arr);
            var h = harr[harr.length-1];
            var name = hosts[h].name;
            break;
    }
    getData(name,lastIndex)
}
function shiftTimeText(){
    if (timelog.length > maxstack-1){ timelog.shift();
        svg.selectAll(".boxTime").filter((d,i)=>i).transition().duration(500)
            .attr("x", (d,i)=>xTimeSummaryScale(i)+ width/maxstack/2);
        svg.select(".boxTime").transition().duration(500)
            .attr("x", xTimeSummaryScale(0)+ width/maxstack/2)
            .transition().remove();
    }
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
        if(!hostResults['timespan'])
            hostResults['timespan']=[];
        if (isRealtime)
            hostResults['timespan'].push(new Date());
        else
            hostResults['timespan']=sampleS['timespan'].slice(0,index+1)
        expectedLength++;
    }
}

function request(){
    bin.data([]);
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
    var missingtimetex = false;

    updatetimeline(0);
    interval2 = new IntervalTimer(function (simDuration) {
        var midlehandle = function (ri){
            let returniteration = ri[0];
            let returnCount = ri[1];
            countarr.push(returnCount);
            count += 1;
        };
        var drawprocess = function ()  {
            if (graphicControl.mode===layout.HORIZONTAL)
                drawsummarypoint(countarr);
            countarr.length = 0;
            // fullset draw
            if (count > (hosts.length-1)) {// Draw the summary Box plot ***********************************************************

                // getJoblist(lastIndex,true);

                // Draw date
                d3.select(".currentDate")
                    .text("" + currentMiliseconds.toDateString());

                // cal to plot
                bin.data([]);
                currentlastIndex = iteration+iterationstep-1;
                // drawsummary();
                jobMap.setharr([]);
                lastIndex = currentlastIndex+1;

                count = 0;
                countbuffer = 0;
                requeststatus = true;
                haveMiddle = false;
                iteration += iterationstep;
                updatetimeline(iteration);
            }
            currentlastIndex = iteration;
            Scatterplot.init(xTimeSummaryScale(0) + swidth / 2);
            xTimeSummaryScaleStep = d3.scaleLinear()
                .domain([0, hosts.length - 1]) // input
                .range([0, xTimeSummaryScale.step()]);


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
                        let ri = step(iteration, countbuffer);
                        midlehandle(ri);
                        if(countbuffer===0) {
                            getJoblist();
                            jobMap.data(jobList).draw(hostResults.timespan[lastIndex]);
                        }
                        countbuffer++;
                    } while ((countbuffer < hosts.length) && (speedup === 2 || (hosts[countbuffer].hpcc_rack === oldrack)) && speedup);
                    speedup = 0;
                    drawprocess();
                }
            }catch(e){

            }
            if (countbuffer>= (hosts.length))
                requeststatus = false; //stop request

        }
    } , simDuration);

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

// function simulateResults2(hostname,iter, s){
//     var newService;
//     let serviceIndex =  serviceList.findIndex(d=>d===s);
//     newService = (sampleS[hostname][serviceListattr[serviceIndex]]||[])[iter];
//     if (serviceIndex === 4) {
//         if (sampleS[hostname]["arrPower_usage"]=== undefined && db!=="influxdb"&& db!=="csv") {
//             var simisval = handlemissingdata(hostname,iter);
//             sampleS[hostname]["arrPower_usage"] = [simisval];
//         }else if (sampleS[hostname]["arrPower_usage"]!== undefined) {
//             if (sampleS[hostname]["arrPower_usage"][iter] === undefined && db !== "influxdb" && db !== "csv") {
//                 var simisval = handlemissingdata(hostname, iter);
//                 sampleS[hostname]["arrPower_usage"][iter] = simisval;
//             }
//             newService = sampleS[hostname]["arrPower_usage"][iter];
//         }
//     }
//     if (newService === undefined){
//         newService ={};
//         newService.result = {};
//         newService.result.query_time = query_time;
//         newService.data = {};
//         newService.data.service={};
//         newService.data.service.host_name = hostname;
//         newService.data.service.plugin_output = undefined;
//     }else {
//         if (db === "influxdb")
//             try {
//                 newService.result.query_time = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ")(newService.result.query_time).getTime();
//             }catch(e){
//
//             }
//     }
//     return newService;
// }
function simulateResults2(hostname,iter, s){
    var newService;
    let serviceIndex =  serviceList.findIndex(d=>d===s);
    newService = (sampleS[hostname][serviceListattr[serviceIndex]]||[])[iter];
    if (serviceIndex === 4) {
        if (sampleS[hostname]["arrPower_usage"]=== undefined && db!=="influxdb"&& db!=="csv") {
            var simisval = handlemissingdata(hostname,iter);
            sampleS[hostname]["arrPower_usage"] = [simisval];
            newService = simisval;
        }else if (sampleS[hostname]["arrPower_usage"]!== undefined) {
            if (sampleS[hostname]["arrPower_usage"][iter] === undefined && db !== "influxdb" && db !== "csv") {
                var simisval = handlemissingdata(hostname, iter);
                sampleS[hostname]["arrPower_usage"][iter] = simisval;
            }
            newService = sampleS[hostname]["arrPower_usage"][iter];
        }
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
function plotResult(result,name,index) {
    // Check if we should reset the starting point
    if (firstTime) {
        currentMiliseconds = hostResults['timespan'][0];
        hostfirst = name;
        xTimeScale = d3.scaleLinear()
            .domain([0, maxstack-1]);
        // get Time
        minTime = currentMiliseconds;  // some max number
    }
    firstTime = false;

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
        case "T-sne Chart":
            initTsneView();
            if (!speedup) {
                getData(name,index||lastIndex,true,true);
            }
            break;
        default:
            if (!speedup) {
                getData(name,index||lastIndex,true,true);
            }
            break;
    }


}
function initTsneView() {
    if (!svgStore.detailView.g.select('.rackRect').empty()) {
        svgStore.detailView.g.selectAll('*').remove();
        TSneplot.reset(true);
    }
}

function plotHeat(arr,name,hpcc_rack,hpcc_node,xStart,y,isSingle){
    svgStore.detailView.g.selectAll(".RackSummary").remove();
    svgStore.detailView.items.selectAll("."+fixName2Class(name)).remove();
    if (isSingle)
        y= y+10;

    // var obj = arr[i];
    // var x = xTimeScale(i);
    // if (arr.length>1)
    //     x = xMin+ i*(xMax-xMin)/(arr.length);
    let newg = svgStore.detailView.items.selectAll("g."+fixName2Class(name)).data([{name:name,val:arr}]);
    newg.exit().remove();
    newg = newg.enter().append('g')
        .merge(newg)
        .attr('class',fixName2Class(name))
        .attr('transform','translate(0,'+y+')').on("mouseover",mouseoverNode);
    let newrect = newg.selectAll("."+fixName2Class(name)).data(d=>d.val);
    newrect.exit().remove();
    newrect.enter()
        .append("rect")
        .attr("width", node_size)
        .attr("height", node_size )
        .attr("stroke", "#000")
        .attr("stroke-width", 0.05)
        .merge(newrect)
        .attr("class", 'compute '+fixName2Class(name))
        .attr("x",(d,i)=> xTimeScale(i))
        .attr("y", -10)

        .attr("fill", function (obj) {
            if (obj.temp1===undefinedValue)
                return undefinedColor;
            else
                return color(obj.temp1);
        })
        .attr("fill-opacity",function (obj) {
            return opa(obj.temp1);
        })
    ;//.on("mouseout", mouseoutNode);

    if ((selectedService==="Temperature" || selectedService==="Fans_speed")&&isSingle!=true)    {
        let newrect = newg.selectAll(".rct2."+name).data(arr);
        newrect.exit().remove();
        newrect.enter()
            .append("rect")
            .attr("width", node_size)
            .attr("height", node_size )
            .attr("stroke", "#000")
            .attr("stroke-width", 0.05)
            .merge(newrect)
            .attr("class", 'rect2 compute '+name)
            .attr("x",(d,i)=> xTimeScale(i))
            .attr("y", node_size-9)

            .attr("fill", function (obj) {
                if (obj.temp2==undefinedValue)
                    return undefinedColor;
                else
                    return color(obj.temp2);
            })
            .attr("fill-opacity",function (obj) {
                return opa(obj.temp2);
            })
        ;
        ;//.on("mouseout", mouseoutNode);
    }

    // *****************************************
    /// drawSummaryAreaChart(hpcc_rack, xStart);
}
function plotArea(arr,name,hpcc_rack,hpcc_node,xStart,y,serindex){
    let range = serviceLists[serindex].sub[0].range;
    var yScale = d3.scaleLinear()
        .domain([(range[1]-range[0])/2,range[1]]) //  baseTemperature=60
        .range([0, node_size*2]); // output

    var area = d3.area()
        .defined(function(d) { return d.temp1; })
        .x(function(d) { return d.x; })
        .y0(function(d) { return y; })
        .y1(function(d) { return y-yScale(d.temp1); })
        .curve(d3.curveCatmullRom);

    svgStore.detailView.items.selectAll("."+fixName2Class(name)).remove();
    svgStore.detailView.items
        .append('clipPath').attr("class",  'compute '+fixName2Class(name))
        .attr("id", "cp"+fixName2Class(name)).append("path")
        .datum(arr) // 10. Binds data to the line
        .attr("d", area);
    svgStore.detailView.items
        .append('rect')
        .attr("class",  'compute '+fixName2Class(name))
        .attr('width',xTimeScale(arr[arr.length-1].x)-xTimeScale(arr[0].x))
        .attr('height',yScale.range()[1]*2)
        .attr('x',arr[0].x)
        .attr('y',y-yScale.range()[1]).attr("fill","url(#lradient)")
        .attr("clip-path","url(#cp"+fixName2Class(name)+")").on("mouseover", function (d) {
        mouseoverNode ({name:name});
    });

    svgStore.detailView.items.append("path")
        .datum(arr) // 10. Binds data to the line
        .attr("class",'compute ' + fixName2Class(name))
        .attr("stroke","#000")
        .attr("stroke-width",0.2)
        .attr("d", area)
        .attr("fill-opacity",function (d) {
            return opa(d[d.length-1].temp1);
        })
        .style("fill", "none")
        .on("mouseover", function (d) {
            mouseoverNode ({name:name});
        })
    ;
}


function getData(nameh,index,skip,usepast){
    if(!isbusy || skip === true) {
        isbusy = true;
        getDataWorker.postMessage({
            action: "getbatchData", value: {
                lastIndex: index,
                hostResults: hostResults,
                host: nameh,
                usepast: usepast
            }
        });
    }
}

function drawSummaryAreaChart(rack, xStart) {
    var arr2 = [];
    var binStep = 8; // pixels
    var maxX = 0;  // The latest x position, to draw the baseline 60 F
    hosts.forEach(hos=>{
        var att = hos.name;
        var hpcc_rack = hos.hpcc_rack;
        var hpcc_node = ho.hpcc_node;
        if (hpcc_rack == rack) {
            var r = hostResults[att];
            for (var i = 0; i < r.arr.length; i++) {
                var a = r.arr[i];
                var obj = {};
                obj.temp1 = a[0];
                obj.temp2 = a[1];
                obj.temp3 = a[2];
                obj.query_time = hostResults['timespan'][i];
                obj.x = xTimeScale(i);
                if (obj.x >maxX)
                    maxX = obj.x ;  // The latest x position, to draw the baseline 60 F

                obj.bin = Math.round((obj.x-xStart)/binStep);   // How to compute BINS ******************************************
                if (arr2[obj.bin] == undefined)
                    arr2[obj.bin] = [];
                arr2[obj.bin].push(obj);
            }
        }
    });
    var arr3 = [];
    for (var att in arr2) {
        if (arr2[att].length>=2){
            var max = 0;
            var min = 1000;
            for (var j=0; j< arr2[att].length; j++) {
                var temp1 = arr2[att][j].temp1;
                if (temp1 > max)
                    max = temp1;
                if (temp1 < min)
                    min = temp1;

            }
            var obj ={};
            obj.bin = arr2[att][0].bin;
            obj.min = min;
            obj.max = max;
            arr3.push(obj)
        }
    }


    // Drawing areas ****************************************************
    var y = top_margin-16;

    var yScale = d3.scaleLinear()
        .domain([baseTemperature, 120]) //  baseTemperature=60
        .range([0, 25]); // output

    var areaMin = d3.area()
        .x(function(d) { return xStart+d.bin*binStep; })
        .y0(function(d) { return y; })
        .y1(function(d) { return y-yScale(d.min)})
        .curve(d3.curveCatmullRom);

    svgStore.detailView.items.selectAll(".RackSummaryMin"+rack).remove();
    svgStore.detailView.items.append("path")
        .datum(arr3) // 10. Binds data to the line
        .attr("class", "RackSummary RackSummaryMin"+rack)
        .attr("stroke","#000")
        .attr("stroke-width",0.2)
        .attr("d", areaMin)
        .style("fill-opacity",1)
        .style("fill","#99d");

    var areaMax = d3.area()
        .x(function(d) { return xStart+d.bin*binStep; })
        .y0(function(d) { return y; })
        .y1(function(d) { return y-yScale(d.max)})
        .curve(d3.curveCatmullRom);

    svgStore.detailView.items.selectAll(".RackSummaryMax"+rack).remove();
    svgStore.detailView.items.append("path")
        .datum(arr3) // 10. Binds data to the line
        .attr("class", "RackSummary RackSummaryMax"+rack)
        .attr("stroke","#000")
        .attr("stroke-width",0.2)
        .attr("d", areaMax)
        .style("fill-opacity",1)
        .style("fill","#e99");

    if (rack==1) {
        svgStore.detailView.items.selectAll(".baseline").remove();
        svgStore.detailView.items.append("line")
            .attr("class", "RackSummary baseline")
            .attr("x1", xStart)
            .attr("x2", maxX+10)
            .attr("y1", y-yScale(baseTemperature))
            .attr("y2", y-yScale(baseTemperature))
            .attr("class", "baseline")
            .attr("stroke","#000")
            .attr("stroke-width",0.5);

        svgStore.detailView.items.selectAll(".baselineText").remove();
        svgStore.detailView.items.append("text")
            .attr("class", "RackSummary baselineText")
            .attr("x", 12+maxX)
            .attr("y", y+2)
            .attr("fill", "#000")
            .style("text-anchor", "start")
            .style("font-size", "12px")
            .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
            .attr("font-family", "sans-serif")
            .text("60°F");
    }
}

let getHostY_HORIZONTAL = function (r,n,pos){
    if (pos!== undefined)
        return  racksnewor[(r - 1)*2+pos].y + Math.ceil(n/2) * h_rack / (maxHostinRack+0.5);
    else
        return  racks[r - 1].y + n * h_rack / (maxHostinRack+0.5);
    // return  racks[r - 1].y + n * h_rack / (maxHostinRack+0.5);
};

let getHostY_VERTICAL = function (r,n,pos){
    // TODO: change 20 to variable
    return  racksnewor[r - 1].hosts.find(d=>d.hpcc_node===n).y;
    // return  racks[r - 1].y + n * h_rack / (maxHostinRack+0.5);
};
let getHostY = getHostY_HORIZONTAL;

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

function realTimesetting (option,db,init,data){
    isRealtime = option;
    // getDataWorker.postMessage({action:'isRealtime',value:option,db: db,data:data,hostList:hostList});
    if (option){
        processData = eval('processData_'+db);
        simDuration = 200;
        simDurationinit = 200;
        numberOfMinutes = 26*60;
    }else{
        processData = db?eval('processData_'+db):processData_old;
        simDuration =1000;
        simDurationinit = 0;
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
    svg.selectAll(".connectTimeline").style("stroke-opacity", 0.1);
}
function exit_warp () {
    playchange();
    TSneplot.remove();
}
function pausechange(){
    var e = d3.select('.pause').node();
    if (interval2)
        interval2.resume();
    e.value = "false";
    $(e).removeClass('active');
    $(e.querySelector('i')).removeClass('fa-play pauseicon').addClass('fa-pause pauseicon');
    svg.selectAll(".connectTimeline").style("stroke-opacity", 1);
}

function resetRequest(){
    pausechange();
    tool_tip.hide();
    firstTime = true;
    if (interval2)
        interval2.stop();
    hostResults = {};
    expectedLength = 0;
    formatRealtime = getformattime(+timestep_query.split(/[a-z]/)[0],timeshortconvert(timestep_query.match(/[a-z]/)[0]));
    var count =0;
    for (var att in hostList.data.hostlist) {
        // to contain the historical query results
        hostResults[att] = {};
        hostResults[att].index = count;
        hostResults[att].arr = [];
        serviceListattr.forEach(d=>hostResults[att][d]=[]);
        count++;
    }
    svg.selectAll(".compute").remove();
    svg.selectAll(".h").remove();
    svg.selectAll(".graphsum").remove();
    svg.selectAll(".connectTimeline").style("stroke-opacity", 1);
    Radarplot.init().clustercallback(d=>TSneplot.clusterBin(d));
    jobMap.hosts(hosts).remove(true);
    TSneplot.reset(true);

    timelog = [];
    jobList = undefined;
    // updateTimeText();
    request();
}
function loadData(){

}


function loadNewData(d) {
    //alert(this.options[this.selectedIndex].text + " this.selectedIndex="+this.selectedIndex);
    //svg.selectAll("*").remove();
    selectedService = d;
    const trig = d3.select("#datasetsSelectTrigger");
    trig.select('img').attr('src',"images/"+selectedService+".png");
    trig.select('span').text(selectedService);
    setColorsAndThresholds(selectedService);
    drawLegend(selectedService,arrThresholds, arrColor,dif);
    resetRequest();
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
function step (iteration, count){
    if (isRealtime){
        return requestRT(iteration,count);
    }
    else{
        // var result = simulateResults(hosts[count].name);
        var tmp = iteration;
        for (i = 0; i < iterationstep; i++) {
            var result = simulateResults2(hosts[count].name, iteration, selectedService);
            // Process the result
            var name = hosts[count].name;
            hostResults[name].arr.push(result);
            // console.log(hosts[count].name+" "+hostResults[name]);
            serviceList_selected.forEach ((s)=>{
                var result = simulateResults2(hosts[count].name, iteration, serviceLists[s.index].text);
                hostResults[name][serviceListattr[s.index]].push(result);
            });

            plotResult(undefined, name,iteration);
            iteration++;
        }
        iteration = tmp;
        return [iteration, count];
    }
    //return [iteration, count];
}
function step_full (iteration, count){
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
                hostResults[name].arr.push(result);
                // console.log(hosts[count].name+" "+hostResults[name]);
                serviceList_selected.forEach((s) => {
                    var result = simulateResults2(hosts[count].name, iteration, serviceLists[s.index].text);
                    hostResults[name][serviceListattr[s.index]].push(result);
                });

                // plotResult(result, name, iteration);
                iteration++;
            }
            iteration = tmp;
        }
    }
    plotResult(undefined, hosts[hosts.length-1].name, iteration);
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

// pause when not use , prevent frozen hiperView

function updateSummaryChartAll() {
    switch (graphicControl.sumType) {
        case "Scatterplot":
            d3.select("#scatterzone").style("visibility", "visible");
            svg.selectAll(".graphsum").remove();
            for (var i = currentlastIndex > (maxstack - 2) ? (currentlastIndex - maxstack + 2) : 0; i < (currentlastIndex + 1); i++) {
                drawsummary(i);
            }
            break;
        case "Boxplot":
        case "Radar":
        case "RadarSummary":
            svg.selectAll(".graphsum").remove();
            d3.select("#scatterzone").style("visibility", "hidden");
            for (var i = currentlastIndex > (maxstack - 2) ? (currentlastIndex - maxstack + 2) : 0; i < (currentlastIndex + 1); i++) {
                drawsummary(i);
            }
            break;
    }
}

$( document ).ready(function() {
    console.log('ready');
    $('.fixed-action-btn').floatingActionButton({
        direction: 'left',
        hoverEnabled: false
    });
    $('.collapsible').collapsible();
    $('.modal').modal();
    $('.dropdown-trigger').dropdown();
    $('.tabs').tabs();
    $('.sidenav').sidenav();
    discovery('#sideNavbtn');
    //$('.tap-target').tapTarget({onOpen: discovery});

    d3.select("#DarkTheme").on("click",switchTheme);
    changeRadarColor(colorArr.Radar[3]);
    // color scale create
    creatContain(d3.select('#RadarColor').select('.collapsible-body>.pickercontain'), colorScaleList, colorArr.Radar, onClickRadarColor);

    d3.select('#clusterDisplay').on('change',function(){
        TsnePlotopt.runopt.clusterDisplay = this.value;
        TSneplot.runopt(TsnePlotopt.runopt);
    });
    d3.select('#clusterProject').on('change',function(){
        TsnePlotopt.runopt.clusterProject = this.value;
        TSneplot.runopt(TsnePlotopt.runopt);
    });
    d3.select('#clusterMethod').on('change',function(){
        Radarplot_opt.clusterMethod = this.value;
        Radarplot.binopt(Radarplot_opt);
        updateSummaryChartAll();
    });
    d3.select('#chartType_control').on("change", function () {
        var sect = document.getElementById("chartType_control");
        graphicControl.charType = sect.options[sect.selectedIndex].value;
    });
    d3.select('#summaryType_control').on("change", function () {
        var sect = document.getElementById("summaryType_control");
        graphicControl.sumType = sect.options[sect.selectedIndex].value;
        svg.select(".graphsum").remove();
        pannelselection(false);
        updateSummaryChartAll();
    });
    d3.select('#jobType_control').on("change", function () {
        var sect = document.getElementById("jobType_control");
        jobMap_runopt.compute.type = sect.options[sect.selectedIndex].value;
        jobMap.runopt(jobMap_runopt);
    });
    d3.select('#datacom').on("change", function () {
        d3.select('.cover').classed('hidden', false);
        exit_warp();
        spinner.spin(target);
        const choice = this.value;
        const choicetext = d3.select(d3.select('#datacom').node().selectedOptions[0]).attr('data-date');
        if (choice!=='csv') {
            if (db === 'csv') { //reload hostlist
                d3.json(srcpath+'data/hotslist_Quanah.json', function (error, data) {
                    if (error) {
                    } else {
                        firstTime = true;
                        hostList = data;
                        systemFormat();
                        inithostResults();
                        MetricController.axisSchema(serviceFullList, true).update();
                        addDatasetsOptions()
                    }
                });
            }
            oldchoose =$('#datacom').val();
            setTimeout(() => {
                if (choice !== "nagios" && choice !== "influxdb") {
                    d3.json(srcpath+"data/" + choice + ".json", function (error, data) {
                        if (error) {
                            d3.json("data/" + choice + ".json", function (error, data) {
                                if (error) {
                                    M.toast({html: 'Local data does not exist, try to query from the internet!'})
                                    d3.json("https://media.githubusercontent.com/media/iDataVisualizationLab/HPCC/master/HiperView/data/" + choice + ".json", function (error, data) {
                                        if (error) {

                                        }
                                        d3.json (srcpath+"data/" + choice + "_job.json", function (error, job) {
                                            if (error){
                                                loadata1(data,undefined);
                                                return;
                                            }
                                            loadata1(data,job);
                                            return;
                                        });
                                    });
                                    return;
                                }
                                return
                            });
                            return;
                        }
                        d3.json (srcpath+"data/" + choice + "_job.json", function (error, job) {
                            if (error){
                                loadata1(data,undefined);
                                return;
                            }
                            loadata1(data,job);
                            return;
                        });
                    });
                }
                else {
                    d3.select(".currentDate")
                        .text("" + (new Date()).toDateString());
                    realTimesetting(true, choice);
                    db = choice;
                    requestService = eval('requestService' + choice);
                    processResult = eval('processResult_' + choice);
                    d3.select('.cover').classed('hidden', true);
                    spinner.stop();
                }

            }, 0);
        }else{

            $('#datacom').val(oldchoose);
            $('#data_input_file').trigger('click');
        }
        function loadata1(data,job){
            data['timespan'] = data['timespan'].map(d=>new Date(d));
            sampleS = data;
            if(job)
                hosts.forEach(h=>sampleS[h.name].arrJob_scheduling = job[h.name])
            if (choice.includes('influxdb')){
                processResult = processResult_influxdb;
                db = "influxdb";
                realTimesetting(false,"influxdb",true);
            }else {
                db = "nagios";
                processResult = processResult_old;
                realTimesetting(false,undefined,true);
            }
            d3.select(".currentDate")
                .text("" + (data['timespan'][0]).toDateString());
            resetRequest();
            d3.select('.cover').classed('hidden', true);
            spinner.stop();
        }
    });
    let oldchoose =$('#datacom').val();
    $('#data_input_file').on('click',()=>{d3.select('.cover').classed('hidden', true);
        spinner.stop();})
    $('#data_input_file').on('input', (evt) => {
        $('#datacom').val('csv')
        var f = evt.target.files[0];
        var reader = new FileReader();
        reader.onload = (function(theFile) {
            return function(e) {
                // Render thumbnail.
                d3.select('.cover').classed('hidden', false);
                exit_warp();
                spinner.spin(target);
                setTimeout(() => {
                    d3.csv(e.target.result,function (error, data) {
                        if (error){
                        }else{
                            loadata1(data);
                            function loadata1(data){
                                db = "csv";

                                newdatatoFormat(data);

                                inithostResults();
                                processResult = processResult_csv;

                                addDatasetsOptions()
                                MetricController.axisSchema(serviceFullList,true).update();
                                realTimesetting(false,"csv",true,data);
                                d3.select(".currentDate")
                                    .text("" + new Date(data[0].timestamp).toDateString());
                                resetRequest();
                                d3.select('.cover').classed('hidden', true);
                                spinner.stop();
                            }
                        }
                    })
                },0);
                // span.innerHTML = ['<img class="thumb" src="', e.target.result,
                //     '" title="', escape(theFile.name), '"/>'].join('');
                // document.getElementById('list').insertBefore(span, null);
            };
        })(f);

        // Read in the image file as a data URL.
        reader.readAsDataURL(f);
    })
    spinner = new Spinner(opts).spin(target);
    setTimeout(() => {
        //load data
        d3.json(srcpath+'data/hotslist_Quanah.json',function(error,data){
            if(error) {
            }else{
                hostList = data;
                inithostResults();

                // graphicControl.charType =  d3.select('#chartType_control').node().value;
                // graphicControl.sumType =  d3.select('#summaryType_control').node().value;
                let choiceinit = d3.select('#datacom').node().value;
                if (choiceinit !== "nagios" && choiceinit !== "influxdb") {
                    // d3.select(".currentDate")
                    //     .text("" + d3.timeParse("%d %b %Y")(d3.select('#datacom').node().selectedOptions[0].text).toDateString());
                    if (choiceinit.includes('influxdb')) {
                        // processResult = processResult_influxdb;
                        db = "influxdb";
                        realTimesetting(false, "influxdb", true);
                    } else {
                        db = "nagios";
                        // processResult = processResult_old;
                        realTimesetting(false, undefined, true);
                    }
                    let choice = d3.select('#datacom').node().value;
                    d3.json(srcpath+"data/" + choice + ".json", function (error, data) {
                        if (error) {
                            M.toast({html: 'Local data does not exist, try to query from the internet!'});
                            d3.json("https://media.githubusercontent.com/media/iDataVisualizationLab/HPCC/master/HiperView/data/" + choiceinit + ".json", function (error, data) {
                                if (error) throw error;
                                d3.select(".currentDate")
                                    .text("" + d3.timeParse("%d %b %Y")(d3.select('#datacom').select('[selected="selected"]').text()).toDateString());
                                loadata(data)
                            });
                            return;
                        }
                        d3.select(".currentDate")
                            .text("" + (new Date(data['timespan'][0]).toDateString()));
                        d3.json (srcpath+"data/" + choice + "_job.json", function (error, job) {
                            if (error){
                                loadata(data,undefined);
                                return;
                            }
                            loadata(data,job);
                            return;
                        });
                    });
                }else{ // realtime
                    d3.select(".currentDate")
                        .text("" + (new Date()).toDateString());
                    realTimesetting(true,choiceinit, true);
                    db = choiceinit;
                    requestService = eval('requestService'+choiceinit);
                    processResult = eval('processResult_'+choiceinit);
                    loadata([])
                }
            }
        });
        MetricController.graphicopt({width:365,height:365})
            .div(d3.select('#RadarController'))
            .tablediv(d3.select('#RadarController_Table'))
            .axisSchema(serviceFullList)
            .onChangeValue(onSchemaUpdate)
            .onChangeFilterFunc(onfilterdata)
            .init();
        function loadata(data,job){
            d3.select(".cover").select('h5').text('drawLegend...');
            drawLegend(initialService, arrThresholds, arrColor, dif);
            data['timespan'] = data['timespan'].map(d=>new Date(d));
            sampleS = data;
            if(job)
                hosts.forEach(h=>sampleS[h.name].arrJob_scheduling = job[h.name])
            main();
            d3.select(".cover").select('h5').text('loading data...');
            addDatasetsOptions(); // Add these dataset to the select dropdown, at the end of this files
            d3.select('.cover').classed('hidden',true);
            spinner.stop();
        }
    },0);
    // Spinner Stop ********************************************************************

});
let profile = {};

function onfilterdata(schema) {
}
function onSchemaUpdate(schema){
    serviceFullList.forEach(ser=>{
        ser.angle = schema.axis[ser.text].angle();
        ser.enable = schema.axis[ser.text].data.enable;
    });
    radarChartOptions.schema = serviceFullList;
    // if (graphicControl.charType === "T-sne Chart")
    TSneplot.schema(serviceFullList,firstTime);
    // if (graphicControl.sumType === "Radar" || graphicControl.sumType === "RadarSummary") {
    Radarplot.schema(serviceFullList,firstTime);
    jobMap.schema(serviceFullList);
    if (!firstTime) {
        updateSummaryChartAll();
        MetricController.drawSummary();
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
