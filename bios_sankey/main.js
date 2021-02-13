

d3.csv('src/data/all_bios_info.csv').then(data=>{
    const width = 4075, height = 720;
    const {columns,color} = stackChart('#bar_chart',data,{width,height});
    const graph = handleData(data,columns.map(k=>k.key));
    drawSankey('#svg_main',graph,{width,height,color})
})


function handleData(data,keys){
    // const keys = data.columns.slice(2,data.columns.length).filter(d=>d!=='SystemServiceTag');
    // const keys = data.columns.slice(2,40).filter(d=>d!=='SystemServiceTag');
    let index = -1;
    const nodes = [];
    const nodeByKey = new Map;
    const indexByKey = new Map;
    const links = [];

    for (const k of keys) {
        for (const d of data) {
            const key = JSON.stringify([k, d[k]]);
            if (nodeByKey.has(key)) continue;
            const node = {name: d[k]};
            nodes.push(node);
            nodeByKey.set(key, node);
            indexByKey.set(key, ++index);
        }
    }

    for (let i = 1; i < keys.length; ++i) {
        const a = keys[i - 1];
        const b = keys[i];
        const prefix = keys.slice(0, i + 1);
        const linkByKey = new Map;
        for (const d of data) {
            const names = prefix.map(k => d[k]);
            const key = JSON.stringify(names);
            const value = d.value || 1;
            let link = linkByKey.get(key);
            if (link) { link.value += value; continue; }
            link = {
                source: indexByKey.get(JSON.stringify([a, d[a]])),
                target: indexByKey.get(JSON.stringify([b, d[b]])),
                names,
                value
            };
            links.push(link);
            linkByKey.set(key, link);
        }
    }

    return {nodes, links, keys};
}

function drawSankey (divID,graph,{width,height,color}){
    sankey = d3.sankey()
        .nodeSort(null)
        .linkSort(null)
        .nodeWidth(4)
        .nodePadding(20)
        .extent([[0, 5], [width, height - 5]])
    const {nodes, links} =  sankey({
        nodes: graph.nodes.map(d => Object.assign({}, d)),
        links: graph.links.map(d => Object.assign({}, d))
    });

    // const color = d3.scaleOrdinal(graph.keys, d3.schemeCategory10).unknown("#ccc")

    const svg = d3.select(divID)
    // .attr("viewBox", [0, 0, width, height]);
    .attr("width", width)
    .attr("height", height);


    svg.append("g")
        .selectAll("rect")
        .data(nodes)
        .join("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        // .style('display',d=>d.name===''?'none':null)
        // .style('fill',d=>color[d.name])
        .append("title")
        .text(d => `${d.name}\n${d.value.toLocaleString()}`);

    svg.append("g")
        .attr("fill", "none")
        .selectAll("g")
        .data(links)
        .join("path")
        .attr("d", d3.sankeyLinkHorizontal())
        // .style('display',d=>((d.source.name==='')||(d.target.name===''))?'none':null)
        .attr("stroke", d => color[d.names[1]])
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", d => d.width)
        .style("mix-blend-mode", "multiply")
        .append("title")
        .text(d => `${d.names.join(" → ")}\n${d.value.toLocaleString()}`);

    svg.append("g")
        .style("font", "10px sans-serif")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
        // .style('display',d=>d.name===''?'none':null)
        .text(d => d.name)
        .append("tspan")
        .attr("fill-opacity", 0.7)
        .text(d => ` ${d.value.toLocaleString()}`);
}

function stackChart(divID,data,{width,height}){

    const keys = data.columns;//.slice(2,40).filter(d=>d!=='SystemServiceTag');
    const keysObject = {};
    keys.forEach(k=>{
        keysObject[k] = {key:k,values:{}};
    });
    data.forEach(d=>{
        keys.forEach(k=>keysObject[k].values[d[k]]=(keysObject[k].values[d[k]]??0)+1)
    });

    const svg = d3.select(divID)
        .attr("viewBox", [0, 0, width, height]);

    let dataViz = Object.values(keysObject);
    dataViz.forEach(d=>{
        let count = 0;
        d.values = Object.keys(d.values).map(e=>{
            const item = {key:e,start:count,value:d.values[e]};
            count+= d.values[e];
            item.end = count;
            return item;
        })
    });
    const color = {};
    dataViz=dataViz.filter(d=>{
        d.values=d.values.filter(e=>e.key!=='');
        if (d.values.length<=2 || d.values.length>=data.length/2)
            return false;
        const colorIn = d3.scaleOrdinal()
            .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#bcbd22", "#17becf"]);
        let count = 0;
        d.values.sort((a,b)=>b.value-a.value)
        d.values.forEach(e=>{
            e.start = count;
            count+=e.value;
            e.end = count;
            color[e.key] = colorIn(e.key);
        });
        return true;
    });
    color[""]="#7f7f7f";
    // let xscale = d3.scaleBand().domain(dataViz.map(d => d.key)).range([0,width]).padding(0.1);
    // let yscale = d3.scaleLinear().domain([0,data.length]).range([height,0]);
    //
    // svg.selectAll('g.barGroup').data(dataViz)
    //     .join('g').attr('class','barGroup')
    //     .attr('transform',d=>`translate(${xscale(d.key)},${yscale.range()[1]})`)
    //     .selectAll('rect').data(d=>d.values)
    //     .join('rect')
    //     .attr('y',d=>yscale(d.end))
    //     .attr('height',d=>-yscale(d.end)+yscale(d.start))
    //     .attr("width", xscale.bandwidth())
    //     .style('fill',d=>color[d.key]);
    return {columns:dataViz,color};
}
