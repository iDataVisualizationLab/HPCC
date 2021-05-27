var timeArcopt = {width:1400,height:700, margin: {top: 10, right: 10, bottom: 0, left: 350},
    offset: {top: 0}};
let TreeLayout = function (){
    let graphicopt = {
        contain: '#Chartcontent',
        offset: {top: 0},
        margin: {top: 30, right: 120, bottom: 30, left: 40},
        width: 1000,
        height: 800,
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
        scatterplot:{
            margin: {top: 0, right: 0, bottom: 0, left: 0},
            width: 36,
            height: 36,
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
            }
        },
        display: {
            links: {
                'stroke-opacity': 0.7
            },
            stream:{
                yScale: d3.scaleLinear().range([0,20]),
                yScaleUp: d3.scaleLinear().domain([0,1-650/800]).range([0,20]),
                yScaleDown: d3.scaleLinear().domain([-650/800,0]).range([-15,0]),
            }
        },
        userStreamMode:'Power',
        dx:20,
        dy:159,
        // display: {
        //     links: {
        //         'stroke-opacity': 0.5
        //     }
        // },
        selectedOpt: 0
    };
    let scheme={},filterTerm=[];
    let contain = d3.select(graphicopt.contain);
    let svg,g,gLink,gNode,_root,root,tree;
    let diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x)
    let master = {};
    let isFirst = true;
    // let color = d3.scaleLinear()
    //     .range(colorScaleList.scag.slice())
    //     .interpolate(d3.interpolateHcl);
    // color.domain(color.range().map((d,i)=>i/(color.range().length-1)));

    let userIcon = {close:`<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-person-plus-fill" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" d="M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.5-3a.5.5 0 0 1 .5.5V7h1.5a.5.5 0 0 1 0 1H14v1.5a.5.5 0 0 1-1 0V8h-1.5a.5.5 0 0 1 0-1H13V5.5a.5.5 0 0 1 .5-.5z"/>
</svg>`,open:`<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-person-dash-fill"  xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" d="M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm5-.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5z"/>
</svg>`}
    let jobIcon = {close:`<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-briefcase-fill" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" d="M0 12.5A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5V6.85L8.129 8.947a.5.5 0 0 1-.258 0L0 6.85v5.65z"/>
  <path fill-rule="evenodd" d="M0 4.5A1.5 1.5 0 0 1 1.5 3h13A1.5 1.5 0 0 1 16 4.5v1.384l-7.614 2.03a1.5 1.5 0 0 1-.772 0L0 5.884V4.5zm5-2A1.5 1.5 0 0 1 6.5 1h3A1.5 1.5 0 0 1 11 2.5V3h-1v-.5a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5V3H5v-.5z"/>
</svg>`,open:`<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-briefcase" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" d="M0 12.5A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-6h-1v6a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-6H0v6z"/>
  <path fill-rule="evenodd" d="M0 4.5A1.5 1.5 0 0 1 1.5 3h13A1.5 1.5 0 0 1 16 4.5v2.384l-7.614 2.03a1.5 1.5 0 0 1-.772 0L0 6.884V4.5zM1.5 4a.5.5 0 0 0-.5.5v1.616l6.871 1.832a.5.5 0 0 0 .258 0L15 6.116V4.5a.5.5 0 0 0-.5-.5h-13zM5 2.5A1.5 1.5 0 0 1 6.5 1h3A1.5 1.5 0 0 1 11 2.5V3h-1v-.5a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5V3H5v-.5z"/>
</svg>`}
    let layout={};
    let yUpperScale, yDownerScale, yScale, xScale;
    var area_compute = d3.area()
        .curve(d3.curveCatmullRom)
        .x(function (d) {
            return xScale(d.timestep);
        })
        .y0(function (d) {
            return - yScale(d.value[0]);
        })
        .y1(function (d) {
            return - yScale(d.value[1]);
        })
        .defined(function (d) {
            return d && d.value[0] !== undefined
        });
    var area_compute_up = d3.area()
        .curve(d3.curveCatmullRom)
        .x(function (d) {
            return xScale(d.timestep);
        })
        .y0(function (d) {
            return - yUpperScale(d.value[0]);
        })
        .y1(function (d) {
            return - yUpperScale(d.value[1]);
        })
        .defined(function (d) {
            return d && d.value[0] !== undefined
        });
    var area_compute_down = d3.area()
        .curve(d3.curveCatmullRom)
        .x(function (d) {
            return xScale(d.timestep);
        })
        .y0(function (d) {
            return - yDownerScale(d.value[0]);
        })
        .y1(function (d) {
            return - yDownerScale(d.value[1]);
        })
        .defined(function (d) {
            return d && d.value[0] !== undefined
        });
    let summary = {user: 0, compute: 0, rack: 0}; // todo auto detect group
    let drawThreshold = 650/800;
    let catergogryObject = {};
    let catergogryList = [];
    let class2term = {};
    let term2class = {};


    master.reset = function(){

        return master;
    };
    master.mouseover = [];
    master.mouseover.dict={};
    master.mouseout = [];
    master.mouseout.dict={};
    master.click = [];
    master.click.dict={};
    master.mouseoverAdd = function(id,func){
        if (master.mouseover.dict[id]!==undefined)
            master.mouseover[master.mouseover.dict[id]] = func;
        else {
            master.mouseover.push(func);
            master.mouseover.dict[id] = master.mouseover.length-1;
        }
    }
    master.mouseoutAdd = function(id,func){
        if (master.mouseout.dict[id]!==undefined)
            master.mouseout[master.mouseout.dict[id]] = func;
        else {
            master.mouseout.push(func)
            master.mouseout.dict[id] = master.mouseout.length-1;
        }
    }
    master.clickAdd = function(id,func){
        if (master.click.dict[id]!==undefined)
            master.click[master.click.dict[id]] = func;
        else {
            master.click.push(func)
            master.click.dict[id] = master.click.length-1;
        }
    }
    master.init = function () {
        svg = contain.select('svg');
        if (svg.empty()){
            svg=contain.append('svg').attr('class','svg-main')
                .attr("viewBox", [-graphicopt.margin.left, -graphicopt.margin.top, graphicopt.width, graphicopt.dx])
                .style('width','100%')
                .style("font", "10px sans-serif")
                .style("user-select", "none");
            gLink = svg.append("g")
                .attr("fill", "none")
                .attr("stroke", "#555")
                .attr("stroke-opacity", 0.4)
                .attr("stroke-width", 1.5);

            gNode = svg.append("g")
                .attr("cursor", "pointer")
                .attr("pointer-events", "all");
        }
        graphicopt.dy = graphicopt.widthG()/6;
        tree = d3.tree().nodeSize([graphicopt.dx, graphicopt.dy]);
        return master;
    };
    function updatelayerpath(p) {
        return p
            .style('fill', d => d.color || 'unset')
            .attr("d", function (d) {
                if (graphicopt.minMaxStream)
                    return area_compute(d.value);
                else
                    return d.up ? area_compute_up(d.value) : area_compute_down(d.value);
            });
    }
    function getDrawData(n) {

        if (graphicopt.minMaxStream) {
            n.noneSymetric = true;
            const drawData = [{
                node: n, value: n.monthly.map((d, ti) => {
                    if (scheme.data.emptyMap[n.name] && scheme.data.emptyMap[n.name][ti] || d[serviceSelected] === undefined)
                        return {...d, value: [undefined, undefined]};
                    return {...d, value: [d[serviceSelected], d.value[2]]};
                }), color: catergogryObject[n.group].upperColor ?? "rgb(252, 141, 89)",
                up: true
            },
                {
                    node: n, value: n.monthly.map((d, ti) => {
                        if (scheme.data.emptyMap[n.name] && scheme.data.emptyMap[n.name][ti] || d[serviceSelected] === undefined)
                            return {...d, value: [undefined, undefined]}
                        return {...d, value: [d.value[0], d[serviceSelected]]};
                    }), color: "#4682b482",
                    up: false
                }];
            if (scheme.data.emptyMap[n.name]) {
                drawData.push({
                        node: n, value: n.monthly.map((d, ti) => {
                            if (!scheme.data.emptyMap[n.name][ti] || d[serviceSelected] === undefined)
                                return {...d, value: [undefined, undefined]}
                            return {...d, value: [d[serviceSelected], d.value[2]]};
                        }), color: "rgb(221,221,221)",
                        up: true
                    },
                    {
                        node: n, value: n.monthly.map((d, ti) => {
                            if (!scheme.data.emptyMap[n.name][ti] || d[serviceSelected] === undefined)
                                return {...d, value: [undefined, undefined]}
                            return {...d, value: [d.value[0], d[serviceSelected]]};
                        }), color: "rgb(221,221,221)",
                        up: false
                    })
            }
            n.drawData = drawData;
        } else {
            debugger
            n.noneSymetric = true;
            const drawData = [{
                node: n, value: n.valueRaw.map((d, ti) => {
                    if (scheme.data.emptyMap[n.name] && scheme.data.emptyMap[n.name][ti] || d[serviceSelected] === undefined)
                        return {...d, value: [undefined, undefined]}
                    if ((d[serviceSelected] - drawThreshold) > 0) {
                        return {...d, value: [0, d[serviceSelected] - drawThreshold]};
                    }
                    const mon = new Object();
                    mon.value = [0, 0];
                    mon.timestep = d.timestep;
                    return mon;
                }), color: catergogryObject[n.group].upperColor ?? "rgb(252, 141, 89)",
                up: true
            },
                {
                    node: n, value: n.valueRaw.map((d, ti) => {
                        if (scheme.data.emptyMap[n.name] && scheme.data.emptyMap[n.name][ti] || d[serviceSelected] === undefined)
                            return {...d, value: [undefined, undefined]}
                        if ((d[serviceSelected] - drawThreshold) < 0)
                            return {...d, value: [d[serviceSelected] - drawThreshold, 0]};
                        const mon = new Object();
                        mon.value = [0, 0];
                        mon.timestep = d.timestep;
                        return mon;
                    }), color: "#4682b482",
                    up: false
                }];
            if (scheme.data.emptyMap[n.name]) {
                drawData.push({
                        node: n, value: n.valueRaw.map((d, ti) => {
                            if (!scheme.data.emptyMap[n.name][ti] || d[serviceSelected] === undefined)
                                return {...d, value: [undefined, undefined]}
                            if ((d[serviceSelected] - drawThreshold) > 0) {
                                return {...d, value: [0, d[serviceSelected] - drawThreshold]};
                            }
                            const mon = new Object();
                            mon.value = [0, 0];
                            mon.timestep = d.timestep;
                            return mon;
                        }), color: "rgb(221,221,221)",
                        up: true
                    },
                    {
                        node: n, value: n.valueRaw.map((d, ti) => {
                            if (!scheme.data.emptyMap[n.name][ti] || d[serviceSelected] === undefined)
                                return {...d, value: [undefined, undefined]}
                            if ((d[serviceSelected] - drawThreshold) < 0)
                                return {...d, value: [d[serviceSelected] - drawThreshold, 0]};
                            const mon = new Object();
                            mon.value = [0, 0];
                            mon.timestep = d.timestep;
                            return mon;
                        }), color: "rgb(221,221,221)",
                        up: false
                    })
            }
            n.drawData = drawData;
        }
    }
    function drawElement(svg,data){
        debugger
        getDrawData(data);
        let layerpath = svg.selectAll('path.layerpath')
            .data(data.drawData)
            .join('path')
            .attr('class', 'layerpath')
            .call(updatelayerpath);
    }
    function drawLargeElement(contain,data){
        const scale = 8;
        const width = graphicopt.scatterplot.width*scale;
        const height = graphicopt.scatterplot.height*scale;
        const w = graphicopt.scatterplot.widthG()*scale;
        const h = graphicopt.scatterplot.heightG()*scale;
        const margin = {};
        d3.entries(graphicopt.scatterplot.margin).forEach(k=>margin[k]*scale);
        const line = d3.line().x(d=>d[0]*w).y(d=>h*(1-d[1]))
            .curve(d3.curveCatmullRom.alpha(0.5))
            .defined(d=>d&&(_.isNumber(d[0])&&_.isNumber(d[1])));
        contain.select('g.content').remove();
        let svg = contain.datum(data).style('border','1px solid gray')
            .style('background-color',d=>color(d.measure)).attr('width',width).attr('height',height)
            .style('width',width+'px').style('height',height+'px')
            .style('overflow','visible');
        g = svg.append('g').attr('class','content').attr('transform',`translate(${[margin.left,margin.top]})`);
        g.selectAll('path').data([data.value])
            .join('path')
            .attr('d',line)
            .attr('fill','none').attr('stroke','#4c4c4c');
        const pointdata = data.value.filter(d=>d&&(_.isNumber(d[0])&&_.isNumber(d[1])))
        g.selectAll('circle').data(pointdata)
            .join('circle')
            .attr('r',2)
            .attr('cx',d=>d[0]*w)
            .attr('cy',d=>h*(1-d[1]))
            .attr('opacity',(d,i)=>i===(pointdata.length-1)?1:0.2)
            .attr('fill',(d,i)=>i===(pointdata.length-1)?'green':'black');
        g.append('text').attr('x',w/2).attr('y',h/2)
            .attr('text-anchor','middle')
            .text(d3.format('.2f')(data.measure));
    }
    master.stop = function (){

    };

    master.draw = function () {
        if (isFirst) {
            master.init();
            isFirst = false;
        }
        yUpperScale = graphicopt.display.stream.yScaleUp;
        yDownerScale = graphicopt.display.stream.yScaleDown;

        // filterNode();
        update(root)

        updateProcess();
    };
    function filterNode(){
        debugger
        const filteredData = {...scheme.data};
        filteredData.children = [];
        // scheme.data.children.forEach(u=>{
        //     u.
        // })
        //
        // root
    }
    function update(source){
        const duration = d3.event && d3.event.altKey ? 2500 : 250;
        const nodes = root.descendants().reverse();
        const links = root.links();

        // Compute the new tree layout.
        tree(root);
        root.leaves().forEach(d=>{
            if (d.data.svg)
                d.y = d.y-graphicopt.dy+10
        })

        let left = root;
        let right = root;
        root.eachBefore(node => {
            if (node.x < left.x) left = node;
            if (node.x > right.x) right = node;
        });

        const height = right.x - left.x + graphicopt.margin.top + graphicopt.margin.bottom;

        const transition = svg.transition()
            .duration(duration)
            .attr("viewBox", [-graphicopt.margin.left, left.x - graphicopt.margin.top, graphicopt.width, height])
            .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));

        // Update the nodes…
        const node = gNode.selectAll("g.el")
            .data(nodes, d => d.id);

        // Enter any new nodes at the parent's previous position.
        const nodeEnter = node.enter().append("g")
            .attr('class','el')
            .attr("transform", d => `translate(${source.y0},${source.x0})`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0)
            .on("click", (d) => {
                d.children = d.children ? null : d._children;
                updateIcon(d);
                update(d);
            });
        function updateIcon(d){
            switch (d.data.type) {
                case 'user':
                    d.icon.html(d => d.children ? userIcon.open : userIcon.close);
                    break;
                case 'job':
                    d.icon.html(d => d.children ? jobIcon.open : jobIcon.close);
                    break;
                default:
                    d.icon.attr("fill", d => d._children ? (d.children?"#fff":"#555") : "#999")
                        .attr("stroke", d => d._children&&d.children?"#000":null)
                        .attr("stroke-width", d => 1)
                    break
            }
        }
        nodeEnter.filter(d=>(!d.data.svg) && (!d.data.type)).append("circle")
            .attr("r", 2.5)
            .attr("fill", d => d._children ? (d.children?"#fff":"#555") : "#999")
            // .attr("stroke-width", 10)
            .each(function(d){d.icon=d3.select(this);})
        nodeEnter.filter(d=>d.data.type).append("svg")
            .attr("y",-8)
            .attr("fill", d => d._children ? "#555" : "#999")
            .each(function(d){d.icon=d3.select(this);
            updateIcon(d);});
        nodeEnter.filter(d=>d.data.svg)
            .selectAll('g.scatter')
            .data(d=> d.data.svg)
            .enter()
                .append('g')
                .attr('class','scatter')
                // .attr('transform',d=>`translate(${d.id*(graphicopt.scatterplot.width+3)+5},${-graphicopt.scatterplot.height/2})`)
                    .append('g')
                    // .append('svg')
                    // .on('click',d=>drawLargeElement(d3.select('#mini_plot'),d))
                    .each(function(d){
                        drawElement(d3.select(this),d);
                    });
        nodeEnter.append("text")
            .attr("graphicopt.dy", "0.31em")
            .attr("x", d => d._children ? -6 : (d.data.value?(6+graphicopt.scatterplot.width):6))
            .attr("text-anchor", d => d._children ? "end" : "start")
            .text(d => d.data.name)
            .clone(true).lower()
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 3)
            .attr("stroke", "white");

        // Transition nodes to their new position.
        const nodeUpdate = node.merge(nodeEnter);
        nodeUpdate.transition(transition)
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .attr("fill-opacity", 1)
            .attr("stroke-opacity", 1);
        if (isNeedRender){
            const svgG = nodeUpdate.filter(d=>d.data.svg)
            .selectAll('g.scatter')
            .data(d=> d.data.svg,d=>d.plotID)
            .join('g')
            .attr('class','scatter');
            svgG.transition(transition)
            .attr('transform',d=>`translate(${d.id*(graphicopt.scatterplot.width+3)+5},${-graphicopt.scatterplot.height/2})`)
            svgG.selectAll('svg')
            .data(d=>[d])
            .join(svg)
            .on('click',d=>drawLargeElement(d3.select('#mini_plot'),d))
            .each(function(d){
                drawElement(d3.select(this),d);
            });
        }
        // Transition exiting nodes to the parent's new position.
        const nodeExit = node.exit().transition(transition).remove()
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0);

        // Update the links…
        const link = gLink.selectAll("path")
            .data(links, d => d.target.id);

        // Enter any new links at the parent's previous position.
        const linkEnter = link.enter().append("path")
            .attr("d", d => {
                const o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            });

        // Transition links to their new position.
        link.merge(linkEnter).transition(transition)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition(transition).remove()
            .attr("d", d => {
                const o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
            });

        // Stash the old positions for transition.
        root.eachBefore(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });
        isNeedRender = false
    }
    master.graphicopt = function (__) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in __) {
                if ('undefined' !== typeof __[i]) {
                    graphicopt[i] = __[i];
                }
            }
            return master;
        }else {
            return graphicopt;
        }

    };
    let isNeedRender = true;
    master.scheme = function (__) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in __) {
                if ('undefined' !== typeof __[i]) {
                    scheme[i] = __[i];
                }
            }
            if (__.data){
                debugger
                root = d3.hierarchy(scheme.data);
                root.x0 = graphicopt.dy / 2;
                root.y0 = 0;
                root.descendants().forEach((d, i) => {
                    d._children=d.children;
                    d.id = i;
                    // if (d.data.svg!==undefined){
                    //
                    // }
                    if (d.depth>0)
                        d.children = null;
                });
                xScale = d3.scaleLinear().domain(__.data.timeRange).range([0,graphicopt.widthG()*2/3]);
            }
            return master;
        }else {
            return scheme;
        }

    };

    master.getColorScale = function(_data) {
        return arguments.length?(getColorScale=_data?_data:function(){return color},master):getColorScale;
    };
    master.filterTerms = function(_) {
        return arguments.length?(filterTerm=_,master):filterTerm;
    };
    master.layout = function(d){
        layout = {};
        d.forEach(k=>layout[k.Name]= _.flatten(k.value).filter(d=>d))
    };
    master.catergogryList = function (_) {
        return arguments.length ? (catergogryList = _, catergogryObject = {}, summary = {}, catergogryList.forEach(c => {
            catergogryObject[c.key] = c.value;
            summary[c.key] = 0
        }), master) : catergogryList;
    };
    master.drawThreshold = function (_) {
        // return arguments.length ? (drawThreshold = _, timeArc.updateDrawData(), timeArc) : drawThreshold;
        return arguments.length ? (drawThreshold = _,  master) : drawThreshold;
    };
    return master;
};
function handle_data_timeArc () {
    const graphicopt = subObject.graphicopt();
    const keys = Layout.timespan//.slice(0,10);
    let scheme ={limitColums : [0,10],
        limitTime : [keys[0],keys[keys.length-1]],
        time: {rate:5,unit:'Minute'},
        // timeLink: {rate:5,unit:'Minute'},
        timeformat: d3.timeDay.every(1),
    };
    scheme.data={name:'hpc',children:[]};
    scheme.data.timespan = keys;
    const selectedService = ['CPU1 Temp','Memory usage'];
    scheme.data.selectedService = selectedService;
    // let userlist = ['hge', 'presmcdo', 'adegbalo', 'juandomi'];
    // let userlist = ['hge'];
    let userlist = Object.keys(Layout.usersStatic);
    userlist.sort((a,b)=>Layout.usersStatic[b].summary[serviceSelected].mean-Layout.usersStatic[a].summary[serviceSelected].mean)
    scheme.range = [[Infinity,-Infinity],[Infinity,-Infinity]];
    const dataArray = [];
    userlist.forEach(u=>{
        const datauser = {
            name: u, type:"user", children:
                Layout.usersStatic[u].jobMain
                    .map(j => {
                        if (Layout.jobsStatic[j])
                            return addComp(u,j);
                        else
                            return {name: j, children: Layout.usersStatic[u].job.map(j=>addComp(u,j))};
                    }
                    )
        };
        scheme.data.children.push(datauser);
    });
    function addComp(u,j){
        return {
            name: Layout.jobsStatic[j].job_name, children: Layout.jobsStatic[j].node_list.map((comp,i) => {
                return {name: comp, svg: [ {
                        // id:i, name: comp, jobID: j, user:u, group:'compute', valueRaw: tsnedata[comp]
                        id:i, name: comp, jobID: j, user:u, group:'compute', valueRaw: Layout.jobarrdata[j].map((d,i)=>d?tsnedata[comp][i]:undefined)
                    }]}
            })
        }
    }
    scheme.data.emptyMap=Layout.noJobMap;
    scheme.data.timeRange=[0,Layout.timespan.length-1];
    const catergogryList=[{key: 'job', value: {customcolor: 'red',upperColor:'red'}},{key: 'compute', value: {customcolor: 'black'}},{key: 'user', value: {customcolor: 'purple',upperColor:'purple'}}];
    subObject.scheme(scheme).catergogryList(catergogryList).draw();
}
