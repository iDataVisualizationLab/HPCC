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

var getColor = d3.scaleOrdinal(d3.schemeCategory20);

var dur = 400;  // animation duration


var startDate = new Date("4/1/2018");
var endtDate = new Date("1/1/2019");
var today = new Date();




var numberOfProcessors = 42;
var h_rack = 1000;
var top_margin = 50;
var w_rack = width/10-1;
var w_gap =0;
var node_size = 5;

var users = [];
var racks = [];

var currentMiliseconds;

main();
function main(){
    currentMiliseconds = new Date().getTime();  // For simulation

    /*
    var xmlhttp = new XMLHttpRequest();
    var url = "http://10.10.1.4/nagios/cgi-bin/statusjson.cgi?query=host&hostname=compute-1-1";
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log(this.responseText);
        }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
    */


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
        hostResults[ h.name] ={};
        hostResults[ h.name].index = h.index;
        hostResults[ h.name].arr = [];
        hosts.push(h);
       // console.log(att+" "+h.hpcc_rack+" "+h.hpcc_node);

        // Compute RACK list
        var rackIndex = isContainRack(racks,h.hpcc_rack);
        if (rackIndex>=0){  // found the user in the users list
            racks[rackIndex].hosts.push(h);
        }
        else{
            var obj ={};
            obj.id = h.hpcc_rack;
            obj.hosts = [];
            obj.hosts.push(h);
            racks.push(obj);
        }
        // Sort RACK list
        racks = racks.sort(function(a,b){
            if (a.id>b.id){
                return 1;
            }
            else return -1;
        })
    }
    for (var i=0; i<racks.length;i++) {
        racks[i].hosts.sort(function(a,b){
            if (a.hpcc_node>b.hpcc_node){
                return 1;
            }
            else return -1;
        })

    }

    // Spinner Stop ********************************************************************
    spinner.stop();

        // Draw racks **********************
    for (var i=0; i<racks.length;i++) {
        racks[i].x = racks[i].id* (w_rack + w_gap) -w_rack+10;
        racks[i].y = top_margin;
    }
    svg.selectAll(".rackRect")
        .data(racks)
        .enter().append("rect")
        .attr("class", "rackRect")
        .attr("x", function (d) {return d.x-6;})
        .attr("y", function (d) {return d.y;})
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("width", w_rack-8)
        .attr("height", h_rack)
        .attr("fill", "#fff")
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .style("box-shadow", "10px 10px 10px #666");
    svg.selectAll(".rackRectText1")
        .data(racks)
        .enter().append("text")
        .attr("class", "rackRectText1")
        .attr("x", function (d) {return d.x+w_rack/2-2;})
        .attr("y", function (d) {return d.y-30;})
        .attr("fill", "#000")
        .style("text-anchor","middle")
        .style("font-size",16)
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text(function (d) {
            return "Rack "+d.id;
        });

    svg.selectAll(".rackRectText2")
        .data(racks)
        .enter().append("text")
        .attr("x", function (d) {return d.x+w_rack/2-2;})
        .attr("y", function (d) {return d.y-12;})
        .attr("class", "rackRectText2")
        .attr("fill", "#000")
        .style("text-anchor","middle")
        .style("font-size",12)
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text(function (d) {
            return "Host usage = "+d.hosts.length;
        });

    // Draw host **********************
    /*
    for (var i=0; i<hosts.length;i++) {
        hosts[i].x = racks[hosts[i].hpcc_rack - 1].x;
        hosts[i].y = racks[hosts[i].hpcc_rack - 1].y + hosts[i].hpcc_node * h_rack / 63;

    }


        svg.selectAll(".node_" )
            .data(hosts)
            .enter().append("rect")
            .attr("class", function (d) {
                return "node_" + d.hpcc_rack + "_" + d.hpcc_node;
            })
            .attr("x", function (d, j) {
                return d.x;
            })
            .attr("y", function (d) {
                return d.y;
            })
            .attr("width", node_size)
            .attr("height", node_size )
            .attr("fill", function (d) {
                return getColor(d);
            })
            .attr("fill-opacity",0.2)
            .attr("stroke", function (d) {
                if (d.masterQueue == "MASTER")
                    return "#000";
                else
                    return "#fff";

            })
            .attr("stroke-width", function (d) {
                if (d.masterQueue == "MASTER")
                    return 0.4;
                else
                    return 0.3;
            })
            .on("mouseover", mouseoverNode2)
            .on("mouseout", mouseoutNode2);*/


    // ********* REQUEST ******************************************

    var count = 0;
    var interval2 = setInterval(function(){
         var xmlhttp = new XMLHttpRequest();

         /*var url = "http://10.10.1.4/nagios/cgi-bin/statusjson.cgi?query=service&hostname="+hosts[count].name+"&servicedescription=check+temperature";
         xmlhttp.onreadystatechange = function() {
             if (this.readyState == 4 && this.status == 200) {
                console.log(this.responseText);
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
        console.log(result);

        count++;
        if (count>=hosts.length)
            count=0;
    } , 10)

}

function simulateResults(hostname){
    sampleService.result.queryTime =  new Date().getTime();
    sampleService.data.service.host_name = hostname;


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

    sampleService.data.service.plugin_output = arrString.join(' ')

    //console.log(temp1);
    console.log(sampleService.data.service.plugin_output );
    //debugger;
    return sampleService;
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

//function getRandomInt(min, max) {
//    min = Math.ceil(min);
//    max = Math.floor(max);
//    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
//}


function plotResult(result){
    var name =  result.data.service.host_name;
    var hpcc_rack = +name.split("-")[1];
    var hpcc_node = +name.split("-")[2].split(".")[0];

    var x = racks[hpcc_rack - 1].x;
    var y = racks[hpcc_rack - 1].y + hpcc_node * h_rack / 61;
    var numSecond= (sampleService.result.queryTime-currentMiliseconds)/1000;
    x+=numSecond;

    var str = result.data.service.plugin_output;
    var arrString =  str.split(" ");

    var temp1 = +arrString[2];
    var temp2 = +arrString[6];
    var temp3 = +arrString[10];


    var color = d3.scaleLinear()
        .domain([20, 60, 80, 100])
        .range(['#44f', '#1a9850','#fee08b', '#d73027'])
        .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb


    svg.append("rect")
        .attr("class", name)
        .attr("x", x)
        .attr("y", y)
        .attr("width", node_size)
        .attr("height", node_size )
        .attr("fill", function (d) {
            return color(temp1);
        })
        .attr("fill-opacity",0.8)
        .attr("stroke", "#000")
        .attr("stroke-width", 0.1)
        .on("mouseover", mouseoverNode2)
        .on("mouseout", mouseoutNode2);

    svg.append("rect")
        .attr("class", name)
        .attr("x", x)
        .attr("y", y+6)
        .attr("width", node_size)
        .attr("height", node_size )
        .attr("fill", function (d) {
            return color(temp2);
        })
        .attr("fill-opacity",0.8)
        .attr("stroke", "#000")
        .attr("stroke-width", 0.1)
        .on("mouseover", mouseoverNode2)
        .on("mouseout", mouseoutNode2);
}

