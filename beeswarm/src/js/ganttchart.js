let Gantt = function(){
    let tooltip = d3.tip().attr('class', 'd3-tip').html(function (d){return `<span>${d}</span>`})
    let graphicopt = {
        margin: {top: 20, right: 20, bottom: 20, left: 20},
        width: 1000,
        height: 500,
        scalezoom: 1,
        zoom:d3.zoom(),
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
        centerX: function () {
            return this.margin.left+this.widthG()/2;
        },
        centerY: function () {
            return this.margin.top+this.heightG()/2;
        },
        animationTime:1000,
        trajectoryNum:5,
        color:{}
    };

    let maindiv='#ganttLayout';
    let isFreeze= false;
    let data=[],main_svg,g,r=0;
    let onFinishDraw = [];
    // used to assign nodes color by group
    var color = d3.scaleSequential()
        .interpolator(d3.interpolateSpectral);
    let getColorScale = function(){return color};
    let master={};
    let radius,alignmentScale;
    master.mouseover = function(d){};
    master.mouseout = function(d){};
    master.draw = function() {
        if (isFreeze)
            freezeHandle();
        color=getColorScale();
        createRadar = _.partial(createRadar_func,_,_,_,_,'radar',graphicopt.radaropt,color);
        radius = d3.scaleLinear()
            .domain([graphicopt.start, graphicopt.end])
            .range([r*0.1, r]);

        var miniradius = 3;
        graphicopt.radaropt.w = miniradius*2;
        graphicopt.radaropt.h = miniradius*2;
        alignmentScale = d3.scaleLinear()
            .domain(graphicopt.range?? d3.extent(data, function(d){
                return d.value;
            }))
            .range([0, graphicopt.widthG()]);
        dodge(data,miniradius*2);
        data.forEach(d=>{
            d.y = graphicopt.heightG()-d.y-miniradius;
            d.r = d.r??miniradius;
            d.drawData[0].r = d.r;
        })
        let onode = g.selectAll(".outer_node")
            .data(data,d=>d.key);
        onode.call(updateOnode);
        onode.exit().remove();
        let onode_n = onode.enter().append("g")
            .attr("class", "outer_node");
        onode_n.append('g').attr('class','circleG');
        onode_n.append('g').attr('class','summary hide');
        onode_n.append('g').attr('class','glowEffect');
        onode_n.append('g').attr('class','label')
            .attr('class','label')
            .style("font", "10px sans-serif")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle");
        onode_n.call(updateOnode);

        g.select('.axisx').attr('transform',`translate(0,${graphicopt.heightG()})`).call(d3.axisBottom(alignmentScale))
        onFinishDraw.forEach(d=>d());

        function updateOnode(p){
            p.each(function(d){
                d.node=d3.select(this);
                d.childrenNode = makecirclepacking(d.node);
            });
            p.interrupt();
            let els = p.filter(function(d){
                if (d.highlight)
                    d.oldpos = d3.select(this).attr('transform').replace(/translate\(|\)/g,'').split(',').map(e=>+e.trim());
                return d.highlight;
            });
            els
                .transition().duration(graphicopt.animationTime).attr("transform", function(d) { return `translate(${d.x},${d.y})`; });
            els.on('end',(d)=>{
                deleteTrajectory(d);
            });
            els.each(function(d){
                if (trajectory[d.key]){
                    deleteTrajectory(d);
                }
                trajectory[d.key] = {};
                trajectory[d.key].grad = g.select('defs').append('radialGradient').attr('id','grad'+d.key)
                    .attr("gradientUnits","userSpaceOnUse")
                    .attr('r',50)
                    .attr('cx',d.oldpos[0])
                    .attr('cy',d.oldpos[1])
                    .attr('fx',d.oldpos[0])
                    .attr('fy',d.oldpos[1])
                ;
                trajectory[d.key].grad.html(`<stop offset="0" style="stop-color:${color(d.value)};stop-opacity:1"></stop>
      <stop offset="1" style="stop-color:${color(d.value)};stop-opacity:0"></stop>`);

                trajectory[d.key].grad.transition()
                    .duration(graphicopt.animationTime)
                    .attr('cx',d.x)
                    .attr('cy',d.y)
                    .attr('fx',d.x)
                    .attr('fy',d.y)

                trajectory[d.key].el = d3.select(this.parentNode).append('path')
                    .attr('class','cloned').style('opacity',0.8)
                    .style('fill','none')
                    .attr('stroke',`url(#grad${d.key})`)
                    .attr('stroke-width',d.r??miniradius)
                    .attr('d',d3.line()([d.oldpos,d.oldpos]));
                trajectory[d.key].el
                    .transition()
                    .duration(graphicopt.animationTime)
                    .attr('d',d3.line()([d.oldpos,[d.x,d.y]]))
                    .on('end',()=>{
                        trajectory[d.key].el.remove();
                        trajectory[d.key].grad.remove();});
            })
            p.filter(d=>!d.highlight).attr("transform", function(d) { return `translate(${d.x},${d.y})`; });
            return p;
        }
    };
    let getRenderFunc = function(){ return d3.arc()
                .innerRadius(0)
    };
    let getDrawData = function(){return[];}
    function freezeHandle(){
        if (isFreeze){
            const func = isFreeze;
            isFreeze = false;
            func();
        }else{
            isFreeze = true;
            isFreeze = (function(){d3.select(this).dispatch('mouseout')}).bind(this);
            d3.event.stopPropagation();
        }
    }
    master.freezeHandle = freezeHandle;
    master.main_svg = function(){return main_svg};
    master.init=function(){
        // graphicopt.width = d3.select(maindiv).node().getBoundingClientRect().width;
        // graphicopt.height = d3.select(maindiv).node().getBoundingClientRect().height;
        r = d3.min([graphicopt.width, graphicopt.height]) / 2-20 ;
        main_svg = d3.select(maindiv)
            .attr("width", graphicopt.width)
            .attr("height", graphicopt.height)
            .style('overflow','visible');
        g = main_svg
            .select("g.content");
        function zoomed(){
            g.attr("transform", d3.event.transform);
        }
        if (g.empty()){
            g = d3.select(maindiv)
                .call(graphicopt.zoom.on("zoom", zoomed))
                .attr("width", graphicopt.width)
                .attr("height", graphicopt.height)
                .append("g")
                .attr('class','content')
                // .attr("transform", "translate(" + (graphicopt.margin.left+graphicopt.diameter()/2) + "," + graphicopt.centerY() + ")")
                .on('click',()=>{if (isFreeze){
                    const func = isFreeze;
                    isFreeze = false;
                    func();
                }});
            let axis = g.append('g').attr('class','axis');
            axisx = axis.append('g').attr('class','axisx');
            axisy = axis.append('g').attr('class','axisy');
            g.call(tooltip);
            let startZoom = d3.zoomIdentity;
            startZoom.x = graphicopt.margin.left;
            startZoom.y = graphicopt.margin.top;
            g.call(graphicopt.zoom.transform, d3.zoomIdentity);
            g.append('defs');
            g.append('g').attr('class','trajectoryHolder').attr('pointer-events','none');
        }
        return master
    };
    master.data = function(_data) {
        return arguments.length?(data=_data,master):data;
    };
    master.color = function(_data) {
        return arguments.length?(color=_data,master):color;
    };
    master.getColorScale = function(_data) {
        return arguments.length?(getColorScale=_data?_data:function(){return color},master):getColorScale;
    };
    master.graphicopt = function(_data) {
        if (arguments.length){
            d3.keys(_data).forEach(k=>graphicopt[k]=_data[k]);
            return master;
        }else
            return graphicopt;
    };
    master.getRenderFunc = function(_data) {
        return arguments.length?(getRenderFunc=_data,master):getRenderFunc;
    };
    master.getDrawData = function(_data) {
        return arguments.length?(getDrawData=_data,master):getDrawData;
    };
    master.onFinishDraw = function(_data) {
        onFinishDraw.push(_data)
        return master;
    };
    master.trajectoryStyle=function(_data) {
        if (arguments.length){
            switch (_data) {
                case 'line':
                    draw_trajectory = draw_trajectory_line;
                    break;
                case 'contour':
                    draw_trajectory = draw_trajectory_contours;
                    break;
            }
            if (master.current_trajectory_data)
                draw_trajectory(master.current_trajectory_data);
            return master;
        }
        return draw_trajectory;
    };
    master.g = function(){return g};
    master.isFreeze = function(){return isFreeze};
    function makeTrajectoryLegend(color){
        const marginTop = 10;
        const marginBottom = 10;
        const marginLeft = 40;
        const marginRight = 20;
        const width = 10;
        const height = 200;
        g.selectAll('.TrajectoryLegend').remove();
        const svg = g.append('g').attr('class','TrajectoryLegend')
            .attr('transform',`translate(${graphicopt.widthG()/2-(width + marginLeft + marginRight)},${-graphicopt.heightG()/2+50})`);
        svg.append('text').text('Trajectory heat map')
        let legend = svg.append('g').attr('class', 'legend')
            .attr('transform', `translate(${marginLeft},${marginTop})`);

        if (color.interpolate) {
            const n = Math.min(color.domain().length, color.range().length);

            let y = color.copy().rangeRound(d3.quantize(d3.interpolate(0, height), n));

            legend.append("image")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", width)
                .attr("height", height)
                .attr("preserveAspectRatio", "none")
                .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
        }// Sequential
        else if (color.interpolator) {
            let y = Object.assign(color.copy()
                    .interpolator(d3.interpolateRound(0, height)),
                {
                    range() {
                        return [0, height];
                    }
                });

            legend.append("image")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", width)
                .attr("height", height)
                .attr("preserveAspectRatio", "none")
                .attr("xlink:href", ramp(color.interpolator()).toDataURL());

            // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
            if (!y.ticks) {
                if (tickValues === undefined) {
                    const n = Math.round(ticks + 1);
                    tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
                }
                if (typeof tickFormat !== "function") {
                    tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
                }
            } else {
                legend.append('g').attr('class', 'legendTick').call(d3.axisLeft(y));
            }
        }

        function ramp(color, n = 256) {
            const canvas = createContext(1, n);
            const context = canvas.getContext("2d");
            for (let i = 0; i < n; ++i) {
                context.fillStyle = color(i / (n - 1));
                context.fillRect(0, i, 1, 1);
            }
            return canvas;
        }

        function createContext(width, height) {
            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            return canvas;
        }

    }
    function mouseover(d){
        if (!isFreeze) {     // Bring to front
            g.classed('onhighlight', true);
            d3.selectAll('.links .link').sort(function (a, b) {
                return d.relatedLinks.indexOf(a.node);
            });
            d3.select(this).classed('highlight', true);
            if (d.node) {
                d.node.classed('highlight', true);
            }
            master.drawTrajectory(d);
            master.mouseover(d);
        }
        if (d.tooltip) {
            tooltip.show(d.name)
        }
    }
    master.highlight = function(listKey){
        g.classed('onhighlight', true);
        g.selectAll('.element').filter(d=>listKey.find(e=>e===d.key))
            .classed('highlight', true);
    };
    master.releasehighlight = function(){
        g.classed('onhighlight', false);
        g.selectAll('.element.highlight')
            .classed('highlight', false);
    };
    master.highlight2 = function(listKey){
        g.classed('onhighlight2', true);
        g.selectAll('.element').filter(d=>listKey.find(e=>e===d.key))
            .classed('highlight2', true);
    };
    master.releasehighlight2 = function(){
        g.classed('onhighlight2', false);
        g.selectAll('.element.highlight2')
            .classed('highlight2', false);
    };
    master.drawTrajectory = function(d,data){
        data = data||Layout.ranking.byComputer[d.name][serviceName]
        master.current_trajectory_data = {g,d,data:data};
        draw_trajectory(master.current_trajectory_data);
    }
    let draw_trajectory = draw_trajectory_line;
    master.current_trajectory_data = undefined;
    function draw_trajectory_line({g,d,data}){
        let dataDraw = data;
        if (!_.isArray(data[0]))
            dataDraw = [data];
        g.select('g.trajectoryHolder').selectAll('path.trajectory.trajectoryPath')
            .data(dataDraw)
            .join('path')
            .attr('class','trajectory trajectoryPath')
            .attr('transform',null)
            .attr('d',d3.line()
                .curve(d3.curveCatmullRom)
                .defined(e => e !== undefined)
                .x(e=>alignmentScale(e)))
            .style('fill','none').style('stroke','black').style('opacity',0.3);
    }
    function draw_trajectory_contours({g,d,data}){
        let dataDraw = data;
        if (_.isArray(data[0]))
            dataDraw = _.flatten(data);
        dataDraw = dataDraw.filter(d=>d!=undefined);
        const contours = d3.contourDensity()
            .x(e=>alignmentScale(e))
            .y(graphicopt.heightG())
            .size( [graphicopt.widthG(), graphicopt.heightG()])
            .bandwidth(graphicopt.trajectory.bandwidth)
            (dataDraw);
        const color = d3.scaleSequential(d3[graphicopt.trajectory.colorScheme])
            .domain(d3.extent(contours, d => d.value ));
        g.select('g.trajectoryHolder').selectAll('path.trajectory.trajectoryPath')
            .data(contours)
            .join('path')
            // .attr('transform',`translate(0,${graphicopt.heightG()})`)
            .attr('class','trajectory trajectoryPath')
            .attr("d", d3.geoPath())
            .style('stroke',null)
            .style("fill", d => color(d.value)).style('opacity',null);
        debugger
        makeTrajectoryLegend(color)
    }
    function mouseout(d){
        if(!isFreeze)
        {
            g.classed('onhighlight',false);
            d3.select(this).classed('highlight', false);
            if(d.node){
                d.node.classed('highlight', false).classed('highlightSummary', false);
            }
            g.selectAll('path.trajectory').remove();
            g.select('.TrajectoryLegend').remove();
            master.current_trajectory_data = undefined;
            master.mouseout(d);
        }
        if (d.tooltip) {
            tooltip.hide()
        }
    }
    var theta = function(r) {
        return -(r-graphicopt.start)-graphicopt.start;
    };

    return master;
};
