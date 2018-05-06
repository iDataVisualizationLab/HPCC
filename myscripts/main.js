

// Set the dimensions of the canvas / graph
var margin = {top: 5, right: 30, bottom: 50, left: 70};

var svg = d3.select("svg"),
    width = +document.getElementById("mainBody").offsetWidth-margin.left-margin.right,
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

d3.json("data/host_usage1.json", function(data_) {
    hosts = data_;
    main();
    // Spinner Stop ********************************************************************
    spinner.stop();

});


var getColor = d3.scaleOrdinal(d3.schemeCategory20);



var dur = 400;  // animation duration


var startDate = new Date("4/1/2018");
var endtDate = new Date("1/1/2019");
var today = new Date();

function getCategoty(str){
    if (str=="PhD")
        return 3;
    else if (str=="MSSE")
        return 2;
    else if (str=="MSCS")
        return 1;
    else
        return 0;
}



var numberOfProcessors = 72;
var h_rack = 500;
var top_margin = 90;
var w_rack = 200;
var w_gap =0;
var node_size = w_rack/numberOfProcessors;

var users = [];
var racks = [];
function main(){
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
        racks[i].x = racks[i].id* (w_rack + w_gap) -w_rack;
        racks[i].y = top_margin;
    }
    svg.append("g")
        .attr("class", "rackRects")
        .selectAll("circle")
        .data(racks)
        .enter().append("rect")
        .attr("x", function (d) {return d.x-4;})
        .attr("y", function (d) {return d.y;})
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("width", w_rack-4)
        .attr("height", h_rack)
        .attr("fill", "#fff")
        .attr("stroke", "#000")
        .attr("stroke-weight", 1);
    svg.append("g")
        .attr("class", "rackRectText1")
        .selectAll("circle")
        .data(racks)
        .enter().append("text")
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

    svg.append("g")
        .attr("class", "rackRectText2")
        .selectAll("circle")
        .data(racks)
        .enter().append("text")
        .attr("x", function (d) {return d.x+w_rack/2-2;})
        .attr("y", function (d) {return d.y-12;})
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
        hosts[i].y = racks[hosts[i].hpcc_rack-1].y + hosts[i].hpcc_node * h_rack / 70;

        svg.selectAll(".hpcc_node_" + hosts[i].hpcc_rack + "_" + hosts[i].hpcc_node)
            .data(hosts[i].jobList)
            .enter().append("rect")
            .attr("class", "hpcc_node" + hosts[i].hpcc_rack + "_" + hosts[i].hpcc_node)
            .attr("x", function (d, j) {
                d.x = hosts[i].x + node_size * j;
                return d.x;
            })
            .attr("y", function (d) {
                return hosts[i].y;
            })
            .attr("width", node_size)
            .attr("height", node_size + 2)
            .attr("fill", function (d) {
                return getColor(d.user);
            })
            .attr("fill-opacity",0.7)
            .attr("stroke", "#fff")
            .attr("stroke-weight", 0)
            .on("mouseover", mouseoverNode2)
            .on("mouseout", mouseoutNode2);
    }

    // Network **********************************
    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.index }))
        .force("collide",d3.forceCollide( function(d){return 20 }).iterations(16) )
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, (h_rack+top_margin) + (height -h_rack-top_margin) / 2))
        .force("y", d3.forceY(0))
        .force("x", d3.forceX(0))

    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("stroke", "black")

    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(users)
        .enter().append("circle")
        .attr("r", getRadius)
        .attr("fill", function(d,i) {
            return getColor(d.name);

        })
        .attr("fill-opacity", 0.8)
        .attr("stroke", "#000")
        .attr("stroke-width", 0.5)
        .attr("stroke-opacity", 1)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));



    // Conpute users x position by averaging nodes x  -----------
    for (var i=0; i<users.length;i++) {
        var sumX =0;
        for (var j=0; j<users[i].nodes.length;j++) {
            sumX+=users[i].nodes[j].x;
        }
        if (users[i].nodes.length>0)
            users[i].averageX = sumX/users[i].nodes.length;
        else
            users[i].averageX =0;
    }


    var nodeEnter = svg.append("g")
        .attr("class", "nodesImage")
        .selectAll("circle")
        .data(users).enter().append("svg:g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + 0+ "," + 0 + ")"; });

    // Append images
    var images = nodeEnter.append("svg:image")
        .attr("xlink:href",  function(d) { return "images/user.png"})
        .attr("x", function(d) { return -getRadius(d)*2;})
        .attr("y", function(d) { return -getRadius(d)*2;})
        .attr("height", function(d){ return getRadius(d)*2;})
        .attr("width", function(d){ return getRadius(d)*2;});



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
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; });
    }

    simulation
        .nodes(users)
        .on("tick", ticked);

    simulation.force("link")
        .links(links);



    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

function getRadius(d) {
    return Math.pow(d.nodes.length,0.5);
}

function isContainUser(array, name) {
    var foundIndex = -1;
    for(var i = 0; i < array.length; i++) {
        if (array[i].name == name) {
            foundIndex = i;
            break;
        }
    }
    return foundIndex;
}

function isContainRack(array, id) {
    var foundIndex = -1;
    for(var i = 0; i < array.length; i++) {
        if (array[i].id == id) {
            foundIndex = i;
            break;
        }
    }
    return foundIndex;
}

function mouseoverNode2(d1){
    tool_tip2.show(d1);
}

function mouseoutNode2(d1){
    tool_tip2.hide(d1);

    svg.selectAll(".nodeCircle")
        .transition().duration(dur)
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1);
}


