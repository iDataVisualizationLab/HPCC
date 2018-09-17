var w = 300,
    h = 70;

var svgLengend = d3.select('.legendHolder').append('svg')
    .attr("class", "legendView")
    .attr("width", w)
    .attr("height", h);


function drawLegend(arr, arrColor) {
    var x =100;
    var y = 16;
    var r = 20;
    svgLengend.selectAll(".legendRect").remove();
    svgLengend.selectAll(".legendRect")
        .data(arr)
        .enter().append("rect")
        .attr("class", "legendRect")
        .attr("x", function (d,i) {
            return x +i*r*2;
        })
        .attr("y", y)
        .attr("width", r*2)
        .attr("height", r)
        .attr("fill",function (d,i) {
            return arrColor[i];
        })
        .attr("fill-opacity",function (d,i) {
            if (i==0)
                return opa(40);
            else
                return opa(d);
        })
        .attr("stroke-width", 0);
    svgLengend.selectAll(".legendText").remove();
    svgLengend.selectAll(".legendText")
        .data(arr)
        .enter().append("text")
        .attr("class", "legendText")
        .attr("x", function (d,i) {
            return x +i*r*2;
        })
        .attr("y", y-2)
        .attr("fill", "#000")
        .style("text-anchor", "start")
        .style("font-size", 12)
        .attr("font-family", "sans-serif")
        .text(function (d) {
            return " "+d;
        });
    svgLengend.append("text")
        .attr("class", "legendText1")
        .attr("x", x-4)
        .attr("y", y+15)
        .style("text-anchor", "end")
        .attr("fill", "#000")
        .style("font-style","italic")
        .style("font-size",12)
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text("Temperature (F)");
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