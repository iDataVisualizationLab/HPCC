

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


d3.json("data/host_usage1.json", function(data_) {
    hosts = data_;
    main();

});

// Force-directed layout
var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("link", d3.forceLink().distance(1).strength(1))
    .force("charge", d3.forceManyBody().strength(-0.1));


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
var h_rack = 320;
var top_margin = 60;
var w_rack = 200;
var w_gap =0;
var node_size = w_rack/numberOfProcessors;

var users = [];

function main(){
    // HPCC ****************************************
    for (var i=0; i<hosts.length;i++) {
        hosts[i].hpcc_rack = hosts[i].hostname.split("-")[1];
        hosts[i].hpcc_node = hosts[i].hostname.split("-")[2].split(".")[0];
        //console.log(hosts[i].hostname+" rack="+hosts[i].hpcc_rack+" "+hosts[i].hpcc_node+" "+hosts[i].jobCount+"/"+hosts[i].numberOfProcessors);

        hosts[i].x = hosts[i].hpcc_rack * (w_rack + w_gap) - 200;
        hosts[i].y = top_margin + hosts[i].hpcc_node * h_rack / 50;

        svg.selectAll(".hpcc_node_" + hosts[i].hpcc_rack + "_" + hosts[i].hpcc_node)
            .data(hosts[i].jobList)
            .enter().append("rect")
            .attr("class", "hpcc_node" + hosts[i].hpcc_rack + "_" + hosts[i].hpcc_node)
            .attr("x", function (d, j) {
                return hosts[i].x + node_size * j;
            })
            .attr("y", function (d) {
                return hosts[i].y;
            })
            .attr("width", node_size)
            .attr("height", node_size + 2)
            .attr("fill", function (d) {
                return getColor(d.user);
            })
            .attr("stroke", "#fff")
            .attr("stroke-weight", 0)
            .on("mouseover", mouseoverNode2)
            .on("mouseout", mouseoutNode2);

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
    }
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

function dragstarted2(d) {
    if (!d3.event.active) simulation2.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged2(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended2(d) {
    if (!d3.event.active) simulation2.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}
