// plugin
d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};


// setting
let graphicopt = {
    margin: {top: 0, right: 0, bottom: 0, left: 0},
    width: window.innerWidth,
    height: window.innerHeight,
    scalezoom: 1,
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
    "mid": 11
};

let isFreeze= false;
function serviceControl(){
    d3.select('#serviceSelection')
        .on('change',function(){
            serviceSelected = +$(this).val();
            currentDraw(serviceSelected);
        })
        .selectAll('option')
        .data(serviceFullList)
        .enter()
        .append('option')
        .attr('value',(d,i)=>i)
        .text(d=>d.text)
}
function draw(computers,jobs,users,sampleS,currentTime,serviceSelected){
    serviceControl()
    isFreeze= false;
    graphicopt.color.title =  serviceFullList[serviceSelected].text;
    graphicopt.width = document.getElementById('circularLayoutHolder').getBoundingClientRect().width;
    graphicopt.height = document.getElementById('circularLayoutHolder').getBoundingClientRect().height;
    let _colorItem = d3.scaleSequential()
        .interpolator(d3.interpolateSpectral);
    _colorItem.domain(serviceFullList[serviceSelected].range.slice().reverse());
    const colorItem = function(d){
        if (d)
            return _colorItem(d);
        else
            // return '#afafaf';
            return '#ffffff';
    };

    let svg_ = d3.select('#circularLayout')
        .attr("width", graphicopt.width)
        .attr("height", graphicopt.height)
        .style('overflow','visible');
    let svg = svg_
        .select("g.content")
        // .attr("transform", "translate(" + graphicopt.centerX() + "," + graphicopt.centerY() + ")")
        .attr("transform", "translate(" + (graphicopt.margin.left+graphicopt.diameter()/2) + "," + graphicopt.centerY() + ")")
        .on('click',()=>{if (isFreeze){
            const func = isFreeze;
            isFreeze = false;
            func();
        }});
    if (svg.empty()){
        svg = d3.select('#circularLayout')
            .attr("width", graphicopt.width)
            .attr("height", graphicopt.height)
            .append("g")
            .attr('class','content')
            // .attr("transform", "translate(" + graphicopt.centerX() + "," + graphicopt.centerY() + ")");
    .attr("transform", "translate(" + (graphicopt.margin.left+graphicopt.diameter()/2) + "," + graphicopt.centerY() + ")")
    }

    graphicopt.el = svg;
    // Set the y scale of rectangles
    graphicopt.iLength = d3.keys(users).length;
    let innerY = d3.scaleLinear()
        .domain([0, graphicopt.iLength])
        .range([-graphicopt.iLength * graphicopt.rect.height/ 2, graphicopt.iLength * graphicopt.rect.height / 2]);

    // Set the x scale of outer nodes
    graphicopt.oLength = Layout.tree.children.length;
    graphicopt.mid = Math.round(graphicopt.oLength/2);
    const deadAngle = 30;
    let outerX = d3.scaleLinear()
        .domain([0, graphicopt.mid-1, graphicopt.mid, graphicopt.oLength-1])
        .range([deadAngle, 180-deadAngle, 180+deadAngle ,360-deadAngle]);


    // Setup the positions of inner nodes
    const users_arr = d3.entries(users).map(function(d, i) {
        d.x = -(graphicopt.rect.width / 2);
        d.y = innerY(i);
        d.relatedLinks = [];
        d.relatedNodes = [];
        return d;
    });

    // Setup the positions of outer nodes
    Layout.tree.children.forEach(d=>d.children.sort((a,b)=>-a.metrics[serviceFullList[serviceSelected].text]+b.metrics[serviceFullList[serviceSelected].text]))
    let pack_all = pack(Layout.tree);
    let max_radius = d3.max(pack_all.children,d=>d.r);
    const rack_arr = Layout.tree.children.map(function(d, i) {
        const pos = angle2position(outerX(i),graphicopt.diameter()/2)
        d.x = pos[0];
        d.y = pos[1]; //- max_radius*2-30;
        const pos_bundle = angle2position(outerX(i),graphicopt.diameter()/2-max_radius-20)
        d.x_bundle = pos_bundle[0];
        d.y_bundle = pos_bundle[1];
        // d.y = outerY(i);
        d.relatedLinks = [];
        d.relatedNodes = [];

        d.pack = pack_all.children.find(c=>c.data.name===d.name);
        d.pack.children.forEach(e=>{
            e.x -= d.pack.x;
            e.y -= d.pack.y;
            e.data.relatedLinks = [];
            e.data.relatedNodes = [];
            e.depth = 1;
        });
        d.pack.x = 0;
        d.pack.y =0;
        d.pack.depth = 0;
        return d;
    });

    // create  links data, including source nodes, target nodes and their positions
    let links = [];

    users_arr.forEach((d, i)=>{
        // links.push({"x": d.x, "y": d.y, "link": d.links })
        d.links = d.value.node.map((c)=>{
            // Layout.compute_layout[v]
            let v = {};
            v.sourceX = d.x;
            v.sourceY = d.y;
            v.source = d.key;
            v.sourceData = d;
            v.target = Layout.compute_layout[c];
            v.targetChildren = c;
            return v;
        });
        d.links.forEach(e=>{
            links.push(e);
        })
        // links.push(d.links);
        return links
    });


    // Create the mapping of target nodes and their positions
    let targetPos = [];
    rack_arr.forEach((d, i)=>{
        targetPos.push({"targetX": d.x, "targetY": d.y,"targetX_bundle":d.x_bundle,"targetY_bundle":d.y_bundle, "target": d.name , node: d});
        return targetPos
    });
    // console.log(targetPos);



    // Append links between inner nodes and outer nodes
    let linksg = svg.select("g.links");
    if(linksg.empty()){
        linksg = svg.append("g").attr("class", "links")
    }

    // Append outer nodes (circles)
    let onodesg = svg.select("g.outer_nodes");
    if(onodesg.empty()){
        onodesg = svg.append("g").attr("class", "outer_nodes")
    }
    let onode = onodesg.selectAll(".outer_node")
        .data(rack_arr,d=>d.name);
    onode.call(updateOnode);
    onode.exit().remove();
    let onode_n = onode.enter().append("g")
        .attr("class", "outer_node");
    onode_n.append('g').attr('class','circleG');
    onode_n.append('g').attr('class','summary hide');
    onode_n.append('g').attr('class','label')
        .attr('class','label')
        .style("font", "10px sans-serif")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle");

    onode_n.append("text")
        .attr('class','groupLabel')
        .attr("dy", ".31em")
        .style('pointer-events','all')
        .on('click',freezeHandle)
        .on("mouseover", function(d){
            if (!isFreeze) {
                d.node.classed('highlightSummary', true);
                _.bind(mouseover, d.childrenNode[d.name].node())(d)
            }})
        .on("mouseout", function(d){_.bind(mouseout,d.childrenNode[d.name].node())(d)});

    onode_n.call(updateOnode)
    function updateOnode(p){

        p.each(function(d){
          d.node=d3.select(this);
          d.childrenNode = makecirclepacking(d.node);
        });
        p.select('text.groupLabel')
            .attr("text-anchor", function(d) { return d.x > 0 ? "start" : "end"; })
            .attr("dx", function(d) { return d.x > 0 ? max_radius : -max_radius; })
            .text(function(d) {
                return d.name; });
        return p.attr("transform", function(d) { return `translate(${d.x},${d.y})`; });
    }

    // draw inner node
    let inodeg = svg.select("g.inner_nodes");
    if(inodeg.empty()){
        inodeg = svg.append("g").attr("class", "inner_nodes")
    }
    let inode = inodeg.selectAll(".inner_node")
        .data(users_arr,d=>d.key).call(updateInode);
    inode.exit().remove();
    let inode_n = inode.enter()
        .append("g")
        .attr("class", "inner_node")
        .on('click',function(d){freezeHandle.bind(this)();userTable(d);})
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);
    inode_n.append('rect')
        .attr('rx',3);
    inode_n.append("text")
        .attr('text-anchor', 'start')
        .attr("transform", "translate(" + 5 + ", " + 13 + ")");
    inode_n.call(updateInode);

    // Join target positions with links data by target nodes
    links.forEach(d=>{
        targetPos.forEach((v=>{

            if (d.target === v.target){
                d.targetX = v.targetX_bundle;
                d.targetY  = v.targetY_bundle;
                const targetChildren = v.node.pack.children.find(c=>c.data.name===d.targetChildren)
                d.targetX_l = v.targetX+targetChildren.x;
                d.targetY_l = v.targetY+targetChildren.y;
                d.targetData = v.node;
                d.targetData.childrenNode[d.targetChildren].datum().data.relatedNodes.push({data:d.sourceData})
                d.sourceData.relatedNodes.push({data:d.targetData,key:d.targetChildren});
                d.targetData.relatedNodes.push({data:d.sourceData});
                d.color = targetChildren.color;
            }
        }))
    });

    // Define link layout
    // let link = d3.linkHorizontal()
    //     .source(d=>[d.targetX_l, d.targetY_l])
    //     .target(d=>[d.targetX < 0 ? d.sourceX : d.sourceX + graphicopt.rect.width, d.sourceY + graphicopt.rect.height / 2])
    const line = d3.line()
        .curve(d3.curveBundle.beta(0.8));
        // .curve(d3.curveCardinal.tension(0.1));
    let link = function(d){

        const target_pos = [d.targetX_l, d.targetY_l];
        const source_pos = [d.targetX < 0 ? d.sourceX : d.sourceX + graphicopt.rect.width, d.sourceY + graphicopt.rect.height / 2];
        const pos1 = [d.targetX, d.targetY];
        const pos3 = [source_pos[0]+(pos1[0]-source_pos[0])/4, source_pos[1]];
        const pos2 = [source_pos[0]+(pos1[0]-source_pos[0])/2, source_pos[1]];

        // return line([target_pos,pos1,pos2,pos3,source_pos])
        return line([target_pos,pos1,pos2,pos3,source_pos])
    }

    let nodeLink = linksg
        .selectAll(".link")
        .data(links)
        .join("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", d=>d.color)
        // .attr("stroke-width", 0.3)
        // .attr("d", d=>diagonal(d))
        .attr("d", link);
    nodeLink.each(function(d){
        const ob = d3.select(this);
        d.targetData.childrenNode[d.targetChildren].datum().data.relatedLinks.push(ob)
        d.sourceData.relatedLinks.push(ob);
        d.targetData.relatedLinks.push(ob);
        d.node=ob;
    });
    makelegend()
    d3.select(self.frameElement).style("height", graphicopt.diameter() - 150 + "px");

    function updateInode(p){
        p.each(function(d){
            d.node=d3.select(this);
        })
        p.select('rect').attr('width', graphicopt.rect.width)
            .attr('height', graphicopt.rect.height)
            .attr('id', d=>d.key);
        p.select('text')
            .html(d=>d.key+'  <tspan style="font-weight: bold">'+d.value.job.length+'</tspan> jobs');
        return p.attr("transform", (d, i)=> "translate(" + d.x + "," + d.y + ")");
    }


    function makecirclepacking(svg) {
        let node;
        let view;
        // svg.append('g').attr('class', 'circleG');
        root = svg.datum().pack;
        let label;
        svg.select("g.label")
            .style("font", "10px sans-serif")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle");
        const summary_map = [
            ['min','max','average']
        ];
        const summary_y = d3.scaleLinear().range([0,root.r]).domain(_colorItem.domain().sort((a,b)=>a-b))
        const summary_path = svg.select('g.summary')
            .selectAll('path')
            .attr('class','summary')
            .data(summary_map.map(d=>({key:d, data:root.data.summary[serviceFullList[serviceSelected].text]})))
            .call(updateSummary);
        summary_path.exit().remove();
        summary_path.enter().append('path').attr('class','summary').call(updateSummary);

        const summary_circle = svg.select('g.summary')
            .selectAll('circle')
            .attr('class','summary')
            .data(summary_map[0].map(d=>({key:d, data:root.data.summary[serviceFullList[serviceSelected].text][d]})))
            .call(updateSummaryCircle);
        summary_circle.exit().remove();
        summary_circle.enter().append('circle').attr('class','summary').call(updateSummaryCircle);

        return updateNodes();

        function updateNodes(istransition) {
            let childrenNode = {};
            node = svg.select('g.circleG')
                .selectAll("circle")
                .data(root.descendants(), d => d.data.name)
                .call(updateNode);

            node.exit().remove();
            node = node.enter().append("circle")
                .call(updateNode).merge(node);
            // node.each(function(d){
            //     childrenNode[d.data.name] = d3.select(this)
            // })
            label = svg.select("g.label")
                .selectAll("text")
                .data(root.descendants());
            label.exit().remove();
            label = label.enter().append('text')
                .classed('hide',true)
                .style('font-size', d => d.parent === root ? 18 : 12)
                .style("fill-opacity", d => d.parent === root ? 1 : 0)
                .style("display", d => 'none')//d.parent === root ? "inline" : "none")
                .text(d => d.data.name).merge(label);
            label.call(textcolor);
            zoomTo([root.x, root.y, root.r * 2], istransition)
            return childrenNode;
            function updateNode(node) {
                node.each(function(d){childrenNode[d.data.name] = d3.select(this)})
                return node
                    .attr("fill", d => {
                        if(d.children) {
                            // d.color =  color(d.depth);
                            // return d.color;
                            d.color = '#dddddd';
                            return d.color;
                        }else {
                            d.color = colorItem(d.data.metrics[serviceFullList[serviceSelected].text]);
                            return d.color;
                        }
                        // d.color = '#dddddd'
                        // return d.color
                    })
                    .classed('compute', d => !d.children)
                    .attr("pointer-events", d => !d.children ? "none" : null)
                    .on('click',freezeHandle)
                    .on("mouseover", function(d){mouseover.bind(this)(d.data||d)})
                    .on("mouseout", function(d){mouseout.bind(this)(d.data||d)})
                    // .on("click", d => focus !== d && (zoom(d), d3.event.stopPropagation()));
                function zoom(d) {
                    const focus0 = focus;

                    focus = d;

                    const transition = svg.transition()
                        .duration(d3.event.altKey ? 7500 : 750)
                        .tween("zoom", d => {
                            const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                            return t => currentZoomData = zoomTo(i(t));
                        });

                    label
                        .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
                        .transition(transition)
                        .style("fill-opacity", d => d.parent === focus ? 1 : 0)
                        .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
                        .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });

                }
            }
        }
        function updateSummary(p){
            p.attr('d',d=>d3.arc().innerRadius(summary_y(d.data[d.key[0]])+2)
                .outerRadius(summary_y(d.data[d.key[1]])-1)
                .startAngle(0)
                .endAngle(Math.PI*2)())
                .attr('fill',d=>_colorItem(d.data[d.key[2]]));
        }
        function updateSummaryCircle(p){
            p.attr('r',d=>summary_y(d.data))
                .attr('fill','none')
                .attr('stroke',d=>_colorItem(d.data));
        }


        function zoomTo(v,istransition) {
            k=1;
            // const k = graphicopt.widthG() / v[2];
            //
            view = v;
            //
            // label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            // value_text.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            // let node_animation;
            // if(istransition)
            //     node_animation = node.transition();
            // else
            //     node_animation = node;
            node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            node.attr("r", d => d.r * k);
            return v
        }
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
    function userTable(d){
        if (isFreeze) {
            d3.select('.informationHolder').classed('hide',false);
            const contain = d3.select('.informationHolder').datum(d);
            contain.select('.card-header').text(d => 'User: ' + d.key);
            contain.select('.card-body').html(`<table id="informationTable" class="display table-striped table-bordered" style="width:100%">
                <thead>
                    <tr>
                        <th></th>
                        <th>Job ID</th>
                        <th>Job Name</th>
                        <th>Start Time</th>
                        <th>Duration</th>
                        <th>Cpu Cores</th>
                        <th>Total Nodes</th>
                        <th>TaskID</th>
                    </tr>
                </thead>
            </table>`);
            const jobData = d.value.job.map(j=>{
                const jobID = j.split('.');
                const job=_.clone(jobs[j]);
                job['id']=jobID[0];
                job['duration']=currentTime - job['start_time']*1000;
                job['task_id'] = jobID[1]||'n/a';
                return job})
            var table = $('#informationTable').DataTable( {
                "data": jobData,
                "scrollX": true,
                "columns": [
                    {
                        "className":      'details-control',
                        "orderable":      false,
                        "data":           null,
                        "defaultContent": ''
                    },
                    { "data": "id" },
                    { "data": "job_name" },
                    { "data": "start_time" ,
                        "render": function ( data, type, row ) {
                            if(type!=='ordering')
                                return d3.timeFormat('%m/%d/%Y %H:%M')(new Date(data*1000));
                            return data;
                        }},
                    { "data": "duration",
                        "render": function ( data, type, row ) {
                            if(type!=='ordering')
                                return millisecondsToStr_axproximate(data);
                            return data;
                        }},
                    { "data": "cpu_cores" },
                    { "data": "total_nodes" },
                    { "data": "task_id" },
                ],
                "order": [[1, 'asc']]
            } );

            // Add event listener for opening and closing details
            $('#informationTable tbody').on('click', 'td.details-control', function () {
                var tr = $(this).closest('tr');
                var row = table.row( tr );

                if ( row.child.isShown() ) {
                    // This row is already open - close it
                    row.child.hide();
                    tr.removeClass('shown');
                }
                else {
                    // Open this row
                    row.child( format(row.data()) ).show();
                    tr.addClass('shown');
                }
            } );
        }else
            d3.select('.informationHolder').classed('hide',true)
    }
    function makelegend(){
        svg_.select('g.legend').remove();
        let legend = svg_.append('g').attr('class','legend').attr('transform',`translate(${Math.min(graphicopt.diameter()+max_radius+40+graphicopt.margin.left,graphicopt.width-graphicopt.margin.right)},${graphicopt.margin.top+30})`);
        const color = _colorItem;
        const marginTop = 20;
        const marginBottom = 0;
        const marginLeft = 0;
        const marginRight = 0;
        const width = 10;
        const height = 200;

        if (color.interpolate) {
            const n = Math.min(color.domain().length, color.range().length);

            let y = color.copy().rangeRound(d3.quantize(d3.interpolate(marginTop, height - marginBottom), n));

            legend.append("image")
                .attr("x", marginLeft)
                .attr("y", marginTop)
                .attr("width", width - marginLeft - marginRight)
                .attr("height", height - marginTop - marginBottom)
                .attr("preserveAspectRatio", "none")
                .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
        }// Sequential
        else if (color.interpolator) {
            let y = Object.assign(color.copy()
                    .interpolator(d3.interpolateRound(marginTop, height - marginBottom)),
                {range() { return [marginTop, height - marginBottom]; }});

            legend.append("image")
                .attr("x", marginLeft)
                .attr("y", marginTop)
                .attr("width", width - marginLeft - marginRight)
                .attr("height", height - marginTop - marginBottom)
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
            }else{
                graphicopt.legend = {scale:y};
                legend.append('g').attr('class','legendTick').call(d3.axisLeft(y));
            }
        }
        if (graphicopt.color.title){
            legend.append('text').text(graphicopt.color.title).attr('y',marginTop -34).style('text-anchor','middle')
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
}

function angle2position(angle,radius){
    return [Math.sin(angle/180*Math.PI)*radius,-Math.cos(angle/180*Math.PI)*radius];
}
