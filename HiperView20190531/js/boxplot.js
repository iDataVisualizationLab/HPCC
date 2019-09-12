var labels = true; // show the text labels beside individual boxplots?

var ww = 30;
var hh = 260;

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
        if (!isNaN(x)){
            var v1 = x;
            // add more variables if your csv file has more columns
            var rowMax = v1;
            var rowMin = v1;

            data[0][1].push(v1);
            if (rowMax > max) max = rowMax;
            if (rowMin < min) min = rowMin;
        }
    });

    var chart = d3.box()
        .whiskers(iqr(2.5))
        .height(hh-60)
        .domain([20, 100])
        .showLabels(labels);
    /*var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("class", "box")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");*/
         
    // draw the boxplots
    var boxdiv = svg.selectAll(".box"+index).remove();
    svg.selectAll(".box"+index)
        .data(data)
        .enter().append("g")
        .attr("class","box"+index+" box"+index+" graphsum")
        .attr("transform", function(d) { return "translate(" + xx  + "," + 40 + ")"; } )
        .call(chart.width(ww));
    if (index >= maxstack-1) shiftplot(svg,"box",xTimeSummaryScale.step()-ww,40,0);
}
    function shiftplot(svg,classname,deltax, y,offsetx) {
        var charts = svg.selectAll(".graphsum").transition().duration(500)
            .attr("transform", function (d,i) {
                d3.select(this).attr("class",(classname+(i-1)+" box"+(i-1)+" graphsum"));
                return "translate(" + (xLinearSummaryScale(i-1)+deltax+offsetx) + "," + y + ")";
            }).on("end", function(d) {
                if (d3.select(this).attr("class")==(classname+(-1)+" box"+(-1)+" graphsum"))
                    d3.select(this).remove();
            });
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
