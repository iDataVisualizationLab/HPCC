let radarController = function () {
    let graphicopt = {
            margin: {top: 40, right: 40, bottom: 40, left: 40},
            width: 300,
            height: 300,
            radius: 150,
            scalezoom: 1,
            widthView: function(){return this.width*this.scalezoom},
            heightView: function(){return this.height*this.scalezoom},
            widthG: function(){return this.widthView()-this.margin.left-this.margin.right},
            heightG: function(){return this.heightView()-this.margin.top-this.margin.bottom},
            roundStrokes: true,
            labelFactor: 1.1,
            levels: 1,
            arrColor: ["#110066", "#4400ff", "#00cccc", "#00dd00", "#ffcc44", "#ff0000", "#660000"],
            arrThresholds: [],
            opacityCircles: 0.1,
            wrapWidth: 60,
        };

    let svg,div;
    let id;
    let radarcomp = { // schema
      axis: {}, // axis objects
      axisList : [],  // axis array
    };
    let radarController ={};
    // color control
    let colorLength = graphicopt.arrColor.length-1;
    graphicopt.arrThresholds = graphicopt.arrColor.map((d,i)=>i/colorLength);
    let colorTemperature = d3.scaleLinear()
        .range(graphicopt.arrColor)
        .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb

    // FUNCTION ZONE
    let onChangeValueFunc = function(){};

    // TODO: REPLACE

    let rScale = d3.scaleLinear()
        .domain([0, 1]);

    radarController.axisSchema = function (){
        if (arguments.length===1) {
            const axis = arguments[0];
            if (Array.isArray(axis)) //array axis
            {
                createSchemaInit(axis);
            } else // schema axis
            {
                updateSchemas(axis);
            }
        }else {
            return radarcomp.axisList;
        }
        return radarController;
    };
    let idleTimeout,
        idleDelay = 350;
    function getBrush(d) {
        return d3.brush(radarcomp.axis[d].scale)
            .extent([[-10, 0], [10, h]])
            .on("brush end", brushended);
    }
    function brushended() {
        var actives = [],
            extents = [];
        svg.selectAll(".brush")
            .filter(function(d) {
                radarcomp.axis[d].filter = d3.brushSelection(this);
                return radarcomp.axis[d].filter;
            })
            .each(function(d) {
                // Get extents of brush along each active selection axis (the Y axes)
                actives.push(d);
                extents.push(radarcomp.axis[d].filter.map(radarcomp.axis[d].scale.invert).sort((a,b)=>a-b));
            });
        var b = svg.selectAll('.dimension').nodes()
            .forEach(function(element, i) {
                var dimension = d3.select(element).data()[0];
                if (_.include(actives, dimension)) {
                    var extent = extents[actives.indexOf(dimension)];
                    d3.select(element)
                        .selectAll('text')
                        .style('font-weight', 'bold')
                        .style('font-size', '13px')
                        .style('display', function() {
                            var value = d3.select(this).data()[0];
                            return extent[0] <= value && value <= extent[1] ? null : "none"
                        });
                } else {
                    d3.select(element)
                        .selectAll('text')
                        .style('font-size', null)
                        .style('font-weight', null)
                        .style('display', null);
                }
                d3.select(element)
                    .selectAll('.label')
                    .style('display', null);
            });
        ;
        // bold dimensions with label
        svg.selectAll('.label')
            .style("font-weight", function(dimension) {
                if (_.include(actives, dimension)) return "bold";
                return null;
            });
        // Get lines within extents
        // var selected = [];
        // data
        //     .filter(function(d) {
        //         return !_.contains(excluded_groups, d.group);
        //     })
        //     .map(function(d) {
        //         return actives.every(function(p, dimension) {
        //             return extents[dimension][0] <= d[p] && d[p] <= extents[dimension][1];
        //         }) ? selected.push(d) : null;
        //     });
        // // free text search
        // var query = d3.select("#search").node().value;
        // if (query.length > 0) {
        //     selected = search(selected, query);
        // }
        // if (selected.length < data.length && selected.length > 0) {
        //     d3.select("#keep-data").attr("disabled", null);
        //     d3.select("#exclude-data").attr("disabled", null);
        // } else {
        //     d3.select("#keep-data").attr("disabled", "disabled");
        //     d3.select("#exclude-data").attr("disabled", "disabled");
        // };
        //
        // // total by food group
        // var tallies = _(selected)
        //     .groupBy(function(d) { return d.group; });
        //
        // // include empty groups
        // _(colors.domain()).each(function(v,k) {tallies[v] = tallies[v] || []; });

        // var s = d3.event.selection;
        // if (!s) {
        //     if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
        //     x.domain(x0);
        //     y.domain(y0);
        // } else {
        //     x.domain([s[0][0], s[1][0]].map(x.invert, x));
        //     y.domain([s[1][1], s[0][1]].map(y.invert, y));
        //     svg.select(".brush").call(brush.move, null);
        // }
    }
    function idled() {
        idleTimeout = null;
    }
    let getangle = function (count) { // auto dive angle function base on neighbor angle
        if (count===radarcomp.axisList.length) //max stack call
            return 0;
        count = (count||0)+1;
        const index = this.order;
        let combo = [];
        if (index === 0)
            combo = [negativeAngle(_(radarcomp.axisList).last().angle(count)),radarcomp.axisList[1].angle(count)];
        else
            combo = [radarcomp.axisList[index-1].angle(count),radarcomp.axisList[index+1].angle(count)];
        if (combo[0]===combo[1]&& combo[0]===0) //fresh angle
            return Math.PI*2/radarcomp.axisList.length*index;
    };
    function createSchemaInit (axisArray){ // input {text: 'axis',range:[],filter:[],angle:0}
        radarcomp.axisList = []; //reset
        if (axisArray[0].order)
            axisArray.sort((a,b)=>a.order-b.order);
        axisArray.forEach((axiselement,index)=>{
            let axis;
            if (typeof axiselement === 'string')
                axis = axiselement;
            else
                axis = axiselement.text;
            radarcomp.axis[axis] = {
                scale: axiselement.range!==undefined?d3.scaleLinear().domain(axiselement.range):d3.scaleLinear(),
                filter: axiselement.filter!==undefined?axiselement.filter:[], //filter for axis
                angle: axiselement.angle!==undefined?function () {return axiselement.angle}:getangle,
                order: axiselement.order!==undefined? axiselement.order: index
            };
            radarcomp.axis[axis].data = axiselement;
            radarcomp.axisList.push(radarcomp.axis[axis]);
        });
    }
    function positiveAngle(angle){
        return angle>0? angle: (angle+Math.PI*2);
    }
    function negativeAngle(angle){
        return angle<0? angle: (angle - Math.PI*2);
    }
    function updateSchemas (axisObject) {
        Object.keys(axisObject).forEach(axis => {
            radarcomp.axis[axis] = axisObject[axis];
        });
    }
    radarController.init = function ()
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
                    .attr('transform',`translate(${graphicopt.widthG()/2+graphicopt.margin.left},${graphicopt.heightG()/2+graphicopt.margin.top})`)
            }
            svg.attrs({
                width: graphicopt.width,
                height: graphicopt.height,
                // overflow: "visible",

            });


            if (first) {
                var filter = g.append('defs').append('filter').attr('id', 'glowc'),
                    feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur'),
                    feMerge = filter.append('feMerge'),
                    feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
                    feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
                /////////////////////////////////////////////////////////
                /////////////// Draw the Circular grid //////////////////
                /////////////////////////////////////////////////////////
                //Wrapper for the grid & axes
                let axisGrid = g.append("g").attr("class", "axisWrapper");
                let radius = Math.min(graphicopt.widthG() / 2, graphicopt.heightG() / 2)
                    Format = d3.format('');
                rScale.range([0,radius]);
                //Draw the background circles
                axisGrid.selectAll(".levels")
                    .data(d3.range(1, (graphicopt.levels + 1)).reverse())
                    .enter()
                    .append("circle")
                    .attr("class", "gridCircle")
                    .attr("r", function (d, i) {
                        return rScale(d/graphicopt.levels);
                    })
                    .style("fill", graphicopt.gradient?'white':"#CDCDCD")
                    .style("stroke", function (d) {
                        var v = d / graphicopt.levels;
                        return graphicopt.gradient? '#d0d0d0': colorTemperature(v);
                    })
                    .style("stroke-width", 0.3)
                    .style("stroke-opacity", 1)
                    .style("fill-opacity", graphicopt.opacityCircles)
                    .style("filter", "url(#glowc)")
                    .style("visibility", (d, i) => ((graphicopt.bin||graphicopt.gradient) && i == 0) ? "hidden" : "visible");


                /////////////////////////////////////////////////////////
                //////////////////// Draw the axes //////////////////////
                /////////////////////////////////////////////////////////

                //Create the straight lines radiating outward from the center
                var axis = axisGrid.selectAll(".axis")
                    .data(radarcomp.axisList)
                    .enter()
                    .append("g")
                    .attr("class", "axis")
                    .style('transform-origin','0,0')
                    .style('transform',function (d, i) {
                        return "rotate(" + toDegrees(d.angle()) + "deg)"});
                //Append the lines
                function toDegrees(rad) {
                    let deg = rad * (180/Math.PI)%360;
                    return deg;
                }
                function toRadian(deg) {
                    return deg * (Math.PI/180);
                }
                axis.append("line")
                    .attr("x1", 0)
                    .attr("y1", 0)
                    .attr("x2", 0)
                    .attr("y2", -rScale(1))
                    // .attr("x2", function (d, i) {
                    //     return rScale(graphicopt.bin||graphicopt.gradient?((graphicopt.levels-1)/graphicopt.levels):1.05) * Math.cos(d.angle() - Math.PI / 2);
                    // })
                    // .attr("y2", function (d, i) {
                    //     return rScale( graphicopt.bin||graphicopt.gradient?((graphicopt.levels-1)/graphicopt.levels):1.05) * Math.sin(d.angle() - Math.PI / 2);
                    // })
                    .attr("class", "line")
                    .style("stroke", graphicopt.gradient?'#eaeaea':"white")
                    .style("stroke-width", "1px");

                //Append the labels at each axis

                axis.append("text")
                    .attr("class", "legend")
                    .style("font-size", "12px")
                    .attr("font-family", "sans-serif")
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "middle")
                    .attr("dy", "-1em")
                    .attr("x", 0)
                    .attr("y", -rScale(graphicopt.labelFactor))
                    .text(function (d) {
                        return d.data.text;
                    }).call(wrap, graphicopt.wrapWidth);
                axis.append("text")
                    .attr("class", "angleValue")
                    .style("font-size", "12px")
                    .attr("font-family", "sans-serif")
                    .attr("text-anchor", "middle")
                    .attr("dy", "2em")
                    .attr("x", 0)
                    .attr("y", -rScale(1))
                    .text(function (d) {
                        return toDegrees(d.angle()).toFixed(2) + 'o';
                    });
                    // .call(wrap, graphicopt.wrapWidth);
                axis.append("circle")
                    // .attr("cx", function (d, i) {
                    //     return rScale(graphicopt.bin||graphicopt.gradient?((graphicopt.levels-1)/graphicopt.levels):1.05) * Math.cos(d.angle() - Math.PI / 2);
                    // })
                    // .attr("cy", function (d, i) {
                    //     return rScale( graphicopt.bin||graphicopt.gradient?((graphicopt.levels-1)/graphicopt.levels):1.05) * Math.sin(d.angle() - Math.PI / 2);
                    // })
                    .attr("cx", 0)
                    .attr("cy", -rScale(1))
                    .attr('r',4)
                    .attr("class", "dragpoint")
                    .style("fill", graphicopt.gradient?'#eaeaea':"white")
                    .on('mouseover',function(){d3.select(this).attr('r',8)})
                    .on('mouseleave',function(){d3.select(this).attr('r',4)})
                    .call(d3.drag().on("start", onDragAxisStarted).on("drag", onDragAxisDragged).on("end", onDragAxisEnded));
                function onDragAxisStarted (d){
                    d.__origin__= d.angle();
                    d3.select(this.parentElement).classed('active',true);
                }
                function onDragAxisDragged (){
                    // FIXME: rotation not smooth
                    // let dAngle = -(Math.atan2(-d3.event.y,d3.event.x)-Math.PI/2);
                    let newpos = {x: -(graphicopt.widthG()/2+ graphicopt.margin.left+20) + (d3.event.sourceEvent.screenX ),
                                    y: -(graphicopt.heightG()/2+ graphicopt.margin.top  +graphicopt.height+20) + (d3.event.sourceEvent.screenY) };
                    console.log(newpos)
                    let dAngle = Math.atan2(-newpos.y,-newpos.x)-Math.PI/2;
                    console.log(dAngle);
                    // let dAngle = Math.atan2(d3.event.sourceEvent.y-radius,d3.event.sourceEvent.x-radius);
                    d3.select(this.parentElement).transition().style('transform',function (d, i) {
                        let newAngle = positiveAngle(dAngle);
                        d.angle = ()=>{return positiveAngle(newAngle);};
                        return "rotate(" + toDegrees(newAngle) + "deg)"});
                    d3.select(this.parentElement).select('.angleValue').text(function (d) {
                        return toDegrees(d.angle()).toFixed(2) + 'o';
                    });
                }
                function onDragAxisEnded (d){
                    d3.select(this.parentElement).classed('active',false);
                    d.__origin__= null;
                    onChangeValueFunc(radarcomp);
                }
            }
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

            //Create a wrapper for the blobs
            // var blobWrapperg = g.selectAll(".radarWrapper")
            //     .data(data);
            // blobWrapperg.exit().remove();
            // var blobWrapper = blobWrapperg
            //     .enter().append("g")
            //     .attr("class", "radarWrapper");
            
        }catch (e) {
            return e;
        }

    }
    /////////////////////////////////////////////////////////
    /////////////////// Helper Function /////////////////////
    /////////////////////////////////////////////////////////

    //Taken from http://bl.ocks.org/mbostock/7555321
    //Wraps SVG text
    function wrap(text, width) {
        text.each(function() {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 0.9, // ems
                y = text.attr("y"),
                x = text.attr("x"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                let size = tspan.node().getComputedTextLength();
                if (size===0)
                    size = getTextWidth(tspan.text(),tspan.style('font'));
                if (size > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }//wrap
    function getTextWidth(text, font) {
        var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
        var context = canvas.getContext("2d");
        context.font = font;
        var metrics = context.measureText(text);
        return metrics.width;
    }
    radarController.graphicopt = function (_) {
        //Put all of the options into a variable called cfg
        if (arguments.length) {
            for (let i in _) {
                if ('undefined' !== typeof _[i]) {
                    graphicopt[i] = _[i];
                }
            }
            return radarController;
        }else {
            return graphicopt;
        }

    };
    radarController.div = function (_) {
        return arguments.length ? (div = _, radarController) : div;

    };

    radarController.onChangeValue = function (_) {
        return arguments.length ? (onChangeValueFunc = _, radarController) : onChangeValueFunc;

    };

    return radarController;
};