// plugin
d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};


// setting
let tooltip = d3.tip().attr('class', 'd3-tip').html(function (d){return `<span>${d}</span>`})
let graphicopt = {
    margin: {top: 0, right: 0, bottom: 0, left: 0},
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
    vizservice =serviceFullList.slice();
    vizservice.push({text:'User',range:[]});
    vizservice.push({text:'Radar',range:[]});
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

function draw(computers,jobs,users,sampleS,currentTime,serviceSelected){
    serviceControl();
    graphicopt.radaropt.schema = serviceFullList;
    isFreeze= false;
    graphicopt.width = document.getElementById('circularLayoutHolder').getBoundingClientRect().width;
    graphicopt.height = document.getElementById('circularLayoutHolder').getBoundingClientRect().height;
    const serviceName = vizservice[serviceSelected].text;
    let _colorItem = d3.scaleSequential()
        .interpolator(d3.interpolateSpectral);
    let getOutofRange = ()=>{}
    if(serviceName==='User') {
        vizservice[serviceSelected].range = d3.keys(users);
        _colorItem = d3.scaleOrdinal(d3.schemeCategory20);
        getOutofRange = ()=>false
    } else if (serviceName==='Radar') {
        _colorItem = colorCluster;
        getOutofRange = ()=>false
    }
    else{
        getOutofRange = getOutofRange_cont
    }
    const range_cal_or = vizservice[serviceSelected].range.slice();
    const range_cal = (vizservice[serviceSelected].filter||vizservice[serviceSelected].range).slice();
    if(serviceName!=='User')
        if(serviceName!=='Radar')
            _colorItem.domain(range_cal.slice().reverse());
    else
        _colorItem.domain(range_cal.slice());
    const colorItem = function(d){
        if (d) {
            if (serviceName!=='User')
                if (serviceName!=='Radar')
                    if (d < range_cal[0] || d > range_cal[1])
                        return 'none';
            return _colorItem(d);
        }else
            // return '#afafaf';
            return '#ffffff';
    };
    let createRadar = _.partial(createRadar_func,_,_,_,_,'radar',graphicopt.radaropt,colorItem);
    let svg_ = d3.select('#circularLayout')
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
        svg.call(tooltip)
        isFirst = true;
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

    // Setup the positions of outer nodes
    function getData(d){
        if (serviceName==='User')
            return d.user.length//?userIndex[d.user[0]]:-1;
        if (serviceName==='Radar'&&d.cluster)
            return -d.cluster.arr.length;
        return d.metrics[vizservice[serviceSelected].text]
    }
    let cluster_dict = {};
    if (serviceName==='Radar'&&cluster_info&&Layout.tree.children[0].children[0].metrics.Radar===undefined)
    {
        cluster_info.forEach(d=>d.arr=[])
        Layout.tree.children.forEach(d=>{
            d.children.forEach(e=>{
                let axis_arr = tsnedata[e.name][0];
                let index = 0;
                let minval = Infinity;
                cluster_info.find((c, ci) => {
                    const val = distance(c.__metrics.normalize, axis_arr);
                    if(val===0&&c.leadername===undefined)
                        c.leadername = {name:e.name,timestep:0};
                    if (minval > val) {
                        index = ci;
                        minval = val;
                    }
                    return !val;
                });
                cluster_info[index].arr.push(e.name);
                cluster_dict[e.name] = cluster_info[index].name;
                e.metrics.Radar = cluster_info[index].name;
                e.cluster = cluster_info[index];
            })
        })
    }
    Layout.tree.children.forEach(d=>d.children.sort((a,b)=>-getData(a)+getData(b)))
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
            e.data.disable = getOutofRange(e.data.metrics);
            e.data.drawData = undefined;
            e.depth = 1;
        });
        d.drawData = [{startAngle: 0,endAngle:360,r:d.pack.r}];
        d.pack.x = 0;
        d.pack.y =0;
        d.pack.depth = 0;
        return d;
    });

    // Setup the positions of inner nodes
    const userIndex={};
    // const users_arr = d3.entries(users).sort((a,b)=>b.value.node.length-a.value.node.length).map(function(d, i) {
    const users_arr = d3.entries(users).sort((a,b)=>b.value.job.length-a.value.job.length).map(function(d, i) {
        userIndex[d.key]=i;
        d.x = -(graphicopt.rect.width / 2);
        d.y = innerY(i);
        d.relatedLinks = [];
        d.relatedNodes = [];
        return d;
    });
    if(isFirst){
        let startZoom = d3.zoomIdentity;
        startZoom.x = Math.max(graphicopt.margin.left+graphicopt.diameter()/2+max_radius+34,(graphicopt.width-450)/2);
        // startZoom.x = graphicopt.margin.left+graphicopt.diameter()/2+max_radius+34;
        startZoom.y = graphicopt.centerY();
        svg.call(graphicopt.zoom.transform, d3.zoomIdentity);
    }

    // create  links data, including source nodes, target nodes and their positions
    let links = [];

    users_arr.forEach((d, i)=>{
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
        });
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
    // Join target positions with links data by target nodes
    links.filter(d=>{
        targetPos.find((v=>{

            if (d.target === v.target){
                d.targetX = v.targetX_bundle;
                d.targetY  = v.targetY_bundle;
                const targetChildren = v.node.pack.children.find(c=>c.data.name===d.targetChildren)
                d.targetX_l = v.targetX+targetChildren.x;
                d.targetY_l = v.targetY+targetChildren.y;
                d.targetData = v.node;
                targetChildren.data.relatedNodes.push({data:d.sourceData})
                d.sourceData.relatedNodes.push({data:d.targetData,key:d.targetChildren});
                d.targetData.relatedNodes.push({data:d.sourceData});
                d.target_prim = targetChildren;
                return true
            }
            return false
        }))
    });

    if (serviceName==='User')
        users_arr.forEach((d, i)=>{
            d.color = colorItem(d.key)
        });
    else if (serviceName==='Radar')
        users_arr.forEach((d, i)=>{
            const uniq = {};
            d.value.node.forEach(c=>uniq[cluster_dict[c]]=1);
            const keys = d3.keys(uniq);
            if (keys.length===1)
                d.color = colorItem(keys[0])
        })


    // Append links between inner nodes and outer nodes
    let linksg = svg.select("g.links");
    if(linksg.empty()){
        linksg = svg.append("g").attr("class", "links")
    }

    const circleStrokeScale = d3.scaleLinear().domain([0,users_arr.length||1]).range([0,10])

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
        .on('click',function(){d3.select(this).dispatch('mouseover'); freezeHandle.bind(this)();})
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
        .on('click',function(d){d3.select(this).dispatch('mouseover'); freezeHandle.bind(this)();userTable(d,'user');})
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);
    inode_n.append('rect')
        .style('fill-opacity',0.8)
        .attr('rx',3);
    inode_n.append("text")
        .attr('text-anchor', 'start')
        .attr("transform", "translate(" + 5 + ", " + 13 + ")");
    inode_n.call(updateInode);


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
        .attr("stroke", d=>{return d.sourceData.color||d.target_prim.color})
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
        });
        p.select('rect').attr('width', graphicopt.rect.width)
            .style('fill',d=>d.color)
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
            ['min','max','mean']
        ];
        const summary_y = d3.scaleLinear().range([0,root.r]).domain(range_cal_or);
        if (vizservice[serviceSelected].text==='User'||vizservice[serviceSelected].text==='Radar'){
            svg.select('g.summary').selectAll('*').remove()
        }
        else{
            const summary_path = svg.select('g.summary')
                .selectAll('path')
                .attr('class', 'summary')
                .data(summary_map.map(d => ({key: d, data: root.data.summary[vizservice[serviceSelected].text]})))
                .call(updateSummary);
            summary_path.exit().remove();
            summary_path.enter().append('path').attr('class', 'summary').call(updateSummary);

            const summary_circle = svg.select('g.summary')
                .selectAll('circle')
                .attr('class', 'summary')
                .data(summary_map[0].map(d => ({
                    key: d,
                    data: root.data.summary[serviceFullList[serviceSelected].text][d]
                })))
                .call(updateSummaryCircle);
            summary_circle.exit().remove();
            summary_circle.enter().append('circle').attr('class', 'summary').call(updateSummaryCircle);
            let annotation = svg.select('g.summary').select('text.annotation');
            if (annotation.empty())
                annotation = svg.select('g.summary').append('text')
                    .attr('class', 'annotation')
                    .style('text-anchor', 'middle');
            annotation.text(`mean=${Math.round(root.data.summary[serviceFullList[serviceSelected].text].mean)}`)
        }
        return updateNodes();

        function updateNodes(istransition) {
            let childrenNode = {};
            node = svg.select('g.circleG')
                .selectAll("g.element")
                .data(root.descendants(), d => d.data.name)
                .call(updateNode);

            node.exit().remove();
            node = node.enter().append("g")
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
                .style('font-size', d => (d.parent === root ? 12 : 10) +'px')
                // .style("display", d => d.parent === root ? "inline" : "none")
                .text(d => d.data.name).merge(label);
            label.each(function(d){
                if (!d.children)
                    d.data.tooltip = d3.select(this);
            })
            label.call(textcolor);
            zoomTo([root.x, root.y, root.r * 2], istransition)
            return childrenNode;
            function updateNode(node) {
                node.each(function(d){childrenNode[d.data.name] = d3.select(this)})
                return node
                    .attr('class','element')
                    .attr("fill", d => {

                        if(d.children) {
                            // d.color =  color(d.depth);
                            // return d.color;
                            d.color = '#dddddd';
                            return d.color;
                        }else {
                            d.color = colorItem(d.data.metrics[vizservice[serviceSelected].text]);
                            return d.color;
                        }
                        // d.color = '#dddddd'
                        // return d.color
                    })
                    .style('stroke-width',d=>{
                        return circleStrokeScale(d.data.relatedNodes.length);
                    })
                    .classed('compute', d => !d.children)
                    .attr("pointer-events", d => !d.children ? "none" : null)
                    .on('click',function(d){d3.select(this).dispatch('mouseover'); freezeHandle.bind(this)();userTable(d,'compute');})
                    .on("mouseover", function(d){mouseover.bind(this)(d.data||d)})
                    .on("mouseout", function(d){mouseout.bind(this)(d.data||d)})
                    // .on("click", d => focus !== d && (zoom(d), d3.event.stopPropagation()));

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
            view = v;
            //
            label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            node.selectAll('g').remove();
            if (serviceName!=='Radar'){
                let path = node.selectAll('path').data(d=>{return  d.data.drawData||(d.data.drawData=getDrawData(d),d.data.drawData)})
                    .attr('d',getRenderFunc)
                    .style('fill',d=>d.color);
                path.exit().remove();
                path.enter().append('path')
                    .attr('class','circle')
                .attr('d',getRenderFunc).style('fill',d=>d.color);
            }else{
                node.filter(d=>{
                    if (!d.data.drawData || d.data.drawData.type!=="radar") {
                         d.data.drawData=getDrawData(d);
                    }
                    return !d.data.drawData.isRadar;
                }).selectAll('path').data(d=>d.data.drawData)
                    .join('path').attr('d',getRenderFunc)
                    .style('fill',d=>d.color);
                const radarNode = node.filter(d=>d.data.drawData.isRadar);
                radarNode.selectAll('path.circle').remove();
                radarNode
                    .selectAll('g').data(d=>[d.data.drawData])
                    .join('g').attr('class','radar  ')
                    .style('fill',d=>d.color)
                    .each(function(d){
                        setTimeout(()=>{
                            createRadar(d3.select(this), d3.select(this), d[0], {size:d.r,colorfill: 0.5}).select('.radarStroke')
                                .style('stroke-opacity',1);
                        },0);
                    });
            }
            return v
        }
    }
    function getOutofRange_cont(e){
        return e[serviceName] < range_cal[0] || e[serviceName] > range_cal[1]
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
        }else
            return [{startAngle:0,endAngle:360,r:e.r}];
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
            d3.select('#legendHolder .legendView').classed('hide',true);
            d3.select('#legendHolder .clusterView').classed('hide',true);
        }else if (vizservice[serviceSelected].text==='Radar'){
            d3.select('#legendHolder .legendView').classed('hide',true);
            d3.select('#legendHolder .clusterView').classed('hide',false);
        }else{
            d3.select('#legendHolder .clusterView').classed('hide',true);
            const color = _colorItem;
            const marginTop = 10;
            const marginBottom = 10;
            const marginLeft = 40;
            const marginRight = 0;
            const width = 10;
            const height = 200;
            const legendHolder = d3.select('#legendHolder');
            legendHolder.style('left', Math.min(d3.zoomIdentity.x + graphicopt.diameter() / 2 + 80, graphicopt.width - graphicopt.margin.right) + 'px');
            legendHolder.select('.legendView').classed('hide',false);
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
