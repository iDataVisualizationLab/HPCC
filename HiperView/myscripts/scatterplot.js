/**Vinh's code from here to there.
 *
 */
var scatterplot_settings = {
    circle_size: 1,
    data_onXaxis: "temperature", //Temperature, Memory_Usage, CPU_load, Fans_Health, Power
    data_onYaxis: "fanspeed", ////Temperature, Memory_Usage, CPU_load, Fans_Health, Power
    global_scale: {
        temperature: 122,
        memoryUsage: 100,
        fanspeed: 17850,
        cpuLoad: 10,
        powerUsage: 350
    }

};
var colorArray = ["#9dbee6", "#afcae6", "#c8dce6", "#e6e6e6", "#e6e6d8", "#e6d49c", "#e6b061", "#e6852f", "#e6531a", "#e61e1a"];

var colorRedBlue = d3.scaleLinear()
    .domain([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])
    .range(colorArray);

var sheight = 80,
    swidth = 80,
    offset = 50,
    padding = 25;
var xScale = d3.scaleLinear()
    .domain([0, scatterplot_settings.global_scale[scatterplot_settings.data_onXaxis]])
    .range([0, swidth]);

var yScale = d3.scaleLinear()
    .domain([0, scatterplot_settings.global_scale[scatterplot_settings.data_onYaxis]])
    .range([sheight, 0]);


var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

/**
 *
 * @param dataPoints in an array containing a set of x, y coordinate dataPoints =[{x:3, y:4, color:red, size:3},{},{}]
 * @constructor
 */
function ScatterPlotG(g, dataPoints) {


    var circles = g.selectAll("circle").data(dataPoints).enter();

    circles.append('circle')
        .attr("r", scatterplot_settings.circle_size)
        .attr("name", function (d) {
            return d.hostname;
        })
        .attr("cx", function (d) {
            return xScale(d[scatterplot_settings.data_onXaxis].value);
        })
        .attr("cy", function (d) {
            return yScale(d[scatterplot_settings.data_onYaxis].value);
        })
        .on("mouseover", function (d) {
            showTooltip(d)
        })
        .on("mouseout", function (d) {
            hideTooltip();
        });

}


function drawScatterPlot(svg, hostResults, index) {

    var g = svg.append("g")
        .attr('class', 'scatterPlot')
        .attr("transform", "translate(" + (index * (swidth + offset) + padding) + ",50)");


    var dataPoints = [];
    for (var key in hostResults) {
        var obj = {};
        obj.temperature = {};
        obj.temperature.query_time = hostResults[key].arrTemperature[hostResults[key].arrTemperature.length - 1].result.query_time;
        obj.temperature.plugin_output = hostResults[key].arrTemperature[hostResults[key].arrTemperature.length - 1].data.service.plugin_output;
        obj.temperature.value = d3.max(extractTemperature(obj.temperature.plugin_output));
        obj.hostname = key;
        obj.cpuLoad = {};
        obj.cpuLoad.plugin_output = hostResults[key].arrCPU_load[hostResults[key].arrCPU_load.length - 1].data.service.plugin_output;
        obj.cpuLoad.value = d3.max(extractCPULoad(obj.cpuLoad.plugin_output));
        obj.cpuLoad.query_time = hostResults[key].arrCPU_load[hostResults[key].arrCPU_load.length - 1].result.query_time;
        obj.fanspeed = {};
        obj.fanspeed.plugin_output = hostResults[key].arrFans_health[hostResults[key].arrFans_health.length - 1].data.service.plugin_output;
        obj.fanspeed.value = d3.max(extractFanHealth(obj.fanspeed.plugin_output));
        obj.memoryUsage = {};
        obj.memoryUsage.plugin_output = hostResults[key].arrMemory_usage[hostResults[key].arrMemory_usage.length - 1].data.service.plugin_output;
        obj.memoryUsage.value = extractMemoryUsage(obj.memoryUsage.plugin_output);
        obj.powerUsage = {};
        obj.powerUsage.plugin_output = hostResults[key].arrPower_usage[hostResults[key].arrPower_usage.length - 1].data.service.plugin_output;
        obj.powerUsage.value = d3.max(extractPowerUsage(obj.powerUsage.plugin_output));
        dataPoints.push(obj);
    }


    g.append("rect").attr("class", "scatterPlotRect")
        .attr("x", (-0.5))
        .attr("y", (-0.5))
        .attr("width", swidth + 2)
        .attr("height", sheight + 2)

        .style("fill", function (d) {
            return colorRedBlue(Outlier(dataPoints.map(function (d) {
                return [xScale(d[scatterplot_settings.data_onXaxis].value), yScale(d[scatterplot_settings.data_onYaxis].value)]
            })))
        });
    ScatterPlotG(g, dataPoints);

}

function Outlier(data) {
    return outliagnostics(data).outlyingScore;
}

/**
 *
 * @param stringInput
 * @returns {Array} of values , empty array if there is an error
 */
function extractTemperature(stringInput) {
    if (stringInput == "NaN") {
        return [0];
    }
    if (stringInput.includes("OK")) {
        var pattern = stringInput.match(/\s\d+/g).map(Number); //Extract integer
        return pattern;
    }
    else {
        return [0];
    }
}

/**
 *
 * @param stringInput
 * @returns {Array} of values 1st percentage, 2nd total memory, 3rd used memory , empty array if there is an error
 */
function extractMemoryUsage(stringInput) {
    if (stringInput.includes("Memory usage is normal") || stringInput.includes("WARNING")) {
        var pattern = stringInput.match(/\s+\d+(\.)\d+/g).map(Number); //Extract float "OK - Memory usage is normal! :: Usage Percentage = 33.96 :: Total Memory: 191.908G :: Used Memory: 65.176G" => [33.96, 191.908, 65.176]
        return pattern[0];//Default 1st percentage
    }
    else {
        return [0];
    }

}

function extractCPULoad(stringInput) {
    if (stringInput.includes("OK") && !stringInput.includes("null")) {
        var pattern = stringInput.match(/\d+(\.)\d+/g).map(Number); //Extract float "OK - Average CPU load is normal! :: CPU Load: 0.499444" => [0.499444]
        return pattern;
    }
    else {
        return [0];
    }
}

function extractFanHealth(stringInput) {
    if (stringInput.includes("OK")) {
        var pattern = stringInput.match(/\s\d+/g).map(Number); //Extract float
        return pattern;
    }
    else {
        return [0];
    }
}

function extractPowerUsage(stringInput) {
    if (stringInput.includes("OK")) {
        var pattern = stringInput.match(/\s\d+/g).map(Number); //Extract float "OK - The average power consumed in the last one minute = 235 W" => [235]
        return pattern;
    }
    else {
        return [0];
    }
}

function showTooltip(detail) {
    div.transition()
        .duration(200)
        .style("opacity", 1).style('width', '250px');
    div.html('<table>' +
        '<tr><td>Node info:</td><td>' + detail.hostname + '</td></tr>' +
        '<tr><td>Temperature:</td><td>' + detail.temperature.plugin_output + '</td></tr>' +
        '<tr><td>Fan Speed:</td><td>' + detail.fanspeed.plugin_output + '</td></tr>' +
        '<tr><td>Memory Usage:</td><td>' + detail.memoryUsage.plugin_output + '</td></tr>' +
        '<tr><td>Power Usage:</td><td>' + detail.powerUsage.plugin_output + '</td></tr>' +
        '<tr><td>CPU Load:</td><td>' + detail.cpuLoad.plugin_output + '</td></tr>' +
        '      </table>'
    )
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");

}

function hideTooltip() {
    div.transition()
        .duration(200)
        .style("opacity", 0);
    div.html('');

}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("src", ev.target.id);
}

function drop(ev) {
    var src = document.getElementById(ev.dataTransfer.getData("src")).cloneNode(true);
    while (ev.currentTarget.hasChildNodes()) {
        ev.currentTarget.removeChild(ev.currentTarget.firstChild);
    }
    ev.currentTarget.appendChild(src);
    if (ev.currentTarget.id == "data_onYaxis") {
        scatterplot_settings.data_onYaxis = src.textContent;
        UpdateYAxis();

    }
    ;
    if (ev.currentTarget.id == "data_onXaxis") {
        scatterplot_settings.data_onXaxis = src.textContent;
        UpdateXAxis();
    }
    ;
}

function UpdateXAxis() {
    xScale = d3.scaleLinear()
        .domain([0, scatterplot_settings.global_scale[scatterplot_settings.data_onXaxis]])
        .range([0, swidth]);
    d3.selectAll('.scatterPlot').selectAll('circle').attr("cx", function (d) {
        return xScale(d[scatterplot_settings.data_onXaxis].value);
    })

    d3.selectAll(".scatterPlot").nodes().forEach(function (d, i) {

        var datapoints = d3.select(d).selectAll('circle').nodes().map(function (d) {
            return [xScale(d3.select(d).data()[0][scatterplot_settings.data_onXaxis].value), yScale(d3.select(d).data()[0][scatterplot_settings.data_onYaxis].value)]
        });
        d3.select(d).selectAll('rect').style('fill',function () {
            return colorRedBlue(Outlier(datapoints));
        })

    })




}

function UpdateYAxis() {
    yScale = d3.scaleLinear()
        .domain([0, scatterplot_settings.global_scale[scatterplot_settings.data_onYaxis]])
        .range([sheight, 0]);

    d3.selectAll('.scatterPlot').selectAll('circle').attr("cy", function (d) {
        return yScale(d[scatterplot_settings.data_onYaxis].value);
    });
    d3.selectAll(".scatterPlot").nodes().forEach(function (d, i) {

        var datapoints = d3.select(d).selectAll('circle').nodes().map(function (d) {
            return [xScale(d3.select(d).data()[0][scatterplot_settings.data_onXaxis].value), yScale(d3.select(d).data()[0][scatterplot_settings.data_onYaxis].value)]
        });
        d3.select(d).selectAll('rect').style('fill',function () {
            return colorRedBlue(Outlier(datapoints));
        })

    })

}