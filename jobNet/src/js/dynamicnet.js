let DynamicNet = function(){
    let tooltip = d3.tip().attr('class', 'd3-tip').html(function (d){return `<span>${d}</span>`})
    let graphicopt = {
        margin: {top: 20, right: 20, bottom: 20, left: 20},
        width: 1400,
        height: 700,
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
        actionMode:'zoom',
        PCAlayout: false
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
    let simulation,node,link,label,removedLinks=[],enterLinks=[];
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
        let {nodes,links,datamap} = data;
        if (graphicopt.PCAlayout){
            let {xscale,yscale,solution} = calculate({dataIn:Object.values(datamap).map(d=>d[0].map(d=>d?(d<0?0:d):0))});
            Object.keys(datamap).forEach((d,i)=>{
                datamap[d].x = xscale(solution[i][0]);
                datamap[d].y = yscale(solution[i][1]);
            })
        }else
            datamap={}
        if (node&&link) // new
        {
            const olds = new Map(node.data().map(d => [d.id, d]));
            nodes = nodes.map(d => { const old = olds.get(d.id)||{};
            d.vx = old.vx;
            d.vy = old.vy;
            if (datamap[d.id]){
                d._x = datamap[d.id].x;
                d._y =datamap[d.id].y;
                if (old.x===undefined)
                {
                    d.x = d._x;
                    d.y = d._y;
                }else
                {
                    d.x = old.x;
                    d.y = old.y;
                }
            }else{
                d._x = undefined;
                d._y = undefined;
                d.x = old.x;
                d.y = old.y;
            }
            d.dy = old.dy;
            d.dx = old.dx;
            return d});
            links = links.map(d => Object.assign({}, d));
        }
        //
        let labelsM = new Map(),labels = [];
        nodes.forEach(d=>{
            d.r = d.r??miniradius;
            d.drawData[0].r = d.r;
            d.relatedNodes =[];
            d.relatedLinks =[];
            if (d.isolate) {
                if (!labelsM.get(d.id))
                    labels.push(d);
                else
                    labelsM.set(d.id, d);
            }
        })

        quadtree = d3.quadtree()
            .extent([[-1, -1], [graphicopt.widthG() + 1, graphicopt.heightG() + 1]])
            .x(d=>d.x)
            .y(d=>d.y)
            .addAll(data);

        function brushed() {
            let selection =d3.event.selection;
            data.forEach(d => {d.selected = false;
                master.mouseout.forEach(f=>f(d.value));
            });
            master.releasehighlight();
            if (selection) search(quadtree, selection);
            let listkey = data.filter(d=>d.selected);
            if (listkey.length){
                master.highlight(listkey.map(d=>d.key));
                master.mouseover.forEach(f=>listkey.forEach(d=>f(d.value)));
                master.onBrush.forEach(f=>listkey.forEach(d=>f(d.value)));
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
        node = g.select('g.nodeHolder').selectAll(".outer_node")
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
        node.each(function(d){
            d.node = d3.select(this);
        });

        switchMode();
        simulation.nodes(nodes);
        simulation.force("link").links(links);

        let linkScale = d3.scaleSqrt().range([0.2,0.8]).domain(d3.extent(links,d=>d.value||0));
        debugger
        link = g.select('g.linkHolder').selectAll(".link")
            .data(links, d => [d.source.id, d.target.id])
            .join(enter=>{
                enterLinks = enter.data().filter(d=>{
                    if (d.target.value.isNew.length){
                        if (!labelsM.get(d.id))
                            labels.push(d.source);
                        else
                            labelsM.set(d.id,d.source);
                        if (!labelsM.get(d.id))
                            labels.push(d.target);
                        else
                            labelsM.set(d.id,d.target);
                        return true;
                    }
                    return false;
                });

                return enter.append('line').attr('class','link')
                .attr("stroke", "rgba(0,0,0,0.53)").attr('opacity',1)
                .attr("stroke-width", d=>linkScale(d.value))
            },update=>update.attr("stroke-width", d=>linkScale(d.value)),exit=>{
                removedLinks = exit.data();
                exit.transition().attr('opacity',0).remove();
            });
        link.each(function(d){
            d.node = d3.select(this);
            d.source.relatedNodes.push(d.target);
            d.source.relatedLinks.push(d);
            d.target.relatedNodes.push(d.source);
            d.target.relatedLinks.push(d);
        });
        label = g.selectAll('.labels')
            .data(labels,d=>d.id);
        label.exit().transition().duration(graphicopt.animationTime).attr('opacity',0).remove();
        const label_n = label.enter()
            .append('text').attr('class','labels').text(d=>d.id).attr('opacity',1);
        label = label_n.merge(label);

        simulation.alphaTarget(0.02).restart();
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
            let node,node_n;
            let view;
            return updateNodes();

            function updateNodes(istransition) {
                let childrenNode = {};
                node = svg.select('g.circleG')
                    .selectAll("g.element")
                    .data(d=>[d], d => d.key)
                    .call(updateNode);
                node.exit().remove();
                node_n = node.enter().append("g")
                    .call(updateNode);
                node=node_n.merge(node);

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
                        d.value.tooltip = d3.select(this);
                });
                label.style('fill','#000').style('text-shadow','#fff 1px 1px 0px');

                const glowEffect = svg.select('g.glowEffect')
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
                        .attr('id',d=>'c'+d.value.currentID)
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
                    node.each(function(d){childrenNode[d.value.name] = d3.select(this)})
                    node
                        .attr('class','element')
                        .classed('compute', true)
                        .on('click',function(d){d3.select(this).dispatch('mouseover'); freezeHandle.bind(this)();userTable(d,d.type);master.click.forEach(f=>f());})
                        .on("mouseover", function(d){mouseover.bind(this)(d)})
                        .on("mouseout", function(d){mouseout.bind(this)(d)})
                        .style('filter',d=>d.value.highlight?`url(#${'c'+d.value.currentID}`:null)
                        .attr("fill", d => {
                                d.color = color(d.value,d);
                                return d.color;
                        })
                        // .style('stroke-width',d=>{
                        //     return circleStrokeScale(d.value.relatedNodes.length);
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
                        .attr('d',getRenderFunc).style('fill',d=>d.color)
                        .attr('transform',d=>d.scale?`translate(${d.offset},${d.offset}) scale(${d.scale})`:null);
                    const icon = node_n.filter(d=>d.isNew&&d.isNew.length).select('path.circle').attr('transform',d=>{if (d.scale){return `translate(${d.offset*2},${d.offset*2}) scale(${d.scale*2})`;} return null})
                    icon.transition().duration(5000).attr('transform',d=>d.scale?`translate(${d.offset},${d.offset}) scale(${d.scale})`:null)
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
    function switchMode(){
        if (graphicopt.actionMode==='zoom'){
            d3.select(maindiv).select('.brushHolder').classed('hide',true);
            debugger
            main_svg
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
    }
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
                .attr('class','Outcontent')
                .attr("transform", "translate(" + (graphicopt.centerX()) + "," + graphicopt.centerY() + ")")
                .append("g")
                .attr('class','content')
                .on('click',()=>{if (isFreeze){
                    const func = isFreeze;
                    isFreeze = false;
                    func();
                }});
            g.append('g').attr('class','forces');
            g.append('g').attr('class','linkHolder');
            g.append('g').attr('class','nodeHolder');
            simulation = d3.forceSimulation()
                .force("charge", d3.forceManyBody().strength(-30))
                .force("link", d3.forceLink().id(d => d.id))
                .force("x", d3.forceX().x(d=>d.isolate?-graphicopt.widthG()*3/8:0).strength(d=>d.isolate?0.5:0.1))
                .force("y", d3.forceY().y(d=>d.isolate?-graphicopt.heightG()*3/8:0).strength(d=>d.isolate?0.5:0.1))
                .on("tick", ticked);
            simulation.stop();

            g.call(tooltip);
            d3.zoomIdentity.x = graphicopt.margin.left;
            d3.zoomIdentity.y = graphicopt.margin.top;
            graphicopt.zoom.on("zoom", zoomed)
            main_svg.call(graphicopt.zoom.transform, d3.zoomIdentity);
            g.append('defs');


            d3.select(maindiv).append('g').attr('class','brushHolder');
        }
        return master
    };
    master.resetZoom = function(){
        graphicopt.zoom.transform(main_svg, d3.zoomIdentity);
    };
    function drag4Force(){
        function dragstarted(d) {
            d._x = d.x;
            d._y = d.y;
        }

        function dragged(d) {
            d._x = d3.event.x;
            d._y = d3.event.y;
            d3.select(this).attr('transform',d=>`translate(${d._x},${d._y})`)
        }

        function dragended(d) {
            d.x = d._x;
            d.y = d._y;
            updateForce(d.key,[d.x,d.y])
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }
    let getDataForce = {};
    master.addForce = function ({key,pos,_index}){
        let _pos = [pos[0]-graphicopt.centerX(),
            pos[1]-graphicopt.centerY()
        ];
        const force = g.select('.forces').append('g')
            .datum({key,x:_pos[0],y:_pos[1]})
            .attr('transform',d=>`translate(${d.x},${d.y})`)
            .attr('class','force')
            .call(drag4Force());
        force.append('circle').attr('r',4);
        force.append('text').text(d=>d.key);
        const getData = function(d,_pos,index){
            if (data.datamap[d.id]&&data.datamap[d.id][0][_index]>0.8){
                d['force'+key] = true;
                return _pos[index]
            }
            d['force'+key] = false;
            return 0;
        };
        getDataForce[key] = getData;
        debugger
        simulation.force(key+"X",d3.forceX().x(d=> getData(d,_pos,0)).strength(d=>(d.isolate|| !d['force'+key])?0:0.5));
        simulation.force(key+"Y",d3.forceY().y(d=>getData(d,_pos,1)).strength(d=>(d.isolate|| !d['force'+key])?0:0.5));
    }
    function updateForce(key,_pos){
        const getData = getDataForce[key];
        simulation.force(key+"X",d3.forceX().x(d=> getData(d,_pos,0)).strength(d=>(d.isolate|| !d['force'+key])?0:0.5));
        simulation.force(key+"Y",d3.forceY().y(d=>getData(d,_pos,1)).strength(d=>(d.isolate|| !d['force'+key])?0:0.5));
        simulation.alphaTarget(0.02).restart();
    }
    master.removeForce = function (key){
        g.select('.forces').filter(d=>d.key===key).remove();
        node.data().forEach(d=>delete d['force'+key]);
        simulation.force(key+"X",null);
        simulation.force(key+"Y",null);
    };
    function ticked() {
        const alpha = simulation.alpha();
        node.attr("transform", d=>{
            if (d._x!==undefined && !d.isolate){
                d.x+= (d._x-d.x)*alpha*0.1;
                d.y+= (d._y-d.y)*alpha*0.1;
            }
            return `translate(${d.x},${d.y})`});

        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        g.selectAll('.labels').attr("transform", d=>`translate(${d.x},${d.y})`);
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

    master.g = function(){return g};
    master.isFreeze = function(){return isFreeze};

    function mouseover(d){
        if (!isFreeze) {     // Bring to front
            g.classed('onhighlight', true);
            d.relatedLinks.forEach(e=>e.node.classed('highlight', true))
            d.relatedNodes.forEach(e=>e.node.classed('highlight', true))
            d3.select(this).classed('highlight', true);
            if (d.node) {
                d.node.classed('highlight', true);
            }
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
    master.PCAlayout = function(d){graphicopt.PCAlayout = d};

    function mouseout(d){
        if(!isFreeze)
        {
            g.classed('onhighlight',false);
            d.relatedLinks.forEach(e=>e.node.classed('highlight', false))
            d.relatedNodes.forEach(e=>e.node.classed('highlight', false))
            d3.select(this).classed('highlight', false);
            if(d.node){
                d.node.classed('highlight', false);
            }
            master.mouseout.forEach(f=>f(d))
        }
        if (d.tooltip) {
            tooltip.hide()
        }
    }
    function calculate({dataIn,dim=2})
    {
        // pca - compute cluster position
        let pca = new PCA();
        // console.log(brand_names);
        // let matrix = pca.scale(dataIn, true, true);
        let matrix = pca.scale(dataIn, false, false);

        let pc = pca.pca(matrix, dim);

        let A = pc[0];  // this is the U matrix from SVD
        // let B = pc[1];  // this is the dV matrix from SVD
        let chosenPC = pc[2];   // this is the most value of PCA
        debugger
        let solution = dataIn.map((d, i) => d3.range(0, dim).map(dim => A[i][chosenPC[dim]]));
        return render(solution);
    }
    function render(sol){
        let xrange = d3.extent(sol, d => d[0]);
        let yrange = d3.extent(sol, d => d[1]);
        let xscale = d3.scaleLinear().range([-graphicopt.widthG()/2, graphicopt.widthG()/2]);
        let yscale = d3.scaleLinear().range([-graphicopt.heightG()/2, graphicopt.heightG()/2]);
        const ratio = graphicopt.heightG() / graphicopt.widthG();
        if ((yrange[1] - yrange[0]) / (xrange[1] - xrange[0]) > graphicopt.heightG() / graphicopt.widthG()) {
            yscale.domain(yrange);
            let delta = ((yrange[1] - yrange[0]) / ratio - (xrange[1] - xrange[0])) / 2;
            xscale.domain([xrange[0] - delta, xrange[1] + delta])
        } else {
            xscale.domain(xrange);
            let delta = ((xrange[1] - xrange[0]) * ratio - (yrange[1] - yrange[0])) / 2;
            yscale.domain([yrange[0] - delta, yrange[1] + delta])
        }
        return {xscale,yscale,solution:sol}
    }
    return master;
};