
d3.csv('src/data/all_bios_info.csv').then(data=>{
    const width = 3075, height = 680;
    const {_columns,_columnsObj} = getColumnData(data);
    let columns = _columns.filter(d=>{
        d.values=d.values.filter(e=>e.key!=='');
        if (d.values.length<=2 || d.values.length>=data.length/2){
            d.selected = false;
            return false;
        }
        d.selected = true;
        return true;
    });

    d3.select('#axis').selectAll('option').data(_columns)
        .join('option')
        .attr('value',(d,i)=>d.key)
        .attr('selected',d=>d.selected?'selected':null)
        .text(d=>d.key+` (${d.values.length})`);

    $('#axis').multiselect({enableFiltering: true,
        includeFilterClearBtn: false,
        maxHeight: 600,
        includeSelectAllOption: true,
        onChange: function(options, checked) {
            columns = options.parent().val().map(d=>_columnsObj[d]);
            updateAxisChoice();
            Sankey.draw(data,[columns[0],...columns.slice(1)]);
        }
    });


    console.log(columns.length)
    updateAxisChoice();
    const Sankey = drawSankey('#svg_main',{width,height});
    Sankey.draw(data,[columns[0],...columns.slice(1)]);
    function updateAxisChoice(){
        d3.select('#colorBy').selectAll('option').data(columns)
            .join('option')
            .attr('value',(d,i)=>i)
            .text(d=>d.key);
        d3.select('#colorBy').on('change',function(){
            const choice = this.selectedIndex;
            Sankey.draw(data,[columns[choice],...columns.slice(0,choice),...columns.slice(choice+1)]);
        });
    }
});



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

function drawSankey (divID,{width,height}){
    sankey = d3.sankey()
        .nodeSort(null)
        .linkSort(null)
        .nodeWidth(4)
        .nodePadding(10)
        .extent([[0, 5], [width, height - 5]])

    // const color = d3.scaleOrdinal(graph.keys, d3.schemeCategory10).unknown("#ccc")

    const svg = d3.select(divID)
    // .attr("viewBox", [0, 0, width, height]);
    .attr("width", width)
    .attr("height", height);

    const reactNode = svg.append("g")
        .attr('class','rectNodes');

    const linksPath = svg.append("g")
        .attr("class", "links")
        .attr("fill", "none");

    const texts = svg.append("g")
        .attr('class','texts')
        .style("font", "10px sans-serif");

    const master = {};
    master.draw=(data,columns)=>{
        width = 83*columns.length;
        sankey.extent([[0, 5], [width, height - 5]]);
        svg.attr("width", width);


        const keys = columns.map(k=>k.key);
        const graph = handleData(data,keys);
        const {nodes, links} =  sankey({
            nodes: graph.nodes.map(d => Object.assign({}, d)),
            links: graph.links.map(d => Object.assign({}, d))
        });
        const color = d3.scaleOrdinal()
            .domain(columns[0].values.map(d=>d.key))
            .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#bcbd22", "#17becf"]).unknown("#ccc");

        const rect = reactNode
            .selectAll("rect")
            .data(nodes,d=>d.layer)
            .join("rect");
        rect
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => d.y1 - d.y0)
            .attr("width", d => d.x1 - d.x0);
        rect.selectAll('title').data(d=>[d])
            .join("title")
            .text(d => `${d.name}\n${d.value.toLocaleString()}`);
        debugger
        const paths = linksPath
            .selectAll("path")
            .data(links,d=>d.source.name+d.target.name)
            .join("path");
        paths.selectAll('title').data(d=>[d])
            .join("title")
            .text(d => `${d.names.join(" → ")}\n${d.value.toLocaleString()}`);
        paths
            .attr("d", linkPath)
            // .style('display',d=>((d.source.name==='')||(d.target.name===''))?'none':null)
            .attr("fill", d => color(d.names[0]))
            .attr("fill-opacity", 0.5)
            .attr("stroke-width", 0.1)
            .style("mix-blend-mode", "multiply");
        texts.selectAll("text")
            .data(nodes)
            .join("text")
            .attr("transform", d => `translate(${d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6},${(d.y1 + d.y0) / 2})`)
            .attr("dy", "0.35em")
            .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
            // .style('display',d=>d.name===''?'none':null)
            .text(d => `"${d.name}"`)
            .selectAll('tspan').data(d=>[d])
            .join("tspan")
            .attr("fill-opacity", 0.7)
            .attr("x", 0)
            .attr("y", 14)
            .text(d => `${d.value.toLocaleString()}`);
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
    return master;
}

function getColumnData(data){

    const keys = data.columns;//.slice(2,40).filter(d=>d!=='SystemServiceTag');
    const keysObject = {};
    keys.forEach(k=>{
        keysObject[k] = {key:k,values:{}};
    });
    data.forEach(d=>{
        keys.forEach(k=>keysObject[k].values[d[k]]=(keysObject[k].values[d[k]]??0)+1)
    });

    // const svg = d3.select(divID)
    //     .attr("viewBox", [0, 0, width, height]);

    let dataViz = Object.values(keysObject);
    dataViz.forEach(d=>{
        d.values = Object.keys(d.values).map(e=>{
            const item = {key:e,value:d.values[e]};
            return item;
        })
    });
    // const color = {};
    return {_columns:dataViz,_columnsObj:keysObject};
}
