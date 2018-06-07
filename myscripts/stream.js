
var w = width/3,
    h = 200;

var svgStream = d3.select('.streamHolder').append('svg')
    .attr("class", "contextView")
    .attr("width", w)
    .attr("height", h);


function buildStreamGraph(mqpdata) {
    var data = mqpdata;
    var stack = d3.stack()
        .keys(["AE", "AREN", "BBT", "BC", "BME", "CE", "CH", "CM", "CS", "ECE", "EV", "HU", "ID", "IE", "IMGD", "MA", "ME", "MG", "PH", "RBE", "SSPS"])
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetWiggle);

    var minTime = new Date();
    var maxTime= new Date("1/1/2000");

    // HPCC ****************************************
    for (var i=0; i<hosts.length;i++) {
        for (var j = 0; j < hosts[i].jobList.length; j++) {
                var e =  hosts[i].jobList[j];
                if (new Date(e.startTime) <minTime)
                    minTime = new Date(e.startTime);
                if (new Date(e.startTime) > maxTime)
                    maxTime = new Date(e.startTime);
        }
    }
    var startTime =  new Date((minTime.getMonth()+1)+"/"+minTime.getDate()+"/"+minTime.getFullYear()+" "+minTime.getHours()+":00:00");
    var numberOfhours = (maxTime-minTime)/3600000;
    var list = [];
    for (var hour=0; hour<numberOfhours;hour++) {
        var obj = {};
        obj.month = new Date(startTime.getTime()+hour*3600000);
        for (var u=0; u<users.length;u++) {
            obj[users[u].name] =0;
        }
        list.push(obj);
    }
    //Compute the hourly distributions
    for (var i=0; i<hosts.length;i++) {
        for (var j = 0; j < hosts[i].jobList.length; j++) {
            var t =  new Date(hosts[i].jobList[j].startTime);
            var index = Math.floor((t - startTime)/3600000);
            var u=  hosts[i].jobList[j].user;
            list[index][u]++;
        }
    }
    var usernames = users.map(d => d.name)

    var stack = d3.stack()
        .keys(usernames)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetSilhouette);


    var series = stack(list);


    var x = d3.scaleTime()
        .domain(d3.extent(list, function(d){ return d.month; }))
        .range([30, w-40]);

    var xAxis = d3.axisBottom(x);

    var y = d3.scaleLinear()
        .domain([0, d3.max(series, function(layer) { return d3.max(layer, function(d){ return d[0] + d[1];}); })])
        .range([h/2, -h*0.9]);

    var area = d3.area()
        .x(function(d) {  return x(d.data.month); })
        .y0(function(d) { return y(d[0]); })
        .y1(function(d) { return y(d[1]); })
        .curve(d3.curveBasis);

    svgStream.selectAll("path")
        .data(series)
        .enter().append("path")
        .attr("d", area)
        .style("fill", function(d) { return getColor(d.key); })
        .style("stroke", "#fff")
        .style("stroke-width", 0.1)
        .on('mouseover', function(d){
            d3.select(this).style('fill',d3.rgb( d3.select(this).style("fill") ).brighter());
            d3.select("#major").text(d.key);
        })
        .on('mouseout', function(d){
            d3.select(this).style('fill',
                d3.rgb( d3.select(this).style("fill") ).darker());
            d3.select("#major").text("Mouse over");

        })

    svgStream.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + h/2 + ")")
        .call(xAxis);
    svgStream.append("text")
        .attr("class", "startTimeText")
        .attr("x", 30)
        .attr("y", h/2-15)
        .attr("fill", "#000")
        .style("text-anchor","left")
        .style("font-size",12)
        .style("font-weight","bold")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text("Job startTime by users");
}
   