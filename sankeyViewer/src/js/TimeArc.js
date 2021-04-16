// data type {key, value, order(optional), data(extra data)}

let TimeArc = function(){
    let tooltip = d3.tip().attr('class', 'd3-tip').html(function (d){return `<span>${d}</span>`})
    let graphicopt = {
        margin: {top: 20, right: 20, bottom: 20, left: 100},
        width: 1400,
        height: 700,
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

    let maindiv='#timearcLayout';
    let isFreeze= false;
    let data=[],times=[],main_svg,g,r=0;
    let onFinishDraw = [];
    // used to assign nodes color by group
    var color = d3.scaleOrdinal(d3.schemeCategory20);
    let getColorScale = function(){return color};
    let master={};
    let radius,x,y;
    let nodeSort = undefined;
    let sankey = d3.sankey()
        .nodeWidth(0.1)
        // .nodeAlign(d3.sankeyLeft)
        .nodePadding(5);
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
    master.draw = function() {
        if (isFreeze)
            freezeHandle();
        const nodes = data.nodes;
        const links = data.links;
        const pNodes = nodes.filter(d=>d.first);
        

        g.select('.timeHandleHolder').attr('transform','translate(0,0)')
            .select('.timeStick').attr('y2',graphicopt.heightG())
        y = d3.scalePoint().range([0,graphicopt.heightG()]).padding(graphicopt.padding);
        // x = d3.scaleTime().domain(graphicopt.range||[d3.min(data,d=>d.range[0]),d3.max(data,d=>d.range[1])]).range([0,graphicopt.widthG()]);
        // data.sort(master.sortFunc);
        y.domain(nodes.map(d=>({y:d.y,name:d.name})).sort((a,b)=>a.y-b.y).map(d=>d.name));
        // const linkScale = d3.scaleLinear().domain(d3.extent(links,d=>d.value)).range([1,5]);
        const yScale = d3.scaleLinear().domain([0,d3.max(pNodes.map(d=>d3.max(d.drawData,e=>e[1])))]).range([0,graphicopt.heightG()/pNodes.length])
        // let sizeScale = d3.scaleSqrt().domain(d3.extent(_.flatten(data.map(d=>d.value.map(d=>d.names.length))))).range([1,graphicopt.hi/2*1.2]);
        // let range= sizeScale.domain();
        // nodes.forEach((d,i)=>{
        //     d.order = i;
        //     d.relatedNode = [];
        // });
        //
        let keys = times;
        x = d3.scaleTime().domain([keys[0],_.last(keys)]).range([0,graphicopt.widthG()]);
        let width = x.range()[1]-x.range()[0];

        var area = d3.area()
            .curve(d3.curveCatmullRomOpen)
            .x(function (d) {
                return x(d[0]);
            })
            .y0(function (d) {
                return -yScale(d[1])/2;
            })
            .y1(function (d) {
                return yScale(d[1])/2;
            }).defined(d=>d);

        // const nodes = data.nodes;
        // const links = data.links;
        nodes.forEach(d=>{
            d.x = x(d.time);
            d.y = y(d.name)
        });
        renderTimeArc();

        function linkArc(d) {
            var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy) / 2;
            if (d.source.y < d.target.y)
                return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
            else
                return "M" + d.target.x + "," + d.target.y + "A" + dr + "," + dr + " 0 0,1 " + d.source.x + "," + d.source.y;
        }

        function renderTimeArc(){
            nodeG = g.select('g.nodeHolder')
                .selectAll(".nodeG")
                .data(pNodes).join("g")
                .attr("class", "nodeG")
                .attr("transform", function (d) {
                    d.nodeTarget = d3.select(this);
                    return "translate(" + d.x + "," + d.y + ")"
                });
            nodeG.selectAll('text')
                .data(d=>[d])
                .join('text')
                .attr('dy',6)
                .style('text-anchor','end')
                .attr('font-weight',d=>d.isShareUser?null:'bold')
                .style('fill',d=>d.color||getColorScale(d))
                .text(d=>d.name);
debugger
            let layerpath = g.select('g.nodeHolder')
                .selectAll(".layer")
                .data(pNodes).join("g")
                .attr("class", "layer")
                    .selectAll('path.layerpath')
                    .data(d=>[{y:d.y,name:d.name,value:d.drawData,color:d.color}]).join('path')
                    .attr('class','layerpath')
                    .style('opacity',0.5)
                    .attr("transform", function (d) {
                        return "translate(0," + d.y + ")"
                    })
                    .call(updatelayerpath);

            let linkArcs = g.select("g.linkHolder").style('opacity',0.5).selectAll("g.outer_node")
                .data(links,(d,i)=>(d._id='a'+d.names.join('').replace(/\[|-|"|:|\.|,| /g,''),d._id))
                .join(
                    enter => {
                        e=enter.append("g").attr('class','outer_node element').style("mix-blend-mode", "multiply").attr('transform','scale(1,1)');
                        // gradient
                        const gradient = e.append("linearGradient")
                            .attr("id", d => d._id)
                            .attr("gradientUnits", "userSpaceOnUse")
                            .attr("x1", d => d.source.x)
                            .attr("x2", d => d.target.x);
                        gradient.selectAll("stop").data(d=>[[0,d.source.color||getColorScale(d.source)],[100,d.target.color||getColorScale(d.target)]])
                            .join('stop')
                            .attr("offset", d=>`${d[0]}%`)
                            .attr("stop-color", d => d[1]);
                        // gradient ---end
                        const path = e.append("path").attr('class',d=>'a'+d._id)
                            .classed('hide',d=>d.arr===undefined)
                            .attr("fill", d => `url(#${d._id})`)
                            .attr("stroke", d => `url(#${d._id})`)
                            .attr("stroke-width", 0.5)
                            .attr("d", linkPath);
                        path.each(function(d){d.dom=d3.select(this)});
                        e.append("title");
                        return e
                    },update => {
                        // gradient
                        const gradient = update.select("linearGradient")
                            .attr("id", d => d._id)
                            .attr("gradientUnits", "userSpaceOnUse");
                        gradient
                            .attr("x1", d => d.source.x)
                            .attr("x2", d => d.target.x);

                        gradient.selectAll("stop").data(d=>[[0,d.source.color||getColorScale(d.source)],[100,d.target.color||getColorScale(d.target)]])
                            .join('stop')
                            .attr("offset", d=>`${d[0]}%`)
                            .attr("stop-color", d => d[1]);
                        // gradient ---end
                        const path = update.select('path').attr("fill", d => `url(#${d._id})`)
                            .attr("stroke", d => `url(#${d._id})`)
                            .attr("stroke-width", 0.1);
                            path.attr("d", linkPath);
                        return update
                    },exit=>{
                        return exit.call(exit=>(exit).attr('opacity',0).remove())
                    }
                );

            g.select('.axisx').attr('transform',`translate(0,${graphicopt.heightG()})`).call(d3.axisBottom(x))
            onFinishDraw.forEach(d=>d());
        }

        function updatelayerpath(p){
            return p
                .style('fill',d=>d.color||'unset')
                .style('stroke',d=>d.color||null)
                .style('stroke-width',1)
                .attr("d", function (d) {
                    // if (d.name==='User 14,32')
                        
                    if (d.value[0])
                        return area([d.value[0],...d.value,d.value[d.value.length-1]]);
                });
        }
        function horizontalSource(d) {
            return [d.source.x, d.source.y];
        }

        function horizontalTarget(d) {
            return [d.target.x, d.target.y];
        }

        function linkPath(d) {
            
            let source = horizontalSource(d);
            let target = horizontalTarget(d);
            if (source[0]>target[0]){
                const temp = source.slice();
                source = target;
                target = temp;
            }
            const thick = yScale(d.value)/2;
            const width = (target[0]-source[0])/2;
            // return d3.line().curve(d3.curveBasis)([source,[source[0]+width,source[1]],[target[0]-width,target[1]],target]);
            return `M ${source[0]} ${source[1]-thick} C ${source[0]+width} ${source[1]-thick}, ${target[0]-width} ${target[1]-thick}, ${target[0]} ${target[1]-thick} 
            L ${target[0]} ${target[1]+thick} C ${target[0]-width} ${target[1]+thick}, ${source[0]+width} ${source[1]+thick}, ${source[0]} ${source[1]+thick} Z`;
        }

    };

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
    function getUserName(arr){
        return (arr&&arr.length)?('User '+arr.map(d=>d.key.replace('user','')).join(',')):'No user';
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
            let axis = g.append('g').attr('class','axis');
            axisx = axis.append('g').attr('class','axisx');
            axisy = axis.append('g').attr('class','axisy');
            g.call(tooltip);
            let startZoom = d3.zoomIdentity;
            startZoom.x = graphicopt.margin.left;
            startZoom.y = graphicopt.margin.top;
            g.call(graphicopt.zoom.transform, d3.zoomIdentity);
            g.append('g').attr('class',"linkHolder");
            g.append('g').attr('class',"nodeHolder");
        }
        return master
    };
    master.padding = function(_data) {
        return arguments.length?(graphicopt.padding=_data,master):graphicopt.padding;
    };
    master.data = function(_data) {
        return arguments.length?(data=_data,master):data;
    };
    master.times = function(_data) {
        return arguments.length?(times=_data,master):times;
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
    master.sankeyOpt = function(_data){
        if (arguments.length) {
            if (_data.nodeSort!==undefined) {
                switch (_data.nodeSort) {
                    case '':
                        nodeSort = undefined;
                        break;
                    case 'size':
                        nodeSort = function (a, b) {
                            return a.value - b.value
                        };
                        break;
                }
            }
            d3.keys(_data).forEach(k => graphicopt[k] = _data[k]);
            return master;
        }else
            return graphicopt
    }
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
        let listobj = {};
        listKey.forEach(k=>listobj[k]=true);
        g.classed('onhighlight', true);
        g.selectAll('.element').filter(d=>{
            let item = d;
            if (d.source)
                item = d.source;
            return item.element.find(f=>listobj[f.key])
        })
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
