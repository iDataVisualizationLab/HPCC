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

function mouseoverUser(d){
    // Draw host **********************
    for (var i=0; i<hosts.length;i++) {
        for (var j = 0; j < hosts[i].jobList.length; j++) {
            //console.log(hosts[i].jobList[j].user);
            if (hosts[i].jobList[j].user == d.name) {
                svg.selectAll(".hpcc_node_" + hosts[i].hpcc_rack + "_" + hosts[i].hpcc_node)
                    .attr("fill-opacity", 1)
                    .attr("stroke", "#f00")
                    .attr("stroke-weight", 100);
            }
        }
    }
}

function mouseoutUser(d){

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