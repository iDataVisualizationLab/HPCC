// plugin
d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};


// setting
let tooltip = d3.tip().attr('class', 'd3-tip').html(function (d){return `<span>${d}</span>`})
let graphicopt = {
    margin: {top: 50, right: 0, bottom: 0, left: 100},
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
    "oLength": 22,
    "iLength": 22,
    "mid": 11,
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
    }
};

let isFreeze= false;
let highlight2Stack = [];
let vizservice=[];
function serviceControl(){
    vizservice =scagMetrics.slice();
    d3.select('#serviceSelection')
        .on('change',function(){
            serviceSelected = +$(this).val();
            currentDraw(serviceSelected);
        })
        .selectAll('option')
        .data(vizservice)
        .enter()
        .append('option')
        .attr('value',(d,i)=>i)
        .attr('data-value',(d,i)=>d)
        .text(d=>d.text)
}
function initdraw(){
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
    let _colorItem = d3.scaleSequential()
        .interpolator(d3.interpolateSpectral);
    let getOutofRange = ()=>{};
    let getOutofRange_prim = ()=>{};
    getOutofRange = getOutofRange_cont;
    getOutofRange_prim = getOutofRange_prim_cont;

    const range_cal_or = vizservice[serviceSelected].range.slice();
    const range_cal = (vizservice[serviceSelected].filter||vizservice[serviceSelected].range).slice();
    _colorItem.domain(range_cal.slice().reverse());

    const colorItem = function(d){
        if (d) {
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
        svg.attr("transform", d3.event.transform);
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
        svg.append('g').attr('class','axis')
        svg.call(tooltip);
        isFirst = true;
    }

    graphicopt.el = svg;
    // Set the x scale
    let matrixListSingle = serviceFullList.map(d=>d.text);
    let min_size = Math.min(graphicopt.heightG(),graphicopt.widthG());
    let X = d3.scaleBand()
        .domain(matrixListSingle)
        .range([0, min_size]);

    // Set the y scale
    let Y = d3.scaleBand()
        .domain(matrixListSingle)
        .range([0,min_size]);


    const datain = d3.entries(Layout.scag).map(function(d, i) {
        d.x = X(d.value.dim[0]);
        d.y = Y(d.value.dim[1]);

        d.relatedLinks = [];
        d.relatedNodes = [];
        d.disable = getOutofRange(d.value.metrics);
        d.invalid = getOutofRange_prim(d.value.metrics);
        d.drawData = undefined;
        // d.highlight = Math.abs(scale_prim(d.value.metrics_delta))>graphicopt.threshold;
        return d;
    });
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
    let onode = onodesg.selectAll(".outer_node")
        .data(datain,d=>d.key);
    onode.call(updateOnode);
    onode.exit().remove();
    let onode_n = onode.enter().append("g")
        .attr("class", "outer_node");
    onode_n.append('g').attr('class','scatterplot')
        .append('rect').attr('class','scatterplot');
    onode_n.append('g').attr('class','glowEffect');
    
    onode_n.attr("transform", function(d) { return `translate(${d.x},${d.y})`; }).call(updateOnode);
    function updateOnode(p){
        p.each(function(d){
          d.node=d3.select(this);
        });
        p.on('mouseover',function(d){tooltip.show(d)})
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
    makelegend()
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
    function userTable(d,type){
        if (isFreeze) {
            d3.select('.informationHolder').classed('hide',false);
            const contain = d3.select('.informationHolder').datum(d);
            contain.select('.card-header').text(d => type.toUpperCase()+': ' + (type==='compute'?d.data.name:d.key));
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
                jobData = _.flatten(d.data.relatedNodes
                    .map(e=>e.data.value.job)).map(j=>{
                    const jobID = j.split('.');
                    const job=_.clone(jobs[j]);
                    if (job.node_list.indexOf(d.data.name)===-1)
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
                                        highlight2Stack.push(r.childrenNode[c].datum().data.tooltip);
                                        r.childrenNode[c].datum().data.tooltip.classed('highlight2', true);

                                        r.childrenNode[c].classed('highlight2', true);
                                        r.childrenNode[c].datum().data.relatedLinks.forEach(d=>{
                                            if (d.datum().source===currentData.user_name){
                                                highlight2Stack.push(d);
                                                d.classed('highlight2',true);
                                            }
                                        });
                                        return true;
                                    }
                                });
                            });
                            users_arr.find(u => {
                                if (u.key===currentData.user_name) {
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
            const height = 200;
            const legendHolder = d3.select('.legendView').classed('hide',false);
            // legendHolder.style('left', Math.min(d3.zoomIdentity.x + graphicopt.diameter() / 2 + 80, graphicopt.width - graphicopt.margin.right) + 'px');
            // legendHolder.select('.legendView').classed('hide',false);
            const svg = legendHolder.select('svg.legend')
                .attr('width', width + marginLeft + marginRight)
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
            let customRange = legendRange.slice();
            const groupbtn = legendHolder.select('.btn-group')
            let applybtn = legendHolder.select('#range_apply')
                .on('click', function () {
                    legendRange = customRange.slice();
                    serviceFullList[serviceSelected].filter = customRange.slice();
                    currentDraw(serviceSelected);
                    groupbtn.classed('hide', true);
                });
            let canclebtn = legendHolder.select('#range_reset')
                .on('click', function () {
                    customRange = serviceFullList[serviceSelected].range.slice();
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
        d3.selectAll('.links .link').sort(function(a, b){ return d.relatedLinks.indexOf(a.node); });
        d3.select(this).classed('highlight', true);
        if (d.node){
            d.node.classed('highlight', true);
        }
        for (let i = 0; i < d.relatedNodes.length; i++)
        {
            if (d.relatedNodes[i].key)
                try {
                    d.relatedNodes[i].data.childrenNode[d.relatedNodes[i].key].classed('highlight', true);
                }catch(e){
                    console.log(d.relatedNodes[i].key)
                }
            else {
                d.relatedNodes[i].data.node.classed('highlight', true);

            }
            // .attr("width", 18).attr("height", 18);
        }

        for (let i = 0; i < d.relatedLinks.length; i++){
            d.relatedLinks[i].moveToFront().classed('highlight', true);
        }}
    if (d.tooltip) {
        tooltip.show(d.name)
    }
}


function mouseout(d){
    if(!isFreeze)
        {
            graphicopt.el.classed('onhighlight',false);
            d3.select(this).classed('highlight', false);
            if(d.node){
                d.node.classed('highlight', false).classed('highlightSummary', false);
            }
        for (let i = 0; i < d.relatedNodes.length; i++)
        {
            if (d.relatedNodes[i].key)
                try {
                    d.relatedNodes[i].data.childrenNode[d.relatedNodes[i].key].classed('highlight', false);
                }catch(e){

                }
            else
                d.relatedNodes[i].data.node.classed('highlight', false);
            // .attr("width", config.rect_width).attr("height", config.rect_height);
        }

        for (let i = 0; i < d.relatedLinks.length; i++){
            d.relatedLinks[i].classed("highlight", false );
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

