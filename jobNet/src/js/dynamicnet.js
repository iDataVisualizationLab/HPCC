let DynamicNet = function(){
    let tooltip = d3.tip().attr('class', 'd3-tip').html(function (d){return `<span>${d}</span>`})
    let graphicopt = {
        margin: {top: 20, right: 20, bottom: 20, left: 20},
        width: 1400,
        height: 800,
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
        color:{},
        // range:[0,1],
        radaropt : {
            // summary:{quantile:true},
            mini:true,
            levels:6,
            gradient:true,
            w:40,
            h:40,
            showText:false,
            margin: {top: 0, right: 0, bottom: 0, left: 0},
            isNormalize:false,
            schema:serviceFullList
        },
        trajectory:{bandwidth:10,thresholds:10,colorScheme:"interpolateViridis"}
    };

    let maindiv='#circularLayout';
    let isFreeze= false;
    let data=[],quadtree=[],main_svg,g,brush,r=0;
    let onFinishDraw = [];
    // used to assign nodes color by group
    var color = d3.scaleSequential()
        .interpolator(d3.interpolateSpectral);
    let getColorScale = function(){return color};
    let master={};
    let createRadar = _.partial(createRadar_func,_,_,_,_,'radar',graphicopt.radaropt,color);
    let simulation,node,link,removedLinks=[],enterLinks=[];
    let radius;
    createEventHandle('onBrush');
    createEventHandle('offBrush');
    createEventHandle('mouseover');
    createEventHandle('mouseout');
    createEventHandle('click');
    function createEventHandle(key){
        master[key] = [];
        master[key].dict = {};
        master[key+'Add'] = function(id,func){
            if (master[key].dict[id]!==undefined)
                master[key][master[key].dict[id]] = func;
            else {
                master[key].push(func)
                master[key].dict[id] = master[key].length-1;
            }
        }
    }

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
        let {nodes,links} = data;
        if (node&&link) // new
        {
            const olds = new Map(node.data().map(d => [d.id, d]));
            nodes = nodes.map(d => { const old = olds.get(d.id)||{};
            d.vx = old.vx;
            d.vy = old.vy;
            d.x = old.x;
            d.y = old.y;
            d.dy = old.dy;
            d.dx = old.dx;
            return d});
            links = links.map(d => Object.assign({}, d));
        }
        //
        nodes.forEach(d=>{ d.r = d.r??miniradius;
        d.drawData[0].r = d.r;})

        quadtree = d3.quadtree()
            .extent([[-1, -1], [graphicopt.widthG() + 1, graphicopt.heightG() + 1]])
            .x(d=>d.x)
            .y(d=>d.y)
            .addAll(data);
        function switchMode(){
            if (graphicopt.actionMode==='zoom'){
                d3.select(maindiv).select('.brushHolder').classed('hide',true);
                d3.select(maindiv)
                    .call(graphicopt.zoom.on("zoom", zoomed))
            }else{
                brush = d3.brush()
                    .extent([[graphicopt.margin.left,graphicopt.margin.top],[graphicopt.widthG(),graphicopt.heightG()]])
                    .on("brush end", brushed);
                d3.select(maindiv).select('.brushHolder').classed('hide',false)
                    .call(brush)
            }
        }
        function zoomed(){
            g.attr("transform", d3.event.transform);
            // subgraph.el.forEach(svg=>svg.select('g.content').attr("transform", d3.event.transform))
        }
        function brushed() {
            let selection =d3.event.selection;
            data.forEach(d => {d.selected = false;
                master.mouseout.forEach(f=>f(d.data));
            });
            master.releasehighlight();
            if (selection) search(quadtree, selection);
            let listkey = data.filter(d=>d.selected);
            if (listkey.length){
                master.highlight(listkey.map(d=>d.key));
                master.mouseover.forEach(f=>listkey.forEach(d=>f(d.data)));
                master.onBrush.forEach(f=>listkey.forEach(d=>f(d.data)));
            }else{
                master.offBrush.forEach(f=>f());
            }
        }
        function search(quadtree, [[x0, y0], [x3, y3]]) {
            quadtree.visit((node, x1, y1, x2, y2) => {
                if (!node.length) {
                    do {
                        const x= node.data.x;
                        const y= node.data.y;
                        const d = node.data;
                        d.selected = x >= x0 && x < x3 && y >= y0 && y < y3;
                    } while ((node = node.next));
                }
                return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
            });
        }
        node = g.selectAll(".outer_node")
            .data(nodes,d=>d.id);
        node.call(updateOnode);
        node.exit().remove();
        let node_n = node.enter().append("g")
            .attr("class", "outer_node");
        node_n.append('g').attr('class','circleG');
        node_n.append('g').attr('class','summary hide');
        node_n.append('g').attr('class','glowEffect');
        node_n.append('g').attr('class','label')
            .attr('class','label')
            .style("font", "10px sans-serif")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle");
        node_n.call(updateOnode);
        node = node.merge(node_n);

        switchMode();
        simulation.nodes(nodes);
        simulation.force("link").links(links)
        simulation.force("x", d3.forceX().x(d=>{ if (d.isolate) debugger
            return d.isolate?-graphicopt.widthG()*3/8:0
        }).strength(d=>d.isolate?1:0.1))
            .force("y", d3.forceY().y(d=>d.isolate?-graphicopt.heightG()*3/8:0).strength(d=>d.isolate?1:0.1));

        link = g.selectAll(".links")
            .data(links, d => [d.source.id, d.target.id])
            .join(enter=>{
                enterLinks = enter.data();
                return enter.append('line').attr('class','links')
                .attr("stroke", "#000").attr('opacity',1)
                .attr("stroke-width", 0.2)
            },update=>update,exit=>{
                removedLinks = exit.data();
                exit.transition().attr('opacity',0).remove();
            });

        simulation.alphaTarget(0.3).restart();
        onFinishDraw.forEach(d=>d({removedLinks,enterLinks}));

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

            p.filter(d=>!d.highlight).attr("transform", function(d) { return `translate(${d.x},${d.y})`; });
            return p;
        }
        function makecirclepacking(svg) {
            let node;
            let view;
            return updateNodes();

            function updateNodes(istransition) {
                let childrenNode = {};
                node = svg.select('g.circleG')
                    .selectAll("g.element")
                    .data(d=>[d], d => d.key)
                    .call(updateNode);
                node.exit().remove();
                node = node.enter().append("g")
                    .call(updateNode).merge(node);

                label = svg.select("g.label")
                    .selectAll("text")
                    .data(d=>[d]);
                label.exit().remove();
                label = label.enter().append('text')
                    .classed('hide',true)
                    .style('font-size', '10px')
                    .text(d => d.key).merge(label);
                label.each(function(d){
                    if (!d.children)
                        d.data.tooltip = d3.select(this);
                });
                label.style('fill','#000').style('text-shadow','#fff 1px 1px 0px');

                glowEffect = svg.select('g.glowEffect')
                    .selectAll("defs.glowElement")
                    .data(d=>[d], d => d.key)
                    .call(updateGlow);

                glowEffect.exit().remove();
                glowEffect_n = glowEffect.enter().append("defs")
                    .attr('class','glowElement');
                glowEffect_n.append('filter');
                glowEffect_n
                    .call(updateGlow).merge(glowEffect);
                function updateGlow(p){
                    p.select('filter')
                        .attr("width","400%")
                        .attr("x","-150%")
                        .attr("y","-150%")
                        .attr("height","400%")
                        .attr('id',d=>'c'+d.data.currentID)
                        .html(`<feGaussianBlur class="blur" stdDeviation="2" result="coloredBlur1"></feGaussianBlur>
                        <feGaussianBlur class="blur" stdDeviation="3" result="coloredBlur2"></feGaussianBlur>
                        <feGaussianBlur class="blur" stdDeviation="5" result="coloredBlur3"></feGaussianBlur>
                        <feMerge>
                            <feMergeNode in="coloredBlur3"></feMergeNode>
                            <feMergeNode in="coloredBlur2"></feMergeNode>
                            <feMergeNode in="coloredBlur1"></feMergeNode>
                            <feMergeNode in="SourceGraphic"></feMergeNode>
                        </feMerge>`);
                    return p;
                }

                zoomTo(istransition);
                return childrenNode;
                function updateNode(node) {
                    node.each(function(d){childrenNode[d.data.name] = d3.select(this)})
                    node
                        .attr('class','element')
                        .classed('compute', true)
                        .on('click',function(d){d3.select(this).dispatch('mouseover'); freezeHandle.bind(this)();userTable(d,'compute');master.click.forEach(f=>f());openPopup(d,main_svg);})
                        .on("mouseover", function(d){mouseover.bind(this)(d.data||d)})
                        .on("mouseout", function(d){mouseout.bind(this)(d.data||d)})
                        .style('filter',d=>d.data.highlight?`url(#${'c'+d.data.currentID}`:null)
                        .attr("fill", d => {
                                d.color = color(d.value,d);
                                return d.color;
                        })
                        // .style('stroke-width',d=>{
                        //     return circleStrokeScale(d.data.relatedNodes.length);
                        // });
                    return node;
                }
            }


            function zoomTo(istransition) {
                //to do
                serviceName = vizservice[serviceSelected].text;
                label.interrupt().transition().ease(d3.easeQuadIn).duration(graphicopt.animationTime).attr("transform", d => `translate(${d.x},${d.y})`);
                node.selectAll('g').remove();
                if (serviceName!=='Radar'){
                    let path = node.selectAll('path').data(d=>d.drawData,d=>d.id)
                        .attr('d',getRenderFunc)
                        .classed('invalid',d=>d.invalid)
                        .style('filter',d=>d.invalid?'url("#glow")':null)
                        .style('fill',d=>d.color);
                    path.exit().remove();
                    const path_n = path.enter().append('path')
                        .attr('class','circle')
                        .classed('invalid',d=>d.invalid)
                        .style('filter',d=>d.invalid?'url("#glow")':null)
                        .attr('transform',d=>{if (d.scale){return `translate(${d.offset*2},${d.offset*2}) scale(${d.scale*2})`;} return null})
                        .attr('d',getRenderFunc).style('fill',d=>d.color);
                    path_n.transition().duration(5000).attr('transform',d=>d.scale?`translate(${d.offset},${d.offset}) scale(${d.scale})`:null)
                }else{

                    const radarNode = node;
                    radarNode.selectAll('path.circle').remove();
                    radarNode
                        .selectAll('g').data(d=>[d.drawData])
                        .join('g').attr('class','radar  ')
                        .style('fill',d=>d.color)
                        .each(function(d){
                            setTimeout(()=>{
                                d[0].color = color(_.isArray(d[0].name)?d[0].name[0]:d[0].name);
                                createRadar(d3.select(this), d3.select(this), d[0], {size:d.r,colorfill: 0.5}).select('.radarStroke')
                                    .style('stroke-opacity',1);
                            },0);
                        });
                }
            }
        }
    };
    let getRenderFunc = function(d){
        if (d.d){
            return d.d;
        }else
            return d3.arc()
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

        if (g.empty()){
            g = d3.select(maindiv)
                .attr("width", graphicopt.width)
                .attr("height", graphicopt.height)
                .append("g")
                .attr('class','content')
                .attr("transform", "translate(" + (graphicopt.centerX()) + "," + graphicopt.centerY() + ")")
                .on('click',()=>{if (isFreeze){
                    const func = isFreeze;
                    isFreeze = false;
                    func();
                }});

            simulation = d3.forceSimulation()
                .force("charge", d3.forceManyBody().strength(-30))
                .force("link", d3.forceLink().id(d => d.id))
                .force("x", d3.forceX().x(d=>d.isolate?-graphicopt.widthG()*3/8:0).strength(d=>d.isolate?1:0.1))
                .force("y", d3.forceY().y(d=>d.isolate?-graphicopt.heightG()*3/8:0).strength(d=>d.isolate?1:0.1))
                .on("tick", ticked);
            simulation.stop();

            g.call(tooltip);
            let startZoom = d3.zoomIdentity;
            startZoom.x = graphicopt.margin.left;
            startZoom.y = graphicopt.margin.top;
            g.call(graphicopt.zoom.transform, d3.zoomIdentity);
            g.append('defs');
            g.append('g').attr('class','trajectoryHolder').attr('pointer-events','none');

            d3.select(maindiv).append('g').attr('class','brushHolder');
        }
        return master
    };
    function ticked() {
        node.attr("transform", d=>`translate(${d.x},${d.y})`);

        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
    }
    master.data = function(_data) {
        if (arguments.length)
        {
            data=_data;
            return master
        }
        return data;
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
                default:
                    draw_trajectory = empty;
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
            master.mouseover.forEach(f=>f(d));
        }
        if (d.tooltip) {
            tooltip.show(d.name)
        }
    }
    master.highlight = function(listKey){
        g.classed('onhighlight', true);
        g.selectAll('.element').filter(d=>listKey.find(e=>e===d.key))
            .classed('highlight', true)
            .each(d=>{
                (d.relatedNode)?d.relatedNode.forEach(e=>e.classed('highlight',true)):''});
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
    let draw_trajectory = empty;
    master.current_trajectory_data = undefined;
    function empty(){
    }
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
            master.mouseout.forEach(f=>f(d))
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
