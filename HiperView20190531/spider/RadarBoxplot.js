d3.RadarBox = function () {
    let svg;
    let g;
    let data = [];
    let RadarBox ={};
    let id;
    let cfg ={
        width: 600,                //Width of the circle
        height: 600,                //Height of the circle
        margin: {top: 10, right: 55, bottom: 0, left: 55}, //The margins of the SVG
        levels: 3,             //How many levels or inner circles should there be drawn
        labelFactor: 1.1,     //How much farther than the radius of the outer circle should the labels be placed
        minValue:0,
        maxValue:1
    };
    let first = false;
    RadarBox.draw = function() {

        // remove contain old svg
        d3.select(id).selectAll("svg").nodes().forEach(d=>{
            if (d3.select(d).attr("class")!==("radarbox"+id.replace(".","")))
                d3.select(d).remove();
        });
        svg = d3.select(id).select(".radar"+id.replace(".",""));
        g = svg.select("#radarGroup");
        // check exist svg
        if (svg.empty()) {
            first = true;
            svg = d3.select(id).append("svg")
                .attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
                .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
                .attr("class", "radar" + id.replace(".",""));
            //Append a g element
            g = svg.append("g")
                .attr("id","radarGroup")
                .attr("transform", "translate(" + (cfg.w/2 + cfg.margin.left) + "," + (cfg.h/2 + cfg.margin.top) + ")");
        }

        if (first) {
            var allAxis = (data[0].map(function(i, j){return i.axis})), //Names of each axis
                total = allAxis.length,                 //The number of different axes
                radius = Math.min(cfg.w/2, cfg.h/2),    //Radius of the outermost circle
                Format = d3.format(''),                //Percentage formatting
                //    angleSlice = Math.PI * 2 / total;       //The width in radians of each "slice"
                angle1= Math.PI * 2 / total;
            angle2= Math.PI * 2 / (total+4);
            angleSlice = [];
            for (var i=0;i<total;i++){
                if (i==0 || i==1 || i==2)       // Temperatures
                    angleSlice.push(angle2*(i-1));
                else if (i==5 || i==6 || i==7 || i==8)  // Fan speeds
                    angleSlice.push(Math.PI/4.62+angle2*(i-1));
                else if (i==9)  // Power consumption
                    angleSlice.push(Math.PI * 1.5);
                else
                    angleSlice.push(angle1*(i-1));
            }      //TOMMY DANG
            //Scale for the radius
            var rScale = d3.scaleLinear()
                .range([0, radius])
                .domain([cfg.minValue, cfg.maxValue]);
            /////////////////////////////////////////////////////////
            ////////// Glow filter for some extra pizzazz ///////////
            /////////////////////////////////////////////////////////
            //Filter for the outside glow
            var filter = g.append('defs').append('filter').attr('id', 'glow'),
                feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur'),
                feMerge = filter.append('feMerge'),
                feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
                feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

            //Filter for the outside glow
            var filter = g.append('defs').append('filter').attr('id', 'glow2'),
                feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '1').attr('result', 'coloredBlur'),
                feMerge = filter.append('feMerge'),
                feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
                feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

            /////////////////////////////////////////////////////////
            /////////////// Draw the Circular grid //////////////////
            /////////////////////////////////////////////////////////

            //Wrapper for the grid & axes
            var axisGrid = g.append("g").attr("class", "axisWrapper");

            //Draw the background circles
            axisGrid.selectAll(".levels")
                .data(d3.range(1, (cfg.levels + 1)).reverse())
                .enter()
                .append("circle")
                .attr("class", "gridCircle")
                .attr("r", function (d, i) {
                    return radius / cfg.levels * d;
                })
                //.style("fill", function(d){
                //    var v = (maxValue-minValue) * d/cfg.levels +minValue;
                //    return colorTemperature(v);
                //})
                .style("fill", "#CDCDCD")
                .style("stroke", function (d) {
                    var v = (maxValue - minValue) * d / cfg.levels + minValue;
                    return colorTemperature(v);
                })
                .style("stroke-width", 0.3)
                .style("stroke-opacity", 1)
                .style("fill-opacity", cfg.opacityCircles)
                .style("filter", "url(#glow)")
                .style("visibility", (d, i) => (cfg.bin && i == 0) ? "hidden" : "visible");

            /////////////////////////////////////////////////////////
            //////////////////// Draw the axes //////////////////////
            /////////////////////////////////////////////////////////

            //Create the straight lines radiating outward from the center
            var axis = axisGrid.selectAll(".axis")
                .data(allAxis)
                .enter()
                .append("g")
                .attr("class", "axis");
            //Append the lines
            axis.append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", function (d, i) {
                    return rScale(maxValue * 1.05) * Math.cos(angleSlice[i] - Math.PI / 2);
                })
                .attr("y2", function (d, i) {
                    return rScale(maxValue * 1.05) * Math.sin(angleSlice[i] - Math.PI / 2);
                })
                .attr("class", "line")
                .style("stroke", "white")
                .style("stroke-width", "1px");
        }

    }

    RadarBox.attrs = function (_) {
        if (arguments.length)
        for(var i in _){
            if('undefined' !== typeof _[i]){ cfg[i] = _[i]; }
        }//for i
        return RadarBox;
    };

    RadarBox.attr = function(n, v) {
        // debugger;
        if (arguments.length < 2 && typeof n === 'string') {
            return cfg[n];
        } else {
            cfg[n] = v;
        }
        return RadarBox;
    };
    RadarBox.data = function (_) {
        return arguments.length ? (data = _, RadarBox) : data;

    };
    RadarBox.svg = function (_) {
        return arguments.length ? (svg = _, RadarBox) : svg;

    };
    RadarBox.id = function (_) {
        return arguments.length ? (id = _, RadarBox) : id;

    };
    // Make the DIV element draggable: from W3 code

    return RadarBox;
}