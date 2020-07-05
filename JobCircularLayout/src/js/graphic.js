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
    rect:{
        "width": 120,
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



function draw({computers,jobs,users,sampleS,serviceSelected}){
    let _colorItem = d3.scaleSequential()
        .interpolator(d3.interpolateSpectral);
    _colorItem.domain(serviceFullList[serviceSelected].range.slice().reverse());
    const colorItem = function(d){
        if (d)
            return _colorItem(d);
        else
            return '#afafaf';
    }

    let svg = d3.select('#circularLayout')
        .attr("width", graphicopt.width)
        .attr("height", graphicopt.height)
        .select("g.content")
        .attr("transform", "translate(" + graphicopt.centerX() + "," + graphicopt.centerY() + ")");
    if (svg.empty()){
        svg = d3.select('#circularLayout')
            .attr("width", graphicopt.width)
            .attr("height", graphicopt.height)
            .append("g")
            .attr('class','content')
            .attr("transform", "translate(" + graphicopt.centerX() + "," + graphicopt.centerY() + ")");
    }

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
        .domain([0, graphicopt.mid, graphicopt.mid, graphicopt.oLength-1])
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
    let pack_all = pack(Layout.tree);
    let max_radius = d3.max(pack_all.children,d=>d.r);
    const rack_arr = Layout.tree.children.map(function(d, i) {
        d.x = outerX(i);
        d.y = graphicopt.diameter()/2 - max_radius*2-30;
        // d.y = outerY(i);
        d.relatedLinks = [];
        d.relatedNodes = [];
        d.pack = pack_all.children[i];
        d.pack.children.forEach(e=>{
            e.x -= d.pack.x;
            e.y -= d.pack.y;
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
        targetPos.push({"targetX": d.x, "targetY": d.y, "target": d.name , node: d});
        return targetPos
    });
    // console.log(targetPos);

    // Join target positions with links data by target nodes
    links.forEach(d=>{
        targetPos.forEach((v=>{
            if (d.target === v.target){
                d.targetX = v.targetX;
                d.targetY = v.targetY;
                d.targetData = v.node;
                d.sourceData.relatedNodes.push(d.targetData);
                d.targetData.relatedNodes.push(d.sourceData);
            }
        }))
    });

    // Define link layout
    let link = d3.linkHorizontal()
        .source(d=>[-d.targetY * Math.sin(projectX(d.targetX)), d.targetY * Math.cos(projectX(d.targetX))])
        .target(d=>[d.targetX > 180 ? d.sourceX : d.sourceX + graphicopt.rect.width, d.sourceY + graphicopt.rect.height / 2])

    // Append links between inner nodes and outer nodes
    let linksg = svg.select("g.links");
    if(linksg.empty()){
        linksg = svg.append("g").attr("class", "links")
    }
    let nodeLink = linksg
        .selectAll(".link")
        .data(links)
        .join("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "#457b9d")
        .attr("stroke-width", d=>d.width/6)
        // .attr("d", d=>diagonal(d))
        .attr("d", link);
    nodeLink.each(function(d){
        const ob = d3.select(this);
        d.sourceData.relatedLinks.push(ob);
        d.targetData.relatedLinks.push(ob);
        d.node=ob;
    });

    // Append outer nodes (circles)
    let onodesg = svg.select("g.outer_nodes");
    if(onodesg.empty()){
        onodesg = svg.append("g").attr("class", "outer_nodes")
    }
    let onode = onodesg.selectAll(".outer_node")
        .data(rack_arr);
    onode.call(updateOnode);
    onode.exit().remove();
    let onode_n = onode.enter().append("g")
        .attr("class", "outer_node")
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);
    onode_n.append('g').attr('class','circleG');
    onode_n.append('g').attr('class','label')
        .attr('class','label')
        .style("font", "10px sans-serif")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle");

    onode_n.append("text")
        .attr('class','groupLabel')
        .attr("dy", ".31em");

    onode_n.call(updateOnode)
    function updateOnode(p){

        p.each(function(d){
          d.node=d3.select(this);
            makecirclepacking(d.node);
        })
        p.select('text.groupLabel')
            .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
            .attr("transform", function(d) { return d.x < 180 ? `translate(30)` : `rotate(180)translate(-30)`; })
            .text(function(d) {
                return d.name; });
        return p.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });
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
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);
    inode_n.append('rect');
    inode_n.append("text")
        .attr('text-anchor', 'start')
        .attr("transform", "translate(" + 5 + ", " + 13 + ")");
    inode_n.call(updateInode)
    inode_n.each(function(d){
        const ob = d3.select(this);
        d.node=ob;

    });



    d3.select(self.frameElement).style("height", graphicopt.diameter() - 150 + "px");

    function updateInode(p){
        p.select('rect').attr('width', graphicopt.rect.width)
            .attr('height', graphicopt.rect.height)
            .attr('id', d=>d.key);
        p.select('text')
            .text(d=>d.key+' ( '+d.value.job.length+' jobs )');
        return p.attr("transform", (d, i)=> "translate(" + d.x + "," + d.y + ")");
    }


    function makecirclepacking(svg) {
        let node;
        // svg.append('g').attr('class', 'circleG');
        root = svg.datum().pack;
        let label;
        svg.select("g.label")
            .style("font", "10px sans-serif")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle");

        updateNodes();

        function updateNodes(istransition) {
            node = svg.select('g.circleG')
                .selectAll("circle")
                .data(root.descendants().slice(1), d => d.data.name)
                .call(updateNode);
            node.exit().remove();
            node = node.enter().append("circle")
                .call(updateNode).merge(node);

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
        }

        function updateNode(node) {
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
                .on("mouseover", function () {
                    d3.select(this).attr("stroke", "#000");
                })
                .on("mouseout", function () {
                    d3.select(this).attr("stroke", null);
                })
                .on("click", d => focus !== d && (zoom(d), d3.event.stopPropagation()));
        }

        function zoomTo(v,istransition) {
            k=1;
            // const k = width / v[2];
            //
            // view = v;
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
        .size([graphicopt.diameter()/3, graphicopt.diameter()/3])
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
    // Bring to front
    d3.selectAll('.links .link').sort(function(a, b){ return d.relatedLinks.indexOf(a.node); });
    d3.select(this).classed('highlight', true);
    for (let i = 0; i < d.relatedNodes.length; i++)
    {
        d.relatedNodes[i].node.classed('highlight', true);
        // .attr("width", 18).attr("height", 18);
    }

    for (let i = 0; i < d.relatedLinks.length; i++){
        d.relatedLinks[i].moveToFront().attr('stroke', '#fc4903');
    }
}


function mouseout(d){
    d3.select(this).classed('highlight', false);
    for (let i = 0; i < d.relatedNodes.length; i++)
    {
        d.relatedNodes[i].node.classed('highlight', false);
        // .attr("width", config.rect_width).attr("height", config.rect_height);
    }

    for (let i = 0; i < d.relatedLinks.length; i++){
        d.relatedLinks[i].attr("stroke", "#457b9d" );
    }
}
