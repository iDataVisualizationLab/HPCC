// plugin
d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};


// setting
let tooltip = d3.tip().attr('class', 'd3-tip').html(function (d){return `<span>${d}</span>`})
let graphicopt = {
    margin: {top: 40, right: 40, bottom: 80, left: 80},
    width: window.innerWidth,
    height: window.innerHeight,
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
    "diameter": function(){return Math.min(this.widthG(),this.heightG())},
    color:{},
    animationTime:500,
    displayThreshold: 4000,
    radaropt : {
        r:40,
        padding:0.1
    }
};

let isFreeze= false;
let highlight2Stack = [];
let vizservice=[];
function initdraw(){
    $('.informationHolder').draggable({ handle: ".card-header" ,containment: "parent", scroll: false });
    d3.select('#userSort').on('change',function(){
        currentDraw(serviceSelected);
    });
    d3.select('#innerDisplay').on('change',function(){
        d3.selectAll('.innerName').text(getInnerNodeAttr())
        currentDraw(serviceSelected);
    });
    d3.select('#sort_apply').on('click',function(){
        sortData();
        currentDraw(serviceSelected)
    })
}
function closeToolTip(){
    d3.select('.informationHolder').classed('hide',true);
}
function getUsersort(){
    return $('#userSort').val()
}
function getInnerNodeAttr(){
    return $('#innerDisplay').val()
}
let userColor = d3.scaleOrdinal(d3.schemeCategory20);
function draw({solution,feature}){
    graphicopt.radaropt.schema = feature;
    isFreeze= false;
    graphicopt.width = document.getElementById('circularLayoutHolder').getBoundingClientRect().width;
    graphicopt.height = document.getElementById('circularLayoutHolder').getBoundingClientRect().height;
    graphicopt.displayThreshold = graphicopt.widthG()*graphicopt.heightG()/100;
    forceColider = d3.forceSimulation()
        .alphaDecay(0.005)
        .alpha(0.1)
        .force('charge', d3.forceManyBody())
        .force("link", d3.forceLink())
        .force('collide', d3.forceCollide().radius(d=>d.maxRadius).iterations(10))
        .on('tick', function () {
            onode.attr("transform", function(d) { return `translate(${d.x},${d.y})`; })
        })
    //color
    const colorItem = d3.scaleOrdinal(colorScaleList.plotlyCategory).domain(feature.map(d=>d.text));
    //symbol
    let createRadar = _.partial(createRadar_func,_,_,_,_,'radar',graphicopt.radaropt,colorItem);

    // init svg
    let svg_ = d3.select('#circularLayout')
        .attr("width", graphicopt.width)
        .attr("height", graphicopt.height)
        .style('overflow','visible');
    let svg = svg_
        .select("g.content");
    function zoomed(){
        svg.attr("transform", d3.event.transform);
        svg.selectAll('g.label text')
            .attr('transform',`scale(${1/d3.event.transform.k})`)
            .attr('opacity', function(d) {
                    if (d3.event.transform.k > d.label.scaleThreshold) {
                    return d.label.opacityScale(d3.event.transform.k);
                }
                return 0;
            });
    }
    let isFirst = false;
    let gaxis = svg.select('g.axis');
    if (svg.empty()){
        svg = d3.select('#circularLayout')
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
        gaxis = svg.append('g').attr('class','axis');
        let gaxisx = gaxis.append('g').attr('class','axisXg');
        gaxisx.append('g').attr('class','axisX');
        gaxisx.append('text').attr('class','axisX');
        let gaxisy = gaxis.append('g').attr('class','axisYg');
        gaxisy.append('g').attr('class','axisY');
        gaxisy.append('text').attr('class','axisY');
        gaxis.append('g').attr('class','axisFeature');
        gaxis.append('defs');
        svg.call(tooltip);
        isFirst = true;
    }

    // scale
    let {xscale,yscale} =  getScale(solution)
    let {renderFunc,innerscale} = getRenderFunc(feature);
    gaxis.select('g.axisXg').attr('transform',`translate(0,${yscale.range()[1]})`).select('g.axisX').call(d3.axisBottom(xscale));
    gaxis.select('g.axisXg').select('text.axisX').text('PC1')
        .style('font-weight','bold').style('text-anchor','middle')
        .attr('transform',`translate(0,${30})`);
    gaxis.select('g.axisYg').attr('transform',`translate(${xscale.range()[0]},0)`).select('g.axisY').call(d3.axisLeft(yscale));
    gaxis.select('g.axisYg').select('text.axisY').text('PC2').style('font-weight','bold').style('text-anchor','middle')
        .attr('transform',`translate(-30,0) rotate(-90)`);
    gaxis.select('defs')
        .selectAll('marker').data(colorItem.domain())
        .join('marker')
        .attr('id', d=>'arrow'+fixName2Class(d))
        .attr("refX", 6)
        .attr("refY", 6)
        .attr("markerWidth", 30)
        .attr("markerHeight", 30)
        .attr("orient", "auto")
            .selectAll('path').data(d=>[d])
            .join("path")
        .attr("d", "M 0 0 12 6 0 12 3 6")
        .style("fill", d=>colorItem(d));

    let multiplyBrands = Math.sqrt(d3.max([
        distance([xscale(0),yscale(0),xscale.range()[0],yscale.range()[0]]),
        distance([xscale(0),yscale(0),xscale.range()[0],yscale.range()[1]]),
        distance([xscale(0),yscale(0),xscale.range()[1],yscale.range()[0]]),
        distance([xscale(0),yscale(0),xscale.range()[1],yscale.range()[1]]),
    ])/d3.max(feature.map(d=>d.pca),d=>distance([xscale(0),yscale(0),xscale(d[0]),yscale(d[1])])));
    debugger
    function distance(d){
        return Math.sqrt((d[2]-d[0])*(d[2]-d[0])+(d[3]-d[1])*(d[3]-d[1]));
    }
    svg.select('g.axisFeature')
        .selectAll('.line')
        .data(feature.map(d=>d.pca))
        .join('line')
        .attr('class', d=>'line item '+fixName2Class(d.name))
        .attr('x1', function (d) {
            return xscale(0)
        })//x(-d.pc1);})
        .attr('y1', function (d) {
            return yscale(0)
        })//y(-d.pc2); })
        .attr("x2", function (d) {
            return xscale(d[0]*multiplyBrands);
        })
        .attr("y2", function (d) {
            return yscale(d[1]*multiplyBrands);
        })
        .style("stroke", function (d) {
            return colorItem(d.name);
        })
        .attr('marker-end', d=>`url(#arrow${fixName2Class(d.name)})`)
        .attr("opacity",0.7)
        .style("stroke-width", '1px');

    graphicopt.el = svg;
    // data
    var cellsLabel = d3.Delaunay.from(solution.map(d=>{temp = [xscale(d[0]),yscale(d[1])];
        temp.name = d.name;
        return temp}))
        .voronoi([-graphicopt.widthG()/2, -graphicopt.heightG()/2, graphicopt.widthG()/2, graphicopt.heightG()/2]);
    const arr = solution.map(function(d, i) {
        d.label = {};
        d.label.scaleThreshold = Math.sqrt(graphicopt.displayThreshold / Math.abs(d3.polygonArea(cellsLabel.cellPolygon(i))));
        d.label.opacityScale = d3.scaleLinear()
            .domain([d.label.scaleThreshold, d.label.scaleThreshold * 1.3])
            .range([0, 1]);
        d.x = xscale(d[0]);
        d.y = yscale(d[1]);
        d.posStatic = {x:d.x,y:d.y};
        d.relatedLinks = [];
        d.relatedNodes = [];
        d.maxRadius = d3.max(d.metrics,e=> innerscale(e.value));
        d.data={};
        d.tooltip = ''
        return d;
    });

    if(isFirst){
        let startZoom = d3.zoomIdentity;
        startZoom.x = graphicopt.centerX();
        // startZoom.x = graphicopt.margin.left+graphicopt.diameter()/2+max_radius+34;
        startZoom.y = graphicopt.centerY();
        svg.call(graphicopt.zoom.transform, d3.zoomIdentity);
    }


    // Append outer nodes (circles)
    let onodesg = svg.select("g.outer_nodes");
    if(onodesg.empty()){
        onodesg = svg.append("g").attr("class", "outer_nodes")
    }
    let onode = onodesg.selectAll(".outer_node")
        .data(arr,d=>d.name);
    onode.call(updateOnode);
    onode.exit().remove();
    let onode_n = onode.enter().append("g")
        .attr("class", "outer_node");
    onode_n.append('g').attr('class','circleG');
    onode_n.append('g').attr('class','glowEffect');
    onode_n.append('g').attr('class','label')
        .attr('class','label')
        .style("font", "10px sans-serif")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle");

    onode_n.attr("transform", function(d) { return `translate(${d.x},${d.y})`; }).call(updateOnode);
    function updateOnode(p){

        p.each(function(d){
          d.node=d3.select(this);
          d.childrenNode = makecirclepacking(d.node);
        });
        p.interrupt().transition().duration(graphicopt.animationTime).attr("transform", function(d) { return `translate(${d.x},${d.y})`; });
        return p;
    }
    onode = onode_n.merge(onode)

    makelegend();
    startCollide();
    function startCollide() {
        forceColider.alpha(0.1).force('collide').radius(function(d){return d.maxRadius}).iterations(10);
        forceColider.nodes(arr);
        updateforce();
        forceColider.restart()
    }
    function updateforce(){
        count = 0;
        forceColider.force('tsne', function (alpha) {
            if (alpha<0.07||count>100) {
                forceColider.alphaMin(alpha);
                forceColider.stop();
                return;
            }else {
                arr.forEach((d, i) => {
                    d.fx = null;
                    d.fy = null;
                    d.x += alpha * (arr[i].posStatic.x - d.x);
                    d.y += alpha * (arr[i].posStatic.y - d.y);
                });
            }
            count++;
        });
    }
    function makecirclepacking(svg) {
            let childrenNode = {};
            node = svg.call(updateNode);

            label = svg.select("g.label")
                .selectAll("text")
                .data(d=>[d]);
            label.exit().remove();
            label = label.enter().append('text')
                .style('font-size', '10px')
                .text(d => d.name).merge(label)
                .attr('transform',`scale(${1/1})`)
                .attr('opacity', function(d) {
                    return d.label.opacityScale(1);
                });
            label.each(function(d){
                d.tooltip = d3.select(this);
            })
            // label.call(textcolor);
            label.style('fill','#000').style('text-shadow','#fff 1px 1px 0px');

            updateShape()
            return childrenNode;
            function updateNode(node) {
                node
                    // .attr("pointer-events", d => !d.children ? "none" : null)
                    .on('click',function(d){d3.select(this).dispatch('mouseover'); freezeHandle.bind(this)();userTable(d,'compute');})
                    .on("mouseover", function(d){mouseover.bind(this)(d)})
                    .on("mouseout", function(d){mouseout.bind(this)(d)})
                    .style('filter',d=>d.highlight?`url(#${'c'+d.currentID}`:null)

                return node;

        }


        function updateShape() {
            //
            node.interrupt().transition().duration(graphicopt.animationTime).attr("transform", d => `translate(${d.x},${d.y})`);
            node.select('g.circleG').selectAll('path')
                .data(d=>d.metrics,d=>d.key)
                .join('path').attr('class',d=>'item '+fixName2Class(d.key)).attr('d',renderFunc)
                .style('fill',d=>colorItem(d.key));
        }
    }
    function getRenderFunc(feature){
        let innerscale = d3.scaleLinear()
            .range([graphicopt.radaropt.r*graphicopt.radaropt.padding,graphicopt.radaropt.r])
            .domain(feature[0].range);
        let startAngle = d3.scaleBand().domain(feature.map(d=>d.text))
            .range([0,Math.PI*2]);
        let w = startAngle.bandwidth()/2;
        return {renderFunc:d3.arc()
            .innerRadius(innerscale.range()[0])
            .outerRadius(d=>innerscale(d.value))
            .startAngle(d=>startAngle(d.key)-w)
            .endAngle(d=>startAngle(d.key)+w),innerscale};
    }
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
    function userTable(d,type){
        if (isFreeze) {
            d3.select('.informationHolder').classed('hide',false);
            const contain = d3.select('.informationHolder').datum(d);
            contain.select('.card-header p').text(d => type.toUpperCase()+': ' + (type==='compute'?d.name:d.key));
            contain.select('.card-body').html(`<table id="informationTable" class="display table-striped table-bordered" style="width:100%">
                <thead>
                    <tr>
                        <th>JobID</th>
                        <th>JobName</th>
                        <th>User</th>
                        <th>StartTime</th>
                        <th>Duration</th>
                        <th>Cores</th>
                        <th>Nodes</th>
                        <th>TaskID</th>
                    </tr>
                </thead>
            </table>`);
            let jobData = [];
            if (type==='user')
                jobData = d.value.job.map(j=>{
                    const jobID = j.split('.');
                    const job=_.clone(jobs[j]);
                    job['id']=jobID[0];
                    job['duration']=currentTime - job['start_time'];
                    job['task_id'] = jobID[1]||'n/a';
                    return job});
            else
                jobData = _.flatten(d.relatedNodes
                    .map(e=>e.value.job)).map(j=>{
                    const jobID = j.split('.');
                    const job=_.clone(jobs[j]);
                    if (job.node_list.indexOf(d.name)===-1)
                        return false;
                    job['id']=jobID[0];
                    job['duration']=currentTime - job['start_time'];
                    job['task_id'] = jobID[1]||'n/a';
                    return job}).filter(d=>d);
            var table = $('#informationTable').DataTable( {
                "data": jobData,
                "scrollX": true,
                "columns": [
                    { "data": "id" },
                    { "data": "job_name" },
                    { "data": "user_name" },
                    { "data": "start_time" ,
                        "render": function ( data, type, row ) {
                            if(type!=='ordering')
                                return d3.timeFormat('%m/%d/%Y %H:%M')(new Date(data));
                            return data;
                        }},
                    { "data": "duration",
                        "render": function ( data, type, row ) {
                            if(type!=='ordering')
                                return millisecondsToStr_axproximate(data);
                            return data;
                        }},
                    { "data": "cpu_cores" },
                    { "data": "node_list" ,"className":'details-control text-wrap',
                        "render": function ( data, type, row ) {
                            if(type==='ordering')
                                return data.length;
                            if (type==='display')
                                if (data.length>2)
                                    return `<span>${(row.isexpand?data: data.slice(0,2)).map(e=>`<span class="tableCompute">${e}</span>`).join('\n')}</span>
                                        <button type="button" class="btn btn-block morebtn" value="open">${data.length-2} more</button>
                                        <button type="button" class="btn btn-block morebtn" value="close">
                                        <img src="src/style/icon/caret-up-fill.svg" style="height: 10px"></img>
                                        </button>`;
                                else
                                    return data.map(e=>`<span class="tableCompute">${e}</span>`).join('\n');
                            return data;
                        }},
                    { "data": "task_id" },
                ],
                "order": [[0, 'asc']],
                "drawCallback": function( settings ) {
                    // Add event listener for opening and closing details
                    $('#informationTable tbody').on('mouseover', 'tr, .tableCompute', function (event) {
                        event.stopPropagation();
                        highlight2Stack.forEach(n=>n.classed('highlight2',false))
                        highlight2Stack = [];
                        let tr = $(this).closest('tr');
                        let row = table.row( tr );
                        d3.select(tr[0]).style('font-weight','unset');
                        d3.select(this).style('font-weight','bold');
                        const isSingle =  d3.select(event.target).classed('tableCompute')
                        if (row.data()) {
                            const currentData = row.data();
                            svg.classed('onhighlight2', true);
                            (isSingle? [d3.select(event.target).text()]:currentData.node_list).forEach(c => {
                                rack_arr.find(r => {
                                    if (r.childrenNode[c]) {
                                        highlight2Stack.push(r.childrenNode[c]);
                                        highlight2Stack.push(r.childrenNode[c].datum().tooltip);
                                        r.childrenNode[c].datum().tooltip.classed('highlight2', true);

                                        r.childrenNode[c].classed('highlight2', true);
                                        r.childrenNode[c].datum().relatedLinks.forEach(d=>{
                                            if (d.datum().source===currentData[innerKey]){
                                                highlight2Stack.push(d);
                                                d.classed('highlight2',true);
                                            }
                                        });
                                        return true;
                                    }
                                });
                            });
                            users_arr.find(u => {
                                if (u.key===currentData[innerKey]) {
                                    highlight2Stack.push(u.node);
                                    u.node.classed('highlight2', true);
                                    return true;
                                }
                            });
                        }
                    }).on('mouseleave', 'tr, .tableCompute', function () {
                        let tr = $(this).closest('tr');
                        d3.select(this).style('font-weight','unset');
                        svg.classed('onhighlight2',false);
                        highlight2Stack.forEach(n=>n.classed('highlight2',false));
                        highlight2Stack = [];
                    });
                }
            } );

            $('#informationTable tbody').on('click', 'td button.morebtn', function () {
                var tr = $(this).closest('tr');
                var row = table.row( tr );

                if ( d3.select(this).attr('value')==='open' ) {
                    row.data().isexpand = true;
                    d3.select(tr[0]).classed('shown',true)
                        .select('span').html(row.data().node_list.map(e=>`<span class="tableCompute">${e}</span>`).join('\n'));
                }
                else {
                    // Open this row
                    row.data().isexpand = false;
                    d3.select(tr[0]).classed('shown',false)
                        .select('span').html(row.data().node_list.slice(0,2).map(e=>`<span class="tableCompute">${e}</span>`).join('\n'));
                }
            });
        }else
            d3.select('.informationHolder').classed('hide',true);
    }
    function makelegend(){

        d3.select('.clusterView').classed('hide',true);
        const color = colorItem;
        const marginTop = 10;
        const marginBottom = 10;
        const marginLeft = 40;
        const marginRight = 0;
        const width = 100;
        const innerW = 10;
        const innerH = 10;
        const innerPadding = innerH*0.5;
        const height = feature.length*(innerH+innerPadding);
        const legendHolder = d3.select('.legendView').classed('hide',false);

        const svg = legendHolder.select('svg.legend')
            .attr('width', width + marginLeft + marginRight)
            .attr('height', height + marginTop + marginBottom);
        svg.select('g.legend').remove();
        let legend = svg.append('g').attr('class', 'legend')
            .attr('transform', `translate(${marginLeft},${marginTop})`);
        // .attr('transform',`translate(${Math.min(graphicopt.diameter()+max_radius+40+graphicopt.margin.left,graphicopt.width-graphicopt.margin.right)},${graphicopt.margin.top+30})`);
        let yscale = d3.scaleLinear().domain([0,feature.length-1]).range([innerH/2,height-innerH/2]);
        legend.selectAll('rect').data(d=>feature).join('rect')
            .attr('class',d=>'item '+fixName2Class(d.text))
            .attr('y',(d,i)=>yscale(i)-innerH/2).attr('width',innerW).attr('height',innerH)
            .attr('fill',d=>color(d.text))
            .style('pointer-events','all')
            .on('mouseover',function(d){hightlight(d.text)})
            .on('mouseout',function(d){unhightlight()});
        legend.selectAll('text.legendLabel').data(d=>feature).join('text')
            .attr('class',d=>'legendLabel item '+fixName2Class(d.text))
            .attr('x',innerW+2).attr('y',(d,i)=>yscale(i))
            .attr('dy','0.5rem')
            .text(d=>d.text)
            .style('pointer-events','all')
            .on('mouseover',function(d){hightlight(d.text)})
            .on('mouseout',function(d){unhightlight()});

    }

    function hightlight(axisName){
        svg.classed('onhighlight',true);
        d3.select('.legendView').classed('onhighlight',true);
        d3.selectAll('.'+fixName2Class(axisName)).classed('highlight',true);
    }
    function unhightlight(){
        svg.classed('onhighlight',false);
        d3.select('.legendView').classed('onhighlight',false);
        d3.selectAll('.highlight').classed('highlight',false);
    }
}
function textcolor(p){
    return p.style('fill',d=>{
        if(d.children)
            return '#ffffff';
        else
            return invertColor(d.color,true);
    }).style('text-shadow',function(d){
        if(d.children)
            return '#000000'+' 1px 1px 0px';
        else
            return invertColor(invertColor(d.color,true),true)+' 1px 1px 0px';
    })
}
function invertColor(hex, bw) {
    try {
        const color = d3.color(hex)
        var r = color.r,
            g = color.g,
            b = color.b;
        if (bw) {
            // http://stackoverflow.com/a/3943023/112731
            return (r * 0.299 + g * 0.587 + b * 0.114) > 186
                ? '#000000'
                : '#FFFFFF';
        }
        // invert color components
        color.r = (255 - r);
        color.g = (255 - g);
        color.b = (255 - b);
        // pad each with zeros and return
    }catch(e){
        return 'none'
    }
    return color.toString();
}



let nest = function (seq, keys) {
    if (!keys.length)
        return seq;
    let first = keys[0];
    let rest = keys.slice(1);
    return _.mapValues(_.groupBy(seq, first), function (value) {
        return nest(value, rest)
    });
};

function pack (data){
    return d3.pack()
        .size([graphicopt.diameter()/5*3, graphicopt.diameter()/5*3])
        .padding(3)
        (d3.hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value))
}

function mouseover(d){
    if (!isFreeze)
   {     // Bring to front
        graphicopt.el.classed('onhighlight',true);
        d3.selectAll('.links .link').sort(function(a, b){ return d.relatedLinks.indexOf(a.node); });
        d3.select(this).classed('highlight', true);
        if (d.node){
            d.node.classed('highlight', true);
        }
        // for (let i = 0; i < d.relatedNodes.length; i++)
        // {
        //     if (d.relatedNodes[i].key)
        //         try {
        //             d.relatedNodes[i].childrenNode[d.relatedNodes[i].key].classed('highlight', true);
        //         }catch(e){
        //             console.log(d.relatedNodes[i].key)
        //         }
        //     else {
        //         d.relatedNodes[i].node.classed('highlight', true);
        //
        //     }
        //     // .attr("width", 18).attr("height", 18);
        // }
        //
        // for (let i = 0; i < d.relatedLinks.length; i++){
        //     d.relatedLinks[i].moveToFront().classed('highlight', true);
        // }
       }
    if (d.tooltip) {
        tooltip.show(`(${d3.format('.2f')(d[0])},${d3.format('.2f')(d[1])})`)
    }
}
function getScale(sol){
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
    const extentX =  xrange.map(xscale);
    extentX[0] = extentX[0]-graphicopt.radaropt.r/2;
    extentX[1] = extentX[1]+graphicopt.radaropt.r/2;
    const extentY =  yrange.map(yscale);
    extentY[0] = extentY[0]-graphicopt.radaropt.r/2;
    extentY[1] = extentY[1]+graphicopt.radaropt.r/2;
    xscale = xscale.copy().domain(extentX.map(xscale.invert)).range(extentX)
    yscale = yscale.copy().domain(extentY.map(yscale.invert)).range(extentY)
    return {xscale,yscale}
}

function mouseout(d){
    if(!isFreeze)
        {
            graphicopt.el.classed('onhighlight',false);
            d3.select(this).classed('highlight', false);
            if(d.node){
                d.node.classed('highlight', false).classed('highlightSummary', false);
            }
        // for (let i = 0; i < d.relatedNodes.length; i++)
        // {
        //     if (d.relatedNodes[i].key)
        //         try {
        //             d.relatedNodes[i].childrenNode[d.relatedNodes[i].key].classed('highlight', false);
        //         }catch(e){
        //
        //         }
        //     else
        //         d.relatedNodes[i].node.classed('highlight', false);
        //     // .attr("width", config.rect_width).attr("height", config.rect_height);
        // }
        //
        // for (let i = 0; i < d.relatedLinks.length; i++){
        //     d.relatedLinks[i].classed("highlight", false );
        // }
        }
    if (d.tooltip) {
        tooltip.hide()
    }
}

function angle2position(angle,radius){
    return [Math.sin(angle/180*Math.PI)*radius,-Math.cos(angle/180*Math.PI)*radius];
}

function circlePath(cx, cy, r){
    return 'M '+cx+' '+cy+' m -'+r+', 0 a '+r+','+r+' 0 1,0 '+(r*2)+',0 a '+r+','+r+' 0 1,0 -'+(r*2)+',0';
}

