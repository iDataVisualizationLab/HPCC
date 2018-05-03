

// Set the dimensions of the canvas / graph
var margin = {top: 5, right: 30, bottom: 50, left: 70};

var svg = d3.select("svg"),
    width = +document.getElementById("mainBody").offsetWidth-margin.left-margin.right,
    height = +svg.attr("height")-margin.top-margin.bottom;

svg = svg.append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

var w2 =10;
var h2 =50;
var svg2 = d3.select("#networkHolder").append("svg")
    .attr("width", w2)
    .attr("height", h2);

// Parse the date / time
var parseTime = d3.timeParse("%m/%d/%y");

// Set the ranges
var x = d3.scaleTime().range([0, width-margin.left*2]);
var xNew = d3.scaleTime().range([0, width/2-margin.left]);

var y = d3.scaleLinear().range([height, 0]);
var yAxis= d3.scaleLinear().range([height, 0]);


// Student info data  
var dataG = {};


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

var simulation2 = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("center", d3.forceCenter().x(w2/2).y(h2/2))
    .force("charge", d3.forceManyBody().strength(-2));

var getColor = d3.scaleOrdinal(d3.schemeCategory20);

var radius = 8;

var node, link;
var node2, link2;
var nodePie, node2Text;

var dur = 400;  // animation duration

// Force-directed layout
var nodes=[];
var links=[];
var nodes2=[];
var links2=[];

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
var data = {};

var sponsorlist = [];
var maxSponsor =83;
function getGrantName(name){
    for(var i = 0; i < maxSponsor; i++) {
        if (sponsorlist[i].name == name) {
            return name;
        }
    }
    return "Others";
}
var radiusScale ; // Radius scale, defined later


function main(){
    // HPCC ****************************************
    for (var i=0; i<hosts.length;i++){
        hosts[i].hpcc_rack = hosts[i].hostname.split("-")[1];
        hosts[i].hpcc_node = hosts[i].hostname.split("-")[2].split(".")[0];
        //console.log(hosts[i].hostname+" rack="+hosts[i].hpcc_rack+" "+hosts[i].hpcc_node+" "+hosts[i].jobCount+"/"+hosts[i].numberOfProcessors);
    }

    var top_margin = 60;
    var w_rack = 100;
    var w_gap =10;
    var h_rack = 800;
    svg.selectAll(".hpcc_node")
        .data(hosts)
        .enter().append("rect")
        .attr("class","hpcc_node")
        .attr("x", function(d){ return d.hpcc_rack*(w_rack+w_gap); })
        .attr("y", function(d){ return top_margin+ d.hpcc_node*h_rack/50; })
        .attr("width", w_rack)
        .attr("height", h_rack/50)
        .attr("fill", "#ff0")
        .attr("stroke", "#fff")
        .attr("stroke-weight", 0.2)
        .on("mouseover", mouseoverNode2)
        .on("mouseout", mouseoutNode2);

}

function mouseoverNode2(d1){
    tool_tip2.show(d1);

    var list =  "__"+d1.name+"__";
    for (var i=0;i<links2.length;i++){
        if (d1.name==links2[i].source.name ){
            list+=links2[i].target.name+"__";
        }
        else  if (d1.name==links2[i].target.name ){
            list+=links2[i].source.name+"__";
        }
    }
    svg2.selectAll(".nodeCircle")
        .transition().duration(dur)
        .attr("fill-opacity", function (d2){
            return list.indexOf("__"+d2.name+"__")>=0 ? 1 : 0.05; })
        .attr("stroke-opacity", function (d2){
            return list.indexOf("__"+d2.name+"__")>=0 ? 1 : 0; });

    svg.selectAll(".nodeCircle")
        .transition().duration(dur)
        .attr("stroke-opacity", function(d2){
            for (var i=0; i<d2.valueList.length;i++){
                if (d1.name ==d2.valueList[i].sponsor){
                    return 1;
                }
            }

            return 0.05;


        });
    svg.selectAll(".nodePie")
        .transition().duration(dur)
        .attr("stroke-opacity", function (d2){
            if (d2.Deadline<today)
                return 0.1;
            else{
                for (var i=0; i<d2.valueList.length;i++){
                    if (d1.name ==d2.valueList[i].sponsor){
                        return 1;
                    }
                }

                return 0.05;
            }
        })
        .attr("fill-opacity", function (d2) {
            if (d2.Deadline<today)
                return 0.1;
            else{
                for (var i=0; i<d2.valueList.length;i++){
                    if (d1.name ==d2.valueList[i].sponsor){
                        return 1;
                    }
                }

                return 0.05;
            }
        });


    svg2.selectAll(".links")
        .transition().duration(dur)
        .attr("stroke-opacity", function (d2){
            if (d1.name==d2.source.name ){
                list+="__"+d2.target.name;
            }
            return (d1.name==d2.source.name || d1.name==d2.target.name) ? 1 : 0.05; });

}

function mouseoutNode2(d1){
    tool_tip2.hide(d1);

    svg2.selectAll(".nodeCircle")
        .transition().duration(dur)
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1);
    svg2.selectAll(".links")
        .transition().duration(dur)
        .attr("stroke-opacity", 1);

    svg.selectAll(".nodeCircle")
        .attr("stroke-opacity", 1);


    svg.selectAll(".nodeCircle")
        .transition().duration(dur*4)
        .attr("r", function (d,i){
            if (i%2==0)
                return 0;
            else
                return radiusScale(Math.sqrt(d.Amount));
        });
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
