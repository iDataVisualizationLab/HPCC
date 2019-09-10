/**Vinh's code from here to there.
 * Ngan modified module
 */

var scatterplot_settings = {
    circle_size: 2,
    data_onXaxis: "cpu1temp",
    data_onYaxis: "fan1peed",
    active_features: {
        cpu1temp: {name: "CPU 1 Temp", scale:[0,122]},
        cpu2temp: {name: "CPU 2 Temp", scale:[0,122]},
        inlettemp: {name: "Inlet Temp", scale:[0,122]},
        memoryusg: {name: "Memory Usage", scale:[0,100]},
        fan1peed: {name: "Fan 1 Speed", scale:[0,17850]},
        fan2peed: {name: "Fan 2 Speed", scale:[0,17850]},
        fan3peed: {name: "Fan 3 Speed", scale:[0,17850]},
        fan4peed: {name: "Fan 4 Speed", scale:[0,17850]},
        jobload: {name: "Job Load", scale:[0,10]},
        pwconsumption: {name: "Power Consumption", scale:[0,350]}
    }

};
var sheight = 180,
    swidth = 180;
var sizeAxisBox = 100;
//Bind properties to selection



//
d3.Scatterplot = function () {
    d3.select("#selection").selectAll("span").data(d3.entries(scatterplot_settings.active_features))
        .enter()
        .append('span')
        .style("display",'block')
        .attr("id",function (d,i) {
            return d.key;
        })
        .text(function (d) {
            return d.value.name;})
        .attr("draggable",true)
        .attr("ondragstart","Scatterplot.drag(event)");
    $('#selection '+'#'+scatterplot_settings.data_onXaxis).addClass('activeX');
    $('#selection '+'#'+scatterplot_settings.data_onYaxis).addClass('activeY');
    let colorArray = ["#9dbee6", "#afcae6", "#c8dce6", "#e6e6e6", "#e6e6d8", "#e6d49c", "#e6b061", "#e6852f", "#e6531a", "#e61e1a"];
    let margin = {top: 50, right: 0, bottom: 0, left: sizeAxisBox};
    let padding = 5;
    let colorRedBlue = d3.scaleLinear()
        .domain([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])
        .range(colorArray);
    let hostResults =[];
    // let offset = 50,
    //     padding = 25;
    let xScale = d3.scaleLinear()
        .domain(scatterplot_settings.active_features[scatterplot_settings.data_onXaxis].scale)
        .range([padding, swidth-padding]);

    let yScale = d3.scaleLinear()
        .domain(scatterplot_settings.active_features[scatterplot_settings.data_onYaxis].scale)
        .range([sheight-padding, padding]);
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

        //FIX ME ** suggestion make variable for service
        scatterplot_settings.active_features.cpu1temp.scale =
            scatterplot_settings.active_features.cpu2temp.scale =
            scatterplot_settings.active_features.inlettemp.scale =thresholds[0];
        scatterplot_settings.active_features.jobload.scale =thresholds[1];
        scatterplot_settings.active_features.memoryusg.scale =thresholds[2];
        scatterplot_settings.active_features.fan1peed.scale =
            scatterplot_settings.active_features.fan2peed.scale =
            scatterplot_settings.active_features.fan3peed.scale =
            scatterplot_settings.active_features.fan4peed.scale = thresholds[3];
        scatterplot_settings.active_features.memoryusg.scale =thresholds[4];

        d3.select("#scatterzone").select(".scatter_y").style('left',(xx-swidth/2-12+margin.left)+"px").style('top',(sheight+margin.top-15-75)+"px");
        d3.select("#scatterzone").select(".scatter_x").style('left',(xx-swidth/2+85+margin.left)+"px").style('top',(97+sheight+margin.top-15-75)+"px");
        dragElement(document.getElementById("selection"));
    };
    function ScatterPlotG(g, dataPoints) {


        var circles = g.selectAll("circle").data(dataPoints).enter();

        circles.append('circle')
            .attr("r", scatterplot_settings.circle_size)
            .attr("name", function (d) {
                return d.hostname;
            })
            .attr("cx", function (d) {
                let cx = xScale(d[scatterplot_settings.data_onXaxis]);
                cx = isNaN(cx)?-100:cx;
                return cx;
            })
            .attr("cy", function (d) {
                let cy = yScale(d[scatterplot_settings.data_onYaxis]);
                cy = isNaN(cy)?-100:cy;
                return cy;
            })
            .style('visibility',function(d){return (d[scatterplot_settings.data_onXaxis]&&d[scatterplot_settings.data_onYaxis]||0)? 'visible':'hidden'})
            .on("mouseover", function (d) {
                showTooltip(d)
            })
            .on("mouseout", function (d) {
                hideTooltip();
            });
    }
    d3.selection.prototype.moveToFront = function() {
        return this.each(function(){
            this.parentNode.appendChild(this);
        });
    };
    d3.selection.prototype.moveToBack = function() {
        return this.each(function() {
            var firstChild = this.parentNode.firstChild;
            if (firstChild) {
                this.parentNode.insertBefore(this, firstChild);
            }
        });
    };

    Scatterplot.draw =function (index, indexo,xx){
        pannelselection(true);
        svg.select(".box" + indexo).remove();
        var g = svg.append("g")
            .attr("class",("scatter"+(indexo)+" box"+(indexo)+" graphsum"))
            .attr("transform", "translate(" + (xx+margin.left) + ","+margin.top+")");


        var dataPoints = [];
        for (var key in hostResults) {
            var obj = {};
            obj.hostname = key;
            var indx = 0;
            var temps = processData(hostResults[key][serviceListattr[indx]][index].data.service.plugin_output,serviceList[indx]);
            obj.cpu1temp = temps[0];
            obj.cpu2temp = temps[1];
            obj.inlettemp = temps[2];
            indx = 2;
            obj.memoryusg = processData(hostResults[key][serviceListattr[indx]][index].data.service.plugin_output,serviceList[indx])[0];
            indx = 3;
            var fans = processData(hostResults[key][serviceListattr[indx]][index].data.service.plugin_output,serviceList[indx]);
            obj.fan1peed = fans[0];
            obj.fan2peed = fans[1];
            obj.fan3peed = fans[2];
            obj.fan4peed = fans[3];
            indx = 1;
            obj.jobload = processData(hostResults[key][serviceListattr[indx]][index].data.service.plugin_output,serviceList[indx])[0];
            indx = 4;
            obj.pwconsumption = processData(hostResults[key][serviceListattr[indx]][index].data.service.plugin_output,serviceList[indx])[0];
            // var obj = {};
            // obj.hostname = key;
            // var temps = extractTemperature(hostResults[key].arrTemperature[index].data.service.plugin_output);
            // obj.cpu1temp = temps[0];
            // obj.cpu2temp = temps[1];
            // obj.inlettemp = temps[2];
            // obj.memoryusg = extractMemoryUsage(hostResults[key].arrMemory_usage[index].data.service.plugin_output);
            // var fans = extractFanHealth(hostResults[key].arrFans_health[index].data.service.plugin_output);
            // obj.fan1peed = fans[0];
            // obj.fan2peed = fans[1];
            // obj.fan3peed = fans[2];
            // obj.fan4peed = fans[3];
            // obj.jobload = extractCPULoad(hostResults[key].arrCPU_load[index].data.service.plugin_output);
            // obj.pwconsumption = extractPowerUsage(hostResults[key].arrPower_usage[index].data.service.plugin_output);


            dataPoints.push(obj);
        }



        g.append("rect").attr("class", "scatterPlotRect")
            .attr("x", (-2.5))
            .attr("y", (-2.5))
            .attr("width", swidth + 5)
            .attr("height", sheight + 5)
            .style("stroke",'black')
            .style("fill", function (d) {
                return colorRedBlue(Outlier(dataPoints.filter(d=>(d[scatterplot_settings.data_onXaxis]&&d[scatterplot_settings.data_onYaxis]||0))
                    .map(d=> [xScale(d[scatterplot_settings.data_onXaxis]), yScale(d[scatterplot_settings.data_onYaxis])])));
            })
            .on("mouseover",d=> g.moveToFront());
        ScatterPlotG(g, dataPoints);
        if (indexo >= maxstack-1) shiftplot(svg,"scatter",80,margin.top,margin.left);

    };

    function Outlier(data) {
        var outscore = outliagnostics(data).outlyingScore;
        console.log(outscore);
        return outscore;
    }

    /**
     *
     * @param stringInput
     * @returns {Array} of values , empty array if there is an error
     */
    function extractTemperature(stringInput) {
        var a = [];
        if (stringInput.indexOf("timed out")>=0 || stringInput.indexOf("(No output on stdout)")>=0 || stringInput.indexOf("UNKNOWN")>=0 ){
            a[0] = 0;
            a[1] = 0;
            a[2] = 0;
        }
        else{
            var arrString =  stringInput.split(" ");
            a[0] = +arrString[2]||0;
            a[1] = +arrString[6]||0;
            a[2] = +arrString[10]||0;
        }
        return a;
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
            .style("opacity", 1).style('width', '180px');
        div.html('<table>' +
            '<thead>'+
            '<tr><th colspan="2">' + detail.hostname + '</th></tr>' +
            '</thead>'+
            '<tbody>' +
            // '<tr><td colspan="2">CPU Temp</td> </tr>' +
            '<tr class = "inside"><td >CPU1 Temp</td><td '+formatstyle(detail.cpu1temp,0)+'>' + formatnumber(detail.cpu1temp)+ '</td></tr>' +
            '<tr class = "inside"><td >CPU2 Temp</td><td '+formatstyle(detail.cpu2temp,0)+'>' + formatnumber(detail.cpu2temp)+ '</td></tr>' +
            '<tr class = "inside"><td >Inlet Temp</td><td '+formatstyle(detail.inlettemp,0)+'>' + formatnumber(detail.inlettemp)+ '</td></tr>' +
            '<tr class = "inside"><td>Job Load</td><td '+formatstyle(detail.jobload,1)+'>' + formatnumber(detail.jobload) + '</td></tr>' +
            '<tr class = "inside"><td>Memory Usage</td><td '+formatstyle(detail.memoryusg,2)+'>' + formatnumber(detail.memoryusg) + '</td></tr>' +
            // '<tr><td colspan="2">Fan Speed</td> </tr>' +
            '<tr class = "inside"><td >Fan1 speed</td><td '+formatstyle(detail.fan1peed,3)+'>' + formatnumber(detail.fan1peed)+ '</td></tr>' +
            '<tr class = "inside"><td >Fan2 speed</td><td '+formatstyle(detail.fan2peed,3)+'>' + formatnumber(detail.fan2peed)+ '</td></tr>' +
            '<tr class = "inside"><td >Fan3 speed</td><td '+formatstyle(detail.fan3peed,3)+'>' + formatnumber(detail.fan3peed)+ '</td></tr>' +
            '<tr class = "inside"><td >Fan4 speed</td><td '+formatstyle(detail.fan4peed,3)+'>' + formatnumber(detail.fan4peed)+ '</td></tr>' +
            '<tr class = "inside"><td>Power Usage</td><td '+formatstyle(detail.pwconsumption,4)+'>' + formatnumber(detail.pwconsumption) + '</td></tr>' +
            '</tbody>' +
            '      </table>'
        )
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");

    }
    function formatnumber (d){
        if(d)
            if (d<1)
                return d.toFixed(1);
            else
                return Math.round(d);
        else
            return d;
    }
    function formatstyle (d,serin){
        if (d>thresholds[serin][1])
            return 'style="color:'+arrColor[6]+';"';
        if (d> (thresholds[serin][1] - (thresholds[serin][1]-thresholds[serin][0])*0.25))
            return 'style="color:'+arrColor[5]+';"';
        return '';

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
        if (ev.currentTarget.id === "data_onYaxis") {
            $('#selection '+'#'+scatterplot_settings.data_onYaxis).removeClass('activeY');
            scatterplot_settings.data_onYaxis = src.id;
            $('#selection '+'#'+scatterplot_settings.data_onYaxis).addClass('activeY');
            Scatterplot.UpdateYAxis();

        }
        ;
        if (ev.currentTarget.id === "data_onXaxis") {
            $('#selection '+'#'+scatterplot_settings.data_onXaxis).removeClass('activeX');
            scatterplot_settings.data_onXaxis = src.id;
            $('#selection '+'#'+scatterplot_settings.data_onXaxis).addClass('activeX');
            Scatterplot.UpdateXAxis();
        }
        ;
    };

    Scatterplot.UpdateXAxis = function(){
        xScale = d3.scaleLinear()
            .domain(scatterplot_settings.active_features[scatterplot_settings.data_onXaxis].scale)
            .range([padding, swidth-padding]);
        d3.selectAll('.graphsum').selectAll('circle').transition().attr("cx", function (d) {
            return isNaN(d[scatterplot_settings.data_onXaxis])?-100:xScale(d[scatterplot_settings.data_onXaxis]);
        }).style('visibility',function(d){return !(isNaN(d[scatterplot_settings.data_onXaxis])||isNaN(d[scatterplot_settings.data_onYaxis]))? 'visible':'hidden'});

        d3.selectAll(".graphsum").nodes().forEach(function (d, i) {

            var datapoints = d3.select(d).selectAll('circle').filter(d=>
                !(isNaN(d[scatterplot_settings.data_onXaxis])||isNaN(d[scatterplot_settings.data_onYaxis]))).nodes()
                .map(function (d) {
                return [xScale(d3.select(d).data()[0][scatterplot_settings.data_onXaxis]), yScale(d3.select(d).data()[0][scatterplot_settings.data_onYaxis])]
            });
            d3.select(d).selectAll('rect').style('fill', function () {
                return colorRedBlue(Outlier(datapoints));
            })

        })

    }

    Scatterplot.UpdateYAxis = function() {
        yScale = d3.scaleLinear()
            .domain(scatterplot_settings.active_features[scatterplot_settings.data_onYaxis].scale)
            .range([sheight-padding, padding]);
        d3.selectAll('.graphsum').selectAll('circle').transition().attr("cy", function (d) {
            return isNaN(d[scatterplot_settings.data_onYaxis])?-100:yScale(d[scatterplot_settings.data_onYaxis]);
        }).style('visibility',function(d){return (!(isNaN(d[scatterplot_settings.data_onXaxis])||isNaN(d[scatterplot_settings.data_onYaxis])))? 'visible':'hidden'});
        d3.selectAll(".graphsum").nodes().forEach(function (d, i) {

            var datapoints = d3.select(d).selectAll('circle').filter(d=>
                !(isNaN(d[scatterplot_settings.data_onXaxis])||isNaN(d[scatterplot_settings.data_onYaxis]))).nodes()
                .map(function (d) {
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
    // Make the DIV element draggable: from W3 code

    return Scatterplot;
};
function pannelselection(show){
    var pansum = d3.select("#selection");
    if (show)
        pansum.style('opacity',1);
    else
        pansum.style('opacity',0);
}
