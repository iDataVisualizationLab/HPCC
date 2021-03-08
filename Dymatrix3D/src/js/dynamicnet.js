let DynamicNet = function(){
    let tooltip = d3.tip().attr('class', 'd3-tip').html(function (d){return `<span>${d}</span>`})
    let graphicopt = {
        margin: {top: 20, right: 20, bottom: 20, left: 20},
        width: 1050,
        height: 650,
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

    let maindiv='#dynamicHolder';
    var color = d3.scaleSequential()
        .interpolator(d3.interpolateSpectral);
    let getColorScale = function(){return color};
    let isFreeze= false;
    let data=[],dynamicVizs=[];
    let onFinishDraw = [];
    let getRenderFunc = function(d){
        debugger
        if (d.d){
            return d.d;
        }else
            return d3.arc()
                .innerRadius(0)
    };
    let getDrawData = function(){return[];}
    let master={};
    let simulations;
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
    const compareMode = true;
    master.draw = function() {
        debugger
        // compare net

        const t0 = performance.now();
        d3.select(maindiv).selectAll('*').remove();
        debugger
        const nodeObjs = data.root_nodes;
        const linkObjs = {};
        const deletedLinksObjs = {};
        data.net.forEach(n=>{
            n.nodes.forEach(n=>{
                nodeObjs[n.id]=n.parent;
                nodeObjs[n.id].tooltip = n.id
            });
            n.links.forEach(l=> {
                if ((!linkObjs[l.source + l.target])||l.isNew)
                    linkObjs[l.source + l.target] = l;
            });
            (n.deletedLinks??[]).forEach(l=> {
                deletedLinksObjs[l.source + l.target] = l;
            });
        });
        // const nodes = data.root_nodes;
        const nodes = Object.values(nodeObjs);
        const links = Object.values(linkObjs);
        const dataTotal = {nodes,links,deletedLinks:Object.values(deletedLinksObjs),ti:0}
        d3.select(maindiv).selectAll('svg.dynamicSVg')
            .data([dataTotal])
            .join('svg')
            .attr('class','dynamicSVg')
            .style('border','1px solid black')
            .each(function(net){
                const netControl = new DynamicNetViz().graphicopt(graphicopt).getRenderFunc(getRenderFunc).getDrawData(getDrawData);
                dynamicVizs.push(netControl);
                const div = this;
                const force = d3.forceSimulation()
                    .force("charge", d3.forceManyBody().strength(-10))
                    .force("link", d3.forceLink().id(d => d.id))
                    .on("tick", ticked)
                    .on('end',()=>{
                        console.timeLog('Force dynamic: ')
                    });
                netControl.init({div,force}).data({nodes:net.nodes,links:net.links,deletedLinks:net.deletedLinks,ti:net.ti});
                // netControl.init({div,force}).data({nodes:net.nodes.map(d=>d.parent),links:net.links,deletedLinks:net.deletedLinks,ti:net.ti});
                netControl.draw();
                function ticked() {
                    const alpha = force.alpha();
                    // console.log(alpha)
                    // if (alpha<0.001){
                    //     d3.select('.navbar-brand').text(performance.now()-t0)
                    //     force.stop();
                    // }
                    netControl.ticked();
                }
            });




            onFinishDraw.forEach(d=>d({}));
    };

    master.main_svg = function(){return main_svg};
    master.init=function(){
        // graphicopt.width = d3.select(maindiv).node().getBoundingClientRect().width;
        // graphicopt.height = d3.select(maindiv).node().getBoundingClientRect().height;
            dynamicVizs = [];
            simulations = [];
        return master
    };
    master.resetZoom = function(){
        graphicopt.zoom.transform(main_svg, d3.zoomIdentity);
    };
    function drag4Force(){
        function dragstarted(d) {
            d._x = d.x;
            d._y = d.y;
            d._mirror = $(d._el).clone(true)[0];
            document.body.appendChild(d._mirror)
            g.select('.network').style('pointer-events','none');
            const pos = this.getBoundingClientRect();
            d3.select(d._mirror).classed('gu-mirror',true).style('left',pos.left+'px').style('top',pos.top+'px');
            _drake.start(d._mirror);
            d3.select(this).attr('opacity',0)
        }

        function dragged(d) {
            d._x = d3.event.x;
            d._y = d3.event.y;
            // d3.select(this).attr('transform',d=>`translate(${d._x-d.width/2},${d._y-d.height/2})`)
            d3.select(this).attr('x',d=>d._x-d.width/2)
                .attr('y',d=>d._y-d.height/2);
            const pos = this.getBoundingClientRect();
            const sourcepos = d.source.getBoundingClientRect();
            d3.select(d._mirror).style('left',pos.left+'px').style('top',pos.top+'px');
            d.remove = (pos.left>=sourcepos.left)&&((pos.left)<=(sourcepos.left+sourcepos.width))&&(pos.top>=sourcepos.top)&&((pos.top)<=(sourcepos.top+sourcepos.height));
        }

        function dragended(d) {
            g.select('.network').style('pointer-events','all');
            d3.select(d._mirror).remove();
            if (d.remove){
                d3.select(d._el).style('top',null).style('left',null)
                d.source.appendChild(d._el);
                master.removeForce(d.key);
            }else{
                d.x = d._x;
                d.y = d._y;
                updateForce(d.key,[d.x,d.y]);
                _drake.end();
                d3.select(this).attr('opacity',1);
            }
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }
    let getDataForce = {};
    let _drake = {};
    master.addForce = function ({key,drake,posProp,mode}){
        let _pos = [posProp.x-graphicopt.centerX()-graphicopt.margin.left+posProp.width/2,
            posProp.y-graphicopt.centerY()-graphicopt.margin.top+posProp.height/2
        ];
        _drake = drake;
        const force = g.select('.forces').append('foreignObject')
            .attr('class','forceSvg')
            .datum({key,x:_pos[0],y:_pos[1],width:posProp.width,height:posProp.height,_el:posProp._el,source:posProp.source})
            .attr('x',d=>d.x-d.width/2)
            .attr('y',d=>d.y-d.height/2)
            .attr('width',d=>d.width)
            .attr('height',d=>d.height)
            .call(drag4Force());
        force.node().appendChild(posProp.el)
        // force.html(posProp.outerHTML);
        force.select('.forceDrag').attr('xmlns','http://www.w3.org/1999/xhtml')
            .classed('gu-transit',false)
            .classed('insvg',true)
            .style('display','block').style('top',null).style('left',null);
        if (mode==='metric'){
            const input = force.select('input.threshold');
            const min = +input.attr('min');
            const max = +input.attr('max');
            input.on('change',function(){
                if (getDataForce[key]){
                    const d = force.datum();
                    d3.select(d._el).select('input').node().value = this.value;
                    const val = value2thresh(+this.value,min, max);
                    getDataForce[key].threshold = val;
                    updateForce(key,[d.x,d.y]);
                }
            });
            debugger
            getDataForce[key] = {threshold:value2thresh(+d3.select(posProp.el).select('input').node().value,min,max)};
            const getData = function(d,_pos,index){
                if (data.datamap[d.id]&&data.datamap[d.id][0][posProp._index]>getDataForce[key].threshold){
                    d['force'+key] = true;
                    return _pos[index]
                }
                d['force'+key] = false;
                return 0;
            };
            getDataForce[key].getData=getData;
        }else{
            getDataForce[key] = {};
            const getData = function(d,_pos,index){
                if (Layout.compute_layout[d.id]===key){
                    d['force'+key] = true;
                    return _pos[index]
                }
                d['force'+key] = false;
                return 0;
            };
            getDataForce[key].getData=getData;
        }
        simulation.force(key+"X",d3.forceX().x(d=> getDataForce[key].getData(d,_pos,0)).strength(d=>(d.isolate|| !d['force'+key])?0:0.8));
        simulation.force(key+"Y",d3.forceY().y(d=>getDataForce[key].getData(d,_pos,1)).strength(d=>(d.isolate|| !d['force'+key])?0:0.8));
    }
    function value2thresh(value,min,max){
        return (value-min)/(max-min);
    }
    function updateForce(key,_pos){
        const getData = getDataForce[key].getData;
        simulation.force(key+"X",d3.forceX().x(d=> getData(d,_pos,0)).strength(d=>(d.isolate|| !d['force'+key])?0:0.8));
        simulation.force(key+"Y",d3.forceY().y(d=>getData(d,_pos,1)).strength(d=>(d.isolate|| !d['force'+key])?0:0.8));
        simulation.restart();
    }
    master.removeForce = function (key){
        g.select('.forces').selectAll('.forceSvg').filter(d=>d.key===key).remove();
        node.data().forEach(d=>delete d['force'+key]);
        simulation.force(key+"X",null);
        simulation.force(key+"Y",null);
        delete getDataForce[key];
    };
    master.removeAllForce = function(){
        Object.keys(getDataForce).forEach(master.removeForce);
    };
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
    function highlightItems(d,value){
        if (d.relatedNodes && d.relatedNodes[0].type==='job'){
            d.relatedNodes.forEach(e=> {
                e.node.classed('highlight', value);
                e.relatedLinks.forEach(e=>e.node.classed('highlight', value));
                e.relatedNodes.forEach(e=>e.node.classed('highlight', value));
            })
        }else {
            d.relatedLinks.forEach(e=>e.node.classed('highlight', value));
            d.relatedNodes.forEach(e=>{
                e.node.classed('highlight', value)
            });
        }
    }
    function mouseover(d){
        if (!isFreeze) {     // Bring to front
            g.classed('onhighlight', true);
            highlightItems(d,true)
            d3.select(this).classed('highlight', true);
            if (d.node) {
                d.node.classed('highlight', true);
            }
            master.mouseover.forEach(f=>f(d));
        }
        if (d.tooltip) {
            tooltip.show(d.tooltip)
        }
    }

    master.highlight = function(listKey){
        g.classed('onhighlight', true);
        g.selectAll('.element').filter(d=>listKey.find(e=>e===d.key))
            .classed('highlight', true)
            .each(d=>{
                highlightItems(d,true)
            });
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
            highlightItems(d,false)
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
