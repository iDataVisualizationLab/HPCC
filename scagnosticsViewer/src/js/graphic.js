// plugin
d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};


// setting
let tooltip = d3.tip().attr('class', 'd3-tip').direction('ne').html(function (d){return `<div class="card text-white bg-secondary">
<div class="card-header">
    ${d.header}
  </div>
<div class="card-body">${d.body}</div></div>`})
let graphicopt = {
    margin: {top: 50, right: 0, bottom: 0, left: 100},
    width: window.innerWidth,
    height: window.innerHeight,
    scalezoom: 1,
    zoom:d3.zoom(),
    transform:{k:1,x:0,y:0},
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
    color:{},
    rect:{
        "width": 125,
        "height": 16,
    },
    pack:{
        width:100,
        height:100
    },
    "diameter": function(){return Math.min(this.widthG(),this.heightG())},
    "violin": d3.viiolinChart().graphicopt({width:25,height:50,opt:{dataformated:true},direction:'v',margin: {top: 0, right: 0, bottom: 0, left: 0},tick:{visibile:false}}),
    animationTime:500,
    threshold:0.3,
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
    },scatteropt : {
        margin: {top: 5, right: 5, bottom: 5, left: 5},
        width: 200,
        height: 200,
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
        }
    }
};

let isFreeze= false;
let highlight2Stack = [];
let vizservice=[];
let scaterMatix;
let timelineViolinopt;
let first = true;
function serviceControl(){
    vizservice =scagMetrics.slice();
    if(first){
        timelineViolinopt = timelineViolinopt?? serviceFullList[0].text+"||"+serviceFullList[1].text;
        timelineControl.onViolinSelectionChange.bind(timelineControl)({
            getData:function(d){
                return d[timelineViolinopt].metrics[scagMetrics[serviceSelected].attr]
            }
        });
        first = false;
    }
    d3.select('#serviceSelection')
        .on('change',function(){
            serviceSelected = +$(this).val();
            timelineControl.onViolinSelectionChange.bind(timelineControl)({});
            currentDraw(serviceSelected);
        })
        .selectAll('option')
        .data(vizservice)
        .enter()
        .append('option')
        .attr('value',(d,i)=>i)
        .attr('data-value',(d,i)=>d.text)
        .text(d=>d.text)
    d3.select('#timelineVariable')
        .on('change',function(){
            timelineViolinopt = $(this).val();
            timelineControl.onViolinSelectionChange.bind(timelineControl)({});
            currentDraw(serviceSelected);
        })
        .selectAll('option')
        .data(Layout.scagpair)
        .enter()
        .append('option')
        .attr('checked',d=>d===timelineViolinopt?'':null)
        .attr('value',d=>d)
        .attr('data-value',d=>d)
        .text(d=>d)
}
function initdraw(){
    $('.informationHolder').draggable({ handle: ".card-header" ,containment: "parent", scroll: false });
    scaterMatix = d3.scatterMatrix().canvasContainer($('d3fc-canvas')[0]).init();

    // d3.select('#userSort').on('change',function(){
    //     currentDraw(serviceSelected);
    // });
    // d3.select('#sort_apply').on('click',function(){
    //     sortData();
    //     currentDraw(serviceSelected)
    // })
}
function getUsersort(){
    return $('#userSort').val()
}
function draw(computers,jobs,users,sampleS,currentTime,serviceSelected){
    serviceControl();

    isFreeze= false;
    graphicopt.width = document.getElementById('matrixLayoutHolder').getBoundingClientRect().width;
    graphicopt.height = document.getElementById('matrixLayoutHolder').getBoundingClientRect().height;
    const serviceName = vizservice[serviceSelected].attr;
    // let _colorItem = d3.scaleSequential()
    //     // .interpolator(d3.interpolateSpectral);
    //     .interpolator(d3.interpolateRdYlBu);
    let _colorItem = d3.scaleLinear()
        .range(colorScaleList.scag.slice().reverse())
        .interpolate(d3.interpolateHcl);
    let getOutofRange = ()=>{};
    let getOutofRange_prim = ()=>{};
    getOutofRange = getOutofRange_cont;
    getOutofRange_prim = getOutofRange_prim_cont;

    const range_cal_or = vizservice[serviceSelected].range.slice();
    const range_cal = (vizservice[serviceSelected].filter||vizservice[serviceSelected].range).slice();
    // _colorItem.domain(range_cal.slice().reverse());
    const colorscale_temp = d3.scaleLinear().domain([0,_colorItem.range().length-1]).range(range_cal.slice().reverse())
    _colorItem.domain(_colorItem.range().map((d,i)=>colorscale_temp(i)));

    const colorItem = function(d){
        if (d!==undefined&&d!==null) {
            if (d < range_cal[0] || d > range_cal[1])
                return 'none';
            return _colorItem(d);
        }else
            return '#ffffff';
    };
  
    let svg_ = d3.select('#matrixLayout')
        .attr("width", graphicopt.width)
        .attr("height", graphicopt.height)
        .style('overflow','visible');
    let svg = svg_
        .select("g.content");
    function zoomed(){
        graphicopt.transform =d3.event.transform;
        svg.attr("transform", d3.event.transform);
        scaterMatix.update_size(graphicopt)
    }
    let isFirst = false;
    if (svg.empty()){
        svg = d3.select('#matrixLayout')
            .call(graphicopt.zoom.on("zoom", zoomed))
            .attr("width", graphicopt.width)
            .attr("height", graphicopt.height)
            .append("g")
            .attr('class','content')
            .on('click',()=>{if (isFreeze){
                const func = isFreeze;
                isFreeze = false;
                func();
            }});
        svg.append('g').attr('class','axis');
        svg.call(tooltip);
        isFirst = true;
    }

    graphicopt.el = svg;
    // Set the x scale
    let matrixListSingle = serviceFullList.map(d=>d.text);
    let min_size = Math.min(graphicopt.heightG(),graphicopt.widthG());
    let X = d3.scaleBand()
        .domain(matrixListSingle)
        .padding(0.1)
        .range([0, min_size]);

    // Set the y scale
    let Y = d3.scaleBand()
        .domain(matrixListSingle)
        .padding(0.1)
        .range([0,min_size]);

    const dataoboj = {};
    const datain = d3.entries(Layout.scag).map(function(d, i) {
        if(!dataoboj[d.value.dim[0]])
            dataoboj[d.value.dim[0]] = [];
        dataoboj[d.value.dim[0]].push(d);
        if(!dataoboj[d.value.dim[1]])
            dataoboj[d.value.dim[1]] = [];
        dataoboj[d.value.dim[1]].push(d);
        d.x = X(d.value.dim[0]);
        d.y = Y(d.value.dim[1]);

        d.relatedLinks = [];
        d.relatedNodes = [];
        d.disable = getOutofRange(d.value.metrics);
        d.invalid = getOutofRange_prim(d.value.metrics);
        d.drawData = undefined;
        d.tooltip={
            header:` ${d.key.replace('||',' v.s. ')}`,
            body:`<table class="table table-sm table-striped bg-light" style="margin-bottom: 0">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Name</th>
          <th scope="col">Score</th>
        </tr>
      </thead>
      <tbody>
        ${scagMetrics.map(s=>{
            return `<tr${s.attr===serviceName?' class="font-weight-bold"':''}><td>${s.id+1}</td><td>${s.text}</td><td class="number">${d3.format('.2f')(d.value.metrics[s.attr])}</td></tr>`
        }).join('')}
      </tbody>
    </table>`}
        // d.highlight = Math.abs(scale_prim(d.value.metrics_delta))>graphicopt.threshold;
        return d;
    });
    datain.forEach(d=>d.relatedNodes=datain.filter(e=>(e.value.dim[0]===d.value.dim[0] )|| (e.value.dim[1]===d.value.dim[1])));
    if(isFirst){
        let startZoom = d3.zoomIdentity;
        startZoom.x = graphicopt.margin.left;
        startZoom.y = graphicopt.margin.top;
        svg.call(graphicopt.zoom.transform, d3.zoomIdentity);
    }
    //axis
    svg.select('g.axis').selectAll('text.axisLabel').data(serviceFullList,d=>d.text)
        .join('text').attr('class','axisLabel')
        .attr('x',d=>X(d.text)+5)
        .attr('y',d=>Y(d.text)+Y.bandwidth()-5)
        .text(d=>d.text)
    // Append outer nodes (circles)
    let onodesg = svg.select("g.outer_nodes");
    if(onodesg.empty()){
        onodesg = svg.append("g").attr("class", "outer_nodes")
    }
    // prepare data
    let dataDraw=[];
    scaterMatix.update_size(graphicopt);
    let x_inside = d3.scaleLinear().range([5,X.bandwidth()-5]);
    let y_inside = d3.scaleLinear().range([Y.bandwidth()-5,5]);
    let onode = onodesg.selectAll(".outer_node")
        .data(datain,d=>d.key);
    onode.call(updateOnode);
    onode.exit().remove();
    let onode_n = onode.enter().append("g")
        .attr("class", "outer_node");
    onode_n.append('g').attr('class','scatterplot')
        .append('rect').attr('class','scatterplot');
    onode_n.append('g').attr('class','glowEffect');
    
    onode_n.call(updateOnode);
    function updateOnode(p){
        p.attr("transform", function(d) { return `translate(${d.x},${d.y})`; }).each(function(d){
            d.value.metrics.normalizedPoints.forEach(e=>dataDraw.push({x:d.x+x_inside(e[0]),y:d.y+y_inside(e[1]),data:e.data}))
            d.node=d3.select(this);
        }) .classed('timelineMarker',d=>d.key===timelineViolinopt);
        p.on('click',function(d){d3.select(this).dispatch('mouseover'); freezeHandle.bind(this)();scatterPlot(d)})
            .on('mouseover',mouseover)
            .on('mouseout',mouseout);
        p.select('rect.scatterplot').attr('width',X.bandwidth()).attr('height',Y.bandwidth())
            .style('fill',function(d){
                d.color = colorItem(d.value.metrics[serviceName]);
                return d.color;
            });
        p.select('text.groupLabel')
            .attr("text-anchor", function(d) { return d.x > 0 ? "start" : "end"; })
            .text(function(d) {
                return d.key; });
        p.interrupt().transition().duration(graphicopt.animationTime).attr("transform", function(d) { return `translate(${d.x},${d.y})`; });
        return p;
    }
    scaterMatix.draw(dataDraw);
    makelegend();
    d3.select(self.frameElement).style("height", graphicopt.diameter() - 150 + "px");


    function getOutofRange_cont(e){
        return e[serviceName] < range_cal[0] || e[serviceName] > range_cal[1]
    }
    function getOutofRange_prim_cont(e){
        return (e[serviceName]) && (e[serviceName] < range_cal_or[0] || e[serviceName] > range_cal_or[1]);
    }
    function scale_prim(e){
        return d3.scaleLinear().domain(range_cal_or.map(d=>d-range_cal_or[0]))(e[serviceName]);
    }
    function getDrawData(e) {
        if (serviceName === 'Radar'){
            if (!e.children) {
                let radarvalue = [serviceFullList.map(d=>({axis:d.text,value:d3.scaleLinear().domain(d.range)(e.data.metrics[d.text])||0}))];
                radarvalue[0].name = e.data.metrics['Radar']
                radarvalue.isRadar = true;
                radarvalue.r = e.r*2;
                radarvalue.type = 'radar';
                return radarvalue
            }
            const radarvalue = [{startAngle:0,endAngle:360,r:e.r}];
            radarvalue.type = 'radar';
            return radarvalue
        }else if (serviceName ==='User'){
            if (e.data.relatedNodes.length>1) {
                const data = d3.pie().value(1)(e.data.relatedNodes);
                data.forEach(d => {
                    d.r = e.r;
                    d.color = d.data.data.color;
                });

                return data;
            }
            return [{
                data: {},
                endAngle: 360,
                index: 0,
                padAngle: 0,
                startAngle: 0,
                value: 1,
                r:e.r,
                color: e.data.relatedNodes[0]?e.data.relatedNodes[0].data.color:'unset'
            }]
        }else{
            const dataout =  [{startAngle:0,endAngle:360,r:e.r,invalid: e.data.invalid}];
            return dataout;
        }
    }
    function getRenderFunc(d){
        if (serviceName!=='Radar'|| !d.isRadar)
            return d3.arc()
                .innerRadius(0)
                .outerRadius(d.r * k)(d);
        // else
        //     return _.partial(createRadar)
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
    function scatterPlot(d){
        if (isFreeze) {
            const serviceactive = serviceFullList.filter(s=>d.value.dim.find(dim=>dim===s.text))
            d3.select('.informationHolder').classed('hide',false);
            const contain = d3.select('.informationHolder').datum(d);
            contain.select('.card-header p').text(d => d.key);
            contain.select('.card-body.information').html(d.tooltip.body);
            const opt = graphicopt.scatteropt;
            const scattersvg = contain.select('.card-body.svg').select('svg');
            scattersvg.attr('width',opt.width);
            scattersvg.attr('height',opt.height);
            const x =d3.scaleLinear().range([opt.margin.left,opt.width - opt.margin.right]);
            const y =d3.scaleLinear().range([opt.height - opt.margin.bottom, opt.margin.top]);
            scattersvg.selectAll('rect.background').data([1]).join('rect')
                .attr('class','background')
                .attr('width',opt.width)
                .attr('height',opt.height)
                .attr('stroke','black')
                .attr('fill','#ddd')
            scattersvg.selectAll('circle.point').data(d.value.metrics.normalizedPoints)
                .join('circle')
                .attr('class','point')
                .attr('cx',d=>x(d[0]))
                .attr('cy',d=>y(d[1]))
                .attr('r',3)
                .attr('fill','black')
                .attr('opacity',0.6)
                .on('mouseover',function(e){
                    tooltip.show({header:e.data,body:`<table class="table table-sm table-striped bg-light" style="margin-bottom: 0">
      <thead>
        <tr>
          <th scope="col">Metric</th>
          <th scope="col">Value</th>
        </tr>
      </thead>
      <tbody>
      ${serviceactive.map(s=>`<tr><td>${s.text}</td><td class="number">${sampleS[e.data][serviceListattr[s.idroot]][0][s.id].toLocaleString()}</td></tr>`).join('')}
</tbody>`})
                }).on('mouseout',function(){tooltip.hide()});
            scattersvg.selectAll('circle.outlier').data(d.value.metrics.outlyingPoints)
                .join('circle')
                .attr('class','outlier')
                .attr('cx',d=>x(d[0]))
                .attr('cy',d=>y(d[1]))
                .attr('r',3)
                .attr('fill','none')
                .attr('stroke','red')
                .attr('opacity',0.8)
        }else
            d3.select('.informationHolder').classed('hide',true);
    }
    function makelegend(){
        if (vizservice[serviceSelected].text==='User'){
            d3.select('.legendView').classed('hide',true);
            d3.select('.clusterView').classed('hide',true);
        }else if (vizservice[serviceSelected].text==='Radar'){
            d3.select('.legendView').classed('hide',true);
            d3.select('.clusterView').classed('hide',false);
        }else{
            d3.select('.clusterView').classed('hide',true);
            const color = _colorItem;
            const marginTop = 10;
            const marginBottom = 10;
            const marginLeft = 40;
            const marginRight = 0;
            const width = 10;
            const width_violin = 30;
            const height = 200;
            const legendHolder = d3.select('.legendView').classed('hide',false);
            // legendHolder.style('left', Math.min(d3.zoomIdentity.x + graphicopt.diameter() / 2 + 80, graphicopt.width - graphicopt.margin.right) + 'px');
            // legendHolder.select('.legendView').classed('hide',false);
            const svg = legendHolder.select('svg.legend')
                .attr('width', width + marginLeft + marginRight+width_violin+5)
                .attr('height', height + marginTop + marginBottom);
            svg.select('g.legend').remove();
            let legend = svg.append('g').attr('class', 'legend')
                .attr('transform', `translate(${marginLeft},${marginTop})`);
            // .attr('transform',`translate(${Math.min(graphicopt.diameter()+max_radius+40+graphicopt.margin.left,graphicopt.width-graphicopt.margin.right)},${graphicopt.margin.top+30})`);
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
                if (!y.ticks) {
                    if (tickValues === undefined) {
                        const n = Math.round(ticks + 1);
                        tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
                    }
                    if (typeof tickFormat !== "function") {
                        tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
                    }
                } else {
                    graphicopt.legend = {scale: y};
                    legend.append('g').attr('class', 'legendTick').call(d3.axisLeft(y));
                }
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
                    graphicopt.legend = {scale: y};
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

            // make custom input button
            let legendRange = vizservice[serviceSelected].range;
            let customRange = vizservice[serviceSelected].filter??vizservice[serviceSelected].range.slice();
            let legend_violin = legend.append('g').attr('class', 'violin')
                .attr('transform', `translate(${width},0)`);
            legend.append('clipPath').attr('id','legendClipPath')
                .append('rect').attr('width',width_violin/2).attr('height',height)
            graphicopt.violin.graphicopt({width:width_violin,height:height,customrange:customRange})
                .data([ getHistdata(datain.filter(d=>!d.disable).map(d=>d.value.metrics[serviceName]),serviceName,customRange)])
                .draw(legend_violin)
                .attr('clip-path',"url(#legendClipPath)")
                .select('.laxis').classed('hide',true);

            const groupbtn = legendHolder.select('.btn-group')
            let applybtn = legendHolder.select('#range_apply')
                .on('click', function () {
                    legendRange = customRange.slice();
                    scagMetrics[serviceSelected].filter = customRange.slice();
                    currentDraw(serviceSelected);
                    groupbtn.classed('hide', true);
                });
            let canclebtn = legendHolder.select('#range_reset')
                .on('click', function () {
                    customRange = scagMetrics[serviceSelected].range.slice();
                    rangeo.each(function (d) {
                        $(this).val(customRange[+(d.key === 'upLimit')]);
                    });
                    currentDraw(serviceSelected);
                    groupbtn.classed('hide', true);
                });
            let rangeo = legendHolder.selectAll('input.range')
                .data([{key: 'upLimit', value: legendRange[1]},
                    {key: 'lowLimit', value: legendRange[0]}])
                .attr('value', d => d.value)
                .on('input', function (d) {
                    let index = +(d.key === 'upLimit');
                    customRange[index] = +$(this).val();
                    // if (_.isEqual(customRange, legendRange)) {
                    //     groupbtn.classed('hide', true);
                    // } else {
                        groupbtn.classed('hide', false);
                        if ((index * 2 - 1) * (-customRange[index] + legendRange[index]) < 0) {
                            // wrong input
                            applybtn.attr('disabled', '');
                        } else {
                            if (!(((!index) * 2 - 1) * (-customRange[+!index] + legendRange[+!index]) < 0)) {
                                applybtn.attr('disabled', null);
                            }
                        }
                    // }
                });
        }
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
function projectX(x)
{
    return ((x - 90) / 180 * Math.PI) - (Math.PI/2);
}

function mouseover(d){
    if (!isFreeze)
   {     // Bring to front
        graphicopt.el.classed('onhighlight',true);
        d3.select(this).classed('highlight', true).classed('focus', true);
        if (d.node){
            d.node.classed('highlight', true);
        }
        for (let i = 0; i < d.relatedNodes.length; i++)
        {
            d.relatedNodes[i].node.classed('highlight', true);
        }
   }
    if (d.tooltip) {
        tooltip.show(d.tooltip)
    }
}


function mouseout(d){
    if(!isFreeze)
        {
            graphicopt.el.classed('onhighlight',false);
            d3.select(this).classed('highlight', false).classed('focus', false);
            if(d.node){
                d.node.classed('highlight', false).classed('highlightSummary', false);
            }
        for (let i = 0; i < d.relatedNodes.length; i++)
        {
                d.relatedNodes[i].node.classed('highlight', false);
        }
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

