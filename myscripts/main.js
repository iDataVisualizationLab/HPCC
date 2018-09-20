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
d3.json("data/HostUsageHistoryPoll2.json", function(data_) {
    hosts = data_;
    main();
    // Spinner Stop ********************************************************************
    spinner.stop();

    buildStreamGraph();  // Draw stream graphs for user's jobs in Stream.js
});


var getColor = d3.scaleOrdinal(d3.schemeCategory20);

var dur = 400;  // animation duration


var startDate = new Date("4/1/2018");
var endtDate = new Date("1/1/2019");
var today = new Date();



var numberOfProcessors = 42;
var h_rack = 800;
var top_margin = 50;
var w_rack = width/10-1;
var w_gap =0;
var node_size = w_rack/numberOfProcessors;

var users = [];
var racks = [];

function main(){




function httpGetAsync(theUrl, callback) { //theURL or a path to file
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
        debugger;
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
            var data = httpRequest.responseText;  //if you fetch a file you can JSON.parse(httpRequest.responseText)
            if (callback) {
                callback(data);
            }
        }
    };
    httpRequest.open('GET', theUrl, true);
    httpRequest.send(null);
}

    httpGetAsync('http://nagiosadmin:nagios@10.10.1.4/nagios/cgi-bin/statusjson.cgi?query=hostlist', function(data) {
    //do something with your data
    debugger;
});

    // HPCC ****************************************
    for (var i=0; i<hosts.length;i++) {
        hosts[i].hpcc_rack = +hosts[i].hostname.split("-")[1];
        hosts[i].hpcc_node = +hosts[i].hostname.split("-")[2].split(".")[0];

        // Compute user list
        for (var j = 0; j < hosts[i].jobList.length; j++) {
             var u = hosts[i].jobList[j].user;
             var userIndex = isContainUser(users,u);
             if (userIndex>=0){  // found the user in the users list
                 users[userIndex].nodes.push(hosts[i].jobList[j]);
             }
             else{
                 var obj ={};
                 obj.name = u;
                 obj.nodes = [];
                 obj.nodes.push(hosts[i].jobList[j]);
                 users.push(obj);
             }
        }
        // Sort user list
        users = users.sort(function(a,b){
            if (a.nodes.length>b.nodes.length){
                return -1;
            }
            else return 1;
        })

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
    }
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
    for (var i=0; i<hosts.length;i++) {
        hosts[i].x = racks[hosts[i].hpcc_rack-1].x;
        hosts[i].y = racks[hosts[i].hpcc_rack-1].y + hosts[i].hpcc_node * h_rack / 62;

        //var masterList = hosts[i].jobList.filter(function (d) {
        //    return d;
            //return d.masterQueue == "MASTER";
        //})
        //console.log("masterList="+masterList.length);

        svg.selectAll(".hpcc_nodessss" + hosts[i].hpcc_rack + "_" + hosts[i].hpcc_node)
            .data(hosts[i].jobList)
            .enter().append("rect")
            .attr("class", function (d,j) {
                return "hpcc_node_" + hosts[i].hpcc_rack + "_" + hosts[i].hpcc_node + "_"+j;
            })
            .attr("x", function (d, j) {
                d.x = hosts[i].x + node_size * j;
                return d.x;
            })
            .attr("y", function (d) {
                return hosts[i].y;
            })
            .attr("width", node_size)
            .attr("height", node_size )
            .attr("fill", function (d) {
                return getColor(d.user);
            })
            .attr("fill-opacity",0.02)
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
            .on("mouseout", mouseoutNode2);
    }

    // Network **********************************
     simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.index }))
        .force("collide",d3.forceCollide( function(d){return 20 }).iterations(16) )
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, h_rack+150))
        .force("y", d3.forceY(0))
        .force("x", d3.forceX(0))

     link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("stroke", "black")

     node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(users)
        .enter().append("circle")
        .attr("r", getRadius)
        .attr("fill", function(d,i) {
            return getColor(d.name);

        })
        .attr("fill-opacity", 1)
        .attr("stroke", "#000")
        .attr("stroke-width", 0)
        .attr("stroke-opacity", 1)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));



    // Conpute users x position by averaging nodes x  -----------
    for (var i=0; i<users.length;i++) {
        var sumX =0;
        for (var j=0; j<users[i].nodes.length;j++) {
            //if (users[i].nodes[j].masterQueue=="MASTER")
            sumX+=users[i].nodes[j].x;
        }
        if (users[i].nodes.length>0)
            users[i].averageX = sumX/users[i].nodes.length;
        else
            users[i].averageX =0;
    }


    var images = svg.selectAll(".nodeImages")
        .data(users).enter().append("svg:image")
        .attr("class", "nodeImages")
        .attr("opacity",1)
        .attr("xlink:href",  function(d) { return "images/user.png"})
        .attr("x", function(d) { return 0;})
        .attr("y", function(d) { return 0;})
        .attr("height", function(d){ return getRadius(d)*2;})
        .attr("width", function(d){ return getRadius(d)*2;})
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("mouseover", mouseoverUser)
        .on("mouseout", mouseoutUser);


    // make node more transparent to be ready for the simulation
    svg.selectAll(".nodeImages")
        .transition().duration(3000)
        .attr("opacity", 0.01);
    node.transition().duration(3000)
        .attr("fill-opacity", 0.01);

    var ticked = function() {
        for (var i=0; i<users.length;i++) {
            users[i].x = users[i].averageX*0.1 +users[i].x*0.9;
        }
        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        images
            .attr("x", function(d) { return d.x-getRadius(d); })
            .attr("y", function(d) { return d.y-getRadius(d); });
    }

    simulation
        .nodes(users)
        .on("tick", ticked);

    simulation.force("link")
        .links(links);

}


