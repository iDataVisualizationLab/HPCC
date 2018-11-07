/**Vinh's code from here to there.
 * Ngan modified module
 */

var scatterplot_settings = {
    circle_size: 1,
    data_onXaxis: "cpu1temp", //Temperature, Memory_Usage, CPU_load, Fans_Health, Power
    data_onYaxis: "fan1peed", ////Temperature, Memory_Usage, CPU_load, Fans_Health, Power
    active_features: {
        cpu1temp: {name: "CPU 1 Temp", maxScale:122},
        cpu2temp: {name: "CPU 2 Temp", maxScale:122},
        inlettemp: {name: "Inlet Temp", maxScale:122},
        memoryusg: {name: "Memory Usage", maxScale:100},
        fan1peed: {name: "Fan 1 Speed", maxScale:17850},
        fan2peed: {name: "Fan 2 Speed", maxScale:17850},
        fan3peed: {name: "Fan 3 Speed", maxScale:17850},
        fan4peed: {name: "Fan 3 Speed", maxScale:17850},
        jobload: {name: "Job Load", maxScale:10},
        pwconsumption: {name: "Power Consumption", maxScale:350}
    }

};
var sheight = 190,
    swidth = 190;
//Bind properties to selection



//
d3.Scatterplot = function () {
    d3.select("#selection").selectAll("span").data(Object.entries(scatterplot_settings.active_features).map(function(d){return d[0]}))
        .enter()
        .append('span')
        .style("display",'block')
        .attr("id",function (d,i) {
            return "drag"+i;
        })
        .text(function (d) {
            return d;})
        .attr("draggable",true)
        .attr("ondragstart","Scatterplot.drag(event)");
    let colorArray = ["#9dbee6", "#afcae6", "#c8dce6", "#e6e6e6", "#e6e6d8", "#e6d49c", "#e6b061", "#e6852f", "#e6531a", "#e61e1a"];

    let colorRedBlue = d3.scaleLinear()
        .domain([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])
        .range(colorArray);
    let hostResults =[];
    let offset = 50,
        padding = 25;
    let xScale = d3.scaleLinear()
        .domain([0, scatterplot_settings.active_features[scatterplot_settings.data_onXaxis].maxScale])
        .range([0, swidth]);

    let yScale = d3.scaleLinear()
        .domain([0, scatterplot_settings.active_features[scatterplot_settings.data_onYaxis].maxScale])
        .range([sheight, 0]);
    let svg;
    let Scatterplot ={};

    let div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    /**
     *
     * @param dataPoints in an array containing a set of x, y coordinate dataPoints =[{x:3, y:4, color:red, size:3},{},{}]
     * @constructor
     */
    Scatterplot.init  = function(xx){
        d3.select("#scatterzone").select(".scatter_y").style('left',(xx-45)+"px");
        d3.select("#scatterzone").select(".scatter_x").style('left',(xx+5)+"px");
    };
    function ScatterPlotG(g, dataPoints) {


        var circles = g.selectAll("circle").data(dataPoints).enter();

        circles.append('circle')
            .attr("r", scatterplot_settings.circle_size)
            .attr("name", function (d) {
                return d.hostname;
            })
            .attr("cx", function (d) {
                return xScale(d[scatterplot_settings.data_onXaxis]);
            })
            .attr("cy", function (d) {
                return yScale(d[scatterplot_settings.data_onYaxis]);
            })
            .on("mouseover", function (d) {
                showTooltip(d)
            })
            .on("mouseout", function (d) {
                hideTooltip();
            });
    }

    Scatterplot.draw =function (index, indexo,xx){
        svg.select(".box" + indexo).remove();
        var g = svg.append("g")
            .attr("class",("scatter"+(indexo)+" box"+(indexo)+" graphsum"))
            .attr("transform", "translate(" + xx + ",50)");


        var dataPoints = [];
        for (var key in hostResults) {
            var obj = {};
            obj.hostname = key;
            var temps = extractTemperature(hostResults[key].arrTemperature[index].data.service.plugin_output);
            obj.cpu1temp = temps[0];
            obj.cpu2temp = temps[1];
            obj.inlettemp = temps[2];
            obj.memoryusg = extractMemoryUsage(hostResults[key].arrMemory_usage[index].data.service.plugin_output);
            var fans = extractFanHealth(hostResults[key].arrFans_health[index].data.service.plugin_output);
            obj.fan1peed = fans[0];
            obj.fan2peed = fans[1];
            obj.fan3peed = fans[2];
            obj.fan4peed = fans[3];
            obj.jobload = extractCPULoad(hostResults[key].arrCPU_load[index].data.service.plugin_output);
            obj.pwconsumption = extractPowerUsage(hostResults[key].arrPower_usage[index].data.service.plugin_output);


            dataPoints.push(obj);
        }


        g.append("rect").attr("class", "scatterPlotRect")
            .attr("x", (-0.5))
            .attr("y", (-0.5))
            .attr("width", swidth + 2)
            .attr("height", sheight + 2)

            .style("fill", function (d) {
                return colorRedBlue(Outlier(dataPoints.map(function (d) {
                    return [xScale(d[scatterplot_settings.data_onXaxis]), yScale(d[scatterplot_settings.data_onYaxis])]
                })))
            });
        ScatterPlotG(g, dataPoints);
        if (indexo >= maxstack-1) shiftplot(svg,"scatter",xTimeSummaryScale.step()/2,40);

    };

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
            return [0, 0, 0];
        }
        if (stringInput.includes("OK")) {
            var pattern = stringInput.match(/\s\d+/g).map(Number); //Extract integer
            return pattern;
        }
        else {
            return [0, 0, 0];
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
            return [0, 0, 0, 0];
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
            '<tr><td>CPU Temp:</td><td> CPU 1: ' + detail.cpu1temp + ',CPU 2: ' + detail.cpu2temp + '</td></tr>' +
            '<tr><td>Fan Speed:</td><td>F1: ' + detail.fan1peed + ', F2: ' + detail.fan2peed + ',F3: ' + detail.fan3peed + ', F4: ' + detail.fan4peed + '</td></tr>' +
            '<tr><td>Memory Usage:</td><td>' + detail.memoryusg + '</td></tr>' +
            '<tr><td>Power Usage:</td><td>' + detail.pwconsumption + '</td></tr>' +
            '<tr><td>CPU Load:</td><td>' + detail.jobload + '</td></tr>' +
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

    Scatterplot.allowDrop = function (ev) {
        ev.preventDefault();
    };

    Scatterplot.drag = function(ev) {
        ev.dataTransfer.setData("src", ev.target.id);
    };

    Scatterplot.drop = function (ev) {
        var src = document.getElementById(ev.dataTransfer.getData("src")).cloneNode(true);
        while (ev.currentTarget.hasChildNodes()) {
            ev.currentTarget.removeChild(ev.currentTarget.firstChild);
        }
        ev.currentTarget.appendChild(src);
        if (ev.currentTarget.id == "data_onYaxis") {
            scatterplot_settings.data_onYaxis = src.textContent;
            Scatterplot.UpdateYAxis();

        }
        ;
        if (ev.currentTarget.id == "data_onXaxis") {
            scatterplot_settings.data_onXaxis = src.textContent;
            Scatterplot.UpdateXAxis();
        }
        ;
    };

    Scatterplot.UpdateXAxis = function(){
        xScale = d3.scaleLinear()
            .domain([0, scatterplot_settings.active_features[scatterplot_settings.data_onXaxis].maxScale])
            .range([0, swidth]);
        d3.selectAll('.graphsum').selectAll('circle').attr("cx", function (d) {
            console.log(d[scatterplot_settings.data_onXaxis]);
            return xScale(d[scatterplot_settings.data_onXaxis]);
        });

        d3.selectAll(".graphsum").nodes().forEach(function (d, i) {

            var datapoints = d3.select(d).selectAll('circle').nodes().map(function (d) {
                return [xScale(d3.select(d).data()[0][scatterplot_settings.data_onXaxis]), yScale(d3.select(d).data()[0][scatterplot_settings.data_onYaxis])]
            });
            d3.select(d).selectAll('rect').style('fill', function () {
                return colorRedBlue(Outlier(datapoints));
            })

        })

    }

    Scatterplot.UpdateYAxis = function() {
        yScale = d3.scaleLinear()
            .domain([0, scatterplot_settings.active_features[scatterplot_settings.data_onYaxis].maxScale])
            .range([sheight, 0]);
        d3.selectAll('.graphsum').selectAll('circle').attr("cy", function (d) {
            return yScale(d[scatterplot_settings.data_onYaxis]);
        });
        d3.selectAll(".graphsum").nodes().forEach(function (d, i) {

            var datapoints = d3.select(d).selectAll('circle').nodes().map(function (d) {
                return [xScale(d3.select(d).data()[0][scatterplot_settings.data_onXaxis]), yScale(d3.select(d).data()[0][scatterplot_settings.data_onYaxis])]
            });
            d3.select(d).selectAll('rect').style('fill', function () {
                return colorRedBlue(Outlier(datapoints));
            })

        })

    }
    Scatterplot.data = function (_) {
        return arguments.length ? (hostResults = _, Scatterplot) : hostResults;

    };
    Scatterplot.svg = function (_) {
        return arguments.length ? (svg = _, Scatterplot) : svg;

    };
    return Scatterplot;
};