/// drawLegend *****************************************************************
function drawLegend(s,arrThresholds, arrColor, dif){
    // var x =100;
    // var y = 30;
    var r = 20;
    // var barW= 5;
    var gradient = svgLengend.append('defs')
        .append('linearGradient')
        .attr('id', 'gradient')
        .attr('x1', '0%') // bottom
        .attr('y1', '0%')
        .attr('x2', '0%') // to top
        .attr('y2', '100%')
        .attr('spreadMethod', 'pad');

    // if (selectedService==="Memory_usage" || selectedService==="Job_load")
    //     barW =8;
    // var xScale = d3.scaleLinear()
    //     .domain([arrThresholds[0], arrThresholds[arrThresholds.length-1]]) // input
    //     .range([x, x+250]); // output

    var xStep = dif/10.;
    var xStepLength = (arrThresholds[arrThresholds.length-1]-arrThresholds[0])/xStep;

    var pct = linspace(0, 100, xStepLength).map(function(d) {
        return Math.round(d);
    });
    let gap = d3.scaleLinear()
        .domain([0, 100]) // input
        .range(d3.extent(arrThresholds)); // output
    pct.forEach(function(d) {
        gradient.append('stop')
            .attr('offset', d+"%")
            .attr('stop-color', color(gap(d)))
            .attr('stop-opacity', opa(gap(d)));
    });

    svgLengend.append('rect')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('width', r)
        .attr('height', arrThresholds.length*16)
        .style('fill', 'url(#gradient)');
    // var arr2 = [];
    // for (var i=arrThresholds[0]; i<arrThresholds[arrThresholds.length-1];i=i+xStep){
    //     arr2.push(i);
    // }
    //
    // svgLengend.selectAll(".legendText")
    //     .data(arrThresholds)
    //     .join(
    //         enter => enter.append("text")
    //             .attr("class", "legendText"),
    //         update => update.attr("fill", "blue")
    //     ).attr("x", function (d) {
    //         return xScale(d);
    //     })
    //     .attr("y", y-2)
    //     .attr("fill", "#000")
    //     .style("text-anchor", "middle")
    //     .style("font-size", "12px")
    //     .attr("font-family", "sans-serif")
    //     .text(function (d,i) {
    //         if (selectedService===serviceList[2] && (i==0 || i==2 || i==4 || i==6))  // memory
    //             return "";
    //         else if (selectedService===serviceList[3] && i==0)  // Fan speed
    //             return "";
    //         else
    //             return Math.round(d);
    //     });
    //
    // svgLengend.selectAll(".legendText2").remove();
    // svgLengend.selectAll(".legendText2")
    //     .data(arrThresholds)
    //     .enter().append("text")
    //     .attr("class", "legendText")
    //     .attr("x", function (d,i) {
    //         return xScale(d);
    //     })
    //     .attr("y", y-15)
    //     .attr("fill",function (d,i) {
    //         return color(d);
    //     })
    //     .style("text-anchor", "middle")
    //     //.style("font-weight","bold")
    //     .style("font-size", "12px")
    //     .attr("font-family", "sans-serif")
    //     .text(function (d,i) {
    //         if (i==1 || i==5){
    //             if (selectedService==serviceList[1] && (i==1 || i==5))   // No lower & upper bound for CPU load
    //                 return "";
    //             else if (selectedService==serviceList[2] && i==1)   // No lower bound for Memory usage
    //                 return "";
    //             else
    //                 return "Critical";
    //         }
    //         else if (i==3)
    //             return "OK";
    //         else
    //             return "";
    //     });
    //
    // svgLengend.selectAll(".legendText1").remove();
    // svgLengend.append("text")
    //     .attr("class", "legendText1")
    //     .attr("x", x-7)
    //     .attr("y", y+15)
    //     .style("text-anchor", "end")
    //     .attr("fill", "#000")
    //     .style("font-style","italic")
    //     .style("font-size", "12px")
    //     .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
    //     .attr("font-family", "sans-serif")
    //     //.text("Temperature (°F)");
    //     .text(s+"");
    // svgLengend.append("text")
    //     .attr("class", "legendText22")
    //     .attr("x", x-5)
    //     .attr("y", y+39)
    //     .style("text-anchor", "end")
    //     .attr("fill", "#000")
    //     .style("font-style","italic")
    //     .style("font-size", "12px")
    //     .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
    //     .attr("font-family", "sans-serif")
    //     .text("Sudden change: ");
}

function linspace(start, end, n) {
    var out = [];
    var delta = (end - start) / (n - 1);

    var i = 0;
    while(i < (n - 1)) {
        out.push(start + (i * delta));
        i++;
    }

    out.push(end);
    return out;
}