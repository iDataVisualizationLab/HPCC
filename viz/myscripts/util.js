var w = 300,
    h = 77;

var svgLengend = d3.select('.legendHolder').append('svg')
    .attr("class", "legendView")
    .attr("width", w)
    .attr("height", h);

var x = d3.scaleLinear()
    .domain([0, 50])
    .range([0, 150])
    .clamp(true);

var slider = svgLengend.append("g")
    .attr("class", "slider")
    .attr("transform", "translate(" + 116 + "," + 50+ ")");

slider.append("line")
    .attr("class", "track")
    .attr("x1", x.range()[0])
    .attr("x2", x.range()[1])
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-inset")
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-overlay")
    .call(d3.drag()
        .on("start.interrupt", function() { slider.interrupt(); })
        .on("start drag", function() { hue(x.invert(d3.event.x)); }));

slider.insert("g", ".track-overlay")
    .attr("class", "ticks")
    .attr("transform", "translate(0," + 18 + ")")
    .selectAll("text")
    .data(x.ticks(5))
    .enter().append("text")
    .attr("x", x)
    .attr("text-anchor", "middle")
    .text(function(d) { return d + "°"; });

var handle = slider.insert("circle", ".track-overlay")
    .attr("class", "handle")
    .attr("r", 5)
    .attr("cx",100);

slider.transition() // Gratuitous intro!
    .duration(750)
    .tween("hue", function() {
        var i = d3.interpolate(0, 70);
        return function(t) { hue(i(t)); };
    });



/// When we move slider *****************************************************************
function hue(hhh) {
    var xx = x(hhh);
    if (xx < 0)
        xx = 0;
    handle.attr("cx", xx);

    if (xx>1){
        //    clearInterval(interval2);

        for (var name in hostResults) {
            var r = hostResults[name];
            // Process the array of historical temperatures
            var maxIncrease = 0;
            var preTemp1 = 0;
            var preTemp2 = 0;
            for (var i = 0; i < r.arr.length; i++) {
                var str = r.arr[i].data.service.plugin_output;
                var arrString = str.split(" ");
                var temp1 = +arrString[2];
                var temp2 = +arrString[6];

                if (i>=1){
                    var dif1 = temp1-preTemp1;
                    var dif2 = temp2-preTemp2;

                    var max = Math.max(dif1,dif2);
                    if (max>maxIncrease)
                        maxIncrease=max;
                }
                preTemp1 = temp1;
                preTemp2 = temp2;
            }
            var sliderValue = xx/3;  // based on the range above
            if (maxIncrease>sliderValue){
                //console.log(name+" "+maxIncrease +" "+xx/3);
            }
            else{
                svg.selectAll("."+name).attr("fill-opacity",0);
            }

        }

    }

}


function drawLegend(arr, arrColor) {
    var x =110;
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
        .style("font-size", "12px")
        .attr("font-family", "sans-serif")
        .text(function (d) {
            return " "+d;
        });
    svgLengend.append("text")
        .attr("class", "legendText1")
        .attr("x", x-7)
        .attr("y", y+15)
        .style("text-anchor", "end")
        .attr("fill", "#000")
        .style("font-style","italic")
        .style("font-size", "12px")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text("Temperature (°F)");
    svgLengend.append("text")
        .attr("class", "legendText22")
        .attr("x", x-5)
        .attr("y", y+39)
        .style("text-anchor", "end")
        .attr("fill", "#000")
        .style("font-style","italic")
        .style("font-size", "12px")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text("Sudden Increase: ");
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