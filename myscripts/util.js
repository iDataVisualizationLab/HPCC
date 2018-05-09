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
    if (d.nodes.length<200){
        return numberOfProcessors;
    }
    else {
        var maxNodes =  users[0].nodes.length;
        var scale = d3.scaleLinear().domain([0,maxNodes]).range([0, numberOfProcessors*0.25]);
        return numberOfProcessors*0.25-scale(d.nodes.length);
    }
}

function mouseoverUser(d){
    // host **********************
    tool_tip2.show(d);

    var max = getMaxNodesToShow(d);
    for (var i=0; i<hosts.length;i++) {
        var count =0;
        for (var j = 0; j < hosts[i].jobList.length; j++) {
            //console.log(hosts[i].jobList[j].user);
            if (hosts[i].jobList[j].user == d.name){//} && hosts[i].jobList[j].masterQueue=="MASTER") {
                svg.selectAll(".hpcc_node_" + hosts[i].hpcc_rack + "_" + hosts[i].hpcc_node+ "_"+j)
                    .attr("fill-opacity", 1);
                count++;
                if (count>max) // limit the number of host to highlight
                    break;
            }
        }
    }
}

function mouseoutUser(d){
    tool_tip2.hide(d);
    var max = getMaxNodesToShow(d);
    for (var i=0; i<hosts.length;i++) {
        var count =0;
        for (var j = 0; j < hosts[i].jobList.length; j++) {
            //console.log(hosts[i].jobList[j].user);
            if (hosts[i].jobList[j].user == d.name){//} && hosts[i].jobList[j].masterQueue=="MASTER") {
                svg.selectAll(".hpcc_node_" + hosts[i].hpcc_rack + "_" + hosts[i].hpcc_node+ "_"+j)
                    .attr("fill-opacity", 0.1);
                count++;
                if (count>max) // limit the number of host to highlight
                    break;
            }
        }
    }
}

function mouseoverNode2(d1){
    tool_tip2.show(d1);
}

function mouseoutNode2(d1){
    tool_tip2.hide(d1);
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