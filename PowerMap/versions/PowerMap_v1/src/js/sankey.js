// data type {key, value, order(optional), data(extra data)}


let Sankey = function(){
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

    let maindiv='#ganttLayout';
    let isFreeze= false;
    let data=[],main_svg,g,r=0;
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
    master.updateTimeHandle = function (time){
        main_svg.select('#timeClip rect').interrupt();
        main_svg.select('#timeClip rect').transition().duration(graphicopt.animationTime).attr('width',x(time)+graphicopt.margin.left);
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
        main_svg.select('#timeClip rect').attr('height',graphicopt.heightG());
        g.select('.timeHandleHolder').attr('transform','translate(0,0)')
            .select('.timeStick').attr('y2',graphicopt.heightG())
        y = d3.scalePoint().range([0,graphicopt.heightG()]).padding(graphicopt.padding);
        // x = d3.scaleTime().domain(graphicopt.range||[d3.min(data,d=>d.range[0]),d3.max(data,d=>d.range[1])]).range([0,graphicopt.widthG()]);
        data.sort(master.sortFunc);
        y.domain(data.map(d=>d.key));
        // let sizeScale = d3.scaleSqrt().domain(d3.extent(_.flatten(data.map(d=>d.value.map(d=>d.names.length))))).range([1,graphicopt.hi/2*1.2]);
        // let range= sizeScale.domain();
        data.forEach((d,i)=>{
            d.order = i;
            d.relatedNode = [];
        });
        let drawArea = g.select('.drawArea').attr('clip-path','url(#timeClip)');
        //
        let keys = Layout.timespan//.slice(0,10);
        x = d3.scaleTime().domain([keys[0],_.last(keys)]).range([0,graphicopt.widthG()]);
        let width = x.range()[1]-x.range()[0];

        let graph = (()=> {
            let index = -1;
            let nodes = [];
            const nodeByKey = new Map;
            const indexByKey = new Map;
            const nodeLabel = new Map;
            let links = [];
            const nodeList = {};
            keys.forEach((k,ki)=>{
                for (const d of data) {
                    if(d[k]){
                        const text = getUserName(d[k]);
                        const key = JSON.stringify([k, text]);
                        if ((graphicopt.showShareUser && (!(d[k]&&d[k].length>1)))|| nodeByKey.has(key))
                            continue // return
                        const node = {name: text,time:k,layer:ki,relatedLinks:[],element:d[k],id:++index};
                        if (!nodeLabel.has(text)) {
                            node.first = true;
                            nodeLabel.set(text, node);
                            nodeList[text] = [];
                            color(text)
                        }
                        nodes.push(node);
                        nodeByKey.set(key, node);
                        indexByKey.set(key, index);
                        nodeList[text].push(node);
                    }
                }
            })
            // nodes = _.shuffle(nodes)
            for (let i = 1; i < keys.length; ++i) {
                const a = keys[i - 1];
                const b = keys[i];
                const prefix = keys.slice(0, i + 1);
                const linkByKey = new Map;
                for (const d of data){
                    const sourceName = JSON.stringify([a, getUserName(d[a])]);
                    const targetName = JSON.stringify([b, getUserName(d[b])]);
                    if (d[a] && d[b] && nodeByKey.get(sourceName) && nodeByKey.get(targetName)){
                        const names = [sourceName,targetName];
                        const key = JSON.stringify(names);
                        // const value = d.value || 1;
                        const value = d[a].total;
                        const arr = d.arr || [d.key];//just ad for testing
                        let link = linkByKey.get(key);
                        if (link) {
                            link.value += value;
                            // link.arr = [...(link.arr??[]),...arr];
                            link.arr = [link.value];
                            continue;
                        }
                        link = {
                            source: indexByKey.get(JSON.stringify([a, getUserName(d[a])])),
                            target: indexByKey.get(JSON.stringify([b, getUserName(d[b])])),
                            names,
                            arr,
                            value
                        };
                        if (getUserName(d[a])!==getUserName(d[b])){
                            nodeByKey.get(JSON.stringify([a, getUserName(d[a])])).relatedLinks.push(link);
                            nodeByKey.get(JSON.stringify([b, getUserName(d[b])])).relatedLinks.push(link);
                        }
                        links.push(link);
                        linkByKey.set(key, link);
                    }
                }
            }
            if (graphicopt.hideStable){
                let removeNodes = {};
                const listUser = {};
                d3.entries(nodeList).forEach(n=>{
                    let removeList = {};
                    if (!n.value.find(e=>{if (!e.relatedLinks.length) removeList[e.id] = true; return e.relatedLinks.length}))
                        d3.keys(removeList).forEach(k=>removeNodes[k] =true);
                })

                nodes = nodes.filter((n,index)=>{
                    if (!removeNodes[n.id])
                        return true;
                    else{
                        // listUser[n.name] = n;
                        return false;
                    }
                });
                // console.log(listUser)
                links = links.filter(l=>!(removeNodes[l.source]||removeNodes[l.target]))
            }
            return {nodes, links};
        })();

        sankey.nodeId(function(d){return d.id})
            .nodeSort(nodeSort)
            // .linkSort(null)
            .extent([[x.range()[0], 10], [x.range()[1], graphicopt.heightG()-10]]);
        const {nodes, links} = sankey({
            nodes: graph.nodes.map(d => Object.assign({}, d)),
            links: graph.links.map(d => Object.assign({}, d))
        });
        links.forEach((d,i)=>{
            d._id = 'link_'+JSON.stringify(d.names).replace(/\.|\[|\]| |"|\\|:|-|,/g,'');
        });
        let isAnimate = true;
        if (links.length>400)
            isAnimate = false;
        svg_paraset = drawArea;
        let node_g = svg_paraset.select('.nodes');
        if(node_g.empty()){
            node_g = svg_paraset.append('g').classed('nodes',true);
        }
        let node_p = node_g
            .selectAll("g.outer_node")
            .data(nodes.filter(d=>d.first),d=>d.name)
            .join(
                enter => (e=enter.append("g").attr('class','outer_node element'),e.append("title"),/*e.append("rect"),*/e.append("text"),e.attr('transform',d=>`translate(${d.x0},${d.y0})`)),
                update => update.call(update=>(isAnimate?update.transition().duration(graphicopt.animationTime):update).attr('transform',d=>`translate(${d.x0},${d.y0})`)),
                exit => exit.call(exit=>(isAnimate?exit.transition().duration(graphicopt.animationTime).attr('opacity',0):exit).remove()),
            );
        node_p.select('text')
            .attr("x", - 6)
            .attr("y", d => (d.y1 + d.y0) / 2-d.y0)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .attr("fill", d=>d.first?color(d.name):'none')
            .attr("font-weight", "bold")
            .text(d => {
                return d.first?d.name:''});
        node_p.each(function(d){
            d.node = d3.select(this);
        });
        let link_g = svg_paraset.select('.links');
        if(link_g.empty()){
            link_g = svg_paraset.append('g').classed('links',true);
        }

        let link_p = link_g
            .attr("fill", "none")
            .attr("opacity", 0.5)
            .selectAll("g.outer_node")
            .data(links,(d,i)=>d._id)
            .join(
                enter => {
                    e=enter.append("g").attr('class','outer_node element').style("mix-blend-mode", "multiply").attr('transform','scale(1,1)');
                    // gradient
                    const gradient = e.append("linearGradient")
                        .attr("id", d => d._id)
                        .attr("gradientUnits", "userSpaceOnUse")
                        .attr("x1", d => d.source.x1)
                        .attr("x2", d => d.target.x0);
                    gradient.selectAll("stop").data(d=>[[0,color(d.source.name)],[100,color(d.target.name)]])
                        .join('stop')
                        .attr("offset", d=>`${d[0]}%`)
                        .attr("stop-color", d => d[1]);
                    // gradient ---end
                    const path = e.append("path").attr('class',d=>'a'+d.nameIndex)
                        .classed('hide',d=>d.arr===undefined)
                        .attr("fill", d => `url(#${d._id})`)
                        .attr("stroke", d => `url(#${d._id})`)
                        .attr("stroke-width", 0.1)
                        .attr("d", linkPath);
                    if (isAnimate)
                        path.attr("opacity", 0)
                        .transition().duration(graphicopt.animationTime)
                        .attr("opacity", 1);
                    path.each(function(d){d.dom=d3.select(this)});
                    e.append("title");
                    return e
                },update => {
                    // gradient
                    const gradient = update.select("linearGradient")
                        .attr("id", d => d._id)
                        .attr("gradientUnits", "userSpaceOnUse");
                    gradient
                        .attr("x1", d => d.source.x1)
                        .attr("x2", d => d.target.x0);

                    gradient.selectAll("stop").data(d=>[[0,color(d.source.name)],[100,color(d.target.name)]])
                        .join('stop')
                        .attr("offset", d=>`${d[0]}%`)
                        .attr("stop-color", d => d[1]);
                    // gradient ---end
                    const path = update.select('path').attr("fill", d => `url(#${d._id})`)
                        .attr("stroke", d => `url(#${d._id})`)
                        .attr("stroke-width", 0.1);
                    if (isAnimate)
                        path
                        .transition().duration(graphicopt.animationTime)
                        .attr("d", linkPath);
                    else
                        path.attr("d", linkPath);
                    return update
                },exit=>{
                    return exit.call(exit=>(isAnimate?exit.transition().duration(graphicopt.animationTime):exit).attr('opacity',0).remove())
                }
            ).on("mouseover", function(d){mouseover.bind(this)(d)})
            .on("mouseout", function(d){mouseout.bind(this)(d)})
            .on("click", function(d){master.click.forEach(f=>f(d));});
        link_p.each(function(d){
            d.node = d3.select(this);
        })
        link_p.each(function(d){
            const nodematch = {};
            const match = links.filter(l=>l.target.name===d.source.name || l.target.name===d.source.name);
            match.forEach(d=>{if (d.source.node) nodematch[d.source.name] = d.source.node});
            debugger
            d.relatedNode = match
                .map(l=>l.node);
            d3.entries(nodematch).forEach(e=>d.relatedNode.push(e.value));
        })
        link_p.select('path')
            .each(function(d){d.dom=d3.select(this)});
        // link_p.select('title').text(d => `${d.names.join(" → ")}\n${d.value.toLocaleString()}`);
        link_p.select('title').text(d => `${d.names.join(" → ")}\n${d.arr}`);

        function horizontalSource(d) {
            return [d.source.x1, d.y0];
        }

        function horizontalTarget(d) {
            return [d.target.x0, d.y1];
        }

        function linkPath(d) {
            const source = horizontalSource(d);
            const target = horizontalTarget(d);
            const thick = d.width/2;
            const width = (target[0]-source[0])/2;
            // return d3.line().curve(d3.curveBasis)([source,[source[0]+width,source[1]],[target[0]-width,target[1]],target]);
            return `M ${source[0]} ${source[1]-thick} C ${source[0]+width} ${source[1]-thick}, ${target[0]-width} ${target[1]-thick}, ${target[0]} ${target[1]-thick} 
            L ${target[0]} ${target[1]+thick} C ${target[0]-width} ${target[1]+thick}, ${source[0]+width} ${source[1]+thick}, ${source[0]} ${source[1]+thick} Z`;
        }

        g.select('.background').select('.drawArea').attr('clip-path',null)
        g.select('.axisx').attr('transform',`translate(0,${graphicopt.heightG()})`).call(d3.axisBottom(x))
        onFinishDraw.forEach(d=>d());

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
        if(main_svg.select('#timeClip').empty())
            main_svg.append('defs').append('clipPath').attr('id','timeClip')
                .append('rect').attr('x',-graphicopt.margin.left).attr('width',graphicopt.margin.left).attr('height',graphicopt.heightG());
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
