/* June-2018
 * Tommy Dang (on the HPCC project, as Assistant professor, iDVL@TTU)
 *
 * THIS SOFTWARE IS BEING PROVIDED "AS IS", WITHOUT ANY EXPRESS OR IMPLIED
 * WARRANTY.  IN PARTICULAR, THE AUTHORS MAKE NO REPRESENTATION OR WARRANTY OF ANY KIND CONCERNING THE MERCHANTABILITY
 * OF THIS SOFTWARE OR ITS FITNESS FOR ANY PARTICULAR PURPOSE.
 */


// Set the dimensions of the canvas / graph
var margin = {top: 5, right: 0, bottom: 50, left: 0};

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
var sHeight=280;  // Summary panel height
var top_margin = sHeight+46;  // Start rack spiatial layout


var users = [];
var racks = [];
var racksnewor = [];

var xTimeScale;
var baseTemperature =60;

var interval2;
var simDuration =0;
var simDurationinit = 0;
var numberOfMinutes = 26*60;

var iterationstep = 1;
var maxstack =7;
var normalTs =0.6; //time sampling
// var timesteppixel = 0.1; // for 4
var timesteppixel = 0.1; // for 26

var isRealtime = false;
var db = 'nagios';
if (isRealtime){
    simDuration = 1000;
    simDurationinit = 1000;
    numberOfMinutes = 26*60;
}

var currentMiliseconds;
var query_time;
var lastIndex;
var currentHostname,currentMeasure;
var currentHostX = 0;
// var currentHosty = 0;

var charType = "Heatmap";
var sumType = "Radar";
let globalTrend = false;
//***********************

var initialService = "Temperature";
var selectedService;


var arrThresholds;
var dif, mid,left;
var color,opa;
//var arrColor = ['#00c', '#1a9850','#fee08b', '#d73027'];
var arrColor = ['#110066','#4400ff', '#00cccc', '#00dd00','#ffcc44', '#ff0000', '#660000'];
setColorsAndThresholds(initialService);

//********tooltip***************
var niceOffset = true;
//***********************
var undefinedValue = undefined;
var undefinedColor = "#666";
var undefinedResult = "timed out";
//*** scale
var xTimeSummaryScale;
var xLinearSummaryScale;


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
            }
        }
    }
};
var Scatterplot = d3.Scatterplot();
var Radarplot = d3.radar();
var TSneplot = d3.Tsneplot().graphicopt(TsnePlotopt);
let getDataWorker = new Worker ('myscripts/getDataWorker.js');
let isbusy = false;

function setColorsAndThresholds(s) {
    for (var i=0; i<serviceList.length;i++){
        if (s == serviceList[i] && i==1){  // CPU_load
            dif = (thresholds[i][1]-thresholds[i][0])/4;
            mid = thresholds[i][0]+(thresholds[i][1]-thresholds[i][0])/2;
            left=0;
            arrThresholds = [left,thresholds[i][0], 0, thresholds[i][0]+2*dif, 10, thresholds[i][1], thresholds[i][1]];
            color = d3.scaleLinear()
                .domain(arrThresholds)
                .range(arrColor)
                .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb
            opa = d3.scaleLinear()
                .domain([left,thresholds[i][0],thresholds[i][0]+dif, thresholds[i][0]+2*dif, thresholds[i][0]+3*dif, thresholds[i][1], thresholds[i][1]+dif])
                .range([1,1,0.3,0.06,0.3,1,1]);

        }
        else if (s == serviceList[i] && i==2){  // Memory_usage
            dif = (thresholds[i][1]-thresholds[i][0])/4;
            mid = thresholds[i][0]+(thresholds[i][1]-thresholds[i][0])/2;
            left=0;
            arrThresholds = [left,thresholds[i][0], 0, thresholds[i][0]+2*dif, 98, thresholds[i][1], thresholds[i][1]];
            color = d3.scaleLinear()
                .domain(arrThresholds)
                .range(arrColor)
                .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb
            opa = d3.scaleLinear()
                .domain([left,thresholds[i][0],thresholds[i][0]+dif, thresholds[i][0]+2*dif, thresholds[i][0]+3*dif, thresholds[i][1], thresholds[i][1]+dif])
                .range([1,1,0.3,0.06,0.3,1,1]);

        }
        else if (s == serviceList[i]){
            dif = (thresholds[i][1]-thresholds[i][0])/4;
            mid = thresholds[i][0]+(thresholds[i][1]-thresholds[i][0])/2;
            left = thresholds[i][0]-dif;
            if (left<0 && i!=0) // Temperature can be less than 0
                left=0;
            arrThresholds = [left,thresholds[i][0], thresholds[i][0]+dif, thresholds[i][0]+2*dif, thresholds[i][0]+3*dif, thresholds[i][1], thresholds[i][1]+dif];
            color = d3.scaleLinear()
                .domain(arrThresholds)
                .range(arrColor)
                .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb
            opa = d3.scaleLinear()
                .domain([left,thresholds[i][0],thresholds[i][0]+dif, thresholds[i][0]+2*dif, thresholds[i][0]+3*dif, thresholds[i][1], thresholds[i][1]+dif])
                .range([1,1,0.3,0.06,0.3,1,1]);
        }
    }
}
//***********************


function initDetailView() {
    if (svg.select('.detailView').empty()) {
        svgStore.detailView ={};
        svgStore.detailView.g = svg.append('g').attr('class', 'detailView');
        svgStore.detailView.label = svgStore.detailView.g.append('g').attr('class', 'detailViewLabel');
        svgStore.detailView.items = svgStore.detailView.g.append('g').attr('class', 'detailViewItems');
    }
    if (svg.select('.rackRect').empty()) {
        svgStore.detailView.label = svgStore.detailView.g.append('g').attr('class', 'detailViewLabel');
        svgStore.detailView.items = svgStore.detailView.g.append('g').attr('class', 'detailViewItems');
        // Draw racks **********************
        for (var i = 0; i < racks.length; i++) {
            racks[i].x = 35 + racks[i].id * (w_rack + w_gap) - w_rack + 10;
            racks[i].y = top_margin;
        }
        // add main rack and sub rack

        //subrack below
        racksnewor = [];
        racks.forEach(d => {
            var newl = {};
            newl.id = d.id;
            newl.pos = 0;
            newl.x = d.x;
            newl.y = d.y;
            newl.hosts = d.hosts.filter(e => e.hpcc_node % 2);
            racksnewor.push(newl);
            var newr = {};
            newr.id = d.id;
            newr.pos = 1;
            newr.x = d.x + w_rack / 2 - 4;
            newr.y = d.y;
            newr.hosts = d.hosts.filter(e => !(e.hpcc_node % 2));
            racksnewor.push(newr);

        });

        svgStore.detailView.label.selectAll(".rackRect")
            .data(racksnewor)
            .enter().append("rect")
            .attr("class", "rackRect")
            .attr("x", function (d, i) {
                return d.x - 6;
            })
            .attr("y", function (d) {
                return d.y;
            })
            .attr("rx", 10)
            .attr("ry", 10)
            .attr("width", (d, i) => (w_rack / 2 - 4))
            .attr("height", h_rack)
            .attr("fill", "#fff")
            .attr("stroke", "#000")
            .attr("stroke-width", 1)
            .style("box-shadow", "10px 10px 10px #666");
        svgStore.detailView.label.selectAll(".rackRectText1")
            .data(racks)
            .enter().append("text")
            .attr("class", "rackRectText1")
            .attr("x", function (d) {
                return d.x + w_rack / 2 - 20;
            })
            .attr("y", function (d) {
                return d.y - 6;
            })
            .attr("fill", "currentColor")
            .style("text-anchor", "middle")
            .style("font-size", 16)
            .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
            .attr("font-family", "sans-serif")
            .text(function (d) {
                return "Rack " + d.id;
                //return "Rack " + d.id + ":   " + d.hosts.length + " hosts";
            });

        // Draw host names **********************

        for (var i = 1; i <= maxHostinRack; i++) {
            var yy = getHostY(1, i);
            svgStore.detailView.label.append("text")
                .attr("class", "hostText")
                .attr("x", 32)
                .attr("y", yy + 1)
                .attr("fill", "currentColor")
                .style("text-anchor", "end")
                .style("font-size", "12px")
                .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
                .attr("font-family", "sans-serif")
                .text("Host");
        }
        for (var i = 0; i < hosts.length; i++) {
            var name = hosts[i].name;
            var hpcc_rack = +name.split("-")[1];
            var hpcc_node = +name.split("-")[2].split(".")[0];
            var xStart = racksnewor[(hpcc_rack - 1) * 2 + (hpcc_node % 2 ? 0 : 1)].x - 2;
            var yy = getHostY(hpcc_rack, hpcc_node, hpcc_node % 2);
            // set opacity for current measurement text
            hosts[i].mOpacity = 0.1;


            svgStore.detailView.label.append("text")
                .attr("class", "hostId")
                .attr("x", xStart)
                .attr("y", yy + 1)
                .attr("fill", "#000")
                .style("text-anchor", "start")
                .style("font-size", "12px")
                .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
                .attr("font-family", "sans-serif")
                .text("" + hpcc_node);

            svgStore.detailView.label.append("text")
                .attr("class", "measure_" + hosts[i].name)
                .attr("x", xStart + w_rack / 2 - 20)
                .attr("y", yy - 4)
                .attr("fill", "#000")
                .attr("fill-opacity", hosts[i].mOpacity)
                .style("text-anchor", "end")
                .style("font-size", "11px")
                .style("text-shadow", "1px 1px 0 rgba(0, 0, 0")
                .attr("font-family", "sans-serif")
                .text("");
        }
    }
    TSneplot.remove();
}

function main() {

    for (var att in hostList.data.hostlist) {
        var h = {};
        h.name = att;
        h.hpcc_rack = +att.split("-")[1];
        h.hpcc_node = +att.split("-")[2].split(".")[0];
        h.index = hosts.length;

        // to contain the historical query results
        hostResults[h.name] = {};
        hostResults[h.name].index = h.index;
        hostResults[h.name].arr = [];
        hostResults[h.name].arrTemperature = [];
        hostResults[h.name].arrCPU_load = [];
        hostResults[h.name].arrMemory_usage = [];
        hostResults[h.name].arrFans_health= [];
        hostResults[h.name].arrPower_usage= [];
        hosts.push(h);
        // console.log(att+" "+h.hpcc_rack+" "+h.hpcc_node);

        // Compute RACK list
        var rackIndex = isContainRack(racks, h.hpcc_rack);
        if (rackIndex >= 0) {  // found the user in the users list
            racks[rackIndex].hosts.push(h);
        }
        else {
            var obj = {};
            obj.id = h.hpcc_rack;
            obj.hosts = [];
            obj.hosts.push(h);
            racks.push(obj);
        }
        // Sort RACK list
        racks = racks.sort(function (a, b) {
            if (a.id > b.id) {
                return 1;
            }
            else return -1;
        })
    }
    for (var i = 0; i < racks.length; i++) {
        racks[i].hosts.sort(function (a, b) {
            if (a.hpcc_node > b.hpcc_node) {
                return 1;
            }
            else return -1;
        })

    }


    hosts.sort((a,b)=>{

        var rackx = a.hpcc_rack;
        var racky = b.hpcc_rack;
        var x = a.hpcc_node;
        var y = b.hpcc_node;
        if (rackx !== racky){
            return rackx-racky;
        }else {
            if (x % 2 - y % 2) {
                return y % 2 - x % 2
            } else {
                return x - y
            }
        }
    });
    radarChartsumopt.scaleDensity= d3.scaleLinear().domain([1,hosts.length]).range([0.3, 0.75]);


    // Summary Panel ********************************************************************
    svgsum = svg.append("g")
        .attr("class", "summaryGroup")
        .attr("transform","translate(" + 1 + "," + 15 + ")");
    svgsum.append("rect")
        .attr("class", "summaryRect")
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("width", width-2)
        .attr("height", sHeight)
        .attr("fill", "#fff")
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .style("box-shadow", "10px 10px 10px #666");
    svgsum.append('svg')
        .attr("class","summarySvg")
        .attr("width", width-2)
        .attr("height", sHeight);
    d3.select(".summaryText1")
        .html("Quanah HPC system: <b>" + hosts.length+"</b> hosts distributed in 10 racks" );


    var currentTextGroup = svg.append('g')
        .attr("class", "currentTextGroup")
        .attr('transform', 'translate(' + 10 + ',' + (sHeight-36) + ')');
    svgsum.append("line")
        .attr("class", "currentTimeline")
        .attr("x1", 10)
        .attr("y1", 0)
        .attr("x2", 10)
        .attr("y2", sHeight)
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .style("stroke-dasharray", ("2, 2"));
    currentTextGroup.append("text")
        .attr("class", "currentText")
        .attr("y", 0)
        .attr("fill", "#000")
        .style("text-anchor", "start")
        .style("font-size", "12px")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text("Latest REQUEST");
    currentTextGroup.append("text")
        .attr("class", "currentHostText")
        .attr("y", 18)
        .attr("fill", "#000")
        .style("text-anchor", "start")
        .style("font-weight","bold")
        .style("font-size", "12px")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text("Host");
    currentTextGroup.append("text")
        .attr("class", "currentTimeText")
        .attr("y", 36)
        .attr("fill", "#000")
        .style("text-anchor", "start")
        .style("font-style","italic")
        .style("font-size", "12px")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text("Time");




    initDetailView();
    svgStore.tsnesvg =svg.append('g').attr("class", "largePanel").attr('transform',`translate(0,${top_margin})`)
        .append("svg").attr("class", "T_sneSvg");

    // Draw line to connect current host and timeline in the Summary panel
    let linepointer = svg.append("line")
        .attr("class", "connectTimeline")
        .attr("x1", 10)
        .attr("y1", sHeight+15)
        .attr("x2", 10)
        .attr("y2", 310)
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .style("stroke-dasharray", ("2, 2"));
    // ********* REQUEST ******************************************
    xLinearSummaryScale = d3.scaleAdjust().range([0-radarsize/24,width+radarsize/24]).domain([0, maxstack-1]).itemsize(radarsize);
    //xLinearSummaryScale = d3.scaleAdjust().range([0,width]).domain([0, maxstack-1]).itemsize(radarsize);
    xTimeSummaryScale =xLinearSummaryScale;
    Radarplot.svg(svgsum.select(".summarySvg")).BinRange([4,10]).scale(xLinearSummaryScale)
        .maxstack(maxstack);
    getDataWorker.postMessage({action:"init",value:{
            hosts:hosts,
            db:db,
        }});
    getDataWorker.addEventListener('message',({data})=>{
        if (data.status==='done') {
            isbusy = false;
        }
        if (data.action==='returnData'){
            TSneplot.data(data.result.arr).draw(data.result.nameh);
        }
    }, false);
    TSneplot.svg(svgStore.tsnesvg).linepointer(linepointer).init();
    request();
}
var currentlastIndex;
var speedup= false;
function request(){
    bin.data([]);
    var count = 0;
    var countbuffer = 0;
    var iteration = 0;
    var haveMiddle = false;
    currentMiliseconds = new Date().getTime();  // For simulation
    query_time=currentMiliseconds;
    lastIndex = 0;
    var countarr = [];
    var requeststatus =true;
    var countrecord = 0;
    interval2 = new IntervalTimer(function (simDuration) {
        var midlehandle = function (ri){
            let returniteration = ri[0];
            let returnCount = ri[1];
            countarr.push(returnCount);
            count += 1;
        };
        var drawprocess = function ()  {

            drawsummarypoint(countarr);
            countarr.length = 0;
            // fullset draw
            if (count >= (hosts.length)) {// Draw the summary Box plot ***********************************************************
                // Draw date
                d3.select(".currentDate")
                    .text("" + new Date(currentMiliseconds).toDateString());

                // cal to plot
                bin.data([]);
                drawsummary();
                if (charType==="T-sne Chart")
                    TSneplot.getTop10();
                shiftTimeText();
                count = 0;
                countbuffer = 0;
                requeststatus = true;
                haveMiddle = false;
                iteration += iterationstep;
            }
            Scatterplot.init(xTimeSummaryScale(0) + swidth / 2);
            xTimeSummaryScaleStep = d3.scaleLinear()
                .domain([0, hosts.length - 1]) // input
                .range([0, xTimeSummaryScale.step()]);


            var rescaleTime = d3.scaleLinear().range([0, radarsize]).domain(xTimeSummaryScaleStep.domain());
            // Update the current timeline in Summary panel
            var x2 = xTimeSummaryScale(lastIndex < maxstack ? lastIndex : (maxstack - 1))
                + ((lastIndex < (maxstack - 1)) ? xTimeSummaryScaleStep(count===0? hosts.length:count) : rescaleTime(xTimeSummaryScaleStep(count)));

            // mark time
            // console.log(count);
            // console.log((count > hosts.length/2 && !haveMiddle));
            if (( (count > hosts.length/2) && !haveMiddle))
            {
                updateTimeText(count);
                haveMiddle = true;
            }
            svg.selectAll(".currentTimeline")
                .attr("x1", x2)
                .attr("x2", x2);

            svg.selectAll(".connectTimeline")
                .attr("x1", x2)
            if (charType!=="T-sne Chart")
                svg.selectAll(".connectTimeline")
                    .attr("x2", currentHostX)
                    .attr("y2", currentHostY);

            svg.selectAll(".currentTextGroup")
                .attr('transform', 'translate(' + (x2 + 2) + ',' + (sHeight - 36) + ')');
            svg.selectAll(".currentText")
                .text("Latest update:");
            svg.selectAll(".currentTimeText")
                .text(new Date(query_time).timeNow2());
            svg.selectAll(".currentHostText")
                .text(currentHostname);

            // Update measurement text and opacity
            for (var i = 0; i < hosts.length; i++) {
                if (hosts[i].name == currentHostname) {
                    hosts[i].mOpacity = 1;
                    hosts[i].xOpacity = currentHostX + 38;

                    if (hosts[i].xOpacity > (racksnewor[(hosts[i].hpcc_rack - 1) * 2 + (hosts[i].hpcc_node % 2 ? 0 : 1)].x - 2) + width / 2)
                        hosts[i].mOpacity = 0;

                    var mea = currentMeasure;
                    if (selectedService == "Job_load" || selectedService == "Memory_usage") {
                        mea = currentMeasure.toFixed(2);
                    }
                    else if (selectedService == "Power_consumption") {
                        mea = Math.round(currentMeasure);
                    }
                    svg.selectAll(".measure_" + hosts[i].name)
                        .attr("fill", color(currentMeasure))
                        .text(mea);
                }
                else {
                    if (hosts[i].mOpacity > 0)
                        hosts[i].mOpacity -= 0.01;
                    if (hosts[i].xOpacity == undefined)
                        hosts[i].xOpacity = currentHostX + 38;
                }


                svg.selectAll(".measure_" + hosts[i].name)
                    .attr("fill-opacity", hosts[i].mOpacity)
                    .attr("x", hosts[i].xOpacity - 10);

            }
        };
        if (requeststatus) {
            var oldrack = hosts[countbuffer].hpcc_rack;
            if (isRealtime) {
                step(iteration, countbuffer).then((ri) => {
                    midlehandle(ri);
                    if (!recordonly)
                        drawprocess();
                    else {
                        countrecord = countrecord +1;
                        if (countbuffer>= (hosts.length)){
                            console.log("done");
                            interval2.stop();
                        }
                    }
                });
                countbuffer++;
            }
            else
            {
                do {
                    let ri = step(iteration, countbuffer);
                    midlehandle(ri);
                    countbuffer++;
                }while ((countbuffer < hosts.length) && (hosts[countbuffer].hpcc_rack === oldrack) && speedup);
                speedup = false;
                drawprocess();
            }
            if (countbuffer>= (hosts.length))
                requeststatus = false; //stop request

        }
    } , simDuration);

    var count3=0;

    var interval3 = setInterval(function(){
        svg.selectAll(".currentText")
            .attr("fill", decimalColorToHTMLcolor(count3*7));
        count3++;
        if (count3>10000)
            count3 = 10000;
    } , 20);
}

function scaleThreshold(i){
    return i<maxstack?i:(maxstack-2);
}

function drawsummary(initIndex){
    var arr = [];
    var xx;

    if (initIndex===undefined){
        currentlastIndex = hostResults[hosts[0].name].arr.length -1;
        lastIndex = currentlastIndex;
        query_time = hostResults[hosts[hosts.length-1].name].arr[lastIndex].result.query_time;
        xx = xTimeSummaryScale(scaleThreshold(lastIndex));
        // updateTimeText(); //time in end
    }else{
        lastIndex = initIndex;
        query_time = hostResults[hosts[hosts.length-1].name].arr[lastIndex].result.query_time;
        var temp = (maxstack-2)-(currentlastIndex-initIndex);
        if (currentlastIndex > maxstack-2)
            xx = xTimeSummaryScale(temp);
        else {
            temp = lastIndex;
            xx = xTimeSummaryScale(lastIndex);
        }

    }
    switch (sumType) {
        case "Boxplot":
            for(var h = 0;h < hosts.length;h++)
            {
                var name = hosts[h].name;
                var r = hostResults[name];
                // lastIndex = initIndex||(r.arr.length - 1);
                // boxplot
                if (lastIndex >= 0) {   // has some data
                    var a = processData(r.arr[lastIndex].data.service.plugin_output, selectedService);
                    arr.push(a[0]);
                }
            }
            drawBoxplot(svg, arr, temp===undefined?(lastIndex>(maxstack-1)?(maxstack-1):lastIndex):temp, xx + xTimeSummaryScale.step()-ww);
            break;
        case "Scatterplot":


            Scatterplot.svg(svg).data(hostResults).draw(lastIndex,temp===undefined?(lastIndex>(maxstack-1)?(maxstack-1):lastIndex):temp,xx+80);

            break;
        case "Radar":
            for(var h = 0;h < hosts.length;h++)
            {
                var name = hosts[h].name;
                var r = hostResults[name];
                // lastIndex = initIndex||(r.arr.length - 1);
                // boxplot
                if (lastIndex >= 0) {   // has some data
                    var arrServices = [];
                    serviceList.forEach((ser,indx) => {
                        var obj = {};
                        let dataextract = r[serviceListattr[indx]][lastIndex];
                        if (dataextract)
                            dataextract = dataextract.data.service.plugin_output;
                        var a = processData(dataextract, ser);
                        obj.a = a;
                        arrServices.push(obj);})
                }
                arrServices.name = name;
                arr.push(arrServices);
            }
            Radarplot.data(arr).draw(temp===undefined?lastIndex:temp);
            // Radar Time
            //drawRadarsum(svg, arr, lastIndex, xx-radarsize);
            break;

    }
    lastIndex = currentlastIndex;
}
function drawsummarypoint(harr){
    var arr = [];
    var xx;
    lastIndex = hostResults[hosts[harr[0]].name].arrTemperature.length -1;
    query_time = hostResults[hosts[harr[0]].name].arrTemperature[lastIndex].result.query_time;
    
    //xx = xTimeSummaryScale(query_time);
    //updateTimeText();

    switch (sumType) {
        case "Boxplot":
            break;
        case "Scatterplot":
            break;
        case "Radar":
            for (var i in harr) {
                var h  = harr[i];
                var name = hosts[h].name;
                var r = hostResults[name];
                // lastIndex = initIndex||(r.arr.length - 1);
                // boxplot
                if (lastIndex >= 0) {   // has some data
                    var arrServices = [];
                    serviceList.forEach((ser, indx) => {
                        var obj = {};
                        let dataextract = r[serviceListattr[indx]][lastIndex];
                        if (dataextract)
                            dataextract = dataextract.data.service.plugin_output;
                        var a = processData(dataextract, ser);
                        obj.a = a;
                        arrServices.push(obj);
                    })
                }
                arrServices.name = name;
                arr.push(arrServices);
            }
            Radarplot.data(arr).drawpoint(lastIndex);
            // Radar Time
            //drawRadarsum(svg, arr, lastIndex, xx-radarsize);
            break;
        case "RadarSummary":
            for (var i in harr) {
                var h  = harr[i];
                var name = hosts[h].name;
                var r = hostResults[name];
                // lastIndex = initIndex||(r.arr.length - 1);
                // boxplot
                if (lastIndex >= 0) {   // has some data
                    var arrServices = [];
                    serviceList.forEach((ser, indx) => {
                        var obj = {};
                        let dataextract = r[serviceListattr[indx]][lastIndex];
                        if (dataextract)
                            dataextract = dataextract.data.service.plugin_output;
                        var a = processData(dataextract, ser);
                        obj.a = a;
                        arrServices.push(obj);
                    })
                }
                arrServices.name = name;
                arr.push(arrServices);
            }
            Radarplot.data(arr).drawSummarypoint(lastIndex);
            break;



    }
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
function updateTimeText(index){
    if (index!= undefined)timelog.push (hostResults[hosts[(index||hosts.length)-1].name].arr.map(d=>d.result.query_time)[lastIndex]);
    if (timelog.length>maxstack) timelog.shift();
    var boxtime = svg.selectAll(".boxTime")
        .data(timelog);
    boxtime.transition().duration(500)
        .attr("x", (d,i)=>xTimeSummaryScale(i)+ width/maxstack/2)
        .text(d=> {
            let temp = new Date(d);
            return temp.getHours()+":"+temp.getMinutes();
        });
    boxtime.exit().remove();
    boxtime.enter().append("text")
        .attr("class", "boxTime")
        .attr("x", (d,i)=>xTimeSummaryScale(i)+ width/maxstack/2)
        .attr("y", sHeight)
        .attr("fill", "#000")
        .style("font-style","italic")
        .style("text-anchor","end")
        .style("font-size", "12px")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text(new Date(query_time).timeNow());
}
// Delete unnecessary files
let processResult = processResult_old;
function processResult_old(r){
    var obj = {};
    obj.result = {};
    obj.result.query_time = r.result.query_time;
    obj.data = {};
    obj.data.service={};
    obj.data.service.host_name = r.data.service.host_name;
    obj.data.service.plugin_output = r.data.service.plugin_output
    return obj;
}
const processResult_nagios = processResult_old;
function processResult_influxdb(r,hostname,index){
    var obj = {};
    obj.result = {};
    if (r.results[0].series){
        obj.result.query_time = new Date(r.results[0].series[0].values[index||0][0]);
    }else
        obj.result.query_time = new Date();
    obj.data = {};
    obj.data.service={};
    obj.data.service.host_name = hostname;
    if (index != undefined ) {
        obj.data.service.plugin_output = {results: r.results.map(d => {
            let temp = {};
            temp.statement_id = d.statement_id;
            temp.series = [];
            let tempsub = {};
            const series = d.series[0];
            tempsub.name = series.name;
            tempsub.columns = series.columns;
            tempsub.values = [series.values[index]];
            temp.series.push(tempsub);
            return temp;
        })};
    } else
        obj.data.service.plugin_output = r;
    return obj;
}


function predict (arr,ser){
    try{
        return processData(arr[arr.length-1].data.service.plugin_output,ser);
    } catch(e){
        let average = 0;
        switch (ser){
            case serviceList[0]:
                average = (thresholds[0][1]-thresholds[0][0])/2
                return [average,average,average];
            case serviceList[1]:
                average = (thresholds[1][1]-thresholds[1][0])/2
                return [average,average,average];
            case serviceList[2]:
                average = (thresholds[2][1]-thresholds[2][0])/2
                return [average,average,average];
            case serviceList[3]:
                average = (thresholds[3][1]-thresholds[3][0])/2
                return [average,average,average,average];
            case serviceList[4]:
                average = (thresholds[4][1]-thresholds[4][0])/2
                return [average,average,average];
            default:
                return [0,0,0];
        }
    }
}


let processData = processData_old;

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
        if (db == "influxdb")
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
function plotResult(result,name) {
    // Check if we should reset the starting point
    console.log(result)
    if (firstTime) {
        currentMiliseconds = result.result.query_time;
        hostfirst = result.data.service.host_name;
        xTimeScale = d3.scaleLinear()
            .domain([0, maxstack-1])
        // get Time
        minTime = currentMiliseconds;  // some max number
    }
    firstTime = false;

    if (result.result.query_time)
        query_time = result.result.query_time||query_time;  // for drawing current timeline in Summary panel
    else
        result.result.query_time = query_time+1000;
    currentHostname = name;

    // Process the array data ***************************************
    var r = hostResults[name];
    var hpcc_rack = +name.split("-")[1];
    var hpcc_node = +name.split("-")[2].split(".")[0];
    var xStart = racksnewor[(hpcc_rack - 1)*2 + (hpcc_node%2?0:1)].x+15;
    // var xStart = racks[hpcc_rack - 1].x+15;
    xTimeScale.range([xStart, xStart+Math.min(w_rack/2-2*node_size,node_size*maxstack)]); // output
        // .range([xStart, xStart+w_rack/2-2*node_size]); // output
    var y = getHostY(hpcc_rack,hpcc_node,hpcc_node%2);


    // Process the array of historical temperatures ***************************************
    var arr = [];
    var startinde = 0;
    // while(maxstackminute)
    if ((r.arr.length>maxstack)||(r.arr.length === maxstack)){
        startinde = (r.arr.length-maxstack);

            //var deltaMiliseconds = r.arr[startinde].result.query_time - currentMiliseconds;
            //var deltapos =xTimeScale(r.arr[startinde].result.query_time)-xTimeScale(currentMiliseconds);
            //xTimeScale.range([xStart-deltapos, xStart+w_rack/2-2*node_size-deltapos]); // output
            // xTimeScale.domain([r.arr[startinde].result.query_time, currentMiliseconds + numberOfMinutes * maxHostinRack * 1000 - deltaMiliseconds]);

    }





    // var maxTime = 0;
    // for (var i=0; i<r.arr.length;i++){
    //     var qtime =r.arr[i].result.query_time;
    //     minTime = Math.min(minTime,qtime);
    //     maxTime = Math.max(maxTime,qtime);
    // }
    maxTime =query_time;
    if (maxTime-minTime>0.8*numberOfMinutes*60*1000)  // Limit time to STOP***********************
        pauseRequest();

    switch (charType) {
        case "Heatmap":
        case "Area Chart":
            for (var i=startinde; i<r.arr.length;i++){
                let a ;
                try {
                    a = processData(r.arr[i].data.service.plugin_output, selectedService);
                } catch (e){
                    a = processData(undefined, selectedService);
                    r.arr[i] ={}
                    r.arr[i].result = {};
                    r.arr[i].result.query_time = query_time;
                    r.arr[i].data = {};
                    r.arr[i].data.service={};
                    r.arr[i].data.service.host_name = currentHostname;
                    r.arr[i].data.service.plugin_output = undefined;
                }
                var obj = {};
                obj.temp1 = a[0];
                obj.temp2 = a[1];
                obj.temp3 = a[2];
                obj.query_time =r.arr[i].result.query_time;
                obj.x = xTimeScale(i-startinde);
                arr.push(obj);
                currentHostX = obj.x ;
                currentMeasure = obj.temp1;
            }

            currentHostY = y;

            initDetailView();
            if (charType === "Heatmap")
            plotHeat(arr, name, hpcc_rack, hpcc_node, xStart, y);
            else
            plotArea(arr, name, hpcc_rack, hpcc_node, xStart, y);
            break;
        case "T-sne Chart":
            initTsneView();
            if (!speedup) {
                plotTsne(name);
            }
    }


}
function initTsneView() {
    if (!svgStore.detailView.g.select('.rackRect').empty()) {
        svgStore.detailView.g.selectAll('*').remove();
        TSneplot.reset(true);
    }
}

function plotHeat(arr,name,hpcc_rack,hpcc_node,xStart,y,minTime,maxTime){
    svgStore.detailView.g.selectAll(".RackSummary").remove();
    svgStore.detailView.items.selectAll("."+name).remove();
    for (var i=0; i<arr.length;i++){
        var obj = arr[i];
        var xMin = xTimeScale(0);
        var xMax = xTimeScale(maxstack-1);
        var x = xTimeScale(i);
        // if (arr.length>1)
        //     x = xMin+ i*(xMax-xMin)/(arr.length);
        svgStore.detailView.items.append("rect")
            .attr("class", name)
            .attr("x", x)
            .attr("y", y-10)
            .attr("width", node_size)
            .attr("height", node_size )
            .attr("fill", function (d) {
                if (obj.temp1==undefinedValue)
                    return undefinedColor;
                else
                    return color(obj.temp1);
            })
            .attr("fill-opacity",function (d) {
                return opa(obj.temp1);
            })
            .attr("stroke", "#000")
            .attr("stroke-width", 0.05)
            .on("mouseover", function (d) {
                mouseoverNode (this);
            })
        ;//.on("mouseout", mouseoutNode);

        if (selectedService=="Temperature" || selectedService=="Fans_speed")    {
            svgStore.detailView.items.append("rect")
                .attr("class", name)
                .attr("x", x)
                .attr("y", y+node_size-9)
                .attr("width", node_size)
                .attr("height", node_size )
                .attr("fill", function (d) {
                    if (obj.temp2==undefinedValue)
                        return undefinedColor;
                    else
                        return color(obj.temp2);
                })
                .attr("fill-opacity",function (d) {
                    return opa(obj.temp2);
                })
                .attr("stroke", "#000")
                .attr("stroke-width", 0.05)
                .on("mouseover", function (d) {
                    mouseoverNode (this);
                })
            ;//.on("mouseout", mouseoutNode);
        }
    }
    // *****************************************
    /// drawSummaryAreaChart(hpcc_rack, xStart);
}

function plotArea(arr,name,hpcc_rack,hpcc_node,xStart,y){
    var yScale = d3.scaleLinear()
        .domain([baseTemperature, 120]) //  baseTemperature=60
        .range([0, 22]); // output

    var area = d3.area()
        .x(function(d) { return d.x; })
        .y0(function(d) { return y; })
        .y1(function(d) { return y-yScale(d.temp1); })
        .curve(d3.curveCatmullRom);

    svgStore.detailView.items.selectAll("."+name).remove();
    svgStore.detailView.items.append("path")
        .datum(arr) // 10. Binds data to the line
        .attr("class", name)
        .attr("stroke","#000")
        .attr("stroke-width",0.2)
        .attr("d", area)
        .attr("fill-opacity",function (d) {
            return opa(d[d.length-1].temp1);
        })
        .on("mouseover", function (d) {
            mouseoverNode (this);
        })
    ;//.on("mouseout", mouseoutNode);
    svgStore.detailView.items.selectAll("."+name).transition().duration(1000)
        .style("fill",function (d) {
            return color(d[d.length-1].temp1);
        })

    drawSummaryAreaChart(hpcc_rack, xStart);
}

function plotTsne(nameh){
    if(!isbusy) {
        isbusy = true;
        getDataWorker.postMessage({
            action: "getbatchData", value: {
                lastIndex: lastIndex,
                hostResults: hostResults,
                host: nameh
            }
        });
    }
}
function drawSummaryAreaChart(rack, xStart) {
    var arr2 = [];
    var binStep = 8; // pixels
    var maxX = 0;  // The latest x position, to draw the baseline 60 F
    for (var att in hostResults) {
        var hpcc_rack = +att.split("-")[1];
        var hpcc_node = +att.split("-")[2].split(".")[0];
        if (hpcc_rack == rack) {
            var r = hostResults[att];
            for (var i = 0; i < r.arr.length; i++) {
                var a = processData(r.arr[i].data.service.plugin_output, selectedService);
                var obj = {};
                obj.temp1 = a[0];
                obj.temp2 = a[1];
                obj.temp3 = a[2];
                obj.query_time = r.arr[i].result.query_time;
                obj.x = xTimeScale(i);
                if (obj.x >maxX)
                    maxX = obj.x ;  // The latest x position, to draw the baseline 60 F

                obj.bin = Math.round((obj.x-xStart)/binStep);   // How to compute BINS ******************************************
                if (arr2[obj.bin] == undefined)
                    arr2[obj.bin] = [];
                arr2[obj.bin].push(obj);
            }
        }
    }
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

function getHostY(r,n,pos){
    if (pos!== undefined)
        return  racksnewor[(r - 1)*2+pos].y + Math.ceil(n/2) * h_rack / (maxHostinRack+0.5);
    else
        return  racks[r - 1].y + n * h_rack / (maxHostinRack+0.5);
    // return  racks[r - 1].y + n * h_rack / (maxHostinRack+0.5);
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

function realTimesetting (option,db){
    isRealtime = option;
    getDataWorker.postMessage({action:'isRealtime',value:option,db: db});
    if (option){
        processData = eval('processData_'+db);
        simDuration = 1000;
        simDurationinit = 1000;
        numberOfMinutes = 26*60;
    }else{
        processData = db?eval('processData_'+db):processData_old;
        simDuration =0;
        simDurationinit = 0;
        numberOfMinutes = 26*60;
    }
    resetRequest();
}
function playchange(){
    var e = d3.select('.pause').node();
    interval2.pause();
    e.value = "true";
    $(e).addClass('active');
    $(e.querySelector('i')).removeClass('fa-pause pauseicon').addClass('fa-play pauseicon');
    svg.selectAll(".connectTimeline").style("stroke-opacity", 0.1);
}

function pausechange(){
    var e = d3.select('.pause').node();
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
    interval2.stop();
    hostResults = {};
    var count =0;
    for (var att in hostList.data.hostlist) {
        // to contain the historical query results
        hostResults[att] = {};
        hostResults[att].index = count;
        hostResults[att].arr = [];
        hostResults[att].arrTemperature = [];
        hostResults[att].arrCPU_load = [];
        hostResults[att].arrMemory_usage = [];
        hostResults[att].arrFans_health= [];
        hostResults[att].arrPower_usage= [];
        count++;

        svg.selectAll("."+att).remove();
    }
    svg.selectAll(".graphsum").remove();
    svg.selectAll(".connectTimeline").style("stroke-opacity", 1);
    Radarplot.init();
    TSneplot.reset(true);
    timelog = [];
    updateTimeText();
    request();
}
function loadData(){

}
function addDatasetsOptions() {
    let select= d3.select("#datasetsSelect")
        .selectAll('li')
        .data(serviceList)
        .enter()
        .append('li')
        .attr('class','collection-item avatar')
        .attr('value',d=>d);
    select.append('img')
        .attr('class',"circle")
        .attr('src',d=>"images/"+d+".png");
    select.append('h4').attr('class','title').text(d=>d);

    select.on("click",loadNewData);
    document.getElementById('datasetsSelect').value = initialService;  //************************************************
    selectedService = document.getElementById("datasetsSelect").value;
    const trig = d3.select("#datasetsSelectTrigger");
    trig.select('img').attr('src',"images/"+selectedService+".png");
    trig.select('span').text(selectedService);

    //loadData();
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
    speedup = true;
}

function requestServicenagios(count,serin) {
    return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    var result = processResult(JSON.parse(this.responseText));
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

function requestServiceinfluxdb(count,serin) {
    return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();
        const ip = "10.101."+ hosts[count].hpcc_rack +"." + hosts[count].hpcc_node;
        xhr.onreadystatechange = function(e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    var name = hosts[count].name;
                    const responseJSON = JSON.parse(this.responseText);
                    let index = 0;
                    if (!recordonly){
                        var result = processResult(responseJSON,name);
                        hostResults[name][serviceListattr[serin]].push(result);
                    }else {
                        if (responseJSON.results[0].series) {
                            const returnLength = responseJSON.results[0].series[0].values.length;
                            for (let i = 0; i < returnLength; i++)
                                hostResults[name][serviceListattr[serin]].push(processResult(responseJSON, name, i));
                        }else
                            hostResults[name][serviceListattr[serin]].push(processResult(responseJSON, name));
                    }
                    if (selectedService === serviceList[serin]) {
                        hostResults[name].arr = hostResults[name][serviceListattr[serin]];
                        if (!recordonly)
                            plotResult(result,hosts[count].name);
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
        let query;
        if (recordonly)
            query = getstringQuery_influx(ip,serin,timerange);
        else
            query = getstringQuery_influx(ip,serin);
        console.log(query)
        xhr.open('get', "http://10.10.1.4:8086/query?db=hpcc_monitoring_db&q=" + query, true);
        xhr.send();
    })
}
let requestService = eval('requestService'+db);
let timerange = ["2019-03-21T15:20:00Z","2019-03-21T18:00:00Z"];

function requestRT(iteration,count) {
    var promises;
    promises = serviceList.map(function (d, i) {
        return requestService(count, i);
    });

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
                //console.log(hosts[count].name+" "+hostResults[name]);
                var result = simulateResults2(hosts[count].name, iteration, serviceList[0]);
                hostResults[name].arrTemperature.push(result);

                var result = simulateResults2(hosts[count].name, iteration, serviceList[1]);
                hostResults[name].arrCPU_load.push(result);

                var result = simulateResults2(hosts[count].name, iteration, serviceList[2]);
                hostResults[name].arrMemory_usage.push(result);

                var result = simulateResults2(hosts[count].name, iteration, serviceList[3]);
                hostResults[name].arrFans_health.push(result);

                var result = simulateResults2(hosts[count].name, iteration, serviceList[4]);
                hostResults[name].arrPower_usage.push(result);

                plotResult(result, name);
                iteration++;
            }
            iteration = tmp;
        return [iteration, count];
    }
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

// ui part
function openNav() {
    d3.select("#mySidenav").classed("sideIn",true);
    d3.select("#Maincontent").classed("sideIn",true);
    // _.delay(resetSize, 500);
}

function closeNav() {
    d3.select("#mySidenav").classed("sideIn",false);
    d3.select("#Maincontent").classed("sideIn",false);
    // _.delay(resetSize, 500);
}

$( document ).ready(function() {
    console.log('ready');
    $('.collapsible').collapsible();
    $('.dropdown-trigger').dropdown();
    $('.tabs').tabs();
    $('.sidenav').sidenav();
    discovery('#sideNavbtn');
    //$('.tap-target').tapTarget({onOpen: discovery});

    d3.select("#DarkTheme").on("click",switchTheme);

    d3.select('#inds').on("change", function () {
        var sect = document.getElementById("inds");
        charType = sect.options[sect.selectedIndex].value;
    });

    d3.select('#indsg').on("change", function () {
        var sect = document.getElementById("indsg");
        sumType = sect.options[sect.selectedIndex].value;
        svg.select(".graphsum").remove();
        pannelselection(false);
        switch(sumType){
            case "Scatterplot":
                d3.select("#scatterzone").style("visibility","visible");
                svg.selectAll(".graphsum").remove();
                for (var i =currentlastIndex>(maxstack-2)?(currentlastIndex-maxstack+2):0; i<(currentlastIndex+1);i++) {
                    drawsummary(i);
                }
                break;
            case "Boxplot":
            case "Radar":
                svg.selectAll(".graphsum").remove();
                d3.select("#scatterzone").style("visibility","hidden");
                for (var i =currentlastIndex>(maxstack-2)?(currentlastIndex-maxstack+2):0; i<(currentlastIndex+1);i++) {
                    drawsummary(i);
                }
                break;
        }
    });
    d3.select('#datacom').on("change", function () {
        d3.select('.cover').classed('hidden', false);
        spinner.spin(target);
        const choice = this.value;
        const choicetext = d3.select('#datacom').node().selectedOptions[0].text;
        setTimeout(() => {
            if (choice !== "nagios" && choice !== "influxdb")
                d3.json("data/" + choice + ".json", function (error, data) {
                    if (error) throw error;
                    sampleS = data;
                    if (choice.includes('influxdb')){
                        processResult = processResult_influxdb;
                        db = "influxdb";
                        realTimesetting(false,"influxdb");
                    }else {
                        processResult = processResult_old;
                        realTimesetting(false);
                    }
                    d3.select(".currentDate")
                        .text("" + d3.timeParse("%d %b %Y")(choicetext).toDateString());
                    resetRequest();
                    d3.select('.cover').classed('hidden', true);
                    spinner.stop();
                });
            else {
                realTimesetting(true,choice);
                db = choice;
                requestService = eval('requestService'+choice);
                processResult = eval('processResult_'+choice);
                d3.select('.cover').classed('hidden', true);
                spinner.stop();
            }
        },0);
    });
    spinner = new Spinner(opts).spin(target);
    setTimeout(() => {
        d3.json("data/" + d3.select('#datacom').node().value  + ".json", function (error, data) {
            if (error) throw error;
            d3.select(".cover").select('h5').text('drawLegend...');
            d3.select(".currentDate")
                .text("" + d3.timeParse("%d %b %Y")(d3.select('#datacom').select('[selected="selected"]').text()).toDateString());
            drawLegend(initialService, arrThresholds, arrColor, dif);
            sampleS = data;
            main();
            d3.select(".cover").select('h5').text('loading data...');
            addDatasetsOptions(); // Add these dataset to the select dropdown, at the end of this files
            d3.select('.cover').classed('hidden',true);
            spinner.stop();
        });
    },0);
    // Spinner Stop ********************************************************************

});
function discovery(d){
    d3.select(d).style('left','20px')
        .classed("pulse",true)
        .transition().delay(5000).duration(1000)
        .style('left',null).on('end',function() {
            d3.select(d).classed("pulse",false);
    });

}
function switchTheme(){
    if (this.value==="light"){
        this.value = "dark";
        this.querySelector('span').textContent = "Light";
        d3.select('body').classed('light',false);
        d3.select('.logoLink').select('img').attr('src',"https://idatavisualizationlab.github.io/HPCC/HiperView/images/TTUlogoWhite.png");
        return;
    }
    this.value = "light";
    this.querySelector('span').textContent = "Dark";
    d3.select('body').classed('light',true);
    d3.select('.logoLink').select('img').attr('src',"https://idatavisualizationlab.github.io/HPCC/HPCViz/images/TTUlogo.png");
    return;
}