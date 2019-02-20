function getRadius(d) {
    return 5+Math.pow(d.nodes.length,0.35);
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


function getMaxNodesToShow(d){
    return 1000;
    /*if (d.nodes.length<200){
        return numberOfProcessors;
    }
    else {
        var maxNodes =  users[0].nodes.length;
        var scale = d3.scaleLinear().domain([0,maxNodes]).range([1, numberOfProcessors*0.5]);
        return numberOfProcessors-scale(d.nodes.length);
    }*/
}

function mouseoverUser(d){
    // host **********************
    //tool_tip.show(d);
    svg.append("text")
        .attr("class", "textUsernames")
        .attr("x", d.x)
        .attr("y", d.y+getRadius(d)+14)
        .attr("fill", getColor(d.name))
        .style("text-anchor","middle")
        .style("font-size",16)
        //.style("font-weight","bold")
        .attr("font-family", "sans-serif")
        .text(d.name);

    svg.append("text")
        .attr("class", "textUserNodes")
        .attr("x", d.x)
        .attr("y", d.y+getRadius(d)+28)
        .attr("fill", "#000")
        .style("text-anchor","middle")
        .style("font-size",12)
        .attr("font-family", "sans-serif")
        .text("Total nodes = "+d.nodes.length);


    showHost(d);
x

    svg.selectAll(".nodeImages")
        .attr("opacity", function(d2){
            return (d.name==d2.name) ? 1 :0.1;});
    node.attr("fill-opacity", function(d2){
        return (d.name==d2.name) ? 1 :0.1;});

    svgStream.selectAll(".areaUser")
        .style("fill-opacity", function(d2){  return (d.name==d2.key) ? 1 :0.1;});

}

function showHost(d){
    var max = getMaxNodesToShow(d);
    for (var i=0; i<hosts.length;i++) {
        var count =0;
        for (var j = 0; j < hosts[i].jobList.length; j++) {
            //console.log(hosts[i].jobList[j].user);
            if (hosts[i].jobList[j].user == d.name){//} && hosts[i].jobList[j].masterQueue=="MASTER") {
                svg.selectAll(".hpcc_node_" + hosts[i].hpcc_rack + "_" + hosts[i].hpcc_node+ "_"+j)
                    .attr("fill-opacity", 1)
                    .attr("stroke", "#000");
                count++;
                if (count>max) // limit the number of host to highlight
                    break;
            }
        }
    }
}



function hideHost(d){
    var max = getMaxNodesToShow(d);
    for (var i=0; i<hosts.length;i++) {
        var count =0;
        for (var j = 0; j < hosts[i].jobList.length; j++) {
            //console.log(hosts[i].jobList[j].user);
            if (hosts[i].jobList[j].user == d.name){//} && hosts[i].jobList[j].masterQueue=="MASTER") {
                svg.selectAll(".hpcc_node_" + hosts[i].hpcc_rack + "_" + hosts[i].hpcc_node+ "_"+j)
                    .attr("fill-opacity", 0.3)
                    .attr("stroke", "#fff");
                count++;
                if (count>max) // limit the number of host to highlight
                    break;
            }
        }
    }
}


function mouseoutUser(d){
    //tool_tip.hide(d);

    hideHost(d);
    svg.selectAll(".textUsernames").remove();
    svg.selectAll(".textUserNodes").remove();

    svg.selectAll(".nodeImages")
        .attr("opacity", 1);
    node.attr("fill-opacity",1);

    svgStream.selectAll(".areaUser")
        .style("fill-opacity", 1);
}

function mouseoverNode2(d1){
    tool_tip.show(d1);
}

function mouseoutNode2(d1){
    tool_tip.hide(d1);
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