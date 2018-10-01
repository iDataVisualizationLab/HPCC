// Setup the tool tip.  Note that this is just one example, and that many styling options are available.
    // See original documentation for more details on styling: http://labratrevenge.com/d3-tip/

var tipW = 450;
var tipH = 200;
var margin = {top: 10, right: 0, bottom: 40, left: 50};
var color2 = d3.scaleOrdinal()
    .range(["#00a","#a0a","#444"]);


//////////////////////////////////////////////////////////////
////////////////////////// Data //////////////////////////////
//////////////////////////////////////////////////////////////

var dataSpider = [
    [//CPU1
        {axis:"temperature",value:0.22},
        {axis:"cpu load",value:0.22},
        {axis:"memory usage",value:0.21},
        {axis:"fans speed",value:0.02},
        {axis:"power consumption",value:0.29},
    ],[//CPU2
        {axis:"temperature",value:0.22},
        {axis:"cpu load",value:0.28},
        {axis:"memory usage",value:0.17},
        {axis:"fans speed",value:0.22},
        {axis:"power consumption",value:0.21},
    ]/*,[//CPU3
        {axis:"temperature",value:0.22},
        {axis:"bmc health",value:0.28},
        {axis:"cpu health",value:0.17},
        {axis:"cpu load",value:0.22},
        {axis:"fans health",value:0.21},
        {axis:"memory health",value:0.02},
        {axis:"memory usage",value:0.29},
    ]*/
];



var tool_tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-200, 100])
    .html(function(d1) {
        var d = hosts[d1.index];
        str="";
       /* str+="<table border='0.5px'  style='width:100%'>"
        for (key in d) {
            if (key== "index")
                ;// Do nothing
            else if (key== "nodes")
                str+=  "<tr><td> Number of nodes</td> <td>  <span style='color:black'>" + d[key].length + "</span> </td></tr>";
            else{
                str+=  "<tr><td>"+key+"</td> <td>  <span style='color:black'>" + d[key] + "</span> </td></tr>";
            }
        }
        str+="</table> <br>"
        */

        str += '<svg width="100" height="100" id="svgTip"> </svg>'
        str += '<div class="radarChart"></div>'; // Spider chart holder
        str += '<button onclick="tool_tip.hide()">Close</button>';
        return str; });
svg.call(tool_tip);




function mouseoverNode(d1){
    var r = hostResults[d1.className.baseVal];
    tool_tip.show(r);

    // 1. create the svgTip
    var svgTip = d3.select("#svgTip")
        .attr("width", tipW + margin.left + margin.right)
        .attr("height", tipH + margin.top + margin.bottom)
        .style("attr","#fff")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")


    // 2. Process the array of historical temperatures
    var arr = [];
    for (var i=0; i<r.arr.length;i++){
        var a = processData(r.arr[i].data.service.plugin_output, serviceList[0]);
        var obj = {};
        obj.temp1 = a[0];
        obj.temp2 = a[1];
        obj.temp3 = a[2];
        obj.query_time =r.arr[i].result.query_time;
        arr.push(obj);
    }

    console.log(r);
        
    var arrServices = [];
    if (r.arr.length>0){
        var lastIndex = r.arr.length-1;
        var a = processData(r.arrTemperature[lastIndex].data.service.plugin_output, serviceList[0]);
        var obj = {};
        obj.a = a;
        arrServices.push(obj);

        var a = processData(r.arrCPU_load[lastIndex].data.service.plugin_output, serviceList[1]);
        var obj = {};
        obj.a = a;
        arrServices.push(obj);

        var a = processData(r.arrMemory_usage[lastIndex].data.service.plugin_output, serviceList[2]);
        var obj = {};
        obj.a = a;
        arrServices.push(obj);

        var a = processData(r.arrFans_health[lastIndex].data.service.plugin_output, serviceList[3]);
        var obj = {};
        obj.a = a;
        arrServices.push(obj);

        var a = processData(r.arrPower_usage[lastIndex].data.service.plugin_output, serviceList[4]);
        var obj = {};
        obj.a = a;
        arrServices.push(obj);
    }
    

    // 3. get Time
    var minTime = 10*(new Date("1/1/2030").getTime());  // some max number
    var maxTime = 0;
    for (var i=0; i<r.arr.length;i++){
        var qtime =r.arr[i].result.query_time;
        minTime = Math.min(minTime,qtime);
        maxTime = Math.max(maxTime,qtime);
    }

    var xScale = d3.scaleTime()
        .domain([ new Date(minTime-1000), new Date(maxTime+1000) ])
        .range([0, tipW-50]);

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
        .attr("width", tipW+ margin.right)
        .attr("height", tipH )
        .attr("fill", "#fff")
        .attr("fill-opacity",1)
        .attr("stroke", "#000")
        .attr("stroke-width", 0.05);               ;


    // 3. Call the x axis in a group tag
    // compute number of ticks
    var numTicks = 1+Math.round((maxTime-minTime)/(60*1000)); // every minutes
    if (numTicks>6) numTicks=6;

    svgTip.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + tipH + ")")
        .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%H:%M")).ticks(numTicks)); //

    // 4. Call the y axis in a group tag
    svgTip.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(yScale).ticks(5).tickSize(-tipW+50))
            .style("stroke-opacity", 0.2); // Create an axis component with d3.axisLeft

    // ****** Append the path ****** CPU1
    var line1 = d3.line()
        .x(function(d, i) { return xScale(d.query_time); }) // set the x values for the line generator
        .y(function(d) { return yScale(d.temp1); }) // set the y values for the line generator
        .curve(d3.curveMonotoneX) // apply smoothing to the line

    svgTip.append("path")
            .datum(arr) // 10. Binds data to the line
            .attr("class", "line1") // Assign a class for styling
            .attr("d", line1)
            .attr("stroke", function () {
                return color2(0);
            })
            .attr("stroke-width",1); // 11. Calls the line generator
    // Appends a circle for each datapoint ****** CPU1
    svgTip.selectAll(".dot1")
        .data(arr)
        .enter().append("circle") // Uses the enter().append() method
        .attr("class", "dot1") // Assign a class for styling
        .attr("cx", function(d, i) { return xScale(d.query_time) })
        .attr("cy", function(d) { return yScale(d.temp1) })
        .attr("r", 3)
        .attr("fill", function (d) {
            return color(d.temp1);
        })
        .attr("fill-opacity",function (d) {
            return 1;
            //return opa(d.temp1);
        })
        .attr("stroke-width",0.5)
        .attr("stroke","#000");

    svgTip.append("text")
        .attr("x", tipW-4)
        .attr("y",  yScale(arr[arr.length-1].temp1))
        .attr("fill", function () { return color2(0); })
        .style("text-anchor","end")
        .style("font-size", "12px")
        .attr("font-family", "sans-serif")
        .text("CPU1="+Math.round(arr[arr.length-1].temp1));


    // ****** Append the path ****** CPU2
    var line2 = d3.line()
        .x(function(d, i) { return xScale(d.query_time); }) // set the x values for the line generator
        .y(function(d) { return yScale(d.temp2); }) // set the y values for the line generator
        .curve(d3.curveMonotoneX) // apply smoothing to the line
    svgTip.append("path")
        .datum(arr) // 10. Binds data to the line
        .attr("class", "line2") // Assign a class for styling
        .attr("d", line2)
        .attr("stroke", function () {
            return color2(1);
        })
        .attr("stroke-width",1);
    // Appends a circle for each datapoint ****** CPU2
    svgTip.selectAll(".dot2")
        .data(arr)
        .enter().append("circle") // Uses the enter().append() method
        .attr("class", "dot2") // Assign a class for styling
        .attr("cx", function(d, i) { return xScale(d.query_time) })
        .attr("cy", function(d) { return yScale(d.temp2) })
        .attr("r", 3)
        .attr("fill", function (d) {
            return color(d.temp2);
        })
        .attr("fill-opacity",function (d) {
            return opa(d.temp2);
        })
        .attr("stroke-width",0.5)
        .attr("stroke","#000");

     svgTip.append("text")
        .attr("x", tipW-4)
        .attr("y",  yScale(arr[arr.length-1].temp2))
        .attr("fill", function () { return color2(1); })
        .style("text-anchor","end")
        .style("font-size", "12x")
        .attr("font-family", "sans-serif")
        .text("CPU2="+Math.round(arr[arr.length-1].temp2));

    // ****** Append the path ****** CPU3  Inlet
    var line3 = d3.line()
        .x(function(d, i) { return xScale(d.query_time); }) // set the x values for the line generator
        .y(function(d) { return yScale(d.temp3); }) // set the y values for the line generator
        .curve(d3.curveMonotoneX) // apply smoothing to the line
    svgTip.append("path")
        .datum(arr) // 10. Binds data to the line
        .attr("class", "line3") // Assign a class for styling
        .attr("d", line3)
        .attr("stroke","#000")
        .attr("stroke-width",1)
        .style("stroke-dasharray", ("1, 4"));
    svgTip.append("text")
        .attr("x", tipW-4)
        .attr("y",  yScale(arr[arr.length-1].temp3))
        .attr("fill", function () { return "#444"; })
        .style("text-anchor","end")
        .style("font-size", "11px")
        .attr("font-family", "sans-serif")
        .text("Inlet="+Math.round(arr[arr.length-1].temp3));





    //************************************************************* Host name
    svgTip.append("text")
        .attr("class", "hostnameInTip")
        .attr("x", function (d) {return 15;})
        .attr("y", function (d) {return 12;})
        .attr("fill", "#000")
        .style("text-anchor","left")
        .style("font-weight","bold")
        .style("font-size", "12px")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text("Host: "+d1.className.baseVal);
    svgTip.append("text")
        .attr("x", -tipH/2)
        .attr("y", -35)
        .attr("transform", "rotate(-90)")
        .attr("fill", "#000")
        .style("text-anchor","middle")
        .style("font-style","italic")
        .style("font-size", "12px")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text("Temperature (°F)");

    //************************************************************* Date and Time
    svgTip.append("text")
        .attr("x", -margin.left)
        .attr("y", tipH+34)
        .attr("fill", "#000")
        .style("font-style","italic")
        .style("text-anchor","left")
        .style("font-size", "12px")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text(""+new Date(minTime).toDateString());

    svgTip.append("text")
        .attr("x", tipW-3)
        .attr("y", tipH+34)
        .attr("fill", "#000")
        .style("font-style","italic")
        .style("text-anchor","end")
        .style("font-size", "12px")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text("Current time: "+new Date(maxTime).getHours()+":"+new Date(maxTime).getMinutes());

    // Update spider data *************************************************************
    for (var i=0; i<arrServices.length;i++){
        dataSpider[0][i].value = arrServices[i].a[0];
        dataSpider[1][i].value = arrServices[i].a[1];
       // dataSpider[2][index].value = arr[i].temp3;
    }
    spiderChart();        
}

function mouseoutNode(d1){
    tool_tip.hide(d1);
}

function spiderChart() {
   /* Radar chart design created by Nadieh Bremer - VisualCinnamon.com */
      var radarChartOptions = {
        w: tipW-50,
        h: tipW,
        maxValue: 0.5,
        levels: 5,
        roundStrokes: true,
        color: color2
      };
      //Call function to draw the Radar chart
      RadarChart(".radarChart", dataSpider, radarChartOptions);
}