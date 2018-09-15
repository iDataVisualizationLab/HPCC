// Setup the tool tip.  Note that this is just one example, and that many styling options are available.
    // See original documentation for more details on styling: http://labratrevenge.com/d3-tip/



var tipW = 400;
var tipH = 300;
var margin = {top: 10, right: 0, bottom: 20, left: 40}
;
var tool_tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([100, tipW/2])
    .html(function(d1) {
        var d = hosts[d1.index];
        str="";
        str+="<table border='0.5px'  style='width:100%'>"
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

       // str +=  '<svg id="svgTip" width="400" height="400" ><circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" /> </svg>'

        str +=  '<svg width="100" height="100" id="svgTip"> </svg>'


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
        var str = r.arr[i].data.service.plugin_output;
        var arrString =  str.split(" ");
        var obj = {};
        obj.temp1 = +arrString[2];
        obj.temp2 = +arrString[6];
        obj.temp3 = +arrString[10];
        obj.queryTime =r.arr[i].result.queryTime;

        arr.push(obj);

    }

    // 3. get Time
    var minTime = 10*(new Date("1/1/2030").getTime());  // some max number
    var maxTime = 0;
    for (var i=0; i<r.arr.length;i++){
        var qtime =r.arr[i].result.queryTime;
        minTime = Math.min(minTime,qtime);
        maxTime = Math.max(maxTime,qtime);
    }

    var xScale = d3.scaleTime()
        .domain([ new Date(minTime-1000), new Date(maxTime+1000) ])
        .range([0, tipW]);

    //var startTime =  new Date((minTime.getMonth()+1)+"/"+minTime.getDate()+"/"+minTime.getFullYear()+" "+minTime.getHours()+":00:00");

   // debugger;


    // 6. Y scale will use the randomly generate number
        var yScale = d3.scaleLinear()
            .domain([20, 120]) // input
            .range([tipH, 0]); // output


    // White Background
    svgTip.append("rect")
        .attr("class", name)
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", tipW)
        .attr("height", tipH )
        .attr("fill", "#fff")
        .attr("fill-opacity",1)
        .attr("stroke", "#000")
        .attr("stroke-width", 0.05);               ;


    // 3. Call the x axis in a group tag
    // compute number of ticks
    var numTicks = 1+Math.round((maxTime-minTime)/(60*1000)); // every minutes
    if (numTicks>10) numTicks=10;

    svgTip.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + tipH + ")")
        .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%H:%M")).ticks(numTicks)); //

    // 4. Call the y axis in a group tag
    svgTip.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft





    // ****** Append the path ****** CPU1
    var line1 = d3.line()
        .x(function(d, i) { return xScale(d.queryTime); }) // set the x values for the line generator
        .y(function(d) { return yScale(d.temp1); }) // set the y values for the line generator
        .curve(d3.curveMonotoneX) // apply smoothing to the line


    svgTip.append("path")
            .datum(arr) // 10. Binds data to the line
            .attr("class", "line1") // Assign a class for styling
            .attr("d", line1)
            .attr("stroke","#000")
            .attr("stroke-width",1); // 11. Calls the line generator
    // Appends a circle for each datapoint ****** CPU1
    svgTip.selectAll(".dot1")
        .data(arr)
        .enter().append("circle") // Uses the enter().append() method
        .attr("class", "dot1") // Assign a class for styling
        .attr("cx", function(d, i) { return xScale(d.queryTime) })
        .attr("cy", function(d) { return yScale(d.temp1) })
        .attr("r", 4)
        .attr("fill", function (d) {
            return color(d.temp1);
        })
        .attr("fill-opacity",function (d) {
            return opa(d.temp1);
        });

    // ****** Append the path ****** CPU2
    var line2 = d3.line()
        .x(function(d, i) { return xScale(d.queryTime); }) // set the x values for the line generator
        .y(function(d) { return yScale(d.temp2); }) // set the y values for the line generator
        .curve(d3.curveMonotoneX) // apply smoothing to the line
    svgTip.append("path")
        .datum(arr) // 10. Binds data to the line
        .attr("class", "line2") // Assign a class for styling
        .attr("d", line2)
        .attr("stroke","#888")
        .attr("stroke-width",1);
    // Appends a circle for each datapoint ****** CPU2
    svgTip.selectAll(".dot2")
        .data(arr)
        .enter().append("circle") // Uses the enter().append() method
        .attr("class", "dot2") // Assign a class for styling
        .attr("cx", function(d, i) { return xScale(d.queryTime) })
        .attr("cy", function(d) { return yScale(d.temp2) })
        .attr("r", 4)
        .attr("fill", function (d) {
            return color(d.temp2);
        })
        .attr("fill-opacity",function (d) {
            return opa(d.temp2);
        });

    // ****** Append the path ****** CPU3
    var line3 = d3.line()
        .x(function(d, i) { return xScale(d.queryTime); }) // set the x values for the line generator
        .y(function(d) { return yScale(d.temp3); }) // set the y values for the line generator
        .curve(d3.curveMonotoneX) // apply smoothing to the line
    svgTip.append("path")
        .datum(arr) // 10. Binds data to the line
        .attr("class", "line3") // Assign a class for styling
        .attr("d", line3)
        .attr("stroke","#000")
        .attr("stroke-width",1)
        .style("stroke-dasharray", ("1, 4"));


    // Appends a circle for each datapoint ****** CPU2
    /*svgTip.selectAll(".dot3")
        .data(arr)
        .enter().append("circle") // Uses the enter().append() method
        .attr("class", "dot3") // Assign a class for styling
        .attr("cx", function(d, i) { return xScale(d.queryTime) })
        .attr("cy", function(d) { return yScale(d.temp3) })
        .attr("r", 4)
        .attr("fill", function (d) {
            return color(d.temp3);
        })
        .attr("fill-opacity",function (d) {
            return opa(d.temp3);
        });*/


}

function mouseoutNode(d1){
    tool_tip.hide(d1);
}



function formatDate(date) {
  var monthNames = [
    "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"
  ];

  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();

  return day + ' ' + monthNames[monthIndex] + ' ' + year;
}