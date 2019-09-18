let Tooltip_lib = function() {
    let graphicopt = {
        margin: {top: 20, right: 0, bottom: 0, left: 0},
        width: 250,
        height: 50,
        scalezoom: 1,
        widthView: function () {
            return this.width * this.scalezoom
        },
        heightView: function () {
            return this.height * this.scalezoom
        },
        widthG: function () {
            return this.widthView() - this.margin.left - this.margin.right
        },
        heightG: function () {
            return this.heightView() - this.margin.top - this.margin.bottom
        },
    },layout={
        axis:{x: {
                domain: [0,0],
                linear: 'Time',
                label: '',
                tickFormat: d3.timeFormat("%H:%M"),
            },y: {
                domain: [0,0],
                linear: 'Linear',
                label: '',
            }}
    };
    let data=[],svg,svg_master,g,tooltip;
    let master ={};
    var tool_tip = d3.tip()
        .attr("class", "d3-tip")
        .attr("id", "d3-tip")
        .offset(()=> {
            if (niceOffset){
                let heightTip =+ $('#d3-tip')[0].offsetHeight;
                return [(d3.event.y-200)< 0 ? -d3.event.y:(d3.event.y-200+heightTip>heightdevice? heightdevice-d3.event.y-heightTip :-200), (d3.event.x+tipW+100)> width ? -50-tipW:50];
            } return [0,0];})
        .html(function(d1,hideLine,type) {
            return cotenttip(hideLine,type); });

    function cotenttip (hideLine,classtype){
        str="";
        hideLine = hideLine||false;
        classtype =  classtype || "radarChartsum";
        if (!classtype) {
            if (!hideLine) {
                str += '<button class="playbtn" onclick="playanimation()"><i class="fas fa-play"></i></button>';
                str += '<svg width="100" height="100" id="svgTip"> </svg>';
                classtype = "radarChart";
            }
            str += '<div class="' + classtype + '"></div>'; // Spider chart holder
            str += '<button onclick="' + (hideLine ? 'pannelsummary(false)' : 'tool_tip.hide()') + '">Close</button>';
            str += '<button onclick="addSVG(' + hideLine + ')">Add</button>';
            // str += '<button onclick="saveSVG(this)">Save Image</button>';
            str += '<button onclick="saveSVG_light(this,\'svg\')" class="modal-trigger" href="#savedialog">Save SVG</button>';
            str += '<button onclick="saveSVG_light(this,\'png\')" class="modal-trigger" href="#savedialog">Save PNG</button>';
            str += '<button onclick="saveSVG_light(this,\'jpg\')" class="modal-trigger" href="#savedialog">Save JPG</button>';
        }else {
            if (classtype==='lineSum'){
                str += '<div class="' + classtype + '"></div>'; // Spider chart holder
            }else {
                str+='<span>Notsupport</span>'
            }
        }
        return str;
    }
    master.init = function () {


        svg_master.call(tool_tip);

        return master;
    };

    function handle_data (dataRaw) {
        dataRaw.sort((a,b)=>a[a.length-1].y-b[b.length-1].y)
        return dataRaw;
    }
    master.show = function (){
        tool_tip.show(undefined,undefined,'lineSum');
        svg = d3.select(".lineSum")
            .append('svg')
            .attrs({
            width: graphicopt.width,
            height: graphicopt.height,

        });
        g = svg.append("g")
            .attr('class','pannel')
            .attr('transform',`translate(${graphicopt.margin.left},${graphicopt.margin.top})`);

        g.append("rect")
            .attrs({
                width: graphicopt.widthG(),
                height: graphicopt.heightG(),
                fill: 'white'
            });
        // 1. set scale

        var xScale = d3[`scale${layout.axis.x.linear}`]()
            .domain(layout.axis.x.domain)
            .range([0, graphicopt.widthG()]);

        var yScale = d3[`scale${layout.axis.y.linear}`]()
            .domain(layout.axis.y.domain) // input
            .range([graphicopt.heightG(), 0]); // output

        // 2. axis create
        var numTicks = 1 + Math.round((xScale.domain()[1] - xScale.domain()[0]) / (60 * 1000)); // every minutes
        if (numTicks > 6) numTicks = 6;
        console.log(numTicks)
        g.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + graphicopt.heightG() + ")")
            .call(d3.axisBottom(xScale).tickFormat(layout.axis.x.tickFormat).ticks(numTicks)); //

        g.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(0,0)")
            .call(d3.axisLeft(yScale).tickFormat(layout.axis.y.tickFormat).ticks(5).tickSize(-graphicopt.widthG()))
            .select('.domain').remove(); //

        // 3. draw
        // ****** Append the path ******
        var line_create = d3.line()
            .x(function (d, i) {
                return xScale(d.x);
            }) // set the x values for the line generator
            .y(function (d) {
                return yScale(d.y);
            }) // set the y values for the line generator
            .curve(d3.curveMonotoneX);

        let gc = g.append("g")
            .attr("class", "graph");

        let gpath = gc.selectAll('gline_path')
            .data(data)
            .enter()
            .append('g')
                .attr("class", "gline_path");
        gpath.append('path')
            .attr('d',line_create)
            .attr('fill', 'none')
            .attr('stroke', d=>d.color?d.color:'black')
            .attr("stroke-width", 1);

        gpath.filter((d,i)=>i===0||i===data.length-1).append("text")
            .attr("x", graphicopt.widthG())
            .attr('dx',4)
            .attr("y", d=>yScale(d[d.length-1].y))
            .attr("fill", d=>d.color?d.color:'black')
            .style("text-anchor", "start")
            .style("font-size", "12px")
            .attr("font-family", "sans-serif")
            .text(d=> `${d.label}`);
                // `${d.label}=${yScale.tickFormat()(d[d.length-1].y)}`);
        g.append("text")
            .attr("x", -graphicopt.heightG() / 2)
            .attr("y", -35)
            .attr("transform", "rotate(-90)")
            .attr("fill", "#000")
            .style("text-anchor", "middle")
            .style("font-style", "italic")
            .style("font-size", "12px")
            .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
            .attr("font-family", "sans-serif")
            .text(layout.axis.y.label);

        //************************************************************* Date and Time

        g.append("text")
            .attr("dy", 10)
            .attr("dx", 10)
            .attr("fill", "#000")
            .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
            .style("text-anchor", "start")
            .style("font-weight", "bold")
            .style("font-size", "12px")
            .attr("font-family", "sans-serif")
            .text(layout.title);

        g.append("text")
            .attr("y", graphicopt.heightG() + 34)
            .attr("fill", "#000")
            .style("font-style", "italic")
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
            .attr("font-family", "sans-serif")
            .text("" + xScale.domain()[0].toDateString());

        // g.append("text")
        //     .attr("x", graphicopt.widthG() - 3)
        //     .attr("y", graphicopt.heightG() + 34)
        //     .attr("fill", "#000")
        //     .style("font-style", "italic")
        //     .style("text-anchor", "middle")
        //     .style("font-size", "12px")
        //     .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        //     .attr("font-family", "sans-serif")
        //     .text("Current time: " + layout.axis.x.tickFormat(xScale.domain()[1]));

    };
    master.hide = function (){
        tool_tip.hide();
    };

    master.graphicopt = function (_) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in _) {
                if ('undefined' !== typeof _[i]) {
                    graphicopt[i] = _[i];
                }
            }
            if (graphicopt.radaropt)
                graphicopt.radaropt.schema = schema;
            return master;
        }else {
            return graphicopt;
        }

    };

    master.layout = function (_) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in _) {
                if ('undefined' !== typeof _[i]) {
                    layout[i] = _[i];
                }
            }
            return master;
        }else {
            return layout;
        }

    };
    
    master.svg = function (_) {
        return arguments.length ? (svg = _, master) : svg;
    };

    master.primarysvg = function (_) {
        return arguments.length ? (svg_master = _, master) : svg_master;
    };

    master.data = function (_) {
        return arguments.length ? (data = handle_data(_), master) : data;
    };

    master.tooltip = function (_) {
        return arguments.length ? (tooltip = _, master) : tooltip;
    };
    
    master.schema = function (_) {
        return arguments.length ? (graphicopt.radaropt.schema = _,schema = _,updatalayout(_), master) : schema;
    };
    return master;
}