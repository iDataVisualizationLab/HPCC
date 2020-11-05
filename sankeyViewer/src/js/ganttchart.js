// data type {key, value, order(optional), data(extra data)}


let Gantt = function(){
    let tooltip = d3.tip().attr('class', 'd3-tip').html(function (d){return `<span>${d}</span>`})
    let graphicopt = {
        margin: {top: 20, right: 20, bottom: 20, left: 20},
        width: 1000,
        height: 500,
        'max-height': 500,
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
        hi: 12,
        padding: 0,
        animationTime:1000,
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
    let radius,x,y;
    master.mouseover = [];
    master.mouseover.dict={};
    master.mouseout = [];
    master.mouseout.dict={};
    master.click = [];
    master.click.dict={};
    master.mouseoverAdd = function(id,func){
        if (master.mouseover.dict[id]!==undefined)
            master.mouseover[master.mouseover.dict[id]] = func;
        else {
            master.mouseover.push(func)
            master.mouseover.dict[id] = master.mouseover.length-1;
        }
    }
    master.mouseoutAdd = function(id,func){
        if (master.mouseout.dict[id]!==undefined)
            master.mouseout[master.mouseout.dict[id]] = func;
        else {
            master.mouseout.push(func)
            master.mouseout.dict[id] = master.mouseout.length-1;
        }
    }
    master.clickAdd = function(id,func){
        if (master.click.dict[id]!==undefined)
            master.click[master.click.dict[id]] = func;
        else {
            master.click.push(func)
            master.click.dict[id] = master.click.length-1;
        }
    }
    master.sortFunc = function(a,b){return a.order-b.order};
    master.updateTimeHandle = function (time){
        main_svg.select('#timeClip rect').interrupt();
        main_svg.select('#timeClip rect').transition().duration(graphicopt.animationTime).attr('width',x(time));
        g.select('.timeHandleHolder').interrupt();
        g.select('.timeHandleHolder').transition().duration(graphicopt.animationTime).attr('transform',`translate(${x(time)},0)`);

        if (data.length&&data[0].drawData)
            g.select('.timeHandleHolder').selectAll('.vticks').data(data.filter(d=>d.value.find(e=>(e[0]<=time)&&(e[1]>=time))),d=>d.key)
                .join(enter=>enter.append('text').attr('class','vticks').attr('y',d=>d.y).attr('dx',5).attr('dy',5).attr('x',d=>d.x).attr('opacity',0).text(d=>d.key)
                        .call(enter => enter.transition().duration(graphicopt.animationTime).attr('opacity',1).style('font-weight','bold'))
                        .each(function(d){
                            d.relatedNode.push(d3.select(this));
                        })
                    ,update=>update.call(update => update.style('font-weight',null).transition().duration(graphicopt.animationTime).attr('y',d=>d.y).attr('x',d=>d.x))
                    ,exit=>exit.call(exit => {
                        exit.each(function(d){
                            d.relatedNode = d.relatedNode.filter((e)=>e.datum().key!==d.key);
                        });
                        exit.transition().duration(graphicopt.animationTime).attr('x',d=>d.x+20).attr('opacity',0).remove()
                    }));
    }
    master.draw = function() {
        if (isFreeze)
            freezeHandle();
        // color=getColorScale();
        let N = data.length;
        if (!graphicopt.collapse)
            graphicopt.height = graphicopt.margin.top+graphicopt.margin.bottom+(N-1)*((1+graphicopt.padding)*graphicopt.hi);
        else
            graphicopt.height = graphicopt["max-height"];
        main_svg.attr('height',graphicopt.height);
        main_svg.select('#timeClip rect').attr('height',graphicopt.heightG());
        g.select('.timeHandleHolder').attr('transform','translate(0,0)')
            .select('.timeStick').attr('y2',graphicopt.heightG())
        y = d3.scalePoint().range([0,graphicopt.heightG()]).padding(graphicopt.padding);
        x = d3.scaleTime().domain(graphicopt.range||[d3.min(data,d=>d.range[0]),d3.max(data,d=>d.range[1])]).range([0,graphicopt.widthG()]);
        data.sort(master.sortFunc);
        y.domain(data.map(d=>d.key));
        let sizeScale = d3.scaleSqrt().domain(d3.extent(_.flatten(data.map(d=>d.value.map(d=>d.names.length))))).range([1,graphicopt.hi/2*1.2]);
        let range= sizeScale.domain();
        data.forEach((d,i)=>{
            d.order = i;
            d.y = y(d.key);
            d.h = graphicopt.hi;
            d.x = 0;
            d.w = x(d.value[1])-d.x;
            d.drawData = [];
            d.value.forEach(e=>{
                let item = e.map(f=>[x(f),-sizeScale(e.names.length)/2]);
                item.names = e.names;
                item.r = sizeScale(e.names.length);
                item.type='top';
                item.size = e.names.length;
                if(range[0]>e.names.length)
                    range[0] = e.names.length;
                if(range[1]<e.names.length)
                    range[1] = e.names.length;
                d.drawData.push(item)
            });
            d.value2.forEach(e=>{
                let item = e.map(f=>[x(f),sizeScale(e.names.length)/2]);
                item.r = sizeScale(e.names.length);
                item.type='bottom';
                item.names = e.names;
                item.size = e.names.length;
                if(range[0]>e.names.length)
                    range[0] = e.names.length;
                if(range[1]<e.names.length)
                    range[1] = e.names.length;
                d.drawData.push(item)
            })
            d.relatedNode = [];
        });
        color.domain([range[1],range[0]]);
        // let sizeScale = d3.scaleLinear().domain(range).range([1,graphicopt.hi])
        // let sizeScale = d3.scaleLinear().domain(range).range([1,graphicopt.hi/2])
        let drawArea = g.select('.drawArea');
        let onode = drawArea.attr('clip-path','url(#timeClip)').selectAll(".outer_node")
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
        g.select('.background').node().appendChild(drawArea.clone(true).node())
        g.select('.background').select('.drawArea').attr('clip-path',null)

        g.select('.axisx').attr('transform',`translate(0,${graphicopt.heightG()})`).call(d3.axisBottom(x))
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

            p.filter(d=>!d.highlight).attr("transform", function(d) { return `translate(${d.x},${d.y})`; });
            return p;
        }
        function makecirclepacking(svg) {
            let node;
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
                        .on("mouseover", function(d){mouseover.bind(this)(d)})
                        .on("mouseout", function(d){mouseout.bind(this)(d)})
                        .style('filter',d=>d.data.highlight?`url(#${'c'+d.data.currentID}`:null)
                        // .attr("fill", d => {
                        //     d.color = color(d.value,d);
                        //     return d.color;
                        // })
                        .style('stroke-width',d=>{
                            return d.h;
                        });
                    return node;
                }
            }


            function zoomTo(istransition) {
                node.selectAll('g').remove();
                let path = node.selectAll('path').data(d=>d.drawData)
                    .join('path')
                    .attr('class','circle')
                    .classed('invalid',d=>d.invalid)
                    .style('filter',d=>d.invalid?'url("#glow")':null)
                    .attr('d',getRenderFunc)
                    .classed('invalid',d=>d.invalid)
                    .style('filter',d=>d.invalid?'url("#glow")':null)
                    .attr("stroke", d => {
                        // d.color = color(d.value,d);
                        // d.color = color(d.size);
                        // return d.color;
                        return d.type==='top'?'rgba(166,86,40,0.75)':'rgba(55,126,184,0.75)';
                    })
                    .attr('stroke-width',d=>sizeScale(d.size))
                ;
            }
        }
    };
    // let getRenderFunc = function(d){
    //     return `M${d[0]} 0 L${d[1]} 0`;
    // };
    let getRenderFunc = function(d){
        return `M${d[0][0]} ${d[0][1]} L${d[1][0]} ${d[1][1]}`;
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
            if (d3.event.stopPropagation) d3.event.stopPropagation();
        }
    }
    function freezeHandleTrigger(value){
        if (value){
            isFreeze = ()=>{};
        }else{
            isFreeze = false;
        }
    }
    master.freezeHandle = freezeHandle;
    master.freezeHandleTrigger = freezeHandleTrigger;
    master.main_svg = function(){return main_svg};
    master.init=function(){
        // graphicopt.width = d3.select(maindiv).node().getBoundingClientRect().width;
        // graphicopt.height = d3.select(maindiv).node().getBoundingClientRect().height;
        r = d3.min([graphicopt.width, graphicopt.height]) / 2-20 ;
        main_svg = d3.select(maindiv)
            .attr("width", graphicopt.width)
            .attr("height", graphicopt.height)
            .style('overflow','visible');
        if(main_svg.select('#timeClip').empty())
            main_svg.append('defs').append('clipPath').attr('id','timeClip')
                .append('rect').attr('width',0).attr('height',graphicopt.heightG());
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
            g.append('g').attr('class','background').style('opacity',0.2);
            g.append('g').attr('class','drawArea');
            let axis = g.append('g').attr('class','axis');
            axisx = axis.append('g').attr('class','axisx');
            axisy = axis.append('g').attr('class','axisy');
            g.call(tooltip);
            let startZoom = d3.zoomIdentity;
            startZoom.x = graphicopt.margin.left;
            startZoom.y = graphicopt.margin.top;
            g.call(graphicopt.zoom.transform, d3.zoomIdentity);
            g.append('defs');
            g.append('g').attr('class','timeHandleHolder')
                .append('line').attr('class','timeStick')
                .attr('y2',graphicopt.heightG())
                .style('stroke','black')
                .attr('stroke-dasharray','2 1');
        }
        return master
    };
    master.padding = function(_data) {
        return arguments.length?(graphicopt.padding=_data,master):graphicopt.padding;
    };
    master.collapse = function(_data) {
        return arguments.length?(graphicopt.collapse=_data,master):graphicopt.collapse;
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

    master.g = function(){return g};
    master.isFreeze = function(){return isFreeze};

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
            d.relatedNode.forEach(e=>e.classed('highlight', true))
            master.mouseover.forEach(f=>f(d));
        }else{
            g.classed('onhighlight2', true);
            d3.select(this).classed('highlight2', true);
            if (d.node) {
                d.node.classed('highlight2', true);
            }
            d.relatedNode.forEach(e=>e.classed('highlight2', true));
        }
        if (d.tooltip) {
            tooltip.show(d.tooltip)
        }
    }
    master.highlight = function(listKey){
        g.classed('onhighlight', true);
        g.selectAll('.element').filter(d=>listKey.find(e=>d&&(e===d.key)))
            .classed('highlight', true)
            .each(d=>{
            (d.relatedNode)?d.relatedNode.forEach(e=>e.classed('highlight',true)):''});;
    };
    master.releasehighlight = function(){
        g.classed('onhighlight', false);
        g.selectAll('.element.highlight')
            .classed('highlight', false);
        g.selectAll('.vticks.highlight')
            .classed('highlight', false);
    };
    master.highlight2 = function(listKey){
        g.classed('onhighlight2', true);
        g.selectAll('.element').filter(d=>listKey.find(e=>d&&(e===d.key)))
            .classed('highlight2', true);
    };
    master.releasehighlight2 = function(){
        g.classed('onhighlight2', false);
        g.selectAll('.element.highlight2')
            .classed('highlight2', false);
    };
    function mouseout(d){
        if(!isFreeze)
        {
            g.classed('onhighlight',false);
            d3.select(this).classed('highlight', false);
            if(d.node){
                d.node.classed('highlight', false).classed('highlightSummary', false);
            }
            d.relatedNode.forEach(e=>e.classed('highlight', false).classed('highlightSummary', false));
            g.selectAll('path.trajectory').remove();
            g.select('.TrajectoryLegend').remove();
            master.current_trajectory_data = undefined;
            master.mouseout.forEach(f=>f(d));
        }else{
            g.classed('onhighlight2', false);
            d3.select(this).classed('highlight2', false);
            if (d.node) {
                d.node.classed('highlight2', false);
            }
            d.relatedNode.forEach(e=>e.classed('highlight2', false));
        }
        if (d.tooltip) {
            tooltip.hide()
        }
    }

    return master;
};
