

// Set the dimensions of the canvas / graph
var margin = {top: 5, right: 30, bottom: 50, left: 70};

var svg = d3.select("svg"),
    width = +document.getElementById("mainBody").offsetWidth-margin.left-margin.right,
    height = +svg.attr("height")-margin.top-margin.bottom;

svg = svg.append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

var w2 =500;
var h2 =450;
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
d3.csv("grants/data/ResearchInsights.csv", function(error, dataG_) {
    // Filter data by endDate
    dataG = dataG_.filter(function(d,i){
        var date = new Date(dataG_[i].Deadline);
        if (date<endtDate)
            return d;
    });

    main();
})

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
    // Scale the range of the data
    x.domain([startDate,endtDate]);
    xNew.domain([startDate,endtDate]);
    y.domain([0, 15]);
    yAxis.domain([0, 0.15]);

    // Draw color legend *************************
    svg.append("line")
        .attr("class", "legendLine10")
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .style("stroke-dasharray", ("2, 2"))
        .attr("x1", x(today))
        .attr("y1", y(10))
        .attr("x2", x(today))
        .attr("y2", height);
    svg.append("text")
        .attr("class", "title")
        .style("font-size", "14px")
        .attr("text-anchor", "left")
        .attr("fill", "#666")
        .attr("x", x(today))
        .attr("y", y(10))
        .text("Today");

    svg2.append("text")
        .attr("class", "title")
        .style("font-size", "16px")
        .attr("text-anchor", "left")
        .attr("fill", "#444")
        .attr("x", 20)
        .attr("y", 20)
        .text("Cosponsorship network");

    // Draw title *******************************
    svg.append("text")
        .attr("class", "title")
        .style("font-size", "20px")
        .attr("text-anchor", "left")
        .attr("fill", "#000")
        .attr("x", margin.left)
        .attr("y", 20)
        .text("Related research grants");

    // Draw Label for yAxis *******************************
    svg.append("text")
        .attr("class", "title")
        .style("font-size", "17px")
        .attr("text-anchor", "middle")
        .attr("fill", "#000")
        .attr("x", width/2-100)
        .attr("y", height+40)
        .text("Date");


    // Add the x Axis
    svg.append("g")
        .attr("class", "xAxis")
        .style("font-size", "14px")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add the y Axis
    // svg.append("g")
    //   .style("font-size", "14px")
    //   .call(d3.axisLeft(yAxis).ticks(12));
    dataG.sort(function(a,b){
        if (new Date(a.Deadline)<new Date(b.Deadline)){
            return -1;
        }
        else
            return 1;
    })


    var minAmount= +dataG[0].Amount;
    var maxAmount= +dataG[0].Amount;
    for (var i=0; i<dataG.length;i++){
        dataG[i].Amount = +dataG[i].Amount;

        var nod1 = {};
        nod1.name = dataG[i].Title;
        nod1.Amount = +dataG[i].Amount;
        nod1.Sponsors = dataG[i].Sponsors;
        nod1.Link = dataG[i].Link;
        nod1.Deadline = new Date(dataG[i].Deadline);
        nod1.originalOrder = nodes.length;
        nodes.push(nod1);

        var nod2 = {};
        nod2.name = dataG[i].Title;
        nod2.Amount = +dataG[i].Amount;
        nod2.Deadline = new Date(dataG[i].Deadline);
        nod2.Link = dataG[i].Link;
        nod2.Sponsors = dataG[i].Sponsors;
        nod2.SponsorList = dataG[i].Sponsors.split(", ");
        nod2.originalOrder = nodes.length;
        nodes.push(nod2);

        // Compute min and max amount
        if (dataG[i].Amount<minAmount)
            minAmount = dataG[i].Amount;
        if (dataG[i].Amount>maxAmount)
            maxAmount = dataG[i].Amount;

        var lin = {};
        lin.source = nod1;
        lin.target = nod2;
        lin.group = nod1.group;
        links.push(lin);
    }

    function isContainObject(array, name) {
        var found = false;
        for(var i = 0; i < array.length; i++) {
            if (array[i].name == name) {
                found = true;
                break;
            }
        }
        return found;
    }
    // Compute Sponsors list
    var indexOfsponsorlist = {};
    for (var i=0; i<dataG.length;i++) {
        var list = dataG[i].Sponsors.split(", ");
        for (var j = 0; j < list.length; j++) {
            if (isContainObject(sponsorlist,list[j])==false){
                var obj = {};
                obj.name = list[j];
                obj.Amount = 0;   // initialize the amount of money
                sponsorlist.push(obj);
                indexOfsponsorlist[obj.name] = sponsorlist.length-1;
            }
        }
    }

    // Compute Sponsors Money
    for (var i=0; i<dataG.length;i++) {
        var list = dataG[i].Sponsors.split(", ");
        if (list.length>0){
            var money = dataG[i].Amount/list.length;
            for (var k = 0; k < list.length; k++) {
                var index =  indexOfsponsorlist[list[k]];
                sponsorlist[index].Amount += money;
            }
        }
    }
    // Compute Co-Sponsors list
    var cosponsorArray = new Array(sponsorlist.length);
    for (var j = 0; j < sponsorlist.length; j++) {
        cosponsorArray[j] = new Array(sponsorlist.length);
    }
    for (var j = 0; j < sponsorlist.length; j++) {
        for (var k = 0; k < sponsorlist.length; k++) {
            cosponsorArray[j][k] =0;
        }
    }

    for (var i=0; i<dataG.length;i++) {
        var list = dataG[i].Sponsors.split(", ");
        for (var j = 0; j < list.length; j++) {
            for (var k = j+1; k < list.length; k++) {
                var indexJ = indexOfsponsorlist[list[j]]
                var indexK = indexOfsponsorlist[list[k]]
                if (indexJ<indexK)
                    cosponsorArray[indexJ][indexK] ++;
                if (indexJ>indexK)
                    cosponsorArray[indexK][indexJ] ++;
            }
        }
    }

    // Second network
    for (var i=0; i<sponsorlist.length;i++){
        var nod1 = {};
        nod1.name = sponsorlist[i].name;
        nod1.Amount = sponsorlist[i].Amount;
        nodes2.push(nod1);
    }

    for (var j = 0; j < sponsorlist.length; j++) {
        for (var k = j+1; k < sponsorlist.length; k++) {
            if (cosponsorArray[j][k]>0){
                var lin = {};
                lin.source = nodes2[j];
                lin.target = nodes2[k];
                lin.count = cosponsorArray[j][k];
                links2.push(lin);
            }
        }
    }
    // Search student nickname
    var optArray =[];
    for (var i=0; i<dataG.length;i++){
        optArray.push(dataG[i].Title);
    }

    optArray = optArray.sort();
    $(function () {
        $("#search").autocomplete({
            source: optArray
        });
    });

    link = svg.selectAll(".links")
        .data(links)
        .enter().append("line")
        .attr("class", "links")
        .attr("stroke", function(d){
            return "#000";
        })
        .attr("stroke-opacity", 0.02)
        .attr("stroke-width",0.5);

    radiusScale = d3.scaleLinear().range([3, 20]).domain([Math.sqrt(minAmount),Math.sqrt(maxAmount)]) ;

    sponsorlist = sponsorlist.sort(function(a,b){
        if (a.name=="None")
            return 1;
        if (a.Amount>b.Amount){
            return -1;
        }
        else return 1;
    })




    // Draw nodePie
    nodePie = svg.selectAll(".nodePie")
        .data(nodes)
        .enter().append("g")
        .attr("class", "nodePie");

    var arc = d3.arc()
        .innerRadius(0);
    var pie = d3.pie()
        .sort(null)
        .value(function (d) {
            return d.value;
        });
    nodePie.selectAll("path").data(function (d) {
        var list = d.Sponsors.split(", ");
        if (list.length>0){
            var money = d.Amount/list.length;
            d.valueList = [];
            for (var k = 0; k < list.length; k++) {
                obj = {};
                obj.value = money;
                obj.r = getRadius(d);
                obj.sponsor = list[k];
                obj.originalOrder = d.originalOrder;
                d.valueList.push(obj);
            }
        }
        return pie(d.valueList);
    })
        .enter().append("svg:path")
        .attr("d", function(d,i) {
            if (d.data.originalOrder%2==0)
                arc.outerRadius(0);
            else
                arc.outerRadius(d.data.r);
            return arc(d);
        })
        .style("fill", function(d) {
            return getColor(getGrantName(d.data.sponsor));
        });


    // Transparent nodes
    node = svg.selectAll(".nodeCircle")
        .data(nodes)
        .enter().append("circle")
        .attr("class","nodeCircle")
        .attr("r", function(d,i){
            return getRadius(d,i);
        })
        .attr("fill", function(d,i) {
            if (i%2==0)
                return "#000";
            else{
                return getColor(getGrantName(d.SponsorList[0]));
            }
        })
        .attr("fill-opacity", function(d){
            // if (d.Deadline<today)
            return 0.1;
            // else
            //     return 1;
        })
        .attr("stroke", "#000")
        .attr("stroke-width", 0.5)
        .attr("stroke-opacity", 1)
        .on("mouseover", mouseoverNode)
        .on("mouseout", mouseoutNode)
        .on("click", function(d){
            window.open(d.Link,'_blank')
        })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));


    mouseoutNode();


    link2 = svg2.selectAll(".links")
        .data(links2)
        .enter().append("line")
        .attr("class", "links")
        .attr("stroke", function(d){
            return "#000";
        })
        .attr("stroke-width",0.5);



    node2 = svg2.selectAll(".nodeCircle")
        .data(nodes2)
        .enter().append("circle")
        .attr("class","nodeCircle")
        .attr("r", function(d){
            return radiusScale(Math.sqrt(d.Amount));
        })
        .attr("fill", function(d,i) {
            return getColor(getGrantName(d.name));
        })
        .attr("stroke", "#fff")
        .attr("stroke-weight", 0.2)
        .on("mouseover", mouseoverNode2)
        .on("mouseout", mouseoutNode2)
        .call(d3.drag()
            .on("start", dragstarted2)
            .on("drag", dragged2)
            .on("end", dragended2));

    node2Text = svg2.selectAll(".nodeText")
        .data(nodes2)
        .enter().append("text")
        .attr("class","nodeText")
        .attr("dy",5)
        .style("text-anchor","middle")
        .style("font-size",11)
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255, 0.8")
        .attr("fill", function(d) {
            return getColor(getGrantName(d.name));
        })
        .attr("fill", "#000")
        .text(function(d){
            if (d.Amount>2000000 && d.name.length<10 && d.name!="None")
                return d.name;
        })
        .on("mouseover", mouseoverNode2)
        .on("mouseout", mouseoutNode2);

    simulation
        .nodes(nodes)
        .on("tick", ticked);
    simulation.force("link")
        .links(links);
    simulation.force("collide", d3.forceCollide(getRadius));

    simulation2
        .nodes(nodes2)
        .on("tick", ticked2);
    simulation2.force("link")
        .links(links2);
    simulation2.force("collide", d3.forceCollide(function(d){
        return getRadius(d)+1;
    }));

}

function getRadius(d,i){
    if (i%2==0)
        return 0;
    else
        return radiusScale(Math.sqrt(d.Amount));
}

function ticked() {
    if (document.getElementById("checkboxP1").checked) {
        var startY = 210;
        for (var i=0;i<nodes.length;i=i+2){
            nodes[i].x = x(nodes[i].Deadline);

            if (i==0){
                nodes[i].y =startY;
            }
            else {
                nodes[i].y = startY+i*3;
            }

        }
    }
    else {

        for (var i = 0; i < nodes.length; i = i + 2) {
            nodes[i].x = x(nodes[i].Deadline);
            nodes[i].y = height - 100;
        }
    }

    nodePie.attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
    });

    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
    node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
}

function ticked2() {
    link2
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
    node2
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
    node2Text.attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; });
}




function searchNode() {
    //searchTerm = document.getElementById('search').value;
    var value = document.getElementById('search').value;
    svg.selectAll(".nodeCircle")
        .transition().duration(dur*4)
        .attr("r", function (d,i){
            if (i%2==0)
                return 0;
            if (d.name.toLowerCase().indexOf(value.toLowerCase())>=0)
                return radiusScale(Math.sqrt(d.Amount));
            else
                return 0;
        });
    svg.selectAll(".nodePie")
        .transition().duration(dur*4)
        .attr("fill-opacity", function (d,i){
            if (i%2==0)
                return 0;
            if (d.name.toLowerCase().indexOf(value.toLowerCase())>=0){

                if (d.Deadline<today)
                    return 0.1;
                else
                    return 1;

            }

            else
                return 0;
        });
}

function check1() {
    simulation.stop();
    simulation.alphaTarget(0.03).restart();
}


function mouseoverNode(d1){
    tool_tip.show(d1);
    svg.selectAll(".nodePie")
        .transition().duration(dur)
        .attr("stroke-opacity", function (d2){
            return d1.name==d2.name ? 1 : 0.05; })
        .attr("fill-opacity", function (d2){
            return d1.name==d2.name ? 1 : 0.1; });

    svg.selectAll(".nodeCircle")
        .transition().duration(dur)
        .attr("stroke-opacity", function (d2){
            return d1.name==d2.name ? 1 : 0.05; });
}

function mouseoutNode(d1){
    tool_tip.hide(d1);

    svg.selectAll(".nodePie")
        .transition().duration(dur)
        .attr("fill-opacity", function(d){
            if (d.Deadline<today)
                return 0.1;
            else
                return 1;
        });

    svg.selectAll(".nodeCircle")
        .attr("stroke-opacity", function(d){
            if (d.Deadline<today)
                return 0.1;
            else
                return 1;
        });

    svg.selectAll(".nodeCircle")
        .transition().duration(dur*4)
        .attr("r", function (d,i){
            if (i%2==0)
                return 0;
            else
                return radiusScale(Math.sqrt(d.Amount));
        });


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

    mouseoutNode();
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
