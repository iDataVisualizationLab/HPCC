// data type {key, value, order(optional), data(extra data)}


let Sankey_v2 = function(){
    let tooltip = d3.tip().attr('class', 'd3-tip').html(function (d){return `${d}`})
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
        color:{},
        maxLimit: 32
    };

    let maindiv='#ganttLayout';
    let isFreeze= false;
    let data=[],times=[],nodes=[],_links=[],graph_={},main_svg,g,r=0;
    let onFinishDraw = [];
    let onLoadingFunc = ()=>{};
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
        if (time){
            g.select('.timeHandleHolder').interrupt();
            g.select('.timeHandleHolder').classed('hide',false).transition().duration(graphicopt.animationTime).attr('transform',`translate(${x(time)},0)`);
        }else
            g.select('.timeHandleHolder').classed('hide',true)
    }
    master.draw = function() {
        if (isFreeze)
            freezeHandle();
        getColorScale = function(d){
            if (d.isShareUser)
                return 'black';
            else
                return color(d.name)
        }
        main_svg.select('#timeClip rect').attr('height',graphicopt.heightG());
        g.select('.timeHandleHolder').classed('hide',true).attr('transform','translate(0,0)')
            .select('.timeStick').attr('y2',graphicopt.heightG())
        y = d3.scalePoint().range([0,graphicopt.heightG()]).padding(graphicopt.padding);
        // x = d3.scaleTime().domain(graphicopt.range||[d3.min(data,d=>d.range[0]),d3.max(data,d=>d.range[1])]).range([0,graphicopt.widthG()]);
        data.sort(master.sortFunc);
        y.domain(data.map(d=>d.key));
        // let sizeScale = d3.scaleSqrt().domain(d3.extent(_.flatten(data.map(d=>d.value.map(d=>d.names.length))))).range([1,graphicopt.hi/2*1.2]);
        // let range= sizeScale.domain();
        debugger
        data.forEach((d,i)=>{
            d.order = i;
            d.relatedNode = [];
        });
        let drawArea = g.select('.drawArea')//.attr('clip-path','url(#timeClip)');
        //
        let keys = Layout.timespan;
        times = keys;
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
            console.time('create nodes');
            keys.forEach((k,ki)=>{
                for (const d of data) {
                    if(d[k]){
                        const text = getUserName(d[k]);
                        const key = JSON.stringify([k, text]);
                        if ((graphicopt.showShareUser && (!(d[k]&&d[k].length>1)))|| nodeByKey.has(key))
                            continue; // return

                        const node = {name: text,time:k,layer:ki,_key:key,relatedLinks:[],element:d[k],id:++index};
                        if (!nodeLabel.has(text)) {
                            node.first = true;
                            node.childNodes = [];
                            nodeLabel.set(text, node);
                            nodeList[text] = [];
                            node.isShareUser = (d[k]&&d[k].length>1);
                            node.maxIndex=ki;
                            node.maxval = 0;
                            node.drawData=[];
                            getColorScale(node);

                            nodes.push(node);
                            nodeByKey.set(key, node);
                            indexByKey.set(key, index);
                            nodeList[text].push(node);
                        }else {
                            node.isShareUser = (d[k]&&d[k].length>1);
                            node.parentNode = nodeLabel.get(text).id;
                            getColorScale(node);
                            nodes.push(node);
                            // if (nodeByKey.has(key)) continue;
                            nodeByKey.set(key, node);
                            indexByKey.set(key, index);
                            nodeList[text].push(node);
                        }
                    }
                }
            });
            console.timeEnd('create nodes');
            console.time('create links');
            // nodes = _.shuffle(nodes);

            const maxLimit = graphicopt.maxLimit;
            const mapOfSankey = {};
            const linkCheckBySource = {};
            for (let i = 1; i < keys.length; ++i) {
                const a = keys[i - 1];
                const b = keys[i];
                const linkByKey = new Map();
                for (const d of data){
                    const aName = getUserName(d[a]);
                    const bName = getUserName(d[b]);
                    const sourceName = JSON.stringify([a, getUserName(d[a])]);
                    const targetName = JSON.stringify([b, getUserName(d[b])]);
                    if (d[a] && d[b] && nodeByKey.has(sourceName) && nodeByKey.has(targetName)){
                        const names = [sourceName,targetName];
                        const key = JSON.stringify(names);
                        // const value = d.value || 1;
                        const value = Math.min(d[a].total,maxLimit);
                        const arr = [d.key];//just ad for testing
                        let link = linkByKey.get(key);
                        const byComp = {};
                        byComp[d.key] = value;
                        if (link) {
                            let new_val = Math.min((link.byComp[d.key]??0) + value,maxLimit);
                            let delta = new_val - (link.byComp[d.key]??0);
                            link.byComp[d.key] = new_val;

                            // if a compute over the limit
                            link.value += delta;

                            // d[a].forEach((n,i)=>{
                            //     link._source[i].value+=n.value;
                            //     link._source.total+=n.value;
                            // });
                            d[b].forEach((n,i)=>{
                                if(link._target[i]===undefined)
                                    debugger
                                link._target[i].value+=n.value;
                                link._target.total+=n.value;
                            });
                            link.arr.push(arr[0]);
                            // TIME ARC
                            // if (nodes[link.source].maxval<link.value) {
                            //     nodes[link.source].maxval = link.value;
                            //     nodes[link.source].maxIndex = i - 1;
                            // }
                            // if (nodes[link.target].maxval<link.value) {
                            //     nodes[link.target].maxval = link.value;
                            //     nodes[link.target].maxIndex = i;
                            // }
                            continue;
                        }
                        if(!mapOfSankey[sourceName])
                            mapOfSankey[sourceName]= JSON.parse(JSON.stringify(d[a]));
                        mapOfSankey[targetName] = JSON.parse(JSON.stringify(d[b]));
                        const _source = mapOfSankey[sourceName];
                        // _source.total=d[a].total;
                        const _target = mapOfSankey[targetName];
                        // _target.total=d[b].total;

                        link = {
                            byComp,
                            source: indexByKey.get(JSON.stringify([a, getUserName(d[a])])),
                            _source,
                            target: indexByKey.get(JSON.stringify([b, getUserName(d[b])])),
                            _target,
                            names,
                            arr,
                            value,
                            _id: 'link_'+key.replace(/\.|\[|\]| |"|\\|:|-|,/g,'')
                        };
                        if (aName!==bName){
                            if (graphicopt.hideStable){
                                nodeByKey.get(JSON.stringify([a, getUserName(d[a])])).relatedLinks.push(link);
                                nodeByKey.get(JSON.stringify([b, getUserName(d[b])])).relatedLinks.push(link);}
                            nodeByKey.get(JSON.stringify([a, getUserName(d[a])])).shared = true;
                            nodeByKey.get(JSON.stringify([b, getUserName(d[b])])).shared = true;

                            if (!linkCheckBySource[bName])
                                linkCheckBySource[bName] = {};
                            linkCheckBySource[bName][nodeByKey.get(targetName).layer] = 1;
                        }else{
                            link.isSameNode = true;
                        }
                        links.push(link);
                        linkByKey.set(key, link);
                    }
                }
            }
            if (graphicopt.showOverLimitUser){
                let keepNodes = {};
                const listUser = {};
                let nodeObj = {};
                nodes.forEach(d=>{nodeObj[d.id] = d;});
                links = links.filter(l=>{
                    if (((l._source.total>l.arr.length*graphicopt.maxLimit) || (l._target.total>l.arr.length*graphicopt.maxLimit))){
                        keepNodes[nodeObj[l.source].name]=true;
                        keepNodes[nodeObj[l.target].name]=true;
                        return true;
                    }
                    l.hide = true;
                    return false;
                });
                nodes = nodes.filter((n,index)=>{
                    if (keepNodes[n.name])
                        return true;
                    else{
                        delete nodeObj[n.id];
                        // listUser[n.name] = n;
                        return false;
                    }
                });
                links = links.filter(l=>nodeObj[l.source]&& nodeObj[l.target] && nodeObj[nodeObj[l.source].parentNode] && nodeObj[nodeObj[l.target].parentNode] )
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

            const __links = []
            d3.nest().key(d=>getUserName(d._source)).key(d=>getUserName(d._target)).entries(links)
                .forEach(d=>{

                    // compress links
                    // let samenode = [];
                    // d.values.forEach((e)=>{
                    //     if (e.key!==d.key){
                    //         e.values.forEach(l=>__links.push(l));
                    //     }else{
                    //         let startL = {...e.values[0]};
                    //         __links.push(startL);
                    //         for (let i = 1; i<e.values.length;i++){
                    //             const l = e.values[i];
                    //             if (nodes[startL.target].layer !== nodes[l.source].layer){
                    //                 startL = {...l};
                    //                 __links.push(startL);
                    //             }else{
                    //                 startL.target = l.target;
                    //             }
                    //         }
                    //     }
                    // })

                    let samenode = [];
                    let stoplayer = linkCheckBySource[d.key]??{};
                    if (linkCheckBySource[d.key])
                        debugger
                    d.values.forEach((e)=>{
                        if (e.key!==d.key){
                            e.values.forEach(l=>{
                                __links.push(l);
                                stoplayer[nodes[l.source].layer] = 1;
                            });
                        }else{
                            samenode=e.values;
                        }
                    });
                    if (Object.keys(stoplayer).length){
                        debugger
                    }
                    if (samenode.length) {
                        let startL = {...samenode[0]};
                        __links.push(startL);
                        for (let i = 1; i < samenode.length; i++) {
                            const l = samenode[i];
                            if (stoplayer[nodes[l.source].layer] || (nodes[startL.target].layer !== nodes[l.source].layer)) {
                                startL = {...l};
                                __links.push(startL);
                            } else {
                                startL.target = l.target;
                            }
                        }
                    }
                })


            console.timeEnd('create links');
            return {nodes, links:__links};
        })();

        // TIME ARC
        const nodeObj = {};
        nodes = graph.nodes.filter(d=>{nodeObj[d.id] = d;return d.first});
        nodes.forEach(d=>d.color=getColorScale(d))
        _links = graph.links.filter(l=>!l.isSameNode && nodeObj[l.source]&& nodeObj[l.target]).map(d =>{
            if (nodeObj[d.source].parentNode!==undefined){
                nodeObj[nodeObj[d.source].parentNode].childNodes.push(d.source);
                nodes.push(nodeObj[d.source]);
            }
            if (nodeObj[d.target].parentNode!==undefined){
                nodeObj[nodeObj[d.target].parentNode].childNodes.push(d.target);
                nodes.push(nodeObj[d.target]);
            }
            return Object.assign({}, d);
        });
        // renderSankey();
        // TIME ARC
        const forceNode = nodes.filter(d=>d.shared)
        force = d3.forceSimulation()
            .force("charge", d3.forceManyBody().strength(-50))
            // .force("center", d3.forceCenter(graphicopt.widthG() / 2, graphicopt.heightG() / 2))
            .force('x', d3.forceX(graphicopt.widthG() / 2).strength(0.015))
            .force('y',  d3.forceY( graphicopt.heightG() / 2).strength(0.015))
            .nodes( forceNode)
            .force('link',d3.forceLink(_links).id(d=>d.id).distance(0))
            .alpha(1)
            .on('tick',function () {
                onLoadingFunc( {percentage:(1-this.alpha())*100,text:'TimeArc calculation'});
                nodes.forEach(function (d,i) {
                    if(d.x!==undefined && d.y!==undefined) {
                        // d.x += (graphicopt.widthG() / 2 - d.x) * 0.05;
                        if (d.parentNode >= 0) {
                            if (nodeObj[d.parentNode].y !== undefined)
                                d.y += (nodeObj[d.parentNode].y - d.y) * 0.5;

                            if (nodeObj[d.parentNode].childNodes && nodeObj[d.parentNode].childNodes.length) {
                                nodeObj[d.parentNode].y = d3.mean(nodeObj[d.parentNode].childNodes,e=>nodeObj[e].y);
                            }
                        } else if (d.childNodes && d.childNodes.length) {
                            var yy = d3.mean(d.childNodes, e => nodeObj[e].y);
                            if (yy !== undefined)
                                d.y += (yy - d.y) * 0.2;
                        }
                    }
                });
            })
            .on("end", function () {
                onLoadingFunc();
                const miny= d3.min(forceNode,d=>d.parentNode!==undefined?nodeObj[d.parentNode].y:d.y);
                let left = 1;
                const nodep = {};
                forceNode.forEach(d=>{
                    if ((d.parentNode !==undefined) && nodeObj[d.parentNode].childNodes && nodeObj[d.parentNode].childNodes.length) {
                        nodeObj[d.parentNode].y = d3.mean(nodeObj[d.parentNode].childNodes,e=>nodeObj[e].y);
                    }
                })
                graph.nodes.forEach(d=>{
                    d._forcey =  (d.parentNode!==undefined?nodeObj[d.parentNode].y:d.y);
                    if((d._forcey === undefined || _.isNaN(d._forcey)) ) {
                        if(d.name==='User 2')
                            debugger
                        if (nodep[d.name] === undefined) {
                            nodep[d.name] = miny - 10 * (left);
                            d._forcey = nodep[d.name];
                            left++;
                        } else {
                            d._forcey = nodep[d.name];
                        }
                    }
                    d.y = d._forcey;
                });
                // graph.nodes.forEach(d=>d._forcey = d.y??nodeObj[d.parentNode].y);
                nodeSort = function(a,b){ return (a._forcey-b._forcey)};
                renderSankey();
            })

        function renderSankey(){
            let nodeObj = {};
            graph.nodes.forEach(d=>{nodeObj[d.id] = d;});
            sankey.nodeId(function(d){return d.id})
                .nodeSort(nodeSort)
                // .linkSort(function(a,b){return ((a.source._forcey+a.target._forcey)-(b.source._forcey+b.target._forcey))})
                .extent([[x.range()[0], 10], [x.range()[1], graphicopt.heightG()-10]]);
            debugger
            const __nodes = graph.nodes.map(d => Object.assign({}, d))
            const __links = graph.links.map(d => Object.assign({}, d))
            const {nodes, links} = sankey({
                nodes: __nodes,
                links: __links
            });
            graph_ = {nodes, links};
            console.log('#links: ',graph_.links.length);
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
                .attr("paint-order", "stroke")
                .attr("stroke", "white")
                .attr("stroke-width", "3")
                .attr("fill", d=>d.first?getColorScale(d):'none')
                .attr('font-weight',d=>d.isShareUser?null:'bold')
                .text(d => {
                    return d.first?d.name:''});
            node_p.each(function(d){
                d.node = d3.select(this);
            });
            let link_g = svg_paraset.select('.links');
            if(link_g.empty()){
                link_g = svg_paraset.append('g').classed('links',true);
            }
            links.forEach(l=>{
                if (l.isSameNode){
                    let parentNode = l.source;
                    if (l.source.parentNode!==undefined){
                        parentNode = nodeObj[l.source.parentNode];
                    }
                    if (parentNode.drawData.length===0 || _.last(parentNode.drawData)[0]!==l.source.time)
                        parentNode.drawData.push([l.source.time,l.value]);
                    parentNode.drawData.push([l.target.time,l.value]);
                }
                l._class = str2class(l.source.name)
            });
            let link_p = link_g
                .attr("fill", "none")
                .selectAll("g.outer_node")
                .data(links,(d,i)=>d._id)
                .join(
                    enter => {
                        e=enter.append("g").attr('class',d=>'outer_node element '+d._class)
                            .classed('hide',d=>d.hide)
                            .attr("opacity", 0.5).style("mix-blend-mode", "multiply").attr('transform','scale(1,1)');
                        // gradient
                        const gradient = e.append("linearGradient")
                            .attr("id", d => d._id)
                            .attr("gradientUnits", "userSpaceOnUse")
                            .attr("x1", d => d.source.x1)
                            .attr("x2", d => d.target.x0);
                        gradient.selectAll("stop").data(d=>[[0,getColorScale(d.source)],[100,getColorScale(d.target)]])
                            .enter().append('stop')
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
                        update.attr('class',d=>'outer_node element '+d._class).classed('hide',d=>d.hide);
                        // gradient
                        const gradient = update.select("linearGradient")
                            .attr("id", d => d._id)
                            .attr("gradientUnits", "userSpaceOnUse");
                        gradient
                            .attr("x1", d => d.source.x1)
                            .attr("x2", d => d.target.x0);

                        gradient.selectAll("stop").data(d=>[[0,getColorScale(d.source)],[100,getColorScale(d.target)]])
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
                ).on("mouseover", function(d){console.log('mouse start------------');console.time('------mouse end');  mouseover.bind(this)(d); console.timeEnd('------mouse end') })
                .on("mouseout", function(d){mouseout.bind(this)(d)})
                .on("click", function(d){master.click.forEach(f=>f(d));});
            link_p.each(function(d){
                d.node = d3.select(this);
            })
            // link_p.each(function(d){
            //     const nodematch = {};
            //     const match = links.filter(l=>l.target.name===d.source.name || l.target.name===d.source.name);
            //     match.forEach(d=>{if (d.source.node) nodematch[d.source.name] = d.source.node});
            //     d.relatedNode = match
            //         .map(l=>l.node);
            //     d3.entries(nodematch).forEach(e=>d.relatedNode.push(e.value));
            // });
            link_p.select('path')
                .each(function(d){d.dom=d3.select(this)});
            // link_p.select('title').text(d => `${d.names.join(" → ")}\n${d.value.toLocaleString()}`);
            // link_p.select('title').text(d => `${d.names.join(" → ")}\n${d.arr}`);
            g.select('.background').select('.drawArea').attr('clip-path',null)
            g.select('.axisx').attr('transform',`translate(0,${graphicopt.heightG()})`).call(d3.axisBottom(x));
            onLoadingFunc();
            onFinishDraw.forEach(d=>d());}
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

    };
    function str2class(str){
        return 'l'+str.replace(/ |,/g,'_');
    }
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
        if (arr && arr.length)
        {
            if (arr.length===1)
                return 'User '+arr[0].key.replace('user','');
            else
                return arr.map(d=>d.key.replace('user','')).join(',');
        }else
            return 'No user';
    }
    function compressName(arr){
        let limit = 5;
        const arrn = arr.map(e=>e.replace('10.101.', ''));
        return (arrn.length>limit?[...arrn.slice(0,limit),'+ '+(arrn.length-limit)+'nodes']:arrn).join(', ')
    }
    master.loadingFunc = function(_){onLoadingFunc = _;return master;};
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
        debugger
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
    master.graph = function() {
        return {nodes,links:_links};
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
//     function mouseover(d){
//         console.time('mouseover')
//         if (!isFreeze) {     // Bring to front
//             console.time('calculate related node!')
//             // if (!d.relatedNode){
//             //     const nodematch = {};
//             //     const match = graph_.links.filter(l=>l.target.name===d.source.name || l.target.name===d.source.name);
//             //     match.forEach(d=>{if (d.source.node) nodematch[d.source.name] = d.source.node});
//             //     // d.relatedNode = match
//             //     //     .map(l=>l.node);
//             //     d.relatedNode = match.map(l=>l.source.node);
//             // }
//             //
//             // d.relatedNode.forEach(e=>{if (e) e.classed('highlightText', true)});
//             console.timeEnd('calculate related node!')
//             g.selectAll('.'+d._class).style('opacity',1);
//             master.mouseover.forEach(f=>f(d));
//             // master.updateTimeHandle(d.source.time)
//         }else{
//             g.classed('onhighlight2', true);
//             d3.select(this).classed('highlight2', true);
//             if (d.node) {
//                 d.node.classed('highlight2', true);
//             }
//             d.relatedNode.forEach(e=>e.classed('highlight2', true));
//         }
//         const timeformat = d3.timeFormat('%m/%d/%Y %H:%M');
//         tooltip.show(`<h5>10.101.${compressName(d.arr)}</h5><div class="container"><div class="row"><table class="col-5"><tbody>
// <tr><th colspan="2">${timeformat(d.source.time)}</th></tr>${d._source.map(e=>`<tr><th>${e.key}</th><td>${e.value}</td></tr>`).join('')}</tbody></table>
// <div class="col-2">-></div><table class="col-5"><tbody><tr><th colspan="2">${timeformat(d.target.time)}</th></tr>${d._target.map(e=>`<tr><th>${e.key}</th><td>${e.value}</td></tr>`).join('')}</tbody></table></div></div>`);
//         console.timeEnd('mouseover')
//     }
    function mouseover(d){
        console.time('mouseover')
        g.selectAll('.'+d._class).style('opacity',1);
        master.mouseover.forEach(f=>f(d));
        let timeformat = d3.timeFormat('%m/%d/%Y %H:%M');
        tooltip.show(`<h5>10.101.${compressName(d.arr)}</h5><div class="container"><div class="row"><table class="col-5"><tbody>
        <tr><th colspan="2">${timeformat(d.source.time)}</th></tr>${d._source.map(e=>`<tr><th>${e.key}</th><td>${e.value}</td></tr>`).join('')}</tbody></table>
        <div class="col-2">-></div><table class="col-5"><tbody><tr><th colspan="2">${timeformat(d.target.time)}</th></tr>${d._target.map(e=>`<tr><th>${e.key}</th><td>${e.value}</td></tr>`).join('')}</tbody></table></div></div>`);
        console.timeEnd('mouseover')
    }
    let filterKey=[];
    master.highlight = function(listKey){
        filterKey = listKey
        let listobj = {};
        listKey.forEach(k=>listobj[k]=true);

        g.selectAll('.'+filterKey.map(k=>str2class(getUserName([{key:k}]))).join(',.')).style('opacity',1);
    };
    master.releasehighlight = function(){
        g.selectAll('.'+filterKey.map(k=>str2class(getUserName([{key:k}]))).join(',.')).style('opacity',null);
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
            // d.relatedNode.forEach(e=>{if (e) e.classed('highlightText', false)});
            g.selectAll('.'+d._class).style('opacity',null);
            master.mouseout.forEach(f=>f(d));
            // master.updateTimeHandle()
        }else{
            g.classed('onhighlight2', false);
            d3.select(this).classed('highlight2', false);
            if (d.node) {
                d.node.classed('highlight2', false);
            }
            d.relatedNode.forEach(e=>e.classed('highlight2', false));
        }
        tooltip.hide()

    }

    return master;
};
