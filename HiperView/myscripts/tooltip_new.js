// Setup the tool tip.  Note that this is just one example, and that many styling options are available.
// See original documentation for more details on styling: http://labratrevenge.com/d3-tip/

var tipW = 450;
var tipH = 200;
var margin = {top: 10, right: 0, bottom: 40, left: 50};
var color2 = d3.scaleOrdinal()
    .range(["#000","#000","#444"]);
var playing =false;
var dataSpider = [];
var dataSpider2 = [];
var levelsR = 6;
var radarChartOptions = {
    w: tipW-50,
    h: tipW+10,
    maxValue: 0.5,
    levels: levelsR,
    roundStrokes: true,
    color: color2,
    isNormalize: true,
    markedLegend: thresholds[0],
    legend: [{},
        {},
        {},
        {5: Math.floor((thresholds[1][1]-thresholds[1][0])/levelsR*5+thresholds[1][0])},
        {5: Math.floor((thresholds[2][1]-thresholds[2][0])/levelsR*5+thresholds[2][0])},
        {5: Math.floor((thresholds[3][1]-thresholds[3][0])/levelsR*5+thresholds[3][0])},
        {5: Math.floor((thresholds[3][1]-thresholds[3][0])/levelsR*5+thresholds[3][0])},
        {5: Math.floor((thresholds[3][1]-thresholds[3][0])/levelsR*5+thresholds[3][0])},
        {5: Math.floor((thresholds[3][1]-thresholds[3][0])/levelsR*5+thresholds[3][0])},
        {5: Math.floor((thresholds[4][1]-thresholds[4][0])/levelsR*5+thresholds[4][0])}]
};
radarChartOptions.schema = serviceFullList;
var radarChartOptions = {
    w: tipW-50,
    h: tipW+10,
    maxValue: 0.5,
    levels: levelsR,
    roundStrokes: true,
    color: color2,
    isNormalize: true,
    markedLegend: thresholds[0],
    legend: [{},
        {},
        {},
        {5: Math.floor((thresholds[1][1]-thresholds[1][0])/levelsR*5+thresholds[1][0])},
        {5: Math.floor((thresholds[2][1]-thresholds[2][0])/levelsR*5+thresholds[2][0])},
        {5: Math.floor((thresholds[3][1]-thresholds[3][0])/levelsR*5+thresholds[3][0])},
        {5: Math.floor((thresholds[3][1]-thresholds[3][0])/levelsR*5+thresholds[3][0])},
        {5: Math.floor((thresholds[3][1]-thresholds[3][0])/levelsR*5+thresholds[3][0])},
        {5: Math.floor((thresholds[3][1]-thresholds[3][0])/levelsR*5+thresholds[3][0])},
        {5: Math.floor((thresholds[4][1]-thresholds[4][0])/levelsR*5+thresholds[4][0])}]
};
radarChartOptions.schema = serviceFullList;
var scaleopt;
//////////////////////////////////////////////////////////////
////////////////////////// Data //////////////////////////////
//////////////////////////////////////////////////////////////

// var axes = ["CPU1 Temp", "CPU2 Temp", "Inlet Temp","Job load",
//     "Memory usage", "Fan1 speed", "Fan2 speed", "Fan3 speed", "Fan4 speed", "Power consumption"];

var tool_tip = d3.tip()
    .attr("class", "d3-tip radarsTip")
    .attr("id", "d3-tip")
    .offset(()=> {
        if (niceOffset){
            let heightTip =+ $('#d3-tip')[0].offsetHeight;
            return [(d3.event.y-200)< 0 ? -d3.event.y:(d3.event.y-200+heightTip>heightdevice? heightdevice-d3.event.y-heightTip :-200), (d3.event.x+tipW+100)> width ? -50-tipW:50];
        } return [0,0];})
    .html(function(d1,hideLine) {
        return cotenttip(hideLine); });
svg.call(tool_tip);
d3.select('.radarsTip')
    .on('mouseenter',()=> {d3.select('.radarsTip').transition().style('opacity', 1)
        .style('pointer-events', 'all');})
    .on('mouseleave',()=> {d3.select('.radarsTip').transition().delay(4000).duration(4000).style('opacity', 0)
        .on('end',()=> d3.select('.radarsTip').style('pointer-events', 'none'))});
var fragment = document.createDocumentFragment();
fragment.appendChild(document.getElementById('d3-tip'));
document.getElementById('instructions').appendChild(fragment);
function cotenttip (hideLine){
    str="";
    hideLine = hideLine||false;
    var classtype =  "radarChartsum";
    if (!hideLine) {
        str += '<button class="playbtn" onclick="playanimation()"><i class="fas fa-play"></i></button>';
        str += '<svg width="100" height="100" id="svgTip"> </svg>';
        classtype =  "radarChart";
    }
    str += '<div class="'+classtype+'"></div>'; // Spider chart holder
    str += '<button onclick="'+(hideLine?'pannelsummary(false)':'tool_tip.hide()')+'">Close</button>';
    str += '<button onclick="addSVG('+hideLine+')">Add</button>';
    // str += '<button onclick="saveSVG(this)">Save Image</button>';
    str += '<button onclick="saveSVG_light(this,\'svg\')" class="modal-trigger" href="#savedialog">Save SVG</button>';
    str += '<button onclick="saveSVG_light(this,\'png\')" class="modal-trigger" href="#savedialog">Save PNG</button>';
    str += '<button onclick="saveSVG_light(this,\'jpg\')" class="modal-trigger" href="#savedialog">Save JPG</button>';
    return str;
}
// Add radar chart to the end of html page
var countRadarChart = 1;
function addSVG(hideLine){
    if (hideLine){
        RadarChart("#radarChart" + countRadarChart, dataSpider2, radarChartOptions, dataSpider2.name);
    }
    else {
        RadarChart("#radarChart" + countRadarChart, dataSpider, radarChartOptions, dataSpider.name);
    }
    countRadarChart++;
    if (countRadarChart==4)
        countRadarChart=1;
}


var svgTip;
var xScale;
function mouseoverNode(d1){
    playing = false;
    var r = hostResults[d1.name];

    tool_tip.show(r);
    // 1. create the svgTip
    svgTip = d3.select("#svgTip")
        .attr("width", tipW + margin.left + margin.right)
        .attr("height", tipH + margin.top + margin.bottom)
        .style("attr","#fff")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    // 2. Process the array of historical temperatures
    var arr = [];
    // adjust stacks
    let startRecord = r.arr.length - maxstack;
    startRecord = startRecord < 0 ? 0 : startRecord;
    try {
        for (var i = startRecord; i < r.arr.length; i++) {
            // var a = processData(r.arr[i].data.service.plugin_output, serviceList[0]);
            var a = r.arrTemperature[i];
            var obj = {};
            if (a) {
                obj.temp1 = a[0];
                obj.temp2 = a[1];
                obj.temp3 = a[2];
            }
            else {
                obj.temp1 = undefined;
                obj.temp2 = undefined;
                obj.temp3 = undefined;
            }
            obj.query_time = hostResults['timespan'][i];
            if (obj.temp1 !== undefinedValue && obj.temp2 !== undefinedValue && obj.temp3 !== undefinedValue)
                arr.push(obj);
        }
        if (!arr.length)
            arr = [{}]


        // 3. get Time
        var minTime = 10 * (new Date("1/1/2030").getTime());  // some max number
        var maxTime = 0;
        for (var i = startRecord; i < r.arr.length; i++) {
            var qtime = hostResults['timespan'][i];
            minTime = Math.min(minTime, qtime.getTime());
            maxTime = Math.max(maxTime, qtime.getTime());
        }

        xScale = d3.scaleTime()
            .domain([new Date(minTime - 1000), new Date(maxTime + 1000)])
            .range([0, tipW - 60]);

        //var startTime =  new Date((minTime.getMonth()+1)+"/"+minTime.getDate()+"/"+minTime.getFullYear()+" "+minTime.getHours()+":00:00");

        // 6. Y scale will use the randomly generate number
        var yScale = d3.scaleLinear()
            .domain([0, 100]) // input
            .range([tipH, 0]); // output

        // White Background
        svgTip.append("rect")
            .attr("class", name)
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", tipW + margin.right)
            .attr("height", tipH)
            .attr("fill", "#fff")
            .attr("fill-opacity", 1)
            .attr("stroke", "#000")
            .attr("stroke-width", 0.05);


        // 3. Call the x axis in a group tag
        // compute number of ticks
        var numTicks = 1 + Math.round((maxTime - minTime) / (60 * 1000)); // every minutes
        if (numTicks > 6) numTicks = 6;

        svgTip.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + tipH + ")")
            .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%H:%M")).ticks(numTicks)); //

        // 4. Call the y axis in a group tag
        svgTip.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(yScale).ticks(5).tickSize(-tipW + 50))
            .style("stroke-opacity", 0.2); // Create an axis component with d3.axisLeft

        // ****** Append the path ****** CPU1
        var line1 = d3.line()
            .x(function (d, i) {
                return xScale(d.query_time);
            }) // set the x values for the line generator
            .y(function (d) {
                return yScale(d.temp1);
            }) // set the y values for the line generator
            .curve(d3.curveMonotoneX) // apply smoothing to the line

        svgTip.append("path")
            .datum(arr) // 10. Binds data to the line
            .attr("class", "line1") // Assign a class for styling
            .attr("d", line1)
            .attr("stroke", function () {
                return color2(0);
            }).attr('fill', 'none')
            .attr("stroke-width", 1); // 11. Calls the line generator
        // Appends a circle for each datapoint ****** CPU1
        svgTip.selectAll(".dot1")
            .data(arr)
            .enter().append("circle") // Uses the enter().append() method
            .attr("class", "dot1") // Assign a class for styling
            .attr("cx", function (d, i) {
                return xScale(d.query_time)
            })
            .attr("cy", function (d) {
                return yScale(d.temp1)
            })
            .attr("r", 3)
            .attr("fill", function (d) {
                return color(d.temp1);
            })
            .attr("fill-opacity", function (d) {
                return 1;
                //return opa(d.temp1);
            })
            .attr("stroke-width", 0.5)
            .attr("stroke", "#000")
            .on("mouseover", function (d, i) {
                mouseoverLine(d, i);
            })
            .on('mouseout', function (d, i) {
                mouseoutLine(d, i);
            });

        svgTip.append("text")
            .attr("x", tipW - 4)
            .attr("y", yScale(arr[arr.length - 1].temp1))
            .attr("fill", function () {
                return color2(0);
            })
            .style("text-anchor", "end")
            .style("font-size", "12px")
            .attr("font-family", "sans-serif")
            .text("CPU1=" + Math.round(arr[arr.length - 1].temp1));


        // ****** Append the path ****** CPU2
        var line2 = d3.line()
            .x(function (d, i) {
                return xScale(d.query_time);
            }) // set the x values for the line generator
            .y(function (d) {
                return yScale(d.temp2);
            }) // set the y values for the line generator
            .curve(d3.curveMonotoneX) // apply smoothing to the line
        svgTip.append("path")
            .datum(arr) // 10. Binds data to the line
            .attr("class", "line2") // Assign a class for styling
            .attr("d", line2).attr('fill', 'none')
            .attr("stroke", function () {
                return color2(1);
            })
            .attr("stroke-width", 1);
        // Appends a circle for each datapoint ****** CPU2
        svgTip.selectAll(".dot2")
            .data(arr)
            .enter().append("circle") // Uses the enter().append() method
            .attr("class", "dot2") // Assign a class for styling
            .attr("cx", function (d, i) {
                return xScale(d.query_time)
            })
            .attr("cy", function (d) {
                return yScale(d.temp2)
            })
            .attr("r", 3)
            .attr("fill", function (d) {
                return color(d.temp2);
            })
            .attr("fill-opacity", function (d) {
                return 1;//opa(d.temp2);
            })
            .attr("stroke-width", 0.5)
            .attr("stroke", "#000")
            .on("mouseover", function (d, i) {
                mouseoverLine(d, i);
            })
            .on('mouseout', function (d, i) {
                mouseoutLine(d, i);
            });

        svgTip.append("text")
            .attr("x", tipW - 4)
            .attr("y", yScale(arr[arr.length - 1].temp2))
            .attr("fill", function () {
                return color2(1);
            })
            .style("text-anchor", "end")
            .style("font-size", "12x")
            .attr("font-family", "sans-serif")
            .text("CPU2=" + Math.round(arr[arr.length - 1].temp2));

        // ****** Append the path ****** CPU3  Inlet
        var line3 = d3.line()
            .x(function (d, i) {
                return xScale(d.query_time);
            }) // set the x values for the line generator
            .y(function (d) {
                return yScale(d.temp3);
            }) // set the y values for the line generator
            .curve(d3.curveMonotoneX) // apply smoothing to the line
        svgTip.append("path")
            .datum(arr) // 10. Binds data to the line
            .attr("class", "line3") // Assign a class for styling
            .attr("d", line3)
            .attr("stroke", "#000").attr('fill', 'none')
            .attr("stroke-width", 1)
            .style("stroke-dasharray", ("3, 3"));
        svgTip.append("text")
            .attr("x", tipW - 4)
            .attr("y", yScale(arr[arr.length - 1].temp3))
            .attr("fill", function () {
                return "#444";
            })
            .style("text-anchor", "end")
            .style("font-size", "11px")
            .attr("font-family", "sans-serif")
            .text("Inlet=" + Math.round(arr[arr.length - 1].temp3));


        //************************************************************* Host name
        svgTip.append("text")
            .attr("class", "hostnameInTip")
            .attr("x", function (d) {
                return 15;
            })
            .attr("y", function (d) {
                return 12;
            })
            .attr("fill", "#000")
            .style("text-anchor", "left")
            .style("font-weight", "bold")
            .style("font-size", "12px")
            .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
            .attr("font-family", "sans-serif")
            .text("Host: " + d1.name);
        svgTip.append("text")
            .attr("x", -tipH / 2)
            .attr("y", -35)
            .attr("transform", "rotate(-90)")
            .attr("fill", "#000")
            .style("text-anchor", "middle")
            .style("font-style", "italic")
            .style("font-size", "12px")
            .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
            .attr("font-family", "sans-serif")
            .text("Temperature (°C)");

        //************************************************************* Date and Time
        svgTip.append("text")
            .attr("x", -margin.left)
            .attr("y", tipH + 34)
            .attr("fill", "#000")
            .style("font-style", "italic")
            .style("text-anchor", "left")
            .style("font-size", "12px")
            .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
            .attr("font-family", "sans-serif")
            .text("" + new Date(minTime).toDateString());

        svgTip.append("text")
            .attr("x", tipW - 3)
            .attr("y", tipH + 34)
            .attr("fill", "#000")
            .style("font-style", "italic")
            .style("text-anchor", "end")
            .style("font-size", "12px")
            .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
            .attr("font-family", "sans-serif")
            .text("Current time: " + new Date(maxTime).getHours() + ":" + new Date(maxTime).getMinutes());
    }catch(e){

    }
    // Update spider data *************************************************************
    var name = d1.name;
    dataSpider = [];
    dataSpider.name = name;
    if (r.arr.length>0){
        for (var i=startRecord;i<r.arr.length;i++){
            var arr1 = getDataByName_withLabel(hostResults, name, i, i,0.5);
            arr1.indexSamp = i;
            arr1.time = hostResults['timespan'][i];
            dataSpider.push(arr1);

        }
    }
    scaleopt = RadarChart(".radarChart", dataSpider, radarChartOptions,"");
}

function mouseoutNode(d1){
    tool_tip.hide(d1);
}

function mouseoverLine(d,i){
    //Dim all blobs
    // console.log('time: '+d.query_time);
    var radar = d3.selectAll(".radarWrapper");
    radar.filter( e => (e!=undefined)?(e.indexSamp !== d.indexSamp):false)
        .transition().duration(500)
        .style("opacity", 0);
    // .style("visibility", "hidden");
    radar.filter( e => (e!=undefined)?(e.indexSamp === d.indexSamp):false)
        .transition().duration(500)
        .style("opacity", 1);
    // .style("visibility", "visible");
    //Bring back the hovered over blob
    // console.log("added");
    // radar
    //     .transition().duration(200)
    //     .style("fill-opacity", 0.3);
}
function mouseoutLine(d,i) {
//Bring back all blobs
    d3.selectAll(".radarWrapper")
        .transition().duration(200)
        .style("opacity", 1);
    // .style("visibility", "visible");
}
var timestep = 500;
function playanimation() {
    if (playing){
        playing = false;
    }else {
        $(".playbtn").addClass('playing');
        $(".playbtn > i").removeClass('fa-play').addClass('fa-stop');
        var cfg = radarChartOptions;
        playing = true;
        var d3tipg = d3.select('#d3-tip');

        d3tipg.selectAll(".radarWrapper")
            .style("opacity", 0);
        var playbar = svgTip.append('g')
            .attr('id', 'playbarg')
            .attr("transform", "translate(" + 0 + "," + 0 + ")");
        playbar.append('line')
            .attr('class', 'playbar')
            .attr('y1', function (d) {
                return tipH
            })
            .attr('x1', function (d) {
                return 0
            })
            .attr('y2', function (d) {
                return 0
            })
            .attr('x2', function (d) {
                return 0
            })
            .style('opacity', 1);
        var g = d3tipg.select("#radarGroup");
        g.select('.radarmove').remove();
        var radar = d3tipg.selectAll(".radarWrapper");

        var current_data = [radar._groups[0][0].__data__];

        d3tipg.select('.radarmove').remove();
        d3tipg.select('.radarradarChart.radarPlot').append('svg')
            .attr('width','100%')
            .attr('height','100%')
            .attr('class','radarmove');
        let optr = _.clone(radarChartOptions,true);
        optr.mini = true;
        optr.showText = false;
        optr.showHelperPoint = false;
        RadarChart(".radarmove", current_data, optr,"");
        //Create a wrapper for the blobs
        // var wapperout = g.selectAll(".radarWrappermove")
        //     .data(current_data);
        // var blobWrapper = wapperout
        //     .enter().append("g")
        //     .attr("class", "radarWrappermove");
        // //Create the outlines
        // var path = blobWrapper.append("path")
        //     .attr("class", "radarStroke")
        //     .attr("d", function (d, i) {
        //         return radarLine(d);
        //     })
        //     .style("stroke-width", cfg.strokeWidth + "px")
        //     .style("stroke-opacity", 0.5)
        //     .style("stroke", function (d, i) {
        //         return cfg.color(i);
        //     })
        //     .style("fill", "none")
        //     .style("filter", "url(#glow2)");
        //
        // //Append the backgrounds
        // blobWrapper
        //     .append("path")
        //     .attr("class", "radarArea")
        //     .attr("d", function(d,i) { return radarLine(d); })
        //     .style("fill", function(d,i) { return cfg.color(i); })
        //     .style("fill-opacity", 0.05);
        // //Append the circles
        // blobWrapper.selectAll(".radarCircle")
        //     .data(function (d, i) {
        //         d.forEach(function (d2) {
        //             d2.index = i;
        //         });
        //         return d;
        //     })
        //     .enter().append("circle")
        //     .attr("class", "radarCircle")
        //     .attr("r", function (d) {
        //         return 1 + Math.pow((d.index + 2), 0.3);
        //     })
        //     .attr("cx", function (d, i) {
        //         return rScale(d.value) * Math.cos(angleSlice[i] - Math.PI / 2);
        //     })
        //     .attr("cy", function (d, i) {
        //         return rScale(d.value) * Math.sin(angleSlice[i] - Math.PI / 2);
        //     })
        //     // .style("fill", function(d,i,j) {  return cfg.color(d.index); })
        //     .style("fill", function (d) {
        //         return colorTemperature(d.value);
        //     })
        //     .style("fill-opacity", 0.5)
        //     .style("stroke", "#000")
        //     .style("stroke-width", 0.2);
        var index;
        var timer = d3.timer(function (elapsed) {
            if (elapsed / timestep > radar._groups[0].length - 1 || (!playing)) {
                playing = false;
                d3.selectAll(".radarmove").remove();
                d3.selectAll(".radarWrapper")
                    .style("opacity", 1);
                playbar.remove();
                $(".playbtn").removeClass('playing');
                $(".playbtn > i").removeClass('fa-stop').addClass('fa-play');
                timer.stop();
            } else {
                if (index != Math.floor(elapsed / timestep) + 1) {
                    index = Math.floor(elapsed / timestep) + 1;
                    // console.log(index);
                    current_data = [radar._groups[0][index].__data__];
                    updateanimation(current_data);
                }

            }

            function updateanimation(current_data) {
                playbar.transition().duration(timestep)//.ease(d3.easeLinear)
                    .attr("transform", "translate(" + xScale(current_data[0].time) + "," + 0 + ")");
                RadarChart(".radarmove",current_data,optr,"");
                // console.log("new: ");
                // console.log(current_data[0].time);
                // wapperout.data(current_data);
                // var blobWrapper = wapperout.enter().selectAll(".radarWrappermove")
                //     .data((d, i) => current_data[i]
                //     );
                // //Create the outlines
                // var path = blobWrapper.selectAll(".radarStroke")
                //     .datum((d, i) => current_data[i])
                //     .transition()
                //     .duration(timestep).ease(d3.easePolyInOut)
                //     .attr("d", function (d, i) {
                //         return radarLine(d);
                //     });
                //
                // //Append the backgrounds
                // blobWrapper.selectAll(".radarArea")
                //     .datum((d, i) => current_data[i])
                //     .transition()
                //     .duration(timestep).ease(d3.easePolyInOut)
                //     .attr("d", function(d,i) { return radarLine(d); });
                //
                // //Append the circles
                // blobWrapper.selectAll(".radarCircle")
                //     .data((d, i) => current_data[i]
                //     ).transition().duration(timestep).ease(d3.easePolyInOut)
                //     .attr("r", function (d) {
                //         return 1 + Math.pow((d.index + 2), 0.3);
                //     })
                //     .attr("cx", function (d, i) {
                //         return rScale(d.value) * Math.cos(angleSlice[i] - Math.PI / 2);
                //     })
                //     .attr("cy", function (d, i) {
                //         return rScale(d.value) * Math.sin(angleSlice[i] - Math.PI / 2);
                //     })
                //     // .style("fill", function(d,i,j) {  return cfg.color(d.index); })
                //     .style("fill", function (d) {
                //         return colorTemperature(d.value);
                //     })
                //     .style("fill-opacity", 0.5)
                //     .style("stroke", "#000")
                //     .style("stroke-width", 0.2);
            }
        }, timestep);
    }
}
function pannelsummary(show){
    var pansum = d3.select("#Summarynode");
    if (show)
        pansum.style('visibility','visible');
    else
        pansum.style('visibility','hidden');
}

function normalizevalue(d,undefined_mode) {
    d.forEach((s,j)=>{
        if (s.value == undefinedValue || isNaN(s.value)) {
            if (undefined_mode==="mean")
                s.value = 0.5;
            else
                s.value = -0.1;
        }else {
            const settingaxis = serviceFullList.find(ser => s.axis===ser.text);
            const scale = d3.scaleLinear()
                .domain(settingaxis.range)
                .range([0,1]);
            s.value =  scale(s.value);
        }
    });
    return d;
}



// Make the DIV element draggable: from W3 code
//dragElement(document.getElementById("Summarynode"));

function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "header")) {
        // if present, the header is where you move the DIV from:
        document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    } else {
        // otherwise, move the DIV from anywhere inside the DIV:
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}