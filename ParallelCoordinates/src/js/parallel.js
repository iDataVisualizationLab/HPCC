// Modified by Ngan Nguyen 2019
// Copyright (c) 2012, Kai Chang
// Released under the BSD License: http://opensource.org/licenses/BSD-3-Clause

var width, height;

var m = [40, 0, 10, 0],
    w,
    h,
    xscale,
    yscale = {},
    dragging = {},
    line =  d3.line(),
    axis,
    data,
    foreground,
    background,
    highlighted,
    dimensions,
    legend,
    render_speed = 50,
    brush_count = 0,
    excluded_groups = [],
    svg;


//legend prt
var arrColor = ['#000066','#0000ff', '#1a9850', '#ddee00','#ffcc44', '#ff0000', '#660000'];
var levelStep = 4;
var arrThresholds;
var selectedService = null;
var orderLegend;
var svgLengend;

$( document ).ready(function() {
    console.log('ready')
    $('.tabs').tabs();
    $('.dropdown-trigger').dropdown();
    $('.sidenav').sidenav();
    $('.tap-target').tapTarget();

    let comboBox = d3.select("#listvar");
    let listOption = d3.merge(serviceLists.map(d=>d.sub.map(e=>{return {service: d.text, arr:serviceListattrnest[d.id].sub[e.id], text:e.text}})));
    listOption.push({service: 'Rack', arr:'rack', text:'Rack'});
    comboBox
        .selectAll('li').data(listOption)
        .join(enter => enter.append("li") .attr('tabindex','0').append("a")
            .attr('href',"#"))
        .text(d=>{console.log(d); return d.text})
        .on('click',changeVar);

    d3.select("#DarkTheme").on("click",switchTheme);
    init();
});
function openNav() {
    d3.select("#mySidenav").classed("sideIn",true);
    d3.select("#Maincontent").classed("sideIn",true);
    _.delay(resetSize, 500);
}

function closeNav() {
    d3.select("#mySidenav").classed("sideIn",false);
    d3.select("#Maincontent").classed("sideIn",false);
    _.delay(resetSize, 500);
}
function getBrush(d) {
    return d3.brushY(yscale[d])
        .extent([[-10, 0], [10, h]])
        .on("brush end", brush);
}

function init() {
    width = $("#Maincontent").width()-10;
    height = d3.max([document.body.clientHeight-540, 240]);
    w = width - m[1] - m[3];
    h = height - m[0] - m[2];
    xscale = d3.scalePoint().range([0, w]).padding(0.3);
    axis = d3.axisLeft().ticks(1+height/50);
    // Scale chart and canvas height
    let chart = d3.select("#chart")
        .style("height", (h + m[0] + m[2]) + "px");

    chart.selectAll("canvas")
        .attr("width", w)
        .attr("height", h)
        .style("padding", m.join("px ") + "px");


// Foreground canvas for primary view
    foreground = document.getElementById('foreground').getContext('2d');
    foreground.globalCompositeOperation = "destination-over";
    foreground.strokeStyle = "rgba(0,100,160,0.1)";
    foreground.lineWidth = 1.7;
    foreground.fillText("Loading...",w/2,h/2);

// Highlight canvas for temporary interactions
    highlighted = document.getElementById('highlight').getContext('2d');
    highlighted.strokeStyle = "rgba(0,100,160,1)";
    highlighted.lineWidth = 4;

// Background canvas
    background = document.getElementById('background').getContext('2d');
    background.strokeStyle = "rgba(0,100,160,0.1)";
    background.lineWidth = 1.7;

    svgLengend = d3.select('#colorContinuos').append('div').append('svg')
        .attr("class", "legendView")
        .attr("width", 0)
        .attr("height", 0)
        .style('display','none');
// SVG for ticks, labels, and interactions
    svg = d3.select("#chart").select("svg")
        .attr("width", width)
        .attr("height", height)
        .append("svg:g")
        .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

// Load the data and visualization

    // Convert quantitative scales to floats
    data = object2DataPrallel(readData());

    // Extract the list of numerical dimensions and create a scale for each.
    xscale.domain(dimensions = d3.keys(data[0]).filter(function (k) {
        return (((_.isDate(data[0][k])) && (yscale[k] = d3.scaleTime()
            .domain(d3.extent(data, function (d) {
                return d[k];
            }))
            .range([h, 0])) || (_.isNumber(data[0][k])) && (yscale[k] = d3.scaleLinear()
            .domain(d3.extent(data, function (d) {
                return +d[k];
            }))
            .range([h, 0]))));
    }));

    // Add a group element for each dimension.
    var g = svg.selectAll(".dimension")
        .data(dimensions)
        .enter().append("svg:g")
        .attr("class", "dimension")
        .attr("transform", function (d) {
            return "translate(" + xscale(d) + ")";
        })
        .call(d3.drag()
            .on("start", function (d) {
                dragging[d] = this.__origin__ = xscale(d);
                this.__dragged__ = false;
                d3.select("#foreground").style("opacity", "0.35");
            })
            .on("drag", function (d) {
                dragging[d] = Math.min(w, Math.max(0, this.__origin__ += d3.event.dx));
                dimensions.sort(function (a, b) {
                    return position(a) - position(b);
                });
                xscale.domain(dimensions);
                g.attr("transform", function (d) {
                    return "translate(" + position(d) + ")";
                });
                this.__dragged__ = true;
                brush();
                // Feedback for axis deletion if dropped
                if (dragging[d] < 12 || dragging[d] > w - 12) {
                    d3.select(this).select(".background").style("fill", "#b00");
                } else {
                    d3.select(this).select(".background").style("fill", null);
                }
            })
            .on("end", function (d) {
                if (!this.__dragged__) {
                    // no movement, invert axis
                    var extent = invert_axis(d, this);
                } else {
                    // reorder axes
                    d3.select(this).transition().attr("transform", "translate(" + xscale(d) + ")");

                    // var extent = yscale[d].brush.extent();
                    var extent = d3.brushSelection(this);
                    if (extent)
                        extent = extent.map(yscale[d].invert).sort((a,b)=>a-b);
                    console.log(extent)
                }

                // remove axis if dragged all the way left
                if (dragging[d] < 12 || dragging[d] > w - 12) {
                    remove_axis(d, g);
                }

                // TODO required to avoid a bug
                xscale.domain(dimensions);
                update_ticks(d, extent);

                // rerender
                d3.select("#foreground").style("opacity", null);
                brush();
                delete this.__dragged__;
                delete this.__origin__;
                delete dragging[d];
            }))

    // Add an axis and title.
    g.append("svg:g")
        .attr("class", "axis")
        .attr("transform", "translate(0,0)")
        .each(function (d) {
            return d3.select(this).call(axis.scale(yscale[d]));
        })
        .append("svg:text")
        .attr("text-anchor", "middle")
        // .attr("y", function(d,i) { return i%2 == 0 ? -14 : -30 } )
        .attr("y", -14)
        .attr("x", 0)
        .attr("class", "label")
        .text(String)
        .append("title")
        .text("Click to invert. Drag to reorder");

    // Add and store a brush for each axis.
    g.append("svg:g")
        .attr("class", "brush")
        .each(function (d) {
            d3.select(this).call(yscale[d].brush = getBrush(d));
        })
        .selectAll("rect")
        .style("visibility", null)
        .attr("x", -23)
        .attr("width", 36)
        .append("title")
        .text("Drag up or down to brush along this axis");

    g.selectAll(".extent")
        .append("title")
        .text("Drag or resize this filter");


    legend = create_legend(colors, brush);

    // Render full foreground
    brush();
}

function setColorsAndThresholds(s) {
    for (var i=0; i<serviceList.length;i++){
        if (s == serviceList[i]){
            dif = (thresholds[i][1]-thresholds[i][0])/levelStep;
            mid = thresholds[i][0]+(thresholds[i][1]-thresholds[i][0])/2;
            left = thresholds[i][0]-dif;
            if (left<0 && i!=0) // Temperature can be less than 0
                left=0;
            arrThresholds = [left,thresholds[i][0], thresholds[i][0]+dif, thresholds[i][0]+2*dif, thresholds[i][0]+3*dif, thresholds[i][1], thresholds[i][1]+dif];
            color = d3.scaleLinear()
                .domain(arrThresholds)
                .range(arrColor)
                .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb
            opa = d3.scaleLinear()
                .domain([left,thresholds[i][0],mid, thresholds[i][1], thresholds[i][1]+dif])
                .range([1,1,0.1,1,1]);
        }
    }
}

// copy one canvas to another, grayscale
function gray_copy(source, target) {
    var pixels = source.getImageData(0,0,w,h);
    target.putImageData(grayscale(pixels),0,0);
}

// http://www.html5rocks.com/en/tutorials/canvas/imagefilters/
function grayscale(pixels, args) {
    var d = pixels.data;
    for (var i=0; i<d.length; i+=4) {
        var r = d[i];
        var g = d[i+1];
        var b = d[i+2];
        // CIE luminance for the RGB
        // The human eye is bad at seeing red and blue, so we de-emphasize them.
        var v = 0.2126*r + 0.7152*g + 0.0722*b;
        d[i] = d[i+1] = d[i+2] = v
    }
    return pixels;
};

function create_legend(colors,brush) {
    if (selectedService) {
        colorbyValue(orderLegend);
    }else{
        colorbyCategory(data,"group");
    }
    barScale.range([0,svgLengend.node().parentElement.offsetWidth]);
    // create legend
    var legend_data = d3.select("#legend")
        .html("")
        .selectAll(".row")
        .data( colors.domain() );
    var legendAll = legend_data.join(
        enter=>{
            let legend = enter.append("div")
            .attr("title", "Hide group");
            legend
                .append("span")
                .style("opacity",0.85)
                .attr("class", "color-bar");

            legend
                .append("span")
                .attr("class", "tally")
                .text(function(d,i) { return 0});

            legend
                .append("span")
                .text(function(d,i) { return " " + d});
            return legend;
        }
    ).on("click", function(d) {
        // toggle food group
        if (_.contains(excluded_groups, d)) {
            d3.select(this).attr("title", "Hide group")
            excluded_groups = _.difference(excluded_groups,[d]);
            brush();
        } else {
            d3.select(this).attr("title", "Show group")
            excluded_groups.push(d);
            brush();
        }
    });
    legendAll.selectAll(".color-bar").style("background", function(d,i) { return colors(d)});
    return legendAll;
}

// render polylines i to i+render_speed
function render_range(selection, i, max, opacity) {
    selection.slice(i,max).forEach(function(d) {
        path(d, foreground, colorCanvas(selectedService==null?d.group:d[selectedService],opacity));
    });
};

// simple data table
function data_table(sample) {
    // sort by first column
    var sample = sample.sort(function(a,b) {
        var col = d3.keys(a)[0];
        return a[col] < b[col] ? -1 : 1;
    });

    var table = d3.select("#food-list")
        .html("")
        .selectAll(".row")
        .data(sample)
        .enter().append("div")
        .on("mouseover", highlight)
        .on("mouseout", unhighlight);

    table
        .append("span")
        .attr("class", "color-block")
        .style("background", function(d) { return color(selectedService==null?d.group:d[selectedService]) })
        .style("opacity",0.85);

    table
        .append("span")
        .text(function(d) { return d.name; })
}

// Adjusts rendering speed
function optimize(timer) {
    var delta = (new Date()).getTime() - timer;
    render_speed = Math.max(Math.ceil(render_speed * 30 / delta), 8);
    render_speed = Math.min(render_speed, 300);
    return (new Date()).getTime();
}

// Feedback on rendering progress
function render_stats(i,n,render_speed) {
    d3.select("#rendered-count").text(i);
    d3.select("#rendered-bar")
        .style("width", (100*i/n) + "%");
    d3.select("#render-speed").text(render_speed);
}

// Feedback on selection
function selection_stats(opacity, n, total) {
    d3.select("#data-count").text(total);
    d3.select("#selected-count").text(n);
    d3.select("#selected-bar").style("width", (100*n/total) + "%");
    d3.select("#opacity").text((""+(opacity*100)).slice(0,4) + "%");
}

// Highlight single polyline
function highlight(d) {
    d3.select("#foreground").style("opacity", "0.25");
    d3.select("#legend").selectAll(".row").style("opacity", function(p) { return (d.group == p) ? null : "0.3" });
    path(d, highlighted, colorCanvas(selectedService==null?d.group:d[selectedService],1));
}

// Remove highlight
function unhighlight() {
    d3.select("#foreground").style("opacity", null);
    d3.select("#legend").selectAll(".row").style("opacity", null);
    highlighted.clearRect(0,0,w,h);
}

function invert_axis(d) {
    // save extent before inverting
    var extent;
    svg.selectAll(".brush")
        .filter(ds=>ds===d)
        .filter(function(ds) {
            yscale[ds].brushSelectionValue = d3.brushSelection(this);
            return d3.brushSelection(this);
        })
        .each(function(d) {
            // Get extents of brush along each active selection axis (the Y axes)
            extent = d3.brushSelection(this).map(yscale[d].invert);
        });
    console.log(extent)
    if (yscale[d].inverted == true) {
        yscale[d].range([h, 0]);
        d3.selectAll('.label')
            .filter(function(p) { return p == d; })
            .style("text-decoration", null);
        yscale[d].inverted = false;
    } else {
        yscale[d].range([0, h]);
        d3.selectAll('.label')
            .filter(function(p) { return p == d; })
            .style("text-decoration", "underline");
        yscale[d].inverted = true;
    }
    return extent;
}

// Draw a single polyline
/*
function path(d, ctx, color) {
  if (color) ctx.strokeStyle = color;
  var x = xscale(0)-15;
      y = yscale[dimensions[0]](d[dimensions[0]]);   // left edge
  ctx.beginPath();
  ctx.moveTo(x,y);
  dimensions.map(function(p,i) {
    x = xscale(p),
    y = yscale[p](d[p]);
    ctx.lineTo(x, y);
  });
  ctx.lineTo(x+15, y);                               // right edge
  ctx.stroke();
}
*/

function path(d, ctx, color) {
    if (color) ctx.strokeStyle = color;
    ctx.beginPath();
    var x0 = xscale(dimensions[0])-15,
        y0 = yscale[dimensions[0]](d[dimensions[0]]);   // left edge
    ctx.moveTo(x0,y0);
    let valid = true;
    dimensions.map(function(p,i) {
        var x = xscale(p),
            y = yscale[p](d[p]);
        if (y===undefined) {
            if (valid) {
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x0,y0);
                ctx.setLineDash([5, 15]);
            } else{

            }
            valid = false;
        }else if (valid) {
            var cp1x = x - 0.5 * (x - x0);
            var cp1y = y0;
            var cp2x = x - 0.5 * (x - x0);
            var cp2y = y;
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
            x0 = x;
            y0 = y;
        }else {
            var cp1x = x - 0.5 * (x - x0);
            var cp1y = y0;
            var cp2x = x - 0.5 * (x - x0);
            var cp2y = y;
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.setLineDash([]);
            ctx.moveTo(x,y);
            valid = true;
            x0 = x;
            y0 = y;
        }
    });
    ctx.lineTo(x0+15, y0);                               // right edge
    ctx.stroke();
};

function colorCanvas(d,a) {
    var c = d3.hsl(color(d));
    c.opacity=a;
    return c;
}
function changeGroupTarget(key) {
    if (key === 'rack' )
        data.forEach(d=>d.group = d.rack)
    else {
        var thresholdScale = function(scale,d) {
            if(d) return d3.bisector(function(d) { return d; }).left(scale,d);
                return undefined};
        let nameLegend = rangeToString(arrThresholds);
        let arrmidle = arrThresholds.slice(1);
        orderLegend = d3.merge([nameLegend.map((d,i)=>{return{text: d, value: arrmidle[i]}}).reverse(),[{text: undefined, value: undefined}]]);
        data.forEach(d => d.group = nameLegend[thresholdScale(arrmidle,d[key])]);
    }
}
function rangeToString(arr){
    let midleRange = arr.slice(1,this.length-1);
    let mapRangeName = ["(<"+midleRange[0]+")"];
    midleRange.slice(1).forEach((d,i)=>mapRangeName.push("("+midleRange[i]+'-'+d+")"));
    mapRangeName.push("(>"+midleRange[midleRange.length-1]+")");
    return mapRangeName;
}
function position(d) {
    var v = dragging[d];
    return v == null ? xscale(d) : v;
}

// Handles a brush event, toggling the display of foreground lines.
// TODO refactor
function brush() {

    var actives = [],
        extents = [];

    svg.selectAll(".brush")
        .filter(function(d) {
            yscale[d].brushSelectionValue = d3.brushSelection(this);
            return d3.brushSelection(this);
        })
        .each(function(d) {
            // Get extents of brush along each active selection axis (the Y axes)
            actives.push(d);
            extents.push(d3.brushSelection(this).map(yscale[d].invert).sort((a,b)=>a-b));
        });
    // hack to hide ticks beyond extent
    var b = d3.selectAll('.dimension').nodes()
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
    d3.selectAll('.label')
        .style("font-weight", function(dimension) {
            if (_.include(actives, dimension)) return "bold";
            return null;
        });

    // Get lines within extents
    var selected = [];
    data
        .filter(function(d) {
            return !_.contains(excluded_groups, d.group);
        })
        .map(function(d) {
            return actives.every(function(p, dimension) {
                return extents[dimension][0] <= d[p] && d[p] <= extents[dimension][1];
            }) ? selected.push(d) : null;
        });
    // free text search
    var query = d3.select("#search").node().value;
    if (query.length > 0) {
        selected = search(selected, query);
    }

    if (selected.length < data.length && selected.length > 0) {
        d3.select("#keep-data").attr("disabled", null);
        d3.select("#exclude-data").attr("disabled", null);
    } else {
        d3.select("#keep-data").attr("disabled", "disabled");
        d3.select("#exclude-data").attr("disabled", "disabled");
    };

    // total by food group
    var tallies = _(selected)
        .groupBy(function(d) { return d.group; });

    // include empty groups
    _(colors.domain()).each(function(v,k) {tallies[v] = tallies[v] || []; });

    legend
        .style("text-decoration", function(d) { return _.contains(excluded_groups,d) ? "line-through" : null; })
        .attr("class", function(d) {
            return (tallies[d].length > 0)
                ? "row"
                : "row off";
        });
    barScale.domain([0,data.length]);
    if (selectedService){
        legend.selectAll(".color-bar")
            .style("width", function(d) {
                return Math.ceil((barScale(tallies[d].length)));
            });

        legend.selectAll(".tally")
            .text(function(d,i) { return tallies[d].length });
    }else {
        legend.selectAll(".color-bar")
            .style("width", function(d) {
                return Math.ceil((barScale(tallies[d].length))) + "px";
            });

        legend.selectAll(".tally")
            .text(function(d,i) { return tallies[d].length });
    }

    // Render selected lines
    paths(selected, foreground, brush_count, true);
}

// render a set of polylines on a canvas
function paths(selected, ctx, count) {
    var n = selected.length,
        i = 0,
        opacity = d3.min([2/Math.pow(n,0.3),1]),
        timer = (new Date()).getTime();

    selection_stats(opacity, n, data.length);

    shuffled_data = _.shuffle(selected);

    data_table(shuffled_data.slice(0,20));

    ctx.clearRect(0,0,w+1,h+1);

    // render all lines until finished or a new brush event
    function animloop(){
        if (i >= n || count < brush_count) return true;
        var max = d3.min([i+render_speed, n]);
        render_range(shuffled_data, i, max, opacity);
        render_stats(max,n,render_speed);
        i = max;
        timer = optimize(timer);  // adjusts render_speed
    };

    d3.timer(animloop);
}

// transition ticks for reordering, rescaling and inverting
function update_ticks(d, extent) {
    // update brushes
    if (d) {
        var brush_el = d3.selectAll(".brush")
            .filter(function(key) { return key == d; });
        // single tick
        if (extent) {
            // restore previous extent
            console.log(extent);
            brush_el.call(yscale[d].brush = getBrush(d)).call(yscale[d].brush.move, extent.map(yscale[d]).sort((a,b)=>a-b));
        } else {
            brush_el.call(yscale[d].brush = getBrush(d));
        }
    } else {
        // all ticks
        d3.selectAll(".brush")
            .each(function(d) { d3.select(this).call(yscale[d].brush = getBrush(d)); })
    }

    show_ticks();

    // update axes
    d3.selectAll(".axis")
        .each(function(d,i) {
            // hide lines for better performance
            d3.select(this).selectAll('line').style("display", "none");

            // transition axis numbers
            d3.select(this)
                .transition()
                .duration(720)
                .call(axis.scale(yscale[d]));

            // bring lines back
            d3.select(this).selectAll('line').transition().delay(800).style("display", null);

            d3.select(this)
                .selectAll('text')
                .style('font-weight', null)
                .style('font-size', null)
                .style('display', null);
        });
}

// Rescale to new dataset domain
function rescale() {
    // reset yscales, preserving inverted state
    dimensions.forEach(function(d,i) {
        if (yscale[d].inverted) {
            yscale[d] = d3.scale.linear()
                .domain(d3.extent(data, function(p) { return +p[d]; }))
                .range([0, h]);
            yscale[d].inverted = true;
        } else {
            yscale[d] = d3.scale.linear()
                .domain(d3.extent(data, function(p) { return +p[d]; }))
                .range([h, 0]);
        }
    });

    update_ticks();

    // Render selected data
    paths(data, foreground, brush_count);
}

// Get polylines within extents
function actives() {
    // var actives = dimensions.filter(function(p) { return !yscale[p].brush.empty(); }),
    //     extents = actives.map(function(p) { return yscale[p].brush.extent(); });
    var actives = [],
        extents = [];
    svg.selectAll(".brush")
        .filter(function(d) {
            yscale[d].brushSelectionValue = d3.brushSelection(this);
            return d3.brushSelection(this);
        })
        .each(function(d) {
            // Get extents of brush along each active selection axis (the Y axes)
            actives.push(d);
            extents.push(d3.brushSelection(this).map(yscale[d].invert));
        });
    // filter extents and excluded groups
    var selected = [];
    data
        .filter(function(d) {
            return !_.contains(excluded_groups, d.group);
        })
        .map(function(d) {
            return actives.every(function(p, i) {
                return extents[i][0] <= d[p] && d[p] <= extents[i][1];
            }) ? selected.push(d) : null;
        });

    // free text search
    var query = d3.select("#search")[0][0].value;
    if (query > 0) {
        selected = search(selected, query);
    }

    return selected;
}

// Export data
function export_csv() {
    var keys = d3.keys(data[0]);
    var rows = actives().map(function(row) {
        return keys.map(function(k) { return row[k]; })
    });
    var csv = d3.csv.format([keys].concat(rows)).replace(/\n/g,"<br/>\n");
    var styles = "<style>body { font-family: sans-serif; font-size: 12px; }</style>";
    window.open("text/csv").document.write(styles + csv);
}

function resetSize() {
    width = $("#Maincontent").width();
    height = d3.max([document.body.clientHeight-540, 240]);
    w = width - m[1] - m[3];
    h = height - m[0] - m[2];

    let chart = d3.select("#chart")
        .style("height", (h + m[0] + m[2]) + "px")

    chart.selectAll("canvas")
        .attr("width", w)
        .attr("height", h)
        .style("padding", m.join("px ") + "px");

    chart.select("svg")
        .attr("width", w + m[1] + m[3])
        .attr("height", h + m[0] + m[2])
        .select("g")
        .attr("transform", "translate(" + m[3] + "," + m[0] + ")");
    // Foreground canvas for primary view
    foreground.lineWidth = 1.7;
// Highlight canvas for temporary interactions
    highlighted.lineWidth = 4;

// Background canvas
    background.lineWidth = 1.7;

    xscale = d3.scalePoint().range([0, w]).padding(0.3).domain(dimensions);
    dimensions.forEach(function (d) {
        yscale[d].range([h, 0]);
    });

    d3.selectAll(".dimension")
        .attr("transform", function (d) {
            return "translate(" + xscale(d) + ")";
        });
    // update brush placement
    d3.selectAll(".brush")
        .each(function (d) {
            d3.select(this).call(yscale[d].brush = d3.brushY(yscale[d])
                .extent([[-10, 0], [10, h]])
                .on("brush end", brush));
        });

    // update axis placement
    axis = axis.ticks(1 + height / 50),
        d3.selectAll(".axis")
            .each(function (d) {
                d3.select(this).call(axis.scale(yscale[d]));
            });

    // render data
    brush();
}

// scale to window size
window.onresize = function() {
    resetSize();
};

// Remove all but selected from the dataset
function keep_data() {
    new_data = actives();
    if (new_data.length == 0) {
        alert("I don't mean to be rude, but I can't let you remove all the data.\n\nTry removing some brushes to get your data back. Then click 'Keep' when you've selected data you want to look closer at.");
        return false;
    }
    data = new_data;
    rescale();
}

// Exclude selected from the dataset
function exclude_data() {
    new_data = _.difference(data, actives());
    if (new_data.length == 0) {
        alert("I don't mean to be rude, but I can't let you remove all the data.\n\nTry selecting just a few data points then clicking 'Exclude'.");
        return false;
    }
    data = new_data;
    rescale();
}

function remove_axis(d,g) {
    dimensions = _.difference(dimensions, [d]);
    xscale.domain(dimensions);
    g.attr("transform", function(p) { return "translate(" + position(p) + ")"; });
    g.filter(function(p) { return p == d; }).remove();
    update_ticks();
}

d3.select("#keep-data").on("click", keep_data);
d3.select("#exclude-data").on("click", exclude_data);
d3.select("#export-data").on("click", export_csv);
d3.select("#search").on("keyup", brush);


// Appearance toggles
d3.select("#hide-ticks").on("click", hide_ticks);
d3.select("#show-ticks").on("click", show_ticks);


function hide_ticks() {
    d3.selectAll(".axis g").style("display", "none");
    //d3.selectAll(".axis path").style("display", "none");
    d3.selectAll(".background").style("visibility", "hidden");
    d3.selectAll("#hide-ticks").attr("disabled", "disabled");
    d3.selectAll("#show-ticks").attr("disabled", null);
};

function show_ticks() {
    d3.selectAll(".axis g").style("display", null);
    //d3.selectAll(".axis path").style("display", null);
    d3.selectAll(".background").style("visibility", null);
    d3.selectAll("#show-ticks").attr("disabled", "disabled");
    d3.selectAll("#hide-ticks").attr("disabled", null);
};

function search(selection,str) {
    pattern = new RegExp(str,"i")
    return _(selection).filter(function(d) { return pattern.exec(d.name); });
}

function changeVar(d){
    $('#groupName').text(d.text);
    if (d.arr==='rack'){
        selectedService = null;
        svgLengend.style('display','none');
        d3.selectAll('.dimension.axisActive').classed('axisActive',false);
        changeGroupTarget(d.arr);
        legend = create_legend(colors,brush);
    }else {
        selectedService = d.arr;
        setColorsAndThresholds(d.service);
        changeGroupTarget(d.arr);
        legend = drawLegend(d.service, arrThresholds, arrColor, dif);
        svgLengend.style('display',null);
        d3.selectAll('.dimension.axisActive').classed('axisActive',false);
        d3.selectAll('.dimension').filter(e=>e===selectedService).classed('axisActive',true);
    }
    brush();
}
