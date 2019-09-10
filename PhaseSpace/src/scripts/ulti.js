// var serviceList = {arrTemperature: {key: "Temperature", val: ["arrTemperatureCPU1","arrTemperatureCPU2"]},
//     arrCPU_load: {key: "CPU_load", val: ["arrCPU_load"]},
//     arrMemory_usage: {key: "Memory_usage", val: ["arrMemory_usage"]},
//     arrFans_health: {key: "Fans_speed", val: ["arrFans_speed1","arrFans_speed2"]},
//     arrPower_usage:{key: "Power_consumption", val: ["arrPower_usage"]}};

function UnzipData(dataRaw){
    let temp = [];
    dataRaw.forEach(d=>{
        d.value[serviceListattr[chosenService]].forEach((it, i)=>
            temp.push({f: it[service_part],df: 0, key: d.key, timestep:i, undefined:false}));
    });
    return temp;
}
function calData(data){
    sumnet =[];
    let nest = d3.nest()
        .key(function(d) { return d.timestep; })
        .entries(data);
    nest.forEach((n,i)=>{
        let currentMean = d3.mean(n.values,m=>m.f);
        n.values.forEach(d => {
            if (d.f===undefined) {
                d.undefined =true;
                d.f = currentMean;
            }
            if (i)
                d.df = d.f - nest[i-1].values.find(t => t.key === d.key).f;
        });
        sumnet.push({f: currentMean, df: d3.mean(n.values,m=>m.df),timestep:i});
    });
    nestbyKey = d3.nest()
        .key(function(d) { return d.key; }).sortKeys(function(a,b) { return a.timestep-b.timestep})
        .entries(data);
    scaleX = d3.scaleLinear().domain(d3.extent(data,d=>d.f)).range([0,1]);
    scaleY = d3.scaleLinear().domain(d3.extent(data,d=>d.df)).range([0,1]);
    nestbyKey.forEach(key => {
        // let gap = 0;
        // key.values.forEach((t,i)=>{
        //     gap += distance([t.f,t.df],[sumnet[i].f,sumnet[i].df]);
        // })
        key.gap = integration (key.values.map(d=>normalize(d)),sumnet.map(d=>normalize(d)));
    });
    return data;
}
function distance (a,b){
    let dis = 0;
    a.forEach((ai,i)=> dis += (ai-b[i])*(ai-b[i]));
    return Math.sqrt(dis);
}
function normalize(a){
    return [scaleX(a.f),scaleY(a.df)];
}
function integration (a,b){
    let gap = 0;
    a.forEach((t,i)=>{
        gap += distance(t,b[i]);
    });
    return gap;
}
function drawSumgap(){
    mainsvg.attrs({
        ViewBox:"0 0 "+widthSvg+" " +heightSvg,
        preserveAspectRatio:"xMidYMid meet"
    }).attrs({
        width: widthSvg,
        height: heightSvg,
        // overflow: "visible",

    });
    color = d3.scaleSequential(d3.interpolateSpectral)
        .domain(d3.extent(nestbyKey,d=>d.gap).reverse());
    x = d3.scaleLinear()
        // .domain(d3.extent(data, d => d.f)).nice()
        .domain([0,1]).nice()
        .range([margin.left, widthSvg - margin.right]);
    xx = d3.scaleLinear()
        .domain(d3.extent(data, d => d.f)).nice()
        .range([margin.left, widthSvg - margin.right]);
    y = d3.scaleLinear()
        .domain([0,1]).nice()
        // .domain(d3.extent(data, d => d.df)).nice()
        .range([heightSvg - margin.bottom, margin.top]);
    yy = d3.scaleLinear()
        .domain(d3.extent(data, d => d.df)).nice()
        .range([heightSvg - margin.bottom, margin.top]);
    let xAxis = g => g
        .attr("transform", `translate(0,${heightSvg - margin.bottom})`)
        .call(d3.axisBottom(xx))
        //.call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", widthSvg - margin.right)
            .attr("y", -4)
            .attr('fill','#ffffff')
            .attr("font-weight", "bold")
            .attr("text-anchor", "end")
            .attr('class','labelx axisLabel')
            .text(()=>serviceLists[chosenService].text));
    let yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yy))
        //.call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
            .attr("x", 4)
            .attr("class","axisLabel")
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .attr('class','labely axisLabel')
            .text(()=>"\u0394 "+serviceLists[chosenService].text));

    mainsvg.append("g")
        .call(xAxis);

    mainsvg.append("g")
        .call(yAxis);
    let datanest = d3.nest()
        .key(function(d) { return d.key; })
        .key(function(d) { return d.timestep; })
        .entries(data);
    datanest.forEach((d,i)=>d.gap =nestbyKey[i].gap);
    let maing = mainsvg. append('g')
        .attrs({id: 'maing'});
    maing.call(tip);
    let gpoints = maing.selectAll(".gCategory")
        .data(datanest,d=>d.values).enter()
        .append('g')
        .attrs({class: 'gCategory',
            id: d=>d.key})
        .call(activepoint);
    gpoints.append('path')
        .attr('class','linkLine')
        .datum(d=>d.values);

    gpoints.selectAll(".datapoint")
        .data(d=>d.values).enter()
        .append('circle')
        .attrs({class: 'datapoint',
            cx: d=>x(scaleX(d.values[0].f)),
            cy: d=>y(scaleY(d.values[0].df)),
            r:  3})
        .on('mouseover',mouseoverHandel)
        .on('mouseleave',mouseleaveHandel);
    maing.call(sumgap);
    d3.select('#legend-svg').call(colorlegend);
}

function colorlegend (g){
    // add the legend now
    var legendFullHeight = heightSvg-margin.bottom;
    var legendFullWidth = 80;

    var legendMargin = { top: 20, bottom: 20, left: 20, right: 35 };

    // use same margins as main plot
    var legendWidth = legendFullWidth - legendMargin.left - legendMargin.right;
    var legendHeight = legendFullHeight - legendMargin.top - legendMargin.bottom;

    var legendSvgMain = g.attr('width', legendFullWidth)
        .attr('height', legendFullHeight);
    var legendSvg = legendSvgMain.append('g')
        .attr('transform', 'translate(' + legendMargin.left + ',' +
            legendMargin.top + ')');
    legendSvgMain.append("text")
        .attr("class","axisLabel")
        .attr("transform", "rotate(-90)")
        .attr("x",0 - (legendFullHeight / 2))
        .attr("dy", "1em")
        .attr("font-weight", "bold")
        .style("text-anchor", "middle")
        .text("Derivation from attractor");

    var gradient = legendSvg.append('defs')
        .append('linearGradient')
        .attr('id', 'gradient')
        .attr('x1', '0%') // bottom
        .attr('y1', '100%')
        .attr('x2', '0%') // to top
        .attr('y2', '0%')
        .attr('spreadMethod', 'pad');
    // programatically generate the gradient for the legend
    // this creates an array of [pct, colour] pairs as stop
    // values for legend
    var pct = linspace(0, 100, 10).map(function(d) {
        return Math.round(d);
    });
    let gap = Math.abs(color.domain()[1]-color.domain()[0]);
    pct.forEach(function(d) {
        gradient.append('stop')
            .attr('offset', d+"%")
            .attr('stop-color', color(d*gap/100))
            .attr('stop-opacity', 1);
    });

    legendSvg.append('rect')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#gradient)');

    // create a scale and axis for the legend
    legendScale = d3.scaleLinear()
        .domain(color.domain().reverse())
        .range([legendHeight, 0]);

    var legendAxis = d3.axisRight(legendScale)
    // .tickValues(d3.range(-3, 4))
    // .tickFormat(d3.format("d"));

    legendSvg.append("g")
        .attr("class", "legend axis")
        .attr("transform", "translate(" + legendWidth + ", 0)")
        .call(legendAxis);
    brush = d3.brushY()
        .extent([[0, 0], [legendWidth, legendHeight]])
        .on("brush end", brushed);
    legendSvg.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, legendScale.range().reverse());
}
function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    let s = d3.event.selection || legendScale.range();
    let range = s.map(legendScale.invert, legendScale);
    d3.selectAll(".gCategory")
        .filter(d=>(d.gap<=range[0] && d.gap>=range[1]));
    // d3.selectAll(".gCategory")
    // x.domain(s.map(x2.invert, x2));
    // focus.select(".area").attr("d", area);
    // focus.select(".axis--x").call(xAxis);
    // svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
    //     .scale(width / (s[1] - s[0]))
    //     .translate(-s[0], 0));
}
function linspace(start, end, n) {
    var out = [];
    var delta = (end - start) / (n - 1);

    var i = 0;
    while(i < (n - 1)) {
        out.push(start + (i * delta));
        i++;
    }

    out.push(end);
    return out;
}
function sumgap (g){
    g.append('path').datum(sumnet)
        .attrs({
            id: 'sumgap',
            class: 'gapLine',
            d: d3.line()
                .curve(d3.curveCardinal)
                .x(function(d) {
                    return x(scaleX(d.f)); })
                .y(function(d) { return y(scaleY(d.df)); })
        });
}

function lineConnect(l,scale){
    scale = scale||1;
    return l
        .attrs({
            class: 'linkLine',
            d: d3.line()
                .curve(d3.curveCardinal.tension(0.25))
                .x(function(d) {
                    return x(scaleX(d.values[0].f))/scale; })
                .y(function(d) { return y(scaleY(d.values[0].df))/scale; })
        })
}
function activepoint(p){
    return p.style('fill',d=>color(d.gap))
        .style('opacity',1)
        .attr('r',3);
}

function deactivepoint(p){
    return p.style('fill','gray')
        .style('opacity',0.1).attr('r',1);
}

// Netgap

function callgapsall(data,limit){
    let newdata = {nodes:[],links:[]};
    nestbyKey.forEach((key,i) => {
        for (let j=i+1; j<nestbyKey.length;j++) {
            let target = nestbyKey[j];
            let gap2 = integration(key.values.map(d=> normalize(d)), target.values.map(d=> normalize(d)));
            //if (limit === undefined || gap2<limit) {
                newdata.links.push({
                    source: key.key,
                    target: target.key,
                    value: gap2
                });
            //}
        }
        newdata.nodes.push({
            id: key.key,
            value: key.gap,
            extra: {text: key.values[0].text, topic: key.values[0].topic},
            values: d3.nest().key(function(d) { return d.timestep; })
                .entries(key.values)
        })
    });
    return newdata;
}
function initNetgap (){
    netConfig.margin ={top: 5, right: 20, bottom: 20, left: 5};
    netConfig.width = widthSvg;
    netConfig.height = heightSvg;
    netsvg
        .attrs({
            width: netConfig.width,
            height: netConfig.height,
        });
    netConfig.scalerevse = d3.scaleLinear().range([30,90]);
    netConfig.invertscale =  d3.scaleLinear().range([0.5,0.01]);
    netConfig.simulation = d3.forceSimulation(netConfig.nodes)
        .force("link", d3.forceLink(netConfig.links).id(d => d.id).distance(d=>netConfig.scalerevse(d.value)).strength(d=>netConfig.invertscale(d.value)))
        .force("charge", d3.forceManyBody(10).distanceMax(netConfig.width/3)
            .distanceMin(30))
        .force("gravity", d3.forceManyBody(5).distanceMax(netConfig.width/5)
            .distanceMin(30))
        .force('collision',d3.forceCollide().radius(20))
        .force("center", d3.forceCenter(netConfig.widthG() / 2, netConfig.heightG()/ 2))
        .on("tick", () => {
            netConfig.link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            netConfig.node
                .attr("transform", d=>{
                    let smallgaph = netConfig.smallgrapSize();
                    d.x = Math.max(smallgaph-netConfig.widthG()*0.5, Math.min(netConfig.widthG()*1.5 - smallgaph/2, d.x));
                    d.y = Math.max(smallgaph-netConfig.heightG()*0.5, Math.min(netConfig.heightG()*1.5 - smallgaph/2, d.y));
                    return `translate(${d.x},${d.y-smallgaph})`});

            netConfig.nodeText.attr("x", d => d.x)
                .attr("y", d => d.y)
            //return `translate(${d.x- netConfig.width/10},${d.y- netConfig.height/10})`});
        });

    netsvg.call(tip);
    netConfig.g = netsvg.append("g").attr('transform',`translate(${netConfig.margin.left},${netConfig.margin.top})`);
    netConfig.g.append("g")
        .attr("stroke", "#999")
        //.attr("stroke-opacity", 0.9)
        .attr("stroke-width", 1)
        .attr('class','linkgroup');
    function zoomed() {
        netConfig.g.attr("transform", d3.event.transform);
    }
    var zoom = d3.zoom()
        .scaleExtent([0.25, 40])
        .on("zoom", zoomed);
    netsvg.call(zoom);

}
function drawNetgap(nodenLink){

    netConfig.simulation.stop();
    function cutbyIQRv3(multi,maxlink) {
        nodenLink.links.sort((a, b) => a.value - b.value);
        nodenLink.nodes.sort((a, b) => a.value - b.value);
        let templarray = nodenLink.links.map(d => d.value);
        const q1 = d3.quantile(templarray, 0.25);
        const q3 = d3.quantile(templarray, 0.75);
        const qmean = d3.median(templarray);
        const iqr = q3 - q1;
        let filtered= nodenLink.links.filter(d=> (d.value<(q3+iqr*multi)));
        let tempLinks=[];
        let tempc =d3.nest()
            .key(d=>d.source)
            .rollup(d=>{
                let nv =nodenLink.nodes.find(e=>e.id === d[0].source).value;
                if (nv>q3)
                    return d.slice(0,1).filter(d=> (d.value<qmean));
                if (nv>q1)
                    return d.slice(0,maxlink-1).filter(d=> (d.value<qmean));
                return d.slice(0,maxlink).filter(d=> (d.value<qmean));})
            .entries(filtered);
        tempc.forEach(d=>{tempLinks = d3.merge([tempLinks,d.value])});
        return tempLinks;
    }
    function cutbyThreshold(threshhold, maxlink) {
        let tempLinks=[];
        let tempc = d3.nest()
            .key(d=>d.source)
            .sortValues((a,b)=>a.value-b.value)
            .rollup(d=>d.slice(0,maxlink).filter(l=>l.value<threshhold))
            .entries(nodenLink.links);
        tempc.forEach(d=>{tempLinks = d3.merge([tempLinks,d.value])});
        return tempLinks;
    }


    netConfig.links = cutbyIQRv3(1.5, 3).map(d => Object.create(d));

    netConfig.nodes = nodenLink.nodes.map(d => {
        let temp = Object.create(d);
        temp.key = d.id;
        temp.gap = d.value;
        return temp;
    });
    // const scalerevse = d3.scaleLinear().domain(d3.extent(links,d=>d.value)).range([1,200]);
    netConfig.scalerevse.domain(d3.extent(netConfig.links,d=>d.value));
    netConfig.invertscale.domain(d3.extent(netConfig.nodes,d=>d.value));




    netConfig.link = netConfig.g.select('.linkgroup')
        .selectAll(".linkGap")
        .data(netConfig.links).join("line")
        // .enter().append("line")
        .attr("class","linkGap")
        .attr("stroke-width", d => Math.sqrt(d.value));

    netConfig.node = netConfig.g
        .selectAll(".linkLineg")
        .data(netConfig.nodes,d=>d.key);
    let newnodes = netConfig.node
        .enter().append('g')
        .attr('class','linkLineg')
        .attr('id',(d,i)=>'mini'+netConfig.nodes[i].key)
        .style('pointer-events','auto');
    netConfig.node.exit().remove();
    newnodes.append('rect')
        .attrs({
            opacity:0,
            width: netConfig.smallgrapSize(),
            height: netConfig.smallgrapSize(),
        });

    newnodes.append('path');

    netConfig.node = netConfig.g
        .selectAll(".linkLineg");

    netConfig.node.select('path')
        .style('stroke',d=>
            color(d.gap))
        .datum(d=>d.values)
        .call(d=>lineConnect(d,netConfig.ratiograph))
        .attr('stroke-width',1);

    netConfig.node.selectAll('rect')
        .style('pointer-events','auto')
        .on('mouseover',(dd)=>{
            netConfig.simulation.stop();
            let maxSudden = d3.max(dd.values,d=>d.values[0].df);
            let maxSuddenPoint = dd.values.find(d=>d.values[0].df===maxSudden);
            mouseoverHandel(maxSuddenPoint);
            let connect = d3.selectAll(".linkGap").filter(d=>d.source.key===dd.key||d.target.key===dd.key).classed('deactive',false);//.style('stroke-opacity',1);
            connect.data().forEach(d=>{
                let id = "#mini"+(d.source.key!==dd.key?d.source.key:d.target.key);
                d3.select(id).style('opacity',1);
            });
            tip.show({values: [{key:dd.key,topic:dd.topic,text:dd.text, connect: connect.data()}]});})
        .on('mouseleave',(d)=>{
            netConfig.simulation.alphaTarget(.3).restart();
            mouseleaveHandel();
            tip.hide();})
        .call(dragForce(netConfig.simulation));

    netConfig.node.append("title")
        .text(d => d.id);
    // DATA JOIN
    netConfig.nodeText = netConfig.g
        .selectAll(".linkText")
        .data(netConfig.nodes);
    // UPDATE
    netConfig.nodeText
        .attr('id',(d,i)=>'text'+netConfig.nodes[i].key)
        .style('pointer-events','auto');
    // ENTER
    netConfig.nodeText
        .enter().append('text')
        .attr('class','linkText')
        .attr('id',(d,i)=>'text'+netConfig.nodes[i].key)
        .style('pointer-events','auto');
    // EXIT
    // Remove old elements as needed.
    netConfig.nodeText.exit().remove();


    netConfig.nodeText = netConfig.g
        .selectAll(".linkText");

    netConfig.nodeText
        .text(d => d.key)
        .attrs({
            x:0,
            y:netConfig.smallgrapSize(),
            // dy: ".30em"
        }).style('font-size',0);
    // }).style('font-size',d=>fontscale(d3.mean(d.values,e=>e.values[0].f)));

    // netConfig.node.select('path')
    netConfig.nodeText
        .style('pointer-events','auto')
        .on('mouseover',(dd)=>{
            let maxSudden = d3.max(dd.values,d=>d.values[0].df);
            let maxSuddenPoint = dd.values.find(d=>d.values[0].df===maxSudden);
            mouseoverHandel(maxSuddenPoint);
            netConfig.simulation.stop();
            netsvg.selectAll(".linkLineg").style('opacity',0.5);
            d3.select("#mini"+dd.key).style('opacity',1);
            d3.selectAll(".linkGap").classed('deactive',true);
            let connect = d3.selectAll(".linkGap").filter(d=>d.source.key===dd.key||d.target.key===dd.key).classed('deactive',false);//.style('stroke-opacity',1);
            connect.data().forEach(d=>{
                let id = "#mini"+(d.source.key!== dd.key?d.source.key:d.target.key);
                d3.select(id).style('opacity',1);
            });
            tip.show({values: [{key:dd.key,topic:dd.topic,text:dd.text, connect: connect.data()}]});})
        .on('mouseleave',(dd)=>{
            mouseleaveHandel();
            netConfig.simulation.alphaTarget(.3).restart();

            netsvg.selectAll(".linkLineg").style('opacity',1);
            netsvg.selectAll(".linkGap").classed('deactive',false);//.style('stroke-opacity',0.5);
            tip.hide()})
        .call(dragForce(netConfig.simulation));


    netConfig.nodeText.nodes().forEach(d=>{
        let e= d3.select(d).node().getBoundingClientRect();
        d.__data__.size = {w: e.width,h: e.height*2};
    });

    netConfig.simulation.nodes(netConfig.nodes);
    netConfig.simulation.force("link").links(netConfig.links);
    netConfig.simulation.alphaTarget(.5).restart()

}
function dragForce (simulation) {

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(.03).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(.5);
        d.fx = null;
        d.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

function changeVar(d){
    chosenService =d.id;
    reset();
    $('#currentservice').text(d.text);
}

function reset(){
    mainsvg.selectAll('*').remove();
    d3.select('#legend-svg').selectAll('*').remove();
    netsvg.selectAll('*').remove();

    data = calData(UnzipData(dataRaw));
    nodenLink = callgapsall(data);
    drawSumgap();
    drawNetgap(nodenLink);
}

function switchTheme(){
    if (this.value==="light"){
        this.value = "dark";
        this.text = "Light";
        d3.select('body').classed('light',false);
        return;
    }
    this.value = "light";
    this.text = "Dark";
    d3.select('body').classed('light',true);
    return
}

function rectCollide() {
    var nodes, sizes, masses
    var size = constant([0, 0])
    var strength = 1
    var iterations = 1

    function force() {
        var node, size, mass, xi, yi
        var i = -1
        while (++i < iterations) { iterate() }

        function iterate() {
            var j = -1
            var tree = d3.quadtree(nodes, xCenter, yCenter).visitAfter(prepare)

            while (++j < nodes.length) {
                node = nodes[j]
                size = sizes[j]
                mass = masses[j]
                xi = xCenter(node)
                yi = yCenter(node)

                tree.visit(apply)
            }
        }

        function apply(quad, x0, y0, x1, y1) {
            var data = quad.data
            var xSize = (size[0] + quad.size[0]) / 2
            var ySize = (size[1] + quad.size[1]) / 2
            if (data) {
                if (data.index <= node.index) { return }

                var x = xi - xCenter(data)
                var y = yi - yCenter(data)
                var xd = Math.abs(x) - xSize
                var yd = Math.abs(y) - ySize

                if (xd < 0 && yd < 0) {
                    var l = Math.sqrt(x * x + y * y)
                    var m = masses[data.index] / (mass + masses[data.index])

                    if (Math.abs(xd) < Math.abs(yd)) {
                        node.vx -= (x *= xd / l * strength) * m
                        data.vx += x * (1 - m)
                    } else {
                        node.vy -= (y *= yd / l * strength) * m
                        data.vy += y * (1 - m)
                    }
                }
            }

            return x0 > xi + xSize || y0 > yi + ySize ||
                x1 < xi - xSize || y1 < yi - ySize
        }

        function prepare(quad) {
            if (quad.data) {
                quad.size = sizes[quad.data.index]
            } else {
                quad.size = [0, 0]
                var i = -1
                while (++i < 4) {
                    if (quad[i] && quad[i].size) {
                        quad.size[0] = Math.max(quad.size[0], quad[i].size[0])
                        quad.size[1] = Math.max(quad.size[1], quad[i].size[1])
                    }
                }
            }
        }
    }

    function xCenter(d) { return d.x + d.vx + sizes[d.index][0] / 2 }
    function yCenter(d) { return d.y + d.vy + sizes[d.index][1] / 2 }

    force.initialize = function (_) {
        sizes = (nodes = _).map(size)
        masses = sizes.map(function (d) { return d[0] * d[1] })
    }

    force.size = function (_) {
        return (arguments.length
            ? (size = typeof _ === 'function' ? _ : constant(_), force)
            : size)
    }

    force.strength = function (_) {
        return (arguments.length ? (strength = +_, force) : strength)
    }

    force.iterations = function (_) {
        return (arguments.length ? (iterations = +_, force) : iterations)
    }

    return force
}
function constant(_) {
    return function () { return _ }
}