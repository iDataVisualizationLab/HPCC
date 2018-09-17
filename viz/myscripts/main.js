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
        "translate(" + margin.left + "," + margin.top + ")")
    .call(d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", zoom));

function zoom() {
    svg.attr("transform", d3.event.transform);
}


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

//d3.json("data/host_usage1.json", function(data_) {
/*d3.json("data/HostUsageHistoryPoll1.json", function(data_) {
    hosts = data_;
    main();


    buildStreamGraph();  // Draw stream graphs for user's jobs in Stream.js
});
*/



var dur = 400;  // animation duration
var startDate = new Date("4/1/2018");
var endtDate = new Date("1/1/2019");
var today = new Date();



var color = d3.scaleLinear()
    .domain([20, 60, 80, 100])
    .range(['#44f', '#1a9850','#fee08b', '#d73027'])
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

var numberOfMinutes = 4;

var users = [];
var racks = [];

var currentMiliseconds;
var xTimeScale;
var baseTemperature =60;
var interval2;

main();
function main() {
    currentMiliseconds = new Date().getTime();  // For simulation


    // HPCC ****************************************
    /*for (var i=0; i<hosts.length;i++) {
     hosts[i].hpcc_rack = +hosts[i].hostname.split("-")[1];
     hosts[i].hpcc_node = +hosts[i].hostname.split("-")[2].split(".")[0];

     // Compute RACK list
     var rackIndex = isContainRack(racks,hosts[i].hpcc_rack);
     if (rackIndex>=0){  // found the user in the users list
     racks[rackIndex].hosts.push(hosts[i]);
     }
     else{
     var obj ={};
     obj.id = hosts[i].hpcc_rack;
     obj.hosts = [];
     obj.hosts.push(hosts[i]);
     racks.push(obj);
     }
     // Sort RACK list
     racks = racks.sort(function(a,b){
     if (a.id>b.id){
     return 1;
     }
     else return -1;
     })
     }*/

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
        .style("font-size", 12)
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
            .style("font-size", 12)
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
            .style("font-size", 11)
            .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
            .attr("font-family", "sans-serif")
            .text(""+hpcc_node);

    }

    // ********* REQUEST ******************************************

    var count = 0;
    interval2 = setInterval(function(){
         var xmlhttp = new XMLHttpRequest();

         /*
         var url = "http://10.10.1.4/nagios/cgi-bin/statusjson.cgi?query=service&hostname="+hosts[count].name+"&servicedescription=check+temperature";
         xmlhttp.onreadystatechange = function() {
             if (this.readyState == 4 && this.status == 200) {
                 var result = JSON.parse(this.responseText);

                 var name =  result.data.service.host_name;
                 hostResults[name].arr.push(result);

                 plotResult(result);

                 console.log(result);
             }
             else{

                 console.log(count+" this.readyState:"+this.readyState+" this.status:"+this.status+" "+this.responseText);
             }

         };
         xmlhttp.open("GET", url, true);
         xmlhttp.send();
        */

        var result = simulateResults(hosts[count].name);

        // Process the result
        var name =  result.data.service.host_name;
        hostResults[name].arr.push(result);

        plotResult(result);

        //console.log(hosts[count]);


        count++;
        if (count>=hosts.length)
            count=0;
    } , 10)

}

function simulateResults(hostname){
    let newService = JSON.parse(JSON.stringify(sampleService));


    newService.result.queryTime =  new Date().getTime();
    newService.data.service.host_name = hostname;


    // temperature
    //var str = sampleService.data.service.plugin_output;
    var str = "CPU1 Temp 67 OK CPU2 Temp 49 OK Inlet Temp 40 OK";
    var arrString =  str.split(" ");

    var temp1 = +arrString[2];
    temp1+= gaussianRandom(-50,50);
    arrString[2]=temp1;

    var temp2 = +arrString[6];
    temp2+= gaussianRandom(-50,50);
    arrString[6]=temp2;

    var temp3 = +arrString[10];
    temp3+= gaussianRandom(-50,50);
    arrString[10]=temp3;

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
    var name =  result.data.service.host_name;
    if (document.getElementById("checkboxP1").checked)
        plotArea(name);
    else
        plotHeat(result,name);

}

function plotHeat(result,name){
    var hpcc_rack = +name.split("-")[1];
    var hpcc_node = +name.split("-")[2].split(".")[0];


    var xStart = racks[hpcc_rack - 1].x+13;
    xTimeScale = d3.scaleLinear()
        .domain([currentMiliseconds, currentMiliseconds+numberOfMinutes*maxHostinRack*1000]) // input
        .range([xStart, xStart+w_rack-2*node_size]); // output

    var x = xTimeScale(result.result.queryTime);
    var y =  getHostY(hpcc_rack,hpcc_node)-10;


    var str = result.data.service.plugin_output;
    var arrString =  str.split(" ");

    var temp1 = +arrString[2];
    var temp2 = +arrString[6];
    var temp3 = +arrString[10];



    svg.append("rect")
        .attr("class", name)
        .attr("x", x)
        .attr("y", y)
        .attr("width", node_size)
        .attr("height", node_size )
        .attr("fill", function (d) {
            return color(temp1);
        })
        .attr("fill-opacity",function (d) {
            return opa(temp1);
        })
        .attr("stroke", "#000")
        .attr("stroke-width", 0.05)
        .on("mouseover", function (d) {
            mouseoverNode (this);
        })
        .on("mouseout", mouseoutNode);

    svg.append("rect")
        .attr("class", name)
        .attr("x", x)
        .attr("y", y+6)
        .attr("width", node_size)
        .attr("height", node_size )
        .attr("fill", function (d) {
            return color(temp2);
        })
        .attr("fill-opacity",function (d) {
            return opa(temp2);
        })
        .attr("stroke", "#000")
        .attr("stroke-width", 0.05)
        .on("mouseover", function (d) {
            mouseoverNode (this);
        })
        .on("mouseout", mouseoutNode);

    drawSummaryAreaChart(hpcc_rack, xStart);
}

function plotArea(name){
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
        obj.queryTime =r.arr[i].result.queryTime;
        obj.x = xTimeScale(obj.queryTime);
        arr.push(obj);
    }

    // get Time
    var minTime = 10*(new Date("1/1/2030").getTime());  // some max number
    var maxTime = 0;
    for (var i=0; i<r.arr.length;i++){
        var qtime =r.arr[i].result.queryTime;
        minTime = Math.min(minTime,qtime);
        maxTime = Math.max(maxTime,qtime);
    }

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
        .style("fill-opacity",function (d) {
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
                obj.queryTime = r.arr[i].result.queryTime;
                obj.x = xTimeScale(obj.queryTime);
                obj.bin = Math.round(obj.x-xStart);   // How to compute BINS ******************************************
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
    //console.log(arr3.length);


    // Drawing areas ****************************************************
    var y = top_margin-16;

    var yScale = d3.scaleLinear()
        .domain([baseTemperature, 120]) //  baseTemperature=60
        .range([0, 25]); // output

    var areaMin = d3.area()
        .x(function(d) { return xStart+d.bin; })
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
        .style("fill","#494");

    var areaMax = d3.area()
        .x(function(d) { return xStart+d.bin; })
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
        .style("fill","#a44");

}

function getHostY(r,n){
   return  racks[r - 1].y + n * h_rack / (maxHostinRack+0.5);
}


function areaChart(){
    // Do nothing
}

function pauseRequest(){
    clearInterval(interval2);
}