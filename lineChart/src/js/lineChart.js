let LineChart = function(){
    let tooltip = d3.tip().attr('class', 'd3-tip').html(function (d){return `<span>${d}</span>`})
    let graphicopt = {
        margin: {top: 0, right: 0, bottom: 0, left: 0},
        width: 500,
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
        color:{}
    };

    let maindiv='#circularLayout';
    let isFreeze= false;
    let data=[],main_svg,g,r=0;
    let onFinishDraw = [];
    // used to assign nodes color by group
    var color = d3.scaleSequential()
        .interpolator(d3.interpolateSpectral);
    let getColorScale = function(){return color};
    let master={};
    let subgraph = {el:[],limit:3};
    let spiralScale,radius;
    master.mouseover = function(d){};
    master.mouseout = function(d){};
    master.draw = function() {
        if (isFreeze)
            freezeHandle();
        color=getColorScale();
        debugger
        onFinishDraw.forEach(d=>d());

        function updateOnode(p){
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
            subgraph.el.forEach(svg=>svg.select('g.content').attr("transform", d3.event.transform))
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
            g.call(tooltip);
            let startZoom = d3.zoomIdentity;
            startZoom.x = graphicopt.centerX();
            startZoom.y = graphicopt.centerY();
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
        return arguments.length?(getColorScale=_data,master):getColorScale;
    };
    master.graphicopt = function(_data) {
        return arguments.length?(graphicopt=_data,master):graphicopt;
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
    master.g = function(){return g};
    master.isFreeze = function(){return isFreeze};
    master.addSubgraph = function(subsvg){
        subsvg.attr('class','subgraph')
            .style('overflow','hidden').style('border','1px solid black')
            .style('position','relative')
            .style('border-radius','5px').style('background-color','white')
        subgraph.el.push(subsvg);
        while ( subgraph.el.length> subgraph.limit){
            subgraph.el.shift().remove();
        }
        subgraph.el.forEach((svg,i)=>svg.attr('id','subgraph'+i))
    };
    master.removeSubgraph = function(subsvg){
        const index = subsvg.attr('id').replace('subgraph','');
        subgraph.el.filter((s,i)=>i!==index);
        subsvg.remove();
        subgraph.el.forEach((svg,i)=>svg.attr('id','subgraph'+i))
    };
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
                .x(e=>radius(spiralScale(e))*Math.sin(theta(spiralScale(e))))
                .y(e=>-radius(spiralScale(e))*Math.cos(theta(spiralScale(e)))))
            .style('fill','none').style('stroke','black').style('opacity',0.3);
    }
    function draw_trajectory_contours({g,d,data}){
        let dataDraw = data;
        if (_.isArray(data[0]))
            dataDraw = _.flatten(data);
        dataDraw = dataDraw.filter(d=>d!=undefined);
        const contours = d3.contourDensity()
            .x(e=>radius(spiralScale(e))*Math.sin(theta(spiralScale(e)))+graphicopt.centerX())
            .y(e=>-radius(spiralScale(e))*Math.cos(theta(spiralScale(e)))+graphicopt.centerY())
            .size( [graphicopt.widthG(), graphicopt.heightG()])
            .bandwidth(graphicopt.trajectory.bandwidth)
            (dataDraw);
        const color = d3.scaleSequential(d3[graphicopt.trajectory.colorScheme])
            .domain(d3.extent(contours, d => d.value ));
        g.select('g.trajectoryHolder').selectAll('path.trajectory.trajectoryPath')
            .data(contours)
            .join('path')
            .attr('transform',`translate(${-graphicopt.centerX()},${-graphicopt.centerY()})`)
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
