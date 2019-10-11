let JobMap = function() {
    let graphicopt = {
            margin: {top: 20, right: 0, bottom: 0, left: 0},
            width: 250,
            height: 50,
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
        },runopt={compute:{setting:'pie'},graphic:{colorBy:'user'}},radarcreate,tableData={},tableHeader=[],tableFooter = [],colorscale,
        svg, g, table_headerNode,first = true,
        dataRaw=[],data = [],arr=[],
        Hosts = []
    ;
    tableFooter.dataRaw =[];
    let jobMap = {};
    let simulation;
    let timebox,linkg,nodeg,schema=[];
    let fisheye_scale = {x:fisheye.scale(d3.scaleLinear),y:fisheye.scale(d3.scaleLinear)};
    let freezing=false;
    function freezinghandle(path,mouseOver,mouseLeave){
        path.on('click',function(d){
            let hightlight_item = path.filter(function(){return d3.select(this).classed('highlight')});
            freezing = !freezing;
            if (freezing){
                g.selectAll('.node:not(.highlight)').style('pointer-events','none'); // disable all click event
                // hightlight_item.on('mouseover',mouseOver[1]);
                // hightlight_item.on('mouseleave',mouseLeave[1]);
            }else{
                g.selectAll('.node:not(.highlight)').style('pointer-events','auto');
                // hightlight_item.on('mouseover', function(d){
                //     if(!freezing)
                //         _.bind(mouseOver[0],this)(d);
                // }).on('mouseleave',function(d){
                //     if(!freezing)
                //         _.bind(mouseLeave[0],this)(d);
                // });
            }
        });
        if (!freezing) {
            path.on('mouseover', function(d){
                if(!freezing)
                    _.bind(mouseOver[0],this)(d);
            }).on('mouseleave',function(d){
                if(!freezing)
                    _.bind(mouseLeave[0],this)(d);
            });
        }
        return path;
    }
    jobMap.init = function () {
        // fisheye_scale.x= fisheye.scale(d3.scaleIdentity).domain([0,graphicopt.widthG()]).focus(graphicopt.widthG()/2);
        fisheye_scale.y= fisheye.scale(d3.scaleIdentity).domain([0,graphicopt.heightG()]).focus(graphicopt.heightG()/2);
        var rScale = d3.scaleLinear()
            .range([0, graphicopt.radaropt.w/2])
            .domain([-0.25, 1.25]);
        radarcreate = d3.radialLine()
            .curve(d3.curveCardinalClosed.tension(0.5))
            .radius(function(d) {
                return rScale(d.value); })
            .angle(function(d) {
                return schema.find(s=>s.text===d.axis).angle; });

        svg.attrs({
            width: graphicopt.width,
            height: graphicopt.height,

        });
        let svdefs = svg.select('defsmain');
        if ( svdefs.empty())
            svdefs = svg.append('defs').attr('id','defsmain');
        if(svdefs.select('#userpic').empty())
            svdefs.append('pattern')
                .attrs({'id':'userpic',width:'100%',height:'100%','patternContentUnits':'objectBoundingBox'})
                .append('image')
                .attrs({'height':1,width:1,preserveAspectRatio:'none',
                    'xmlns:xlink':'http://www.w3.org/1999/xlink','xlink:href':'src/images/u.png'});

        svg.append('rect').attr('class','pantarget')
            .attrs({
                'opacity':0,
                width: graphicopt.width,
                height: graphicopt.height,
            }).call(d3.zoom().on("zoom", function () {
                // fisheye_scale.x.domain([0,graphicopt.widthG()*d3.event.transform.k]);
                // fisheye_scale.y.domain([0,graphicopt.heightG()*d3.event.transform.k]);
            g.attr("transform", d3.event.transform);
        }));

        g = svg.append("g")
            .attr('class','pannel')
            .attr('transform',`translate(${graphicopt.margin.left},${graphicopt.margin.top})`);
        g.append('g').attr('class','gNodeaxis hide').attr('transform',`translate(200,0)`);
        linkg = g.append("g")
            .attr('class','linkg');
        nodeg = g.append("g")
            .attr('class','nodeg');
        g.append("rect")
            .attr('class','fisheyeLayer')
            .style('opacity',0)
            .style('pointer-events', runopt.lensing?'auto':'none');
        table_headerNode = g.append('g').attr('class', 'table header').attr('transform', `translate(600,${0})`);
        timebox = svg.append('text').attr('class','timebox')
            .attr('x',graphicopt.margin.left)
            .attr('y',graphicopt.margin.top)
            .style('font-size','16px').attr('dy','1rem');

        return jobMap;
    };
    jobMap.remove = function (){
        if (simulation) simulation.stop();
        nodeg.selectAll('*').remove();
        linkg.selectAll('*').remove();
        violinRange = [0,0];
        first = true;
        return jobMap;
    };
    let colorCategory  = d3.scaleOrdinal().range(d3.schemeCategory20);
    let colorCluster  = d3.scaleOrdinal().range(d3.schemeCategory10);

    function colorFunc (key,other){
        switch (runopt.graphic.colorBy+(other||'')) {
            case 'user':
                return colorCategory(key);
            case 'group':
                return key===undefined?'black':colorCluster(key);
            default:
                return 'black';
        }
    }

    function createRadar(datapoint, bg, newdata, colorfill) {
        if (datapoint.empty()) {
            datapoint = bg
                .append("g")
                .datum(d => newdata.find(n => n.name === d.name))
                .attr("class", d => "compute linkLineg " + fixName2Class(d.name));
            datapoint.append("clipPath")
                .attr("id", d => "tSNE" + fixName2Class(d.name))
                .append("path")
                .attr("d", d => radarcreate(d));
            datapoint
                .append("rect")
                .style('fill', 'url(#rGradient)')
                .attr("clip-path", d => "url(#tSNE" + fixName2Class(d.name) + ")")
                .attr("x", -graphicopt.radaropt.w / 2)
                .attr("y", -graphicopt.radaropt.h / 2)
                .attr("width", graphicopt.radaropt.w)
                .attr("height", graphicopt.radaropt.h);
            datapoint
                .append("path")
                .attr("class", "tSNEborder")
                .attr("d", d => radarcreate(d))
                .style("stroke", 'black')
                .style("stroke-width", 0.5)
                .style("stroke-opacity", 0.5).style("fill", "none");
        } else {
            datapoint.select('clipPath').select('path')
                .transition('expand').duration(100).ease(d3.easePolyInOut)
                .attr("d", d => radarcreate(d.filter(e => e.enable)));
            datapoint.select('.tSNEborder')
                .transition('expand').duration(100).ease(d3.easePolyInOut)
                .attr("d", d => radarcreate(d.filter(e => e.enable)));
        }
        if (colorfill) {
            datapoint.select("rect").style('display', 'none');
            datapoint.select('.tSNEborder').style('fill', d => colorFunc(d.name)).style('fill-opacity', 0.5);
        } else {
            datapoint.select("rect").style('display', 'unset')
            datapoint.select('.tSNEborder').style('fill', 'none')
        }
        return datapoint;
    }

    function drawEmbedding(data,colorfill) {
        let newdata =handledata(data);
        let bg = svg.selectAll('.computeSig');
        let datapointg = bg.select(".radar")
            .datum(d=>newdata.find(n=>n.name === d.name));
        if (datapointg.empty())
            datapointg = bg.append('g').attr('class','radar').datum(d=>newdata.find(n=>n.name === d.name));

        createRadar(datapointg.select('.linkLineg'), datapointg, newdata, colorfill);

    }
    let timelineScale = d3.scaleLinear().range([-10,0]);
    function drawEmbedding_timeline(data,colorfill) {

        // xscale
        let newdata = handledata(data);
        let bg = svg.selectAll('.computeSig');
        let lensingLayer=  g.select('.fisheyeLayer');
        if (!lensingLayer.on("mousemove"))
            lensingLayer.on("mousemove", function() {
                let mouse = d3.mouse(this);
                if(runopt.compute.type==="timeline"){
                    fisheye_scale.x= fisheye.scale(d3.scaleIdentity).domain([-10*timelineScale.domain()[1],0]).focus(mouse[0]-(+lensingLayer.attr('width')));
                    drawEmbedding_timeline(data,colorfill);
                }
            }).on("mouseleave",function () {
                if(runopt.compute.type==="timeline"){
                    fisheye_scale.x = d=>d;
                    drawEmbedding_timeline(data,colorfill);
                }
            });

        let datapoint = bg.selectAll(".linkLinegg").data(d=>d.timeline.clusterarr.map(e=>{temp=_.cloneDeep(newdata.find(n=>n.name === e.cluster)); temp.name= e.cluster;temp.timestep = e.timestep; return temp;}));
        datapoint.exit().remove();
        datapoint = datapoint.enter().append('g')
            .attr('class','linkLinegg timeline')
        .merge(datapoint);
        datapoint.each(function(d,i){
            createRadar(d3.select(this).select('.linkLineg'), d3.select(this), newdata, colorfill).classed('hide',i?false:true);// hide 1st radar
        });
        datapoint.attr('transform',function(d){
            return `translate(${fisheye_scale.x(timelineScale(d.timestep))},0)`});

        bg.style('stroke-width', d=>linkscale(d.values_name.length));
        bg.select(".invisibleline").remove();
        bg.append('line').attr('class',"invisibleline").attrs(function(d){
            let parentndata = d3.select(this.parentNode.parentNode).datum();
            return {
                'x1':fisheye_scale.x(timelineScale(timelineScale.domain()[1])),
                'x2':fisheye_scale.x(timelineScale(0)),
                'stroke-width': 5,
                'opacity':0
            };
        });
        let dataline = bg.selectAll(".linegg").data(d=>d.timeline.line);
        dataline.exit().remove();
        dataline = dataline.enter().append('line')
            .attr('class','linegg timeline')
            .merge(dataline)
            .attrs(function(d){
                let parentndata = d3.select(this.parentNode.parentNode).datum();
                return{
                x1: d=>fisheye_scale.x(timelineScale(d.end)),
                x2: d=>fisheye_scale.x(timelineScale(d.start)),
            }}).styles({
                stroke: d=>colorFunc(d.cluster),
            });

        bg.on('mouseover',function(d){
            if (freezing) {
                let maxstep = d3.max(clusterdata, c => c.arr.length) - 1;
                let layout = tooltip_lib.layout();
                layout.axis.x.domain = [[first__timestep, last_timestep]];
                const scaletime = d3.scaleTime().domain(layout.axis.x.domain[0]).range([0, maxstep]);
                layout.axis.y.label = [];
                layout.axis.y.domain = [];
                layout.axis.y.tickFormat = [];
                layout.background = {
                    type: 'discrete',
                    value: d.timeline.clusterarr.map((v, i) => {
                        return {
                            x0: scaletime.invert(v.timestep),
                            x1: d.timeline.clusterarr[i + 1] ? scaletime.invert(d.timeline.clusterarr[i + 1].timestep) : undefined,
                            color: colorFunc(v.cluster)
                        }
                    })
                };
                layout.background.value[layout.background.value.length - 1].x1 = last_timestep;
                const data_in = schema.map(s => {
                    let scaleY = d3.scaleLinear().range(s.range);
                    let data_temp = d.values_name.map(h => {
                        let temp = hostOb[h].data.map(e => {
                            return {
                                y: scaleY(e.find(a => a.axis === s.text).value),
                                x: e.time,
                            }
                        });
                        temp.label = h;
                        return temp;
                    });
                    layout.axis.y.label.push(s.text);
                    layout.axis.y.domain.push(s.range);
                    if (s.range[1] > 1000)
                        layout.axis.y.tickFormat.push(d3.format('~s'));
                    else
                        layout.axis.y.tickFormat.push(null);
                    return data_temp;
                });

                // layout.title = `User: ${username}`;
                layout.title2 = `#compute: ${d.values_name.length}`;

                tooltip_lib.graphicopt({width: tooltip_opt.width, height: 100}).data(data_in).layout(layout).show();
            }
        });

        updateaxis();
    }

    function updateaxis() {
        let bg = svg.selectAll('.computeSig');
        let rangey = d3.extent(bg.data(),d=>d.y2||d.y);
        let scale = d3.scaleTime().range([timelineScale(0),timelineScale(timelineScale.domain()[1])]).domain([first__timestep,last_timestep]);
        let axis = svg.select('.gNodeaxis')
            .classed('hide',false)
            .attr('transform',`translate(${bg.datum().x2||bg.datum().x},${rangey[0]})`)
            .call(d3.axisTop(scale).tickSize(rangey[0]-rangey[1]));
        axis.select('.domain').remove();
        axis.selectAll('.tick').attr('transform',d=>`translate(${fisheye_scale.x(scale(d))},0)`)
    }

    jobMap.drawComp = function (){
        switch(runopt.compute.type){
            case "radar":
                svg.selectAll('.computeNode').selectAll('.piePath').remove();
                svg.selectAll('.computeNode').selectAll('.timeline').remove();
                svg.select('.gNodeaxis').classed('hide',true);
                if (clusterNode_data){
                    drawEmbedding(clusterNode_data.map(d=>{let temp = d.__metrics.normalize;temp.name = d.name; return temp;}),runopt.graphic.colorBy==='group')
                }else {
                    if (arr.length)
                        drawEmbedding(arr)
                }
                break;
            case "timeline":
                svg.selectAll('.computeNode').selectAll('.piePath').remove();
                svg.selectAll('.computeNode').selectAll('.radar').remove();
                drawEmbedding_timeline(clusterdata.map(d=>{let temp = d.__metrics.normalize;temp.name = d.name; return temp;}),true);
                break;
            case "pie":
            default:
                svg.select('.gNodeaxis').classed('hide',true);
                svg.selectAll('.computeNode').selectAll('.timeline').remove();
                svg.selectAll('.computeNode').selectAll('.radar').remove();
                drawPie(svg.selectAll('.computeNode'));
                break;
        }
        return jobMap;
    };

    function handledata(data){
        let objectarr = data.map(a=>{
            let temp = a.map((d,i)=>{return {axis: schema[i].text, value: d, enable: schema[i].enable};});
            temp = _.sortBy(temp,d=>schema.find(e=>e.text===d.axis).angle);
            temp.name = a.name;
            return temp;
        });
        return objectarr;
    }

    function drawPie(computers) {
        computers.select('.computeSig').select('.linkLineg').remove();
        var arc = d3.arc()
            .outerRadius(graphicopt.node.r)
            .innerRadius(0);
        let pie = d3.pie()
            .value(function (d) {
                return d.value;
            })
            .sort(function (a, b) {
                return d3.ascending(a.order, b.order);
            })

        let piePath = computers
            .select('.computeSig')
            .selectAll('.piePath').data(d => {
                let tempdata = d.user.map(e => {
                    return {
                        value: e.unqinode_ob[d.name].length,
                        order: e.order,
                        user: e.name,

                    }
                });
                return pie(tempdata)
            });
        piePath.exit().remove();
        piePath.enter().append('path').attr('class', 'piePath')
            .attr('d', arc).style('fill', d => colorFunc(d.data.user,getsubfixcolormode()));
    }
    function getsubfixcolormode(){
        return runopt.graphic.colorBy==='group'?'_no':undefined;
    }
    let yscale,linkscale = d3.scaleSqrt().range([0.25,3]);
    let scaleNode = d3.scaleLinear();
    let scaleNode_y = d3.scaleLinear();
    let scaleJob = d3.scaleLinear();
    let Jobscale = d3.scaleSqrt().range([0.5,3]);

    function renderManual(computers, jobNode, link) {

        jobNode.data().sort((a, b) => user.find(e => e.key === a.user).order - user.find(e => e.key === b.user).order).forEach((d, i) => d.order = i);
        jobNode.transition().attr('transform', d => {
            d.x2 = 430;
            d.y = scaleJob(d.order);
            return `translate(${d.x2},${d.y})`
        });
        let temp_link = link.data().filter(d => d.target.type === 'job');
        computers.data().forEach(d => d.y = d3.mean(temp_link.filter(e => e.source.name === d.name), f => f.target.y))
        computers.data().sort((a, b) => a.y - b.y).forEach((d, i) => d.order = i);
        if (runopt.compute.type==='timeline') {
            // scaleNode_y_midle = d3.scaleLinear().range([yscale.range()[1] / 2, yscale.range()[1] / 2 + 10]).domain([computers.data().length / 2, computers.data().length / 2 + 1])
            scaleNode_y_midle = d3.scaleLinear().range(yscale.range()).domain([0, computers.data().length-1])
            computers.transition().attr('transform', d => {
                    d.x2 = 300;
                    d.y2 = scaleNode_y_midle(d.order);
                return `translate(${d.x2},${d.y2 || d.y})`
            });
            updateaxis();
            let lensingLayer=  g.select('.fisheyeLayer');
            lensingLayer.attrs({
                'width':timelineScale(timelineScale.domain()[1])-timelineScale(0),
            }).attr('height',scaleNode_y_midle(computers.data().length-1)-scaleNode_y_midle(0));
            lensingLayer.attr('transform',`translate(${300-(+lensingLayer.attr('width'))},${scaleNode_y_midle(0)})`)
        }else {
            // computers.data().sort((a, b) => b.arr ? b.arr[b.arr.length - 1].length : -1 - a.arr ? a.arr[a.arr.length - 1].length : -1).forEach((d, i) => d.order = i);
            computers.transition().attr('transform', d => {
                d.x = 300;
                d.x2 = 300;
                d.y = scaleNode_y(d.order);
                return `translate(${d.x2},${d.y})`
            });
        }
        link.transition()
            .call(updatelink);
    }
    let last_timestep = new Date();
    function trimNameArray(text){
        let namearr = text.split(' ');
        if (namearr.length<3)
            return namearr.join(', ');
        else{
            nametr = namearr.slice(0,2).join(', ');
            nametr += `, +${namearr.length-2} more`;
            return nametr;
        }
    }
    let linkHorizontal = d3.linkHorizontal()
        .x(function(d) {
            return d.y;
        })
        .y(function(d) {
            return d.x;
        });
    function updatelink (path){
        path.select('path')
            .attr("d", d=>{
                return linkHorizontal({
                    source: {
                        x: d.source.y2 || d.source.y,
                        y: (d.source.x2 || d.source.x)+ (d.source.type==='job'?graphicopt.job.r:0)
                    },
                    target: {
                        x: d.target.y2 || d.target.y,
                        y: (d.target.x2 || d.target.x) - ((d.source.type==='job')||(d.target.type==='job')?graphicopt.user.r:0)
                    }});
            });
        path.select('text').attr("transform", function(d) {
            return "translate(" +
                (((d.source.x2 || d.source.x) + (d.target.x2 || d.target.x))/2) + "," +
                (((d.source.y2 || d.source.y) + (d.target.y2 || d.target.y))/2) + ")";
        })
        return path;
    }
    let maxTimestep;
    jobMap.draw = function (){
        // reset freezing action
        freezing = false;
        g.selectAll('.node').style('pointer-events','auto');
        
        let timeStep = new Date(last_timestep.toString());
        let timeStep_r = last_timestep.toString();
        timebox.html(`<tspan x="10" dy="1.2em">${timeStep.toLocaleTimeString()}</tspan>
                        <tspan x="10" dy="1.2em">Timestep: ${lastIndex+1}/${(maxTimestep===undefined?'_':maxTimestep)}</tspan>`);
        timebox.classed('hide',runopt.compute.type==='timeline')
        yscale = d3.scaleLinear().domain([-1,user.length]).range([0,Math.min(graphicopt.heightG(),30*(user.length))]);
        let deltey = yscale(1)-yscale(0);
        if (runopt.compute.clusterNode&&clusterNode_data)
            scaleNode_y.domain([0,clusterNode_data.length-1]).range(yscale.range());
        scaleJob.domain([0,data.length-1]).range(yscale.range());

        tableLayout.row.height = deltey;
        violiin_chart.graphicopt({height:tableLayout.row.height,color:(i)=>'black'});
        // compute pie
        if(first) {
            makeheader();
            first = false;
        }
        let computers = nodeg.selectAll('.computeNode').data(clusterdata_timeline||clusterNode_data||Hosts,function(d){return d.name});
        computers.select('.computeSig').datum(d=>d);
        computers.exit().remove();
        let computers_n = computers.enter().append('g').attr('class',d=>'node computeNode '+fixName2Class(fixstr(d.name)));

        computers_n.append('g').attrs(
            {'class':'computeSig',
                'stroke':'black',
            });
        computers_n.append('text').attrs(
            {'class':'computeSig_label',
                'display':'none',
                'text-anchor':'end',
                'dx':-graphicopt.node.r,
                'dy':'0.5rem',
                'fill':'black',
            }).merge(computers.select('.computeSig_label')).text(d=>d.text?d.text:trimNameArray(d.name))
        ;

        computers = nodeg.selectAll('.computeNode');
        computers.classed('statics',!!clusterNode_data)


        //job node
        let timerange = [d3.min(data,d=>new Date(d.submitTime)),timeStep];
        timerange[0] = new Date(timerange[0].toDateString());
        timerange[1].setDate(timerange[1].getDate()+1);
        timerange[1] = new Date(timerange[1].toDateString());
        let time_daynum = d3.timeDay.every(1).range(timerange[0],timerange[1]).length;
        var radius = d3.scaleTime()
            .domain(timerange)
            .range([graphicopt.job.r_inside, graphicopt.job.r]);

        var theta = d3.scaleTime()
            .domain(timerange)
            .range([0, Math.PI*2*(time_daynum-1)]);

        var spiral = d3.radialLine()
            .curve(d3.curveCardinal)
            .angle(theta)
            .radius(radius);

        let backdround_spiral = d3.timeHour.every(1).range(timerange[0],timerange[1]);
        let jobNode = nodeg.selectAll('.jobNode').data(data,function(d){return d.name});
        jobNode.exit().remove();
        let jobNode_n = jobNode.enter().append('g').attr('class',d=>'node jobNode '+fixName2Class(fixstr(d.name)));

        jobNode_n.append('circle')
            .attrs(
            {'class':'computeSig_b',
                // 'd': d=>spiral([new Date(d.submitTime),new Date(d.startTime),timeStep]),
                // 'd': d=>spiral(backdround_spiral),
                'r': graphicopt.job.r,
                'fill': '#dddddd',
                'opacity': 0.2,
                'stroke-width':0,
            });
        jobNode_n.append('path')
            .attrs(
            {'class':'computeSig_sub submitTime',
            });
        jobNode_n.append('path')
            .attrs(
                {'class':'computeSig_start timeBoxRunning',
                })
        ;
        jobNode_n.append('text').attr('class','lelftext hide').attrs({'x':-graphicopt.job.r}).style('text-anchor','end');
        jobNode_n.append('text').attr('class','righttext hide').attrs({'x':graphicopt.job.r});
        jobNode = nodeg.selectAll('.jobNode');
        jobNode.select('.computeSig_b').attr('r',graphicopt.job.r);
        jobNode.select('.computeSig_sub.submitTime').attr('d',function(d){
            let temp = d3.timeHour.every(1).range(new Date(d.submitTime),new Date(d.startTime));
            temp.pop();
            temp.push(new Date(d.startTime));
            return spiral(temp);
        })
        ;
        jobNode.select('.computeSig_start.timeBoxRunning') .attr('d',function(d){
            let temp = d3.timeHour.every(1).range(new Date(d.startTime),new Date(timeStep_r.toString()));
            temp.pop();
            temp.push(new Date(timeStep_r.toString()));
            return spiral(temp);
        });
        jobNode.select('.lelftext').text(d=>`#Hosts: ${d.nodes.length}`)
        jobNode.select('.righttext').text(d=>d.values?`#Jobs: ${d.values.length}`:'')

        jobNode.selectAll('path').style('stroke-width',d=>d.values?Jobscale(d.values.length):1.5);

        // table_header(table_headerNode);
        // make table footer
        let table_footerNode = nodeg.select('.table.footer');
        if(table_footerNode.empty())
            table_footerNode = nodeg.append('g').attr('class','table footer').attr('transform',`translate(600,${yscale(user.length)})`);
        table_footer(table_footerNode);

        let userNode = nodeg.selectAll('.userNode').data(user,d=> d.name);
        userNode.exit().remove();
        let userNode_n = userNode.enter().append('g').attr('class',d=>'node userNode '+fixName2Class(fixstr(d.name)));

        updaterow(userNode_n.merge(userNode));

        userNode_n.append('circle').attrs(
            {'class':'userNodeSig',
                'r': graphicopt.user.r,
            });
        userNode_n.append('circle').attrs(
            {'class':'userNodeImg',
                'r': graphicopt.user.r,
                'fill': d=>"url(#userpic)"
            });

        userNode_n.append('text').attrs(
            // {'class':'userNodeSig_label',
            //     'y': -graphicopt.user.r,
            //     'text-anchor':'middle',
            // });
            {'class':'userNodeSig_label',
                'dy': '0.25rem',
                'x': graphicopt.user.r+4,
                // 'text-anchor':'middle',
            });


        userNode=nodeg.selectAll('.userNode');
        userNode.select('.userNodeSig').styles(
            {
                'fill-opacity':0.5,
                'fill': d=>{const color = colorFunc(d.name,getsubfixcolormode()); return color==='black'?'white':color;}
            });
        userNode.select('.userNodeSig_label')
        .text(d=>d.name);


        let node = nodeg.selectAll('.node');

        let ticked = function() {
            node.each(d => {
                d.x = Math.max(graphicopt.node.r, Math.min(d.x, graphicopt.widthG() - graphicopt.node.r));
            });
            // if(this.alpha()<0.69) {
            let range_com = d3.extent(computers.data(), d => d.x);
            scaleNode.domain(range_com).range([50, 120]);

            computers.data().sort((a,b)=>a.y-b.y).forEach((d,i)=>d.order = i);
            if (runopt.compute.type==='timeline') {
                // scaleNode_y_midle = d3.scaleLinear().range([yscale.range()[1]/2,yscale.range()[1]/2+10]).domain([computers.data().length/2,computers.data().length/2+1])
                scaleNode_y_midle = d3.scaleLinear().range(yscale.range()).domain([0, computers.data().length-1])
            }
            computers.transition().attr('transform', d => {
                if (runopt.compute.type==='timeline') {
                    d.x2 = 200;
                    d.y2 = scaleNode_y_midle(d.order);
                }else
                if (runopt.compute.clusterNode) {
                    d.x = 200;
                    d.x2 = 200;
                }else
                    d.x2 = scaleNode(d.x);
                if (runopt.compute.clusterNode&&this.alpha()<0.6)
                    d.y = scaleNode_y(d.order);
                return `translate(${d.x2},${d.y2||d.y})`
            });
            let range_job = d3.extent(jobNode.data(), d => d.x);
            scaleNode.domain(range_job).range([370, 450]);
            jobNode.data().sort((a,b)=>a.y-b.y).forEach((d,i)=>d.order = i);
            jobNode.transition().attr('transform', d => {
                d.x2 = scaleNode(d.x);
                if (runopt.compute.clusterNode&&this.alpha()<0.6)
                    d.y = scaleJob(d.order);
                return `translate(${d.x2},${d.y})`
            });

            link.transition()
                .call(updatelink)
            if (runopt.compute.type==='timeline')
                updateaxis();
        };


        g.selectAll('.userNode')
            .call(path=>freezinghandle(path,[function(d){
                d3.selectAll('.userNode').classed('fade',true);
                d3.select(this).classed('highlight',true);
                link.classed('hide',true);
                const sametarget = link.filter(f=> d===f.target).classed('hide',false).classed('highlight',true).data();
                const samesource = link.filter(f=> sametarget.find(e=>e.source===f.target)).classed('hide',false).classed('highlight',true).data();
                d3.selectAll('.jobNode').classed('hide',true);
                d3.selectAll('.jobNode').filter(f=>sametarget.find(e=>e.source===f)).classed('hide',false).classed('highlight',true);
                d3.selectAll( '.computeNode').classed('fade',true);
                d3.selectAll( '.computeNode').filter(f=>samesource.find(e=>e.source===f)).classed('highlight',true);
                table_footerNode.classed('fade',true);
            },null
            ],[function(d){
                d3.selectAll('.userNode').classed('fade',false);
                d3.select(this).classed('highlight',false);
                d3.selectAll('.jobNode').classed('hide',false).classed('highlight',false);
                d3.selectAll( '.computeNode').classed('fade',false).classed('highlight',false);
                link.classed('hide',false).classed('highlight',false);
                table_footerNode.classed('fade',false);
            },null
            ]))
            .transition().attr('transform',d=>{
            d.fy=yscale(d.order);
            d.fx=600;
            return `translate(${d.fx},${d.fy})`
        });
        g.selectAll('.computeNode')
            .call(path=>freezinghandle(path,[function(d){
                d3.selectAll( '.computeNode').classed('fade',true);
                d3.select(this).classed('highlight',true);
                link.classed('hide',true);
                const samesource = link.filter(f=> d===f.source).classed('hide',false).classed('highlight',true).data();
                const sametarget = link.filter(f=> samesource.find(e=>e.target===f.source)).classed('hide',false).classed('highlight',true).data();
                d3.selectAll('.jobNode').classed('hide',true);
                d3.selectAll('.jobNode').filter(f=>samesource.find(e=>e.target===f)).classed('hide',false).classed('highlight',true);
                d3.selectAll('.userNode').classed('fade',true);
                d3.selectAll( '.userNode').filter(f=>sametarget.find(e=>e.target===f)).classed('highlight',true);
                table_footerNode.classed('fade',true);
            },null],[function(d){
                d3.selectAll( '.computeNode').classed('fade',false).classed('highlight',false);
                d3.selectAll('.jobNode').classed('hide',false).classed('highlight',false);
                d3.selectAll( '.userNode').classed('fade',false).classed('highlight',false);
                link.classed('hide',false).classed('highlight',false);
                table_footerNode.classed('fade',false);
            },null]));
        g.selectAll('.jobNode')
            .call(path=>freezinghandle(path,[function(d){
                g.selectAll('.jobNode').classed('hide',true);
                d3.select(this).classed('hide',false).classed('highlight',true);
                d3.select(this).selectAll('text').classed('hide',false);
                link.classed('hide',true);
                const samesource = link.filter(f=> d===f.source).classed('hide',false).classed('highlight',true).data();
                const sametarget = link.filter(f=> d===f.target).classed('hide',false).classed('highlight',true).data();
                d3.selectAll('.userNode').classed('fade',true);
                d3.selectAll( '.userNode').filter(f=>samesource.find(e=>e.target===f)).classed('highlight',true);
                d3.selectAll( '.computeNode').classed('fade',true);
                d3.selectAll( '.computeNode').filter(f=>sametarget.find(e=>e.source===f)).classed('highlight',true);
                table_footerNode.classed('fade',true);
            },null],[function(d){
                g.selectAll('.jobNode').classed('hide',false).classed('highlight',false);
                d3.select(this).selectAll('text').classed('hide',true);
                d3.selectAll( '.userNode').classed('fade',false).classed('highlight',false);
                d3.selectAll( '.computeNode').classed('fade',false).classed('highlight',false);
                link.classed('hide',false).classed('highlight',false);
                table_footerNode.classed('fade',false);
            },null]));
        initForce();
        function getGradID(d){
            return 'links'+d.index;
        }
        simulation
            .nodes(node.data()).stop();
        simulation.force("link")
            .links(linkdata);
        let link = linkg.selectAll('.links').data(linkdata.filter(d=>d.type===undefined),function(d){return d.source.name+ "-" +d.target.name});
        link.exit().remove();
        let link_n = link.enter()
            .append('g')
            .attr("class", "links");
        link_n
            .append('path');
        link_n
            .append('text').attr("text-anchor", "middle");

        link = linkg.selectAll('.links');
        link.select('text').text(function(d){return d.links?d.links:''});
        link.call(updatelink);
        link.select('path')
            .attr("stroke", d=> colorFunc(getLinkKeyColor(d)))
            .style("stroke-width", function (d) {
                return d.links===undefined?1:linkscale(d.links);
            });
            // .style('stroke-dasharray',function(){return getstrokearray(this);}).style('stroke-dashoffset',getstrokearray_offset);

        if (!runopt.compute.clusterNode&&runopt.compute.type!=='timeline')
            simulation.alphaTarget(0.3).on("tick", ticked).restart();
        else {
            renderManual(computers, jobNode, link);
        }

        jobMap.drawComp();
        function initForce(){
            if (!simulation) {
                let repelForce = d3.forceManyBody().strength(d=> (d.type==='job')?0:-150);
                let attractForce = d3.forceManyBody().strength(d=> (d.type==='job')?0:100);
                simulation = d3.forceSimulation()
                    .force("link", d3.forceLink().id(function (d) {
                        return d.name;
                    }).distance(200).strength(d => d.type ? 1 : 0.9))
                    .force("collide", d3.forceCollide(d =>
                        (d.type === 'job') ? 0.001 : graphicopt.node.r).strength(0.8))
                    .force("charge1", attractForce)
                    .force("charge2", repelForce)
                    // .force("center", d3.forceCenter(graphicopt.widthG() / 2, graphicopt.heightG() / 2))
                    // .force("y", d3.forceY(d=>
                    //     yscale(d.order)||graphicopt.heightG()/2).strength(function(d){return d.type==='user'?0.8:0}))
                    .force("x", d3.forceX(function (
                        d) {
                        return (d.type === 'job') ? 400 : ((d.type === 'user') ? 600 : 0)
                    }).strength(function (d) {
                        return d.type === 'job' ? 0.8 : 0.8
                    })).alphaTarget(1)
                    .on("tick", ticked);
                // simulation.alphaTarget(1);
                simulation.fistTime = true;
            }else {
                // simulation.velocityDecay(0.1);
            }
        }

        function triggerForce () {
            simulation.stop()
            let attractForce = d3.forceManyBody().strength(d=> (d.type==='job')?0:100);

            simulation.force("link")
                .links(linkdata).strength(1);
            simulation.force("collide",d3.forceCollide(d=>
                (d.type==='job')?0:graphicopt.node.r).strength(0.8))
                .force("charge1", attractForce)
                // .force("charge2", repelForce)
                // .force("y", undefined);
            // .force("link", d3.forceLink().id(function(d) { return d.name; }).distance(1).strength(1))
            simulation.fistTime = false;
            simulation.alphaTarget(0.7).restart();
        }
        return jobMap;
    };
    function getLinkKeyColor(d){
        switch (runopt.graphic.colorBy) {
            case 'user':
                return (_.isString(d.source.user)&&d.source.user)||d.target.user;
            case 'group':
                if (d.target.type==='job') {
                    if (d.source.__metrics)// cluster group
                        return d.source.name;
                    else
                        return _.last(d.source.timeline.clusterarr).cluster
                }
                return undefined;
            default:
                return (_.isString(d.source.user)&&d.source.user)||d.target.user;
        }
    }
    function getstrokearray (self){
        return (self||this).getTotalLength()-graphicopt.job.r
    }
    function getstrokearray_offset (d){
        return d.source.type==='job'?-graphicopt.job.r:0;
    }
    function table_header(path){
        let rows = path.selectAll('.row').data([tableHeader]);
        rows.exit().remove();
        let rows_n = rows.enter().append('g').attr('class', 'row')
            .attr('transform',`translate(0,${-tableLayout.row.height/2})`);
        // rows_n.append('rect').attrs({'class':'back-row','width':tableLayout.row.width,'height':tableLayout.row.height});
        let cells = rows_n.merge(rows).selectAll('.cell').data(d=>d);
        cells.exit().remove();

        let cells_n = cells.enter().append('g').attr('class',d=>'cell '+tableLayout.column[d.key].type).attr('transform',d=>`translate(${tableLayout.column[d.key].x},20)`);
        cells_n.append('text').styles({'font-weight':'bold'}).attrs({width:tableLayout.row['graph-width']});
        cells = cells_n.merge(cells);
        cells.select('text').text(d=>d.value).call(d=>{
            const dir = d.datum().direction;
            if (dir)
                truncate(d,'▲');
            else if (dir===undefined)
                truncate(d,'↕');
            else
                truncate(d,'▼');
        });
        cells.on('click',function(d){
            if (d.key!==tableHeader.currentsort)
                cells.filter(e=>e.key===tableHeader.currentsort)
                    .each(function(e){
                        e.direction=undefined;
                        d3.select(this).select('text').text(d=>d.value).call(d=>truncate(d,'↕'));
                    });
            tableHeader.currentsort = d.key;
            tableHeader.direction = (d.direction=!d.direction);
            handle_sort(true);
            d3.select(this).select('text').text(d=>d.value).call(d=>{
                const dir = d.datum().direction;
                if (dir)
                    truncate(d,'▲');
                else if (dir===undefined)
                    truncate(d,'↕');
                else
                    truncate(d,'▼');
            });
        })

    }
    function table_footer(path){
        let customrange = [0,d3.max(tableFooter.filter(d=>tableLayout.column[d.key].type==='graph'),e=>d3.max(e.value.arr,d=>d[1]))]
        let rows = path.selectAll('.row').data([tableFooter]);
        rows.exit().remove();
        let rows_n = rows.enter().append('g').attr('class', 'row')
            .attr('transform',`translate(0,${-tableLayout.row.height/2})`);
        // rows_n.append('rect').attrs({'class':'back-row','width':tableLayout.row.width,'height':tableLayout.row.height});
        let cells = rows_n.merge(rows).selectAll('.cell').data(d=>d);
        cells.exit().remove();

        let cellsText = cells.filter(d=>d&&tableLayout.column[d.key].type!=='graph');
        let cells_n = cells.enter().append('g').attr('class',d=>'cell '+tableLayout.column[d.key].type).attr('transform',d=>`translate(${tableLayout.column[d.key].x},${tableLayout.column[d.key].y})`);
        let cellsText_n = cells_n.filter(d=>d&&tableLayout.column[d.key].type!=='graph');
        cellsText_n.append('text');
        cellsText_n.merge(cellsText).select('text').text(d=>d.value);

        let cellsGraph = cells.filter(d=>d&&tableLayout.column[d.key].type==='graph');
        let cellsGraph_n = cells_n.filter(d=>d&&tableLayout.column[d.key].type==='graph');
        cellsGraph_n.append('g').attr('class','violing');
        path.selectAll('.row .graph').select('g.violing').each(function(d){
            violiin_chart.rangeY(customrange).data([d.value]).draw(d3.select(this))
        })
    }
    function updaterow(path){
        let rows = path.selectAll('.row').data(d=>[tableData[d.name]],e=>e.id);
        rows.exit().remove();
        let rows_n = rows.enter().append('g').attr('class', 'row')
            .attr('transform',`translate(0,${-tableLayout.row.height/2})`);
        // rows_n.append('rect').attrs({'class':'back-row','width':tableLayout.row.width,'height':tableLayout.row.height});
        let cells = rows_n.merge(rows).selectAll('.cell').data(d=>d,d=>d.key);
        cells.exit().remove();

        let cellsText = cells.filter(d=>tableLayout.column[d.key].type!=='graph');
        let cells_n = cells.enter().append('g').attr('class',d=>'cell '+tableLayout.column[d.key].type).attr('transform',d=>`translate(${tableLayout.column[d.key].x},${tableLayout.column[d.key].y})`);
        let cellsText_n = cells_n.filter(d=>tableLayout.column[d.key].type!=='graph');
        cellsText_n.append('text');
        cellsText=cellsText_n.merge(cellsText).select('text').text(d=>{
            let custom = tableLayout.column[d.key].format;
            if (custom)
                return d3.format(custom)(d.value);
            else
                return d.value;
        });

        let cellsGraph = cells.filter(d=>tableLayout.column[d.key].type==='graph');
        let cellsGraph_n = cells_n.filter(d=>tableLayout.column[d.key].type==='graph');
        cellsGraph_n.append('g').attr('class','violing');
        cellsGraph_n.merge(cellsGraph).on('mouseover',function(d){
            if (freezing) {
                let username = d3.select(this.parentNode).datum().id;
                let data_temp = user.find(u => u.key === username).dataRaw;
                let scaleY = d3.scaleLinear().range(schema.find(s => s.text === d.key).range);
                let data = d3.nest().key(e => e.name).rollup(f => {
                    let temp = f.map((e, i) => {
                        return {
                            y: scaleY(e.find(a => a.axis === d.key).value),
                            x: e.time,
                        };
                    });
                    temp.label = f[0].name;
                    return temp;
                }).entries(data_temp).map(e => e.value);
                let layout = tooltip_lib.layout();
                layout.background = undefined;
                layout.axis.y.label = [d.key];
                layout.axis.x.domain = [[first__timestep, last_timestep]];
                layout.axis.y.domain = [scaleY.range()];
                layout.title = `User: ${username}`;
                layout.title2 = `#compute: ${data.length}`;
                if (layout.axis.y.domain[0][1] > 1000)
                    layout.axis.y.tickFormat = [d3.format('~s')];
                tooltip_lib.graphicopt(tooltip_opt).data([data]).layout(layout).show();
            }
        });
        path.selectAll('.row .graph').select('g.violing').each(function(d){
            violiin_chart.rangeY(violinRange).data([d.value]).draw(d3.select(this))
        })
    }
    let tableLayout = {
        row:{
            width: 500,
            height: 20,//deltey,
            'graph-width': 100,
        },
        column:{
            'UserID': {id:'UserID',type:'text',x: 10,y:20,width:60},
            'Hosts': {id:'Hosts',type:'num',x: 130,y:20,width:60},
            'Jobs': {id:'Jobs',type:'num',x: 190,y:20,width:60},
        }
    };
    // let violiin_chart = d3.viiolinChart().graphicopt({width:tableLayout.row["graph-width"],height:20,opt:{dataformated:true},tick:{visibile:false},middleAxis:{'stroke-width':0.5}});
    let violiin_chart = d3.histChart().graphicopt({width:tableLayout.row["graph-width"],height:20,opt:{dataformated:true},tick:{visibile:false},middleAxis:{'stroke-width':0.5},symmetric: true});
    let linkdata = [];
    let user = [];
    let hostOb={};
    let hiddenlink = [];

    function handle_sort(disableLinkSort,skiprender) {
        if(tableHeader.currentsort===undefined)
            user.sort((a, b) => b.values.length - a.values.length);
        else
            switch (tableHeader.currentsort) {
                case 'UserID':
                    user.sort((a, b) => a.name.localeCompare(b.name)*(-1+2*tableHeader.direction));
                    break;
                case 'Hosts':
                    user.sort((a, b) => (b.unqinode.length - a.unqinode.length)*(-1+2*tableHeader.direction));
                    break;
                case 'Jobs':
                    user.sort((a, b) => (b.values.length - a.values.length)*(-1+2*tableHeader.direction));
                    break;
                case 'PowerUsage':
                    var indexf = tableHeader.findIndex(d=>d.key===tableHeader.currentsort)-1;
                    user.sort((a, b) => ((tableData[b.name][indexf]||{value:-Infinity}).value - (tableData[a.name][indexf]||{value:-Infinity}).value)*(-1+2*tableHeader.direction));
                    break;
                default:
                    var indexf = tableHeader.findIndex(d=>d.key===tableHeader.currentsort)-1;
                    user.sort((a, b) => ((tableData[b.name][indexf]||{value:{median:-Infinity}}).value.median - (tableData[a.name][indexf]||{value:{median:-Infinity}}).value.median)*(-1+2*tableHeader.direction));
                    break;
            }
        user.forEach((d, i) => {
            d.order = i;
            d.orderlink = i;
        });
        if (!disableLinkSort) {
            Hosts.forEach(d => {
                let n = d.user.length;
                if (n > 1) {
                    const linkoorder = d3.min(d.user, e => e.order);
                    for (let i = 0; i < n; i++) {
                        d.user[i].orderlink = Math.min(linkoorder, d.user[i].orderlink);
                    }
                }
            });
            // order by links
            user.sort((a, b) => a.orderlink - b.orderlink).forEach((d, i) => d.order = i);
        }
        g.selectAll('.userNode').transition().attr('transform',d=>{
            d.fy=yscale(d.order);
            d.fx=600;
            d.y=d.fy;
            d.x=d.fx;
            return `translate(${d.fx},${d.fy})`
        });
        if ((runopt.compute.type==='timeline' || runopt.compute.clusterNode)&&!skiprender)
            renderManual(d3.selectAll('.node.computeNode'),d3.selectAll('.node.jobNode'),d3.selectAll('.links'))
    }
    let clusterNode_data,clusterdata,clusterdata_timeline;
    let clusterlineScale = d3.scaleLinear().range([0,400]);
    function cluster_line(path){ //timelinescale
        let clineg = path.selectAll('.cline_g').data(d=>d.cvalues);
        clineg.exit().remove();
        let clineg_n = clineg.enter().append(g).attr('class','cline_g');
        clineg_n.append('path').attr('class')
    }

    function updateClusterTimeline() {
        let maxstep = d3.max(clusterdata, c => c.arr.length) - 1;
        for (let ts = 0; ts < maxstep + 1; ts++) {
            clusterdata.forEach(c => {
                ct = c.arr[ts];
                if (ct)
                    ct.forEach(h => {
                        let currentarr = hostOb[h].timeline.clusterarr;
                        if (currentarr.length && c.name === hostOb[h].timeline.clusterarr[currentarr.length - 1].cluster) {
                            hostOb[h].timeline.clusterarr.stack++;
                            if (hostOb[h].timeline.clusterarr.stack === 1)
                                hostOb[h].timeline.line.push({cluster: c.name, start: ts - 1, end: ts});
                            else if (hostOb[h].timeline.clusterarr.stack > 1)
                                hostOb[h].timeline.line[hostOb[h].timeline.line.length - 1].end = ts;
                        } else {
                            hostOb[h].timeline.clusterarr.push({cluster: c.name, timestep: ts});
                            hostOb[h].timeline.clusterarr.stack = 0;
                        }
                    });

            });
        }
        timelineScale.domain([maxstep - 1, maxstep]);
        // fisheye_scale.x.domain([-maxstep*timelineScale.range()[0],0]);
    }

    let first__timestep = new Date();
    let lastIndex = 0;
    function handle_links (timeStep_r,lastIndex_r){
        if (timeStep_r) {
            last_timestep = new Date(timeStep_r.toString());
            lastIndex = lastIndex_r
            if (first__timestep>last_timestep)
                first__timestep = last_timestep;
        }
        harr_old = [];
        if (simulation)
            simulation.stop();
        linkdata = [];
        Hosts.forEach(h=>{
            h.user=[];
            h.timeline = {clusterarr:[],line:[]};
        });


        updateClusterTimeline();

        let user_n = current_userData();
            // .sort((a,b)=>b.values.length-a.values.length).filter((d,i)=>i<12);
        // tableData = {}
        Object.keys(tableData).forEach(k=>tableData[k].keep =false);
        data=dataRaw.filter(d=>user.findIndex(e=>e.key===d.user)!==-1)
        data.forEach(d=>{
            d.name = d.jobID+'';
            d.type = 'job';
            d.nodes.forEach(n=>{
                let temp  ={source:n,target:d.jobID+''};
                let temp2  ={source:d.jobID+'',target:d.user};

                linkdata.push(temp);
                if (linkdata.indexOf(temp2)===-1)
                    linkdata.push(temp2);
            });
            let oldData = nodeg.selectAll('.node.jobNode').filter(e=>e.name===d.name||(e.values?e.values.findIndex(v=>v.name===d.name)!==-1:false)).data();
            if (oldData.length){
                d.x = oldData[0].x;
                d.x2 = oldData[0].x2;
                d.y = oldData[0].y;
                d.fx = oldData[0].fx;
                d.fy = oldData[0].fy;
                d.vx = oldData[0].vx;
                d.vy = oldData[0].vy;
            }
        });

        let newdata = [];

        user = user_n.map((d,i)=>{
            d.name = d.key;
            d.order = i;
            d.orderlink = i;
            d.type='user';
            d.unqinode_ob = {};
            d.unqinode.forEach(n=>{
                d.unqinode_ob[n] = d.values.filter(e=>e.nodes.find(f=>f===n));
                hostOb[n].user.push(d)});
            if(runopt.compute.clusterJobID){
                const range_temp_sub = d3.extent(d.values,e=>+new Date(e.submitTime));
                const range_temp_st = d3.extent(d.values,e=>+new Date(e.startTime));
                const scale_temp_sub = d3.scaleLinear().domain([range_temp_sub[0],range_temp_sub[0]+runopt.compute.clusterJobID_info.groupBy]);
                const scale_temp_st = d3.scaleLinear().domain([range_temp_st[0],range_temp_st[0]+runopt.compute.clusterJobID_info.groupBy]);
                let group_temp_ob =_.groupBy(d.values,function(d){return ''+Math.floor(scale_temp_sub(+new Date(d.submitTime)))+ Math.floor(scale_temp_st(+new Date(d.startTime)))});
                for (var k in group_temp_ob) {
                    let temp = _.cloneDeep(group_temp_ob[k][0]);
                    temp.x = d3.mean(group_temp_ob[k],e=>e.x);
                    temp.x2 = d3.mean(group_temp_ob[k],e=>e.x2);
                    temp.y = d3.mean(group_temp_ob[k],e=>e.y);
                    temp.fx = d3.mean(group_temp_ob[k],e=>e.fx);
                    temp.fy = d3.mean(group_temp_ob[k],e=>e.fy);
                    temp.vx = d3.mean(group_temp_ob[k],e=>e.vx);
                    temp.vy = d3.mean(group_temp_ob[k],e=>e.vy);
                    temp.values = group_temp_ob[k];
                    temp.nodes = _.uniq(_.flatten(group_temp_ob[k].map(g=>g.nodes)));
                    let namearr = group_temp_ob[k].map(d=>d.name);
                    temp.name = namearr.join(' ');
                    let sameSource = linkdata.filter(e=>namearr.find(f=>f===e.source+''));

                    let temp_g = _.groupBy(sameSource,function(e){return e.target});
                    Object.keys(temp_g).forEach(k=>{
                        temp_g[k].forEach((e,i)=>{
                            if(i===0) {
                                e.source = temp.name;
                                e.links = temp_g[k].length;
                            }else{
                                e.del = true;
                            }
                        });
                    });

                    sameSource = linkdata.filter(e=>namearr.find(f=>f===e.target+''));
                    temp_g = _.groupBy(sameSource,function(e){return e.source});
                    Object.keys(temp_g).forEach(k=>{
                        temp_g[k].forEach((e,i)=>{
                            if(i===0) {
                                e.target = temp.name;
                                e.links = temp_g[k].length;
                            }else{
                                e.del = true;
                            }
                        });
                    });
                    newdata.push(temp)
                }
                d3.extent(d.values,e=>+new Date(e.submitTime))
            }
            d.dataRaw = (user.filter(e=>e.name===d.name)[0]|| {dataRaw:[]}).dataRaw||[];
            tableData[d.name] = tableData[d.name] || [{key:'Hosts', value:0},
                {key:'Jobs',value: 0}];
            tableData[d.name][0].value = d.unqinode.length;
            tableData[d.name][1].value = d.values.length;
            tableData[d.name].id = d.name;
            tableData[d.name].keep = true;
            return d
        });
        if (runopt.compute.clusterJobID) {
            linkdata = linkdata.filter(d => !d.del);
            linkscale.domain(d3.extent(linkdata,d=>d.links));
            data = newdata;
            Jobscale.domain(d3.extent(data,d=>d.values.length));
        }
        if (runopt.compute.clusterNode) {
            clusterdata.forEach(c =>{
                let namearr = c.arr[c.arr.length-1];
                if (namearr) {
                    let sameSource = linkdata.filter(e => namearr.find(f => f === e.source + ''));
                    let temp_g = _.groupBy(sameSource,function(e){return e.target});
                    Object.keys(temp_g).forEach(k=>{
                        temp_g[k].forEach((e,i)=>{
                            if(i===0) {
                                e.source = c.name;
                                e.links = temp_g[k].length;
                            }else{
                                e.del = true;
                            }
                        });
                    });
                }
            });
            clusterNode_data = clusterdata;
            // colorCluster.domain(clusterNode_data.map(d=>d.name));
            linkdata = linkdata.filter(d => !d.del);
            linkscale.domain(d3.extent(linkdata,d=>d.links));
        }else
            clusterNode_data = undefined;
        if (runopt.compute.type==='timeline') {
            clusterdata_timeline = [];
            data.forEach(d=>{
               let listcomp = d.nodes.filter(e=>{
                   let temp = linkdata.filter(f=>f.source===e);
                   if (temp.length===1)
                       return true;
                   else if(temp.length>1){
                       if (!clusterdata_timeline.find(c=>c.name===e)) {
                           clusterdata_timeline.push({
                               name: e,
                               values_name: [e],
                               timeline: hostOb[e].timeline
                           });
                           temp.forEach(d=>d.links=1);
                       }
                   }
                   return false;
               });
                let temp_g = _.groupBy(listcomp.map(e=>hostOb[e]),function(e){return JSON.stringify(e.timeline)});
                Object.keys(temp_g).forEach(k=>{
                    let temp_h = {};
                    temp_h.values_name = temp_g[k].map(e=>e.name);
                    temp_h.name = temp_h.values_name.join(' ');
                    temp_g[k].forEach((n)=>{
                        linkdata.filter(f=>f.source ===n.name).forEach((e,i)=>{
                            if(i===0) {
                                e.source =  temp_h.name;
                                e.links = temp_g[k].length;
                            }else{
                                e.del = true;
                            }
                        });
                    });

                    temp_h.timeline = temp_g[k][0].timeline;
                    clusterdata_timeline.push(temp_h);
                });
            });
            linkdata = linkdata.filter(d => !d.del);
            linkscale.domain(d3.extent(linkdata,d=>d.links));
        }else
            clusterdata_timeline = undefined;

        Object.keys(tableData).forEach(k=>{
            if (!tableData[k].keep)
                delete tableData[k];
        });

        handle_sort(true,true);

        tableFooter[0] = {key:'UserID',value:'Summary'}
        tableFooter[1] = {key:'Hosts', value:Hosts.filter(d=>d.user.length).length}
        tableFooter[2] = {key:'Jobs', value:d3.sum(user,d=>d.values.length)};

        return linkdata
    };
    let harr_old=[];
    function handle_harr (harr) {
        _.pullAll(harr,harr_old);
        harr_old = harr.slice();
        return harr;
    }

    let violinRange = [0,0];
    function handle_summary (data){
        let index_power = schema.indexOf(schema.find(d=>d.text==="Power consumption"));
        let scaleBack = d3.scaleLinear().domain([0,1]).range(schema[index_power].range);
        user.forEach(d=>d.needRender=false)
        data.forEach(d=>{
            hostOb[d.name].data.push(d); // add new data
            if (hostOb[d.name].user) {
                hostOb[d.name].user.forEach(e => {
                    e.needRender = true;
                    e.dataRaw.push(d);
                    if (!e.PowerUsage)
                        e.PowerUsage = {};
                    e.PowerUsage.sum = (e.PowerUsage.sum||0) + Math.round(scaleBack(d[index_power].value||0));
                    e.PowerUsage.time = 1*60;
                    e.PowerUsage.kwh = Math.round(e.PowerUsage.sum/1000/e.PowerUsage.time*3600*10)/10;
                });
            }
            if (hostOb[d.name].user.length)
                tableFooter.dataRaw.push(d);
        });
        let user_update,rangechange;
        if (isanimation) {
            schema.forEach((s, i) => {
                let r = getViolinData(tableFooter, i, s);
                tableFooter[i + 3] = {key: r.axis, value: r};
            });
            user_update = user.filter(d => d.needRender);
            rangechange = false;

            function getViolinData(d, i, s) {
                v = d.dataRaw.map(e => e[i].value).filter(e => e !== undefined).sort((a, b) => a - b);
                let r;
                if (v.length) {
                    let sumstat = [];
                    r = {
                        axis: s.text,
                        q1: ss.quantileSorted(v, 0.25),
                        q3: ss.quantileSorted(v, 0.75),
                        median: ss.medianSorted(v),
                        mean: ss.mean(v),
                    };
                    var x = d3.scaleLinear()
                        .domain([0, 1]);
                    let x_change = d3.scaleLinear()
                        .domain([0, runopt.histodram.resolution - 1]).range(x.domain());

                    var histogram = d3.histogram()
                        .domain(x.domain())
                        .thresholds(d3.range(0, runopt.histodram.resolution).map(e => x_change(e)))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
                        // .thresholds(x.ticks(runopt.histodram.resolution))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
                        .value(d => d);
                    let hisdata = histogram(v);
                    r.point = [];
                    r.outlier = [];
                    sumstat = hisdata.map((d, i) => [d.x0 + (d.x1 - d.x0) / 2, (d || []).length]);
                    const localmax = d3.max(sumstat, e => e[1]);
                    if (d.type && localmax > violinRange [1]) {
                        violinRange [1] = localmax;
                        rangechange = true;
                    }
                    r.arr = sumstat;
                } else {
                    r = {
                        axis: s.text,
                        q1: undefined,
                        q3: undefined,
                        median: undefined,
                        mean: undefined,
                        outlier: [],
                        point: [],
                        arr: []
                    };
                }
                return r;
            }

            user_update.forEach(d => {
                schema.forEach((s, i) => {
                    let r = getViolinData(d, i, s);
                    tableData[d.name][i + 2] = {key: r.axis, value: r};
                })
                tableData[d.name][schema.length + 2] = {key: 'PowerUsage', value: d.PowerUsage.kwh};
                // tableData[d.name] =[{key:'Hosts', value:d.unqinode.length}
            });
            user_update = g.selectAll('.userNode').filter(d => d.needRender);
            user_update.selectAll('text').interrupt().selectAll("*").interrupt();
            user_update.selectAll('text').styles({
                'stroke': 'yellow',
                'stroke-opacity': 1
            }).transition().duration(3000).styles({'stroke-opacity': 0});
        }
        if (tableHeader.currentsort)
            handle_sort(true);
        if (isanimation) {
            updaterow(rangechange ? g.selectAll('.userNode') : user_update);
            table_footer(nodeg.select('.table.footer'));
        }
    }
    let zoom_toogle=true;
    function zoom_func(val){
        zoom_toogle = val;
        d3.select('.pantarget').classed('lock',zoom_toogle);
    };
    function makeOb (){
        hostOb={};
        Hosts.forEach(h=>{h.data=[]; hostOb[h.name]=h;});
    }

    function makeheader() {
// make table header
        table_header(table_headerNode);
    }

    function updatalayout(data){
        let currentsort = tableHeader.currentsort;
        let currentdirection = tableHeader.direction;
        tableHeader = [{key:'UserID', value:'UserID'},{key:'Hosts', value:'Hosts'}, {key:'Jobs',value: 'Jobs'}];
        let offset = tableLayout.column['Jobs'].x;
        let padding = 15;
        data.forEach((d,i)=>{
            tableLayout.column[d.text] = {id:d.text,type: 'graph' ,x: offset+(i)*tableLayout.row["graph-width"]+padding,y:0,width:tableLayout.row["graph-width"]};
            tableLayout.row.width = offset+(i)*(tableLayout.row["graph-width"]+padding);
            tableHeader.push({key:d.text, value:d.text});
        })
        tableLayout.column['PowerUsage'] = {id:'PowerUsage',type: 'num',format:'.1f' ,x: tableLayout.row.width+70,y:20,width:90};
        tableLayout.row.width = tableLayout.row.width+70;
        tableHeader.push({key:'PowerUsage', value:'Usage(kWh)'});
        tableHeader.currentsort = currentsort;
        tableHeader.direction = currentdirection;

        makeheader();
    }
    jobMap.graphicopt = function (_) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in _) {
                if ('undefined' !== typeof _[i]) {
                    graphicopt[i] = _[i];
                }
            }
            if (graphicopt.radaropt)
                graphicopt.radaropt.schema = schema;
            return jobMap;
        }else {
            return graphicopt;
        }

    };

    jobMap.runopt = function (_) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in _) {
                if ('undefined' !== typeof _[i]) {
                    runopt[i] = _[i];
                }
            }
            if (g) {
                if (runopt.lensing) {
                    g.select('.fisheyeLayer').style('pointer-events', 'auto');
                } else {
                    g.select('.fisheyeLayer').style('pointer-events', 'none');
                    fisheye_scale.x = d=>d;
                }
            }
            return jobMap;
        }else {
            return runopt;
        }

    };

    jobMap.svg = function (_) {
        return arguments.length ? (svg = _, jobMap) : svg;
    };

    jobMap.data = function (_) {
        return dataRaw = _?_:dataRaw, handle_links (arguments[1],arguments[2]), jobMap;
    };

    jobMap.clusterData = function (v) {
        return arguments.length ? (clusterdata = v,updateClusterTimeline(), jobMap) : clusterdata;
    };

    jobMap.zoomtoogle = function (_) {
        return arguments.length ? (zoom_func(_), jobMap) : zoom_toogle;
    };

    jobMap.hosts = function (a) {
        return arguments.length ? (Hosts = _.cloneDeep( a),makeOb(), jobMap) : Hosts;
    };

    jobMap.maxTimestep = function (_) {
        return arguments.length ? (maxTimestep=_,jobMap):maxTimestep;
    };

    jobMap.dataComp = function (_) {
        return arguments.length ? (arr = _, jobMap) : arr;
    };

    jobMap.getharr = function (_) {
        return (handle_harr(_),jobMap);
    };

    jobMap.setharr = function (_) {
        return arguments.length ? (harr_old=_,jobMap):jobMap;
    };

    jobMap.color = function (_) {
        return arguments.length ? (colorscale=_,jobMap):colorscale;
    };

    jobMap.dataComp_points = function (_) {
        return (handle_summary(_),jobMap);
    };
    jobMap.schema = function (_) {
        return arguments.length ? (graphicopt.radaropt.schema = _,schema = _,updatalayout(_), jobMap) : schema;
    };
    jobMap.colorCluster = function (_) {
        return arguments.length ? (colorCluster = _,jobMap) : colorCluster;
    };
    return jobMap;
};
