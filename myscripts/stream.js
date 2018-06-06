
function buildStreamGraph(mqpdata) {
    var data = mqpdata;
    var stack = d3.stack()
        .keys(["AE", "AREN", "BBT", "BC", "BME", "CE", "CH", "CM", "CS", "ECE", "EV", "HU", "ID", "IE", "IMGD", "MA", "ME", "MG", "PH", "RBE", "SSPS"])
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetWiggle);
    debugger;
    var series =3;
    var width = 850,
        height = 500;

    var x = d3.scaleTime()
        .domain(d3.extent(data, function(d){ return d.month; }))
        .range([100, width]);

    var xAxis = d3.axisBottom(x);

    var y = d3.scaleLinear()
        .domain([0, d3.max(series, function(layer) { return d3.max(layer, function(d){ return d[0] + d[1];}); })])
        .range([height/2, -200]);

    var color = d3.scaleLinear()
        .range(["#51D0D7", "#31B5BB"]);

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var area = d3.area()
        .x(function(d) {  return x(d.data.month); })
        .y0(function(d) { return y(d[0]); })
        .y1(function(d) { return y(d[1]); })
        .curve(d3.curveBasis);


    svg.selectAll("path")
        .data(series)
        .enter().append("path")
        .attr("d", area)
        .style("fill", function() { return color(Math.random()); })
        .on('mouseover', function(d){
            d3.select(this).style('fill',d3.rgb( d3.select(this).style("fill") ).brighter());
            d3.select("#major").text(d.key);
        })
        .on('mouseout', function(d){
            d3.select(this).style('fill',
                d3.rgb( d3.select(this).style("fill") ).darker());
            d3.select("#major").text("Mouse over");

        })

    svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + (height) + ")")
        .call(xAxis);

}
   