var labels = true; // show the text labels beside individual boxplots?

var ww = 800;
var hh = 200;

// parse in the data

//var csv =[1,2,3,4, 3,5,2,18,4,9,4,6,9,11];


function drawBoxplot(svg,arr, index,xx) {
    var min = Infinity,
    max = -Infinity;
    var data = [];
    data[0] = [];
    data[0][0] = "Label";
    data[0][1] = [];

    arr.forEach(function(x) {
        var v1 = x;
            //v4 = Math.floor(x.Q4);
        // add more variables if your csv file has more columns
        var rowMax = v1;
        var rowMin = v1;

        data[0][1].push(v1);
        if (rowMax > max) max = rowMax;
        if (rowMin < min) min = rowMin;
    });

    var chart = d3.box()
        .whiskers(iqr(1.5))
        .height(hh)
        .domain([40, 100])
        .showLabels(labels);
    /*var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("class", "box")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");*/
    // the y-axis
    var y = d3.scaleLinear()
        .domain([min, max])
        .range([hh]);

    // draw the boxplots
    svg.selectAll(".box"+index)
        .data(data)
        .enter().append("g")
        .attr("transform", function(d) { return "translate(" + xx  + "," + 20 + ")"; } )
        .call(chart.width(20));
}

// Returns a function to compute the interquartile range.
function iqr(k) {
    return function(d, i) {
        var q1 = d.quartiles[0],
            q3 = d.quartiles[2],
            iqr = (q3 - q1) * k,
            i = -1,
            j = d.length;
        while (d[++i] < q1 - iqr);
        while (d[--j] > q3 + iqr);
        return [i, j];
    };
}
