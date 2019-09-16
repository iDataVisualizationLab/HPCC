/* MIT License
 *
 * Copyright (c) 2018 Tommy Dang
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
var margin = {top: 5, right: 0, bottom: 50, left: 0};

var svg = d3.select("svg"),
    width = +document.getElementById("mainBody").offsetWidth,
    height = +svg.attr("height")-margin.top-margin.bottom;

svg = svg.append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");
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

var maxHostinRack= 60;
var h_rack = 1280;
var w_rack = (width-23)/10-1;
var w_gap =0;
var node_size = 6;
var sHeight=200;  // Summary panel height
var top_margin = sHeight+46;  // Start rack spiatial layout


var users = [];
var racks = [];

var xTimeScale;
var baseTemperature =60;

var interval2;
var simDuration =0;
var numberOfMinutes = 26*60;
var iterationstep = 19;

var isRealtime = true;
if (isRealtime){
    simDuration = 500;
    numberOfMinutes = 26*60;
}

var currentMiliseconds;
var query_time;
var currentHostname,currentMeasure;
var currentHostX = 0;
var currentHosty = 0;

var charType = "Heatmap";
//***********************
var serviceList = ["Temperature","Job_load","Memory_usage","Fans_speed","Power_consum"]
var thresholds = [[3,98], [0,10], [0,99], [1050,17850],[0,200] ];
var initialService = "Temperature";
var selectedService;

var arrThresholds;
var dif, mid,left;
var color,opa;
//var arrColor = ['#00c', '#1a9850','#fee08b', '#d73027'];
var arrColor = ['#110066','#4400ff', '#00cccc', '#00dd00','#ffcc44', '#ff0000', '#660000'];
setColorsAndThresholds(initialService);

//***********************
var undefinedValue = undefined;
var undefinedColor = "#666";

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
drawLegend(initialService,arrThresholds, arrColor,dif);

main();
addDatasetsOptions(); // Add these dataset to the select dropdown, at the end of this files


function main() {

    for (var att in listhost) {
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
    // hosts.sort(function (a, b) {
    //     if (a.hpcc_rack*1000+a.hpcc_node > b.hpcc_rack*1000+b.hpcc_node) {
    //         return 1;
    //     }
    //     else return -1;
    // })

    // Summary Panel ********************************************************************
    svg.append("rect")
        .attr("class", "summaryRect")
        .attr("x", 1)
        .attr("y", 15)
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("width", width-2)
        .attr("height", sHeight)
        .attr("fill", "#fff")
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .style("box-shadow", "10px 10px 10px #666");
    svg.append("text")
        .attr("class", "summaryText1")
        .attr("x", 20)
        .attr("y", 35)
        .attr("fill", "#000")
        .style("text-anchor", "start")
        .style("font-size", "16px")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text("Quanah HPC system: " + hosts.length+" hosts distributed in 10 racks" );

    svg.append("line")
        .attr("class", "currentTimeline")
        .attr("x1", 10)
        .attr("y1", 40)
        .attr("x2", 10)
        .attr("y2", 214)
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .style("stroke-dasharray", ("2, 2"));;

    svg.append("text")
        .attr("class", "currentText")
        .attr("x", 10)
        .attr("y", 164)
        .attr("fill", "#000")
        .style("text-anchor", "start")
        .style("font-size", "12px")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text("Latest REQUEST");    
    svg.append("text")
        .attr("class", "currentHostText")
        .attr("x", 10)
        .attr("y", 182)
        .attr("fill", "#000")
        .style("text-anchor", "start")
        .style("font-weight","bold")
        .style("font-size", "12px")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text("Host");
    svg.append("text")
        .attr("class", "currentTimeText")
        .attr("x", 10)
        .attr("y", 200)
        .attr("fill", "#000")
        .style("text-anchor", "start")
        .style("font-style","italic")
        .style("font-size", "12px")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text("Time");
    
    
            
    // Spinner Stop ********************************************************************
    spinner.stop();

    // Draw racks **********************
    for (var i = 0; i < racks.length; i++) {
        racks[i].x = 35+ racks[i].id * (w_rack + w_gap) - w_rack + 10;
        racks[i].y = top_margin;
    }
    svg.selectAll(".rackRect")
        .data(racks)
        .enter().append("rect")
        .attr("class", "rackRect")
        .attr("x", function (d) {
            return d.x - 6;
        })
        .attr("y", function (d) {
            return d.y;
        })
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("width", w_rack - 8)
        .attr("height", h_rack)
        .attr("fill", "#fff")
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .style("box-shadow", "10px 10px 10px #666");
    svg.selectAll(".rackRectText1")
        .data(racks)
        .enter().append("text")
        .attr("class", "rackRectText1")
        .attr("x", function (d) {
            return d.x + w_rack / 2 - 20;
        })
        .attr("y", function (d) {
            return d.y - 6;
        })
        .attr("fill", "#000")
        .style("text-anchor", "middle")
        .style("font-size", 16)
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text(function (d) {
            return "Rack " + d.id ;
            //return "Rack " + d.id + ":   " + d.hosts.length + " hosts";
        });

    // Draw host names **********************
    /*svg.append("text")
        .attr("class", "hostText")
        .attr("x", 0)
        .attr("y", top_margin-15)
        .attr("fill", "#000")
        .style("font-weight","bold")
        .style("text-anchor", "start")
        .style("font-size", "12px")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text("Summary");*/

    for (var i = 1; i <= maxHostinRack; i++) {
        var yy = getHostY(1,i);
        svg.append("text")
            .attr("class", "hostText")
            .attr("x", 32)
            .attr("y", yy+1)
            .attr("fill", "#000")
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
        var xStart = racks[hpcc_rack - 1].x-2;
        var yy = getHostY(hpcc_rack,hpcc_node);
        // set opacity for current measurement text 
        hosts[i].mOpacity = 0.1;


        svg.append("text")
            .attr("class", "hostId")
            .attr("x", xStart)
            .attr("y", yy+1)
            .attr("fill", "#000")
            .style("text-anchor", "start")
            .style("font-size", "12px")
            .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
            .attr("font-family", "sans-serif")
            .text(""+hpcc_node);

        svg.append("text")
            .attr("class", "measure_"+hosts[i].name)
            .attr("x", xStart+w_rack-20)
            .attr("y", yy-4)
            .attr("fill", "#000")
            .attr("fill-opacity", hosts[i].mOpacity)
            .style("text-anchor", "end")
            .style("font-size", "11px")
            .style("text-shadow", "1px 1px 0 rgba(0, 0, 0")
            .attr("font-family", "sans-serif")
            .text("");    
    }


    // Draw line to connect current host and timeline in the Summary panel
     svg.append("line")
        .attr("class", "connectTimeline")
        .attr("x1", 10)
        .attr("y1", 215)
        .attr("x2", 10)
        .attr("y2", 310)
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .style("stroke-dasharray", ("2, 2"));;   
    // ********* REQUEST ******************************************
    request();
}

function request(){
    var count = 0;
    var iteration = 0;
    currentMiliseconds = new Date().getTime();  // For simulation
    query_time=currentMiliseconds;

    interval2 = setInterval(function(){
        if (isRealtime){
            var xmlhttp = new XMLHttpRequest();
            var url = "http://10.10.1.4/nagios/cgi-bin/statusjson.cgi?query=service&hostname="+hosts[count].name+"&servicedescription=check+temperature";
            xmlhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var result = processResult(JSON.parse(this.responseText));
                    var name =  result.data.service.host_name;
                    hostResults[name].arrTemperature.push(result);
                    if (selectedService == serviceList[0]){
                        hostResults[name].arr=hostResults[name].arrTemperature;
                        plotResult(result);
                    }          
                }
                else{
                    console.log(count+"ERROR__check+temperature__ this.readyState:"+this.readyState+" this.status:"+this.status+" "+this.responseText);
                }

            };
            xmlhttp.open("GET", url, true);
            xmlhttp.send();

            var xmlhttp2 = new XMLHttpRequest();
            var url2 = "http://10.10.1.4/nagios/cgi-bin/statusjson.cgi?query=service&hostname="+hosts[count].name+"&servicedescription=check+cpu+load";
            xmlhttp2.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var result = processResult(JSON.parse(this.responseText));
                    var name =  result.data.service.host_name;
                    hostResults[name].arrCPU_load.push(result);
                    if (selectedService == serviceList[1]){
                        hostResults[name].arr=hostResults[name].arrCPU_load;
                        plotResult(result);
                    }     
                }
                else{
                    console.log(count+"ERROR__check+cpu+load__ this.readyState:"+this.readyState+" this.status:"+this.status+" "+this.responseText);
                }
            };
            xmlhttp2.open("GET", url2, true);
            xmlhttp2.send();


            var xmlhttp3 = new XMLHttpRequest();
            var url3 = "http://10.10.1.4/nagios/cgi-bin/statusjson.cgi?query=service&hostname="+hosts[count].name+"&servicedescription=check+memory+usage";
            xmlhttp3.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var result = processResult(JSON.parse(this.responseText));
                    var name =  result.data.service.host_name;
                    hostResults[name].arrMemory_usage.push(result);
                    if (selectedService == serviceList[2]){
                        hostResults[name].arr=hostResults[name].arrMemory_usage;
                        plotResult(result);
                    }  
                }
                else{
                    console.log(count+"ERROR__check+memory+usage__ this.readyState:"+this.readyState+" this.status:"+this.status+" "+this.responseText);
                }
            };
            xmlhttp3.open("GET", url3, true);
            xmlhttp3.send();

            var xmlhttp4 = new XMLHttpRequest();
            var url4 = "http://10.10.1.4/nagios/cgi-bin/statusjson.cgi?query=service&hostname="+hosts[count].name+"&servicedescription=check+fans+health";
            xmlhttp4.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var result = processResult(JSON.parse(this.responseText));
                    var name =  result.data.service.host_name;
                    hostResults[name].arrFans_health.push(result);
                    if (selectedService == serviceList[3]){
                        hostResults[name].arr=hostResults[name].arrFans_health;
                        plotResult(result);
                    }  
                }
                else{
                    console.log(count+"ERROR__check+fans+health__ this.readyState:"+this.readyState+" this.status:"+this.status+" "+this.responseText);
                }
            };
            xmlhttp4.open("GET", url4, true);
            xmlhttp4.send();

            var xmlhttp5 = new XMLHttpRequest();
            var url5 = "http://10.10.1.4/nagios/cgi-bin/statusjson.cgi?query=service&hostname="+hosts[count].name+"&servicedescription=check+power+usage";
            xmlhttp5.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var result = processResult(JSON.parse(this.responseText));
                    var name =  result.data.service.host_name;
                    hostResults[name].arrPower_usage.push(result);
                    if (selectedService == serviceList[4]){
                        hostResults[name].arr=hostResults[name].arrPower_usage;
                        plotResult(result);
                    }  
                }
                else{
                    console.log(count+"ERROR__check+power+usage__ this.readyState:"+this.readyState+" this.status:"+this.status+" "+this.responseText);
                }
            };
            xmlhttp5.open("GET", url5, true);
            xmlhttp5.send();
            var result = {};
        }
        else{
            // var result = simulateResults(hosts[count].name);
            var tmp =iteration;
            for (i=0;i<iterationstep;i++){
                var result = simulateResults2(hosts[count].name,iteration, selectedService);
                // Process the result
                var name =  result.data.service.host_name;
                hostResults[name].arr.push(result);
                plotResult(result);
                //console.log(hosts[count].name+" "+hostResults[name]);
                var result = simulateResults2(hosts[count].name,iteration, serviceList[0]);
                hostResults[name].arrTemperature.push(result);

                var result = simulateResults2(hosts[count].name,iteration, serviceList[1]);
                hostResults[name].arrCPU_load.push(result);

                var result = simulateResults2(hosts[count].name,iteration, serviceList[2]);
                hostResults[name].arrMemory_usage.push(result);

                var result = simulateResults2(hosts[count].name,iteration, serviceList[3]);
                hostResults[name].arrFans_health.push(result);

                var result = simulateResults2(hosts[count].name,iteration, serviceList[4]);
                hostResults[name].arrPower_usage.push(result);   
                iteration++; 
            }    
            iteration = tmp;
        }

        count++;

        var xTimeSummaryScale = d3.scaleLinear()
                .domain([currentMiliseconds, currentMiliseconds+0.9*numberOfMinutes*60*1000]) // input
                .range([30, width]); // output
        Date.prototype.timeNow = function () {
             return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes();
        }  
        Date.prototype.timeNow2 = function () {
             return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
        }

        if (count>=hosts.length){// Draw the summary Box plot ***********************************************************
            var arr = [];
            var xx; 
            var lastIndex;
            
            
            for (var h=0; h<hosts.length;h++){
                var name = hosts[h].name; 
                var r = hostResults[name];
                lastIndex = r.arr.length-1;
                if (lastIndex>=0){   // has some data
                    var a = processData(r.arr[lastIndex].data.service.plugin_output, selectedService);
                    if (h==hosts.length-1){
                        query_time =r.arr[lastIndex].result.query_time;
                        xx = xTimeSummaryScale(query_time);     
                    }
                    arr.push(a[0]);
                }
            }
            
            // Draw date
            svg.selectAll(".currentDate").remove();
            svg.append("text")
                .attr("class", "currentDate")
                .attr("x", 600)
                .attr("y", 35)
                .attr("fill", "#000")
                .style("font-style","italic")
                .style("text-anchor","left")
                .style("font-size", "14px")
                .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
                .attr("font-family", "sans-serif")
                .text(""+new Date(currentMiliseconds).toDateString());
           
            // Boxplot Time
            svg.append("text")
                .attr("class", "boxTime")
                .attr("x", xx-2)
                .attr("y", hh+10)
                .attr("fill", "#000")
                .style("font-style","italic")
                .style("text-anchor","middle")
                .style("font-size", "12px")
                .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
                .attr("font-family", "sans-serif")
                .text(new Date(query_time).timeNow());    

            drawBoxplot(svg, arr, lastIndex, xx-10);
            count=0;
            iteration+=iterationstep;
        }
        // Update the current timeline in Summary panel
        var x2 = xTimeSummaryScale(query_time);
        svg.selectAll(".currentTimeline")
            .attr("x1", x2)
            .attr("x2", x2);
        svg.selectAll(".connectTimeline")
            .attr("x1", x2)
            .attr("x2", currentHostX)
            .attr("y2", currentHostY);       
        svg.selectAll(".currentText")
            .attr("x", x2+2)
            .text("Latest update:");  
        svg.selectAll(".currentTimeText")
            .attr("x", x2+2)
            .text(new Date(query_time).timeNow2());      
        svg.selectAll(".currentHostText")
            .attr("x", x2+2)
            .text(currentHostname);      

        // Update measurement text and opacity
        for (var i = 0; i < hosts.length; i++) {
            if (hosts[i].name==currentHostname){
                hosts[i].mOpacity = 1;
                hosts[i].xOpacity = currentHostX+38;

                if (hosts[i].xOpacity>racks[hosts[i].hpcc_rack - 1].x+w_rack-20)
                    hosts[i].mOpacity =0;

                var mea = currentMeasure;
                if (selectedService=="Job_load" || selectedService=="Memory_usage"){
                    mea = currentMeasure.toFixed(2);
                }
                else if (selectedService=="Power_consumption"){
                    mea = Math.round(currentMeasure);
                }
                svg.selectAll(".measure_"+hosts[i].name)
                    .attr("fill", color(currentMeasure))    
                    .text(mea);
            }
            else{
                if (hosts[i].mOpacity >0)
                    hosts[i].mOpacity -= 0.01;
                if (hosts[i].xOpacity==undefined)
                    hosts[i].xOpacity = currentHostX+38;
            }


            svg.selectAll(".measure_"+hosts[i].name)
                .attr("fill-opacity", hosts[i].mOpacity)
                .attr("x", hosts[i].xOpacity);   

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

// Delete unnesseccary files
function processResult(r){
    var obj = {};
    obj.result = {};
    obj.result.query_time = r.result.query_time;
    obj.data = {};
    obj.data.service={};
    obj.data.service.host_name = r.data.service.host_name;
    obj.data.service.plugin_output = r.data.service.plugin_output
    return obj;
}

function processData(str, serviceName) {  
    if (serviceName == serviceList[0]){
        var a = [];
        if (str.indexOf("timed out")>=0 || str.indexOf("(No output on stdout)")>=0 || str.indexOf("UNKNOWN")>=0 ){
            a[0] = undefinedValue;
            a[1] = undefinedValue;
            a[2] = undefinedValue;
        }
        else{
            var arrString =  str.split(" ");
            a[0] = +arrString[2];
            a[1] = +arrString[6];
            a[2] = +arrString[10];
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
        //console.log(str);
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
    var newService
    if (s == serviceList[0])             
        newService = sampleS[hostname].arrTemperature[iter];
    else if (s == serviceList[1])
        newService = sampleS[hostname].arrCPU_load[iter];
    else if (s == serviceList[2]) 
        newService = sampleS[hostname].arrMemory_usage[iter];
    else if (s == serviceList[3]) 
        newService = sampleS[hostname].arrFans_health[iter];
    else if (s == serviceList[4]) 
        newService = sampleS[hostname].arrPower_usage[iter];
    return newService;
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


function plotResult(result) {
    // Check if we should reset the starting point
    if (firstTime)
        currentMiliseconds = result.result.query_time;
    firstTime = false;
    var name =  result.data.service.host_name;
     
    query_time = result.result.query_time;  // for drawing current timeline in Summary panel
    currentHostname = name;
    
    // Process the array data ***************************************    
    var r = hostResults[name];
    var hpcc_rack = +name.split("-")[1];
    var hpcc_node = +name.split("-")[2].split(".")[0];

    var xStart = racks[hpcc_rack - 1].x+15;
    xTimeScale = d3.scaleLinear()
        .domain([currentMiliseconds, currentMiliseconds+numberOfMinutes*maxHostinRack*1000]) // input
        .range([xStart, xStart+w_rack-2*node_size]); // output
    var y = getHostY(hpcc_rack,hpcc_node);


    // Process the array of historical temperatures *************************************** 
    var arr = [];
    for (var i=0; i<r.arr.length;i++){
        var a = processData(r.arr[i].data.service.plugin_output, selectedService);
        var obj = {};
        obj.temp1 = a[0];
        obj.temp2 = a[1];
        obj.temp3 = a[2];
        obj.query_time =r.arr[i].result.query_time;
        obj.x = xTimeScale(obj.query_time);
        arr.push(obj);
        currentHostX = obj.x ;
        currentMeasure = obj.temp1;
    }

    currentHostY = y;
    

    // get Time
    var minTime = 10*(new Date("1/1/2030").getTime());  // some max number
    var maxTime = 0;
    for (var i=0; i<r.arr.length;i++){
        var qtime =r.arr[i].result.query_time;
        minTime = Math.min(minTime,qtime);
        maxTime = Math.max(maxTime,qtime);
    }
    if (maxTime-minTime>0.8*numberOfMinutes*60*1000)  // Limit time to STOP***********************
        pauseRequest();

    if (charType == "Heatmap")
        plotHeat(arr,name,hpcc_rack,hpcc_node,xStart,y,minTime,maxTime);
    else if (charType == "Area Chart") 
        plotArea(arr,name,hpcc_rack,hpcc_node,xStart,y);
    
}

function plotHeat(arr,name,hpcc_rack,hpcc_node,xStart,y,minTime,maxTime){
    svg.selectAll("."+name).remove();
    for (var i=0; i<arr.length;i++){
        var obj = arr[i];     
        var xMin = xTimeScale(minTime);
        var xMax = xTimeScale(maxTime);
        var x = xTimeScale(arr[i].query_time);
        if (arr.length>1)
            x = xMin+ i*(xMax-xMin)/(arr.length);
        svg.append("rect")
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
            svg.append("rect")
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

    svg.selectAll("."+name).remove();
    svg.append("path")
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
    svg.selectAll("."+name).transition().duration(1000)
        .style("fill",function (d) {
            return color(d[d.length-1].temp1);
        })

    drawSummaryAreaChart(hpcc_rack, xStart);
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
                obj.x = xTimeScale(obj.query_time);
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

    svg.selectAll(".RackSummaryMin"+rack).remove();
    svg.append("path")
        .datum(arr3) // 10. Binds data to the line
        .attr("class", "RackSummaryMin"+rack)
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

    svg.selectAll(".RackSummaryMax"+rack).remove();
    svg.append("path")
        .datum(arr3) // 10. Binds data to the line
        .attr("class", "RackSummaryMax"+rack)
        .attr("stroke","#000")
        .attr("stroke-width",0.2)
        .attr("d", areaMax)
        .style("fill-opacity",1)
        .style("fill","#e99");

    if (rack==1) {
        svg.selectAll(".baseline").remove();
        svg.append("line")
            .attr("class", "baseline")
            .attr("x1", xStart)
            .attr("x2", maxX+10)
            .attr("y1", y-yScale(baseTemperature))
            .attr("y2", y-yScale(baseTemperature))
            .attr("class", "baseline")
            .attr("stroke","#000")
            .attr("stroke-width",0.5);

        svg.selectAll(".baselineText").remove();
        svg.append("text")
            .attr("class", "baselineText")
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

function getHostY(r,n){
   return  racks[r - 1].y + n * h_rack / (maxHostinRack+0.5);
}

d3.select('#inds').on("change", function () {
    var sect = document.getElementById("inds");
    charType = sect.options[sect.selectedIndex].value;
});



function pauseRequest(){
    clearInterval(interval2);
    svg.selectAll(".connectTimeline").style("stroke-opacity", 0.1);
}

function resetRequest(){
    firstTime = true;
    clearInterval(interval2);

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

    // Remove boxplot in Summary panel
    svg.selectAll(".box").remove();
    svg.selectAll(".boxx").remove();
    svg.selectAll("line.median").remove();
    svg.selectAll("line.center").remove();
    svg.selectAll("circle.outlier").remove();
    svg.selectAll("text.box").remove();
    svg.selectAll("line.whisker").remove();
    svg.selectAll("text.whisker").remove();
    svg.selectAll(".connectTimeline").style("stroke-opacity", 1);     
    
    request();
}

function addDatasetsOptions() {
    var select = document.getElementById("datasetsSelect");
    for(var i = 0; i < serviceList.length; i++) {
        var opt = serviceList[i];
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        el["data-image"]="images/"+serviceList[i]+".png";
        select.appendChild(el);
    }
    document.getElementById('datasetsSelect').value = initialService;  //************************************************
    selectedService = document.getElementById("datasetsSelect").value;
    //loadData();
}

function loadNewData(event) {
    //alert(this.options[this.selectedIndex].text + " this.selectedIndex="+this.selectedIndex);
    //svg.selectAll("*").remove();
    selectedService = this.options[this.selectedIndex].text;

    setColorsAndThresholds(selectedService);
    drawLegend(selectedService,arrThresholds, arrColor,dif);
    resetRequest();
    tool_tip.hide();
}