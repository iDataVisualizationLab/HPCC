/* June-2018
 * Tommy Dang (on the HPCC project, as Assistant professor, iDVL@TTU)
 *
 * THIS SOFTWARE IS BEING PROVIDED "AS IS", WITHOUT ANY EXPRESS OR IMPLIED
 * WARRANTY.  IN PARTICULAR, THE AUTHORS MAKE NO REPRESENTATION OR WARRANTY OF ANY KIND CONCERNING THE MERCHANTABILITY
 * OF THIS SOFTWARE OR ITS FITNESS FOR ANY PARTICULAR PURPOSE.
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


var arrTemp = [20, 60, 80, 100];
var arrColor = ['#44f', '#1a9850','#fee08b', '#d73027'];

var color = d3.scaleLinear()
    .domain(arrTemp)
    .range(arrColor)
    .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb
var opa = d3.scaleLinear()
    .domain([20, 100])
    .range([0, 1]);

var maxHostinRack= 60;
var h_rack = 1200;
var top_margin = 70;
var w_rack = (width-23)/10-1;
var w_gap =0;
var node_size = 6;

var users = [];
var racks = [];

var xTimeScale;
var baseTemperature =60;

var interval2;
var simDuration =10;
var numberOfMinutes = 1.5;
var isRealtime = false;
if (isRealtime){
    simDuration = 1000;
    numberOfMinutes = 6*60;
}

var currentMiliseconds;
var firstTime =true;
var charType = "Heatmap";


//***********************
var fileList = ["Temperature","CPU_load","Memory_load","Power_consumption"]
var initialDataset = "Temperature";
var fileName;


main();
drawLegend(arrTemp, arrColor);
addDatasetsOptions(); // Add these dataset to the select dropdown, at the end of this files



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
        hostResults[h.name].arrCPU_load = [];
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
            return d.y - 36;
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
    svg.append("text")
        .attr("class", "hostText")
        .attr("x", 0)
        .attr("y", top_margin-15)
        .attr("fill", "#000")
        .style("font-weight","bold")
        .style("text-anchor", "start")
        .style("font-size", "12px")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text("Summary");

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
    }

    // ********* REQUEST ******************************************
    request();
}

function request(){
    var count = 0;
    currentMiliseconds = new Date().getTime();  // For simulation
    interval2 = setInterval(function(){
        if (isRealtime){
            var xmlhttp = new XMLHttpRequest();
            var url = "http://10.10.1.4/nagios/cgi-bin/statusjson.cgi?query=service&hostname="+hosts[count].name+"&servicedescription=check+temperature";
            xmlhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var result = JSON.parse(this.responseText);

                    var name =  result.data.service.host_name;
                    hostResults[name].arr.push(result);
                    plotResult(result);
                }
                else{
                    console.log(count+"ERROR____ this.readyState:"+this.readyState+" this.status:"+this.status+" "+this.responseText);
                }

            };
            xmlhttp.open("GET", url, true);
            xmlhttp.send();

            var xmlhttp2 = new XMLHttpRequest();
            var url2 = "http://10.10.1.4/nagios/cgi-bin/statusjson.cgi?query=service&hostname="+hosts[count].name+"&servicedescription=check+cpu+load";
            xmlhttp2.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var result = JSON.parse(this.responseText);

                    var name =  result.data.service.host_name;
                    hostResults[name].arrCPU_load.push(result);
                   // plotResult(result);
                }
                else{
                    console.log(count+"ERROR____ this.readyState:"+this.readyState+" this.status:"+this.status+" "+this.responseText);
                }
            };
            xmlhttp.open("GET", url, true);
            xmlhttp.send();
        }
        else{
            var result = simulateResults(hosts[count].name);
            // Process the result
            var name =  result.data.service.host_name;
            hostResults[name].arr.push(result);
            plotResult(result);
        }
        count++;
        if (count>=hosts.length)
            count=0;
    } , simDuration)
}



function simulateResults(hostname){
    var newService = JSON.parse(JSON.stringify(sampleService));

    newService.result.query_time =  new Date().getTime();
    newService.data.service.host_name = hostname;


    // temperature
    var str = "CPU1 Temp 67 OK CPU2 Temp 49 OK Inlet Temp 40 OK";
     var arrString =  str.split(" ");
     var temp1 = +arrString[2];
    temp1+= gaussianRandom(-30,30);
    arrString[2]=temp1;

    var temp2 = +arrString[6];
    temp2+= gaussianRandom(-20,20);
    arrString[6]=temp2;

    var temp3 = +arrString[10];
    temp3+= gaussianRandom(-10,10);
    arrString[10]=temp3;


    // CPU load
    /*var str = "OK - Average CPU load is normal! :: CPU Load: 0.500694"
    var arrString =  str.split(" CPU Load: ");
    var load = +arrString[1];
    load+= gaussianRandom(-5,5);
    arrString[1]=load;*/

    newService.data.service.plugin_output = arrString.join(' ')
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

     var r = hostResults[name];

    var hpcc_rack = +name.split("-")[1];
    var hpcc_node = +name.split("-")[2].split(".")[0];

    var xStart = racks[hpcc_rack - 1].x+15;
    xTimeScale = d3.scaleLinear()
        .domain([currentMiliseconds, currentMiliseconds+numberOfMinutes*maxHostinRack*1000]) // input
        .range([xStart, xStart+w_rack-2*node_size]); // output
    var y = getHostY(hpcc_rack,hpcc_node);


    // Process the array of historical temperatures
    var arr = [];
    for (var i=0; i<r.arr.length;i++){
        var str = r.arr[i].data.service.plugin_output;
        var arrString =  str.split(" ");
        var obj = {};
        obj.temp1 = +arrString[2];
        obj.temp2 = +arrString[6];
        obj.temp3 = +arrString[10];
        obj.query_time =r.arr[i].result.query_time;
        obj.x = xTimeScale(obj.query_time);
        arr.push(obj);
    }

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

        svg.append("rect")
            .attr("class", name)
            .attr("x", x)
            .attr("y", y+node_size-9)
            .attr("width", node_size)
            .attr("height", node_size )
            .attr("fill", function (d) {
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
    drawSummaryAreaChart(hpcc_rack, xStart);
}

function processData() {

}

function plotArea(arr,name,hpcc_rack,hpcc_node,xStart,y){
  var yScale = d3.scaleLinear()
        .domain([baseTemperature, 120]) //  baseTemperature=60
        .range([0, 25]); // output

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
    var binStep = 5; // pixels
    for (var att in hostResults) {
        var hpcc_rack = +att.split("-")[1];
        var hpcc_node = +att.split("-")[2].split(".")[0];
        if (hpcc_rack == rack) {
            var r = hostResults[att];
            for (var i = 0; i < r.arr.length; i++) {
                var str = r.arr[i].data.service.plugin_output;
                var arrString = str.split(" ");
                var obj = {};
                obj.temp1 = +arrString[2];
                obj.temp2 = +arrString[6];
                obj.temp3 = +arrString[10];
                obj.query_time = r.arr[i].result.query_time;
                obj.x = xTimeScale(obj.query_time);
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

}

function getHostY(r,n){
   return  racks[r - 1].y + n * h_rack / (maxHostinRack+0.5);
}

d3.select('#inds').on("change", function () {
    var sect = document.getElementById("inds");
    charType = sect.options[sect.selectedIndex].value;
});

function areaChart(){
    // Do nothing
}

function saveResults(){
    var filename = "HPCC_results.json";
    var type = "json";
    var str = JSON.stringify(hostResults);

    var file = new Blob([str], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

function pauseRequest(){
    clearInterval(interval2);
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
        count++;

        svg.selectAll("."+att).remove();
    }
    request();
}

function addDatasetsOptions() {
    var select = document.getElementById("datasetsSelect");
    for(var i = 0; i < fileList.length; i++) {
        var opt = fileList[i];
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;

        el["data-image"]="images/"+fileList[i]+".png";
        select.appendChild(el);
    }
    document.getElementById('datasetsSelect').value = initialDataset;  //************************************************
    fileName = document.getElementById("datasetsSelect").value;

    //loadData();
}


function loadNewData(event) {
    //alert(this.options[this.selectedIndex].text + " this.selectedIndex="+this.selectedIndex);
    svg.selectAll("*").remove();
    fileName = this.options[this.selectedIndex].text;
    console.log(" fileName="+fileName);
    //loadData();
}