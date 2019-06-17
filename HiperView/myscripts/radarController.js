let radarController = function () {
    let graphicopt = {
            margin: {top: 5, right: 0, bottom: 0, left: 0},
            width: 400,
            height: 400,
            scalezoom: 1,
            widthView: function(){return this.width*this.scalezoom},
            heightView: function(){return this.height*this.scalezoom},
            widthG: function(){return this.widthView()-this.margin.left-this.margin.right},
            heightG: function(){return this.heightView()-this.margin.top-this.margin.bottom},
            roundStrokes: true,
        };

    let svg,div;
    let id;

    let radraController ={};

    //Scale for the radius
    let rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([minValue, maxValue]);

    radraController.init = function ()
    {
        try {
            if (!div) throw 'div not defined';
            /////////////////////////////////////////////////////////
            //////////// Create the container SVG and g /////////////
            /////////////////////////////////////////////////////////

            //Remove whatever chart with the same id/class was present before
            let first = false;

            // div.select("svg").remove();

            //Initiate the radar chart SVG or update it

            svg = div.select(".radarController");


            let g = svg.select("#radarGroup");
            if (svg.empty()) {
                first = true;
                svg = div.append("svg")
                    .attr("width", graphicopt.width)
                    .attr("height", graphicopt.height)
                    .attr("class", "radarController radarPlot");
                //Append a g element
                g = svg.append("g")
                    .attr('class','radarControllerg')
                    .attr('transform',`translate(0,${graphicopt.margin.top})`)
            }
            svg.attrs({
                width: graphicopt.width,
                height: graphicopt.height,
                // overflow: "visible",

            });

            /////////////////////////////////////////////////////////
            ///////////// Draw the radar chart blobs ////////////////
            /////////////////////////////////////////////////////////
            //The radial line function
            let radarLine = d3.radialLine()
            // .interpolate("linear-closed")
                .curve(d3.curveCatmullRom.alpha(0.5))
                .radius(function(d) { return rScale(d.value||d); })
                .angle(function(d,i) {  return angleSlice[i]; });

            let radialAreaGenerator = d3.radialArea()
                .angle(function(d,i) {  return angleSlice[i]; })
                .innerRadius(function(d,i) {
                    return rScale(d.minval);
                })
                .outerRadius(function(d,i) {
                    return rScale(d.maxval);
                });

            if(graphicopt.roundStrokes) {
                radarLine.curve(d3.curveCardinalClosed.tension(0.5));
                //radialAreaGenerator.curve(d3.curveBasisClosed);
                radialAreaGenerator.curve(d3.curveCardinalClosed.tension(0.5));
            }
        }catch (e) {
            return e;
        }

    }
    radraController.graphicopt = function (_) {
        return arguments.length ? (graphicopt = _, radraController) : graphicopt;

    };
    radraController.div = function (_) {
        return arguments.length ? (div = _, radraController) : div;

    };
    return radraController;
};