// Setup the tool tip.  Note that this is just one example, and that many styling options are available.
    // See original documentation for more details on styling: http://labratrevenge.com/d3-tip/



var tipW = 400;
var tipH = 300;

var tool_tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([100, tipW/2])
    .html(function(d1) {
        var d = hosts[d1.index];
        str="";
        str+="<table border='0.5px'  style='width:100%'>"
        for (key in d) {
            if (key== "x" || key== "y" || key== "vx" || key== "vy" || key== "fx" || key== "fy")
                ;// Do nothing
            else if (key== "nodes")
                str+=  "<tr><td> Number of nodes</td> <td>  <span style='color:black'>" + d[key].length + "</span> </td></tr>";
            else if (key== "Link")
                str+=  "<tr><td>"+key+"</td> <td>  <span style='color:blue'>" + d[key] + "</span> </td></tr>";
            else{
                str+=  "<tr><td>"+key+"</td> <td>  <span style='color:black'>" + d[key] + "</span> </td></tr>";
            }
        }
        str+="</table> <br>"

        str +=  '<svg id="svgTip" width="400" height="400" > </svg>'



        return str; });
svg.call(tool_tip);




function mouseoverNode(d1){
    var r = hostResults[d1.className.baseVal];
    tool_tip.show(r);


// draw line graph
    d3.select("#svgTip")
        .append("rect")
        .attr("class", "a")
        .attr("x", 10)
        .attr("y", 10)
        .attr("width", 100)
        .attr("height",100 )
        .attr("fill", function (d) {
            return "f00";
        })
        .attr("fill-opacity",0.9)
        .attr("stroke", "#000")
        .attr("stroke-width", 0.5);

    // 2. Use the margin convention practice
    var margin = {top: 50, right: 50, bottom: 50, left: 50}
        , width = 400 // Use the window's width
        , height =200; // Use the window's height

    // The number of datapoints
        var n = 21;

    // 5. X scale will use the index of our data
        var xScale = d3.scaleLinear()
            .domain([0, n-1]) // input
            .range([0, width]); // output

    // 6. Y scale will use the randomly generate number
        var yScale = d3.scaleLinear()
            .domain([0, 1]) // input
            .range([height, 0]); // output

    // 7. d3's line generator
        var line = d3.line()
            .x(function(d, i) { return xScale(i); }) // set the x values for the line generator
            .y(function(d) { return yScale(d.y); }) // set the y values for the line generator
            .curve(d3.curveMonotoneX) // apply smoothing to the line

    // 8. An array of objects of length N. Each object has key -> value pair, the key being "y" and the value is a random number
        var dataset = d3.range(n).map(function(d) { return {"y": d3.randomUniform(1)() } })

    // 1. Add the SVG to the page and employ #2
        var svg = d3.select("#svgTip")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // 3. Call the x axis in a group tag
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale)); // Create an axis component with d3.axisBottom

    // 4. Call the y axis in a group tag
        svg.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft

    // 9. Append the path, bind the data, and call the line generator
        svg.append("path")
            .datum(dataset) // 10. Binds data to the line
            .attr("class", "line") // Assign a class for styling
            .attr("d", line)
            .attr("stroke","#f00")
            .attr("stroke-width",2); // 11. Calls the line generator

    // 12. Appends a circle for each datapoint
        svg.selectAll(".dot")
            .data(dataset)
            .enter().append("circle") // Uses the enter().append() method
            .attr("class", "dot") // Assign a class for styling
            .attr("cx", function(d, i) { return xScale(i) })
            .attr("cy", function(d) { return yScale(d.y) })
            .attr("r", 5);



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