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
        },runopt={compute:{setting:'pie'}},radarcreate,tableData={},tableHeader=[],tableFooter = [],colorscale,
        svg, g, table_headerNode,first = true,
        data = [],arr=[],
        hosts = []
    ;
    tableFooter.dataRaw =[];
    let jobMap = {};
    let simulation;
    let timebox,linkg,nodeg,schema=[];
    jobMap.init = function () {
        var rScale = d3.scaleLinear()
            .range([0, graphicopt.radaropt.w/2])
            .domain([-0.25, 1.25]);
        radarcreate = d3.radialLine()
            .curve(d3.curveCardinalClosed.tension(0))
            .radius(function(d) { return rScale(d.value); })
            .angle(function(d) {
                return schema.find(s=>s.text===d.axis).angle; });

        svg.attrs({
            width: graphicopt.width,
            height: graphicopt.height,

        })

        if(svg.select('#userpic').empty())
            svg.append('defs').append('pattern')
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
            g.attr("transform", d3.event.transform);
        }));;
        g = svg.append("g")
            .attr('class','pannel')
            .attr('transform',`translate(${graphicopt.margin.left},${graphicopt.margin.top})`);
        linkg = g.append("g")
            .attr('class','linkg');
        nodeg = g.append("g")
            .attr('class','nodeg');
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
    let colorCategory  = d3.scaleOrdinal().range(d3.range(2,13).map(d=>d3.interpolateGreys(d/14)));
    let colorBy = 'user';
    function colorFunc (key){
        switch (colorBy) {
            case 'user':
                return colorCategory(key);
            default:
                return 'black';
        }
    }
    function drawEmbedding(data) {
        let newdata =handledata(data);
        let bg = svg.selectAll('.computeSig');
        let datapoint = bg.select(".linkLineg")
            .datum(d=>newdata.find(n=>n.name === d.name));
        if(datapoint.empty()){
            datapoint = bg
                .append("g")
                .datum(d=>newdata.find(n=>n.name === d.name))
                .attr("class", d=>"compute linkLineg "+fixName2Class(d.name));
            datapoint.append("clipPath")
                .attr("id",d=>"tSNE"+fixName2Class(d.name))
                .append("path")
                .attr("d", d => radarcreate(d));
            datapoint
                .append("rect")
                .style('fill', 'url(#rGradient)')
                .attr("clip-path", d=>"url(#tSNE"+fixName2Class(d.name)+")")
                .attr("x",-graphicopt.radaropt.w/2)
                .attr("y",-graphicopt.radaropt.h/2)
                .attr("width",graphicopt.radaropt.w)
                .attr("height",graphicopt.radaropt.h);
            datapoint
                .append("path")
                .attr("class","tSNEborder")
                .attr("d", d => radarcreate(d))
                .style("stroke", 'black')
                .style("stroke-width", 0.5)
                .style("stroke-opacity", 0.5).style("fill", "none");
        }else{
            datapoint.select('clipPath').select('path')
                .transition('expand').duration(100).ease(d3.easePolyInOut)
                .attr("d", d => radarcreate(d.filter(e=>e.enable)));
            datapoint.select('.tSNEborder')
                .transition('expand').duration(100).ease(d3.easePolyInOut)
                .attr("d", d => radarcreate(d.filter(e=>e.enable)));
        }

    }
    jobMap.drawComp = function (){
        if(runopt.compute.type==="radar"){
            svg.selectAll('.computeNode').selectAll('.piePath').remove();
            if (arr.length)
            drawEmbedding(arr)
        }else{
            drawPie(svg.selectAll('.computeNode'));
        }
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
            .attr('d', arc).style('fill', d => colorFunc(d.data.user));
    }
    let yscale,linkscale = d3.scaleSqrt().range([0.25,3]);
    let scaleNode = d3.scaleLinear();
    jobMap.draw = function (timeStep_r){
        timeStep = new Date(timeStep_r.toString());
        if (!timeStep)
            timeStep = new Date();
        timebox.text(timeStep.toLocaleTimeString())
        yscale = d3.scaleLinear().domain([-1,user.length]).range([0,Math.min(graphicopt.heightG(),30*12)]);
        let deltey = yscale(1)-yscale(0);
        tableLayout.row.height = deltey;
        violiin_chart.graphicopt({height:tableLayout.row.height,color:(i)=>'black'});
        // violiin_chart.graphicopt({height:tableLayout.row.height,color:(i)=>colorscale(i)});
        // compute pie
        if(first) {
            makeheader();
            first = false;
        }
        let computers = nodeg.selectAll('.computeNode').data(hosts,function(d){return d.name});
        computers.exit().remove();
        let computers_n = computers.enter().append('g').attr('class',d=>'node computeNode '+fixName2Class(fixstr(d.name)));
        // computers_n.append('circle').attrs(
        //     {'class':'computeSig',
        //         'r': graphicopt.node.r,
        //         'fill':'white',
        //     });
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
                'stroke':'white',
                'stroke-width':0.2,
            })
            .text(d=>d.name)
        ;

        computers = computers_n.merge(computers);

        jobMap.drawComp();

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

        // jobNode_n.append('path')
        //     .attrs(
        //     {'class':'computeSig_b',
        //         // 'd': d=>spiral([new Date(d.submitTime),new Date(d.startTime),timeStep]),
        //         'd': d=>spiral(backdround_spiral),
        //         // 'stroke':'#ddd',
        //     });
        jobNode_n.append('path')
            .attrs(
            {'class':'computeSig_sub submitTime',
            })
            .attr('d',function(d){
                let temp = d3.timeHour.every(1).range(new Date(d.submitTime),new Date(d.startTime));
                temp.pop();
                temp.push(new Date(d.startTime));
                return spiral(temp);
            }).style('stroke','#ffa328')

        ;
        jobNode_n.append('path')
            .attrs(
                {'class':'computeSig_start timeBoxRunning',
                })
            .attr('d',function(d){
                let temp = d3.timeHour.every(1).range(new Date(d.startTime),timeStep);
                temp.pop();
                temp.push(timeStep);
                return spiral(temp);
            }).attr('stroke','##3fc151')
        ;
        jobNode = jobNode.merge(jobNode_n);



        // table_header(table_headerNode);
        // make table footer
        let table_footerNode = nodeg.select('.table.footer');
        if(table_footerNode.empty())
            table_footerNode = nodeg.append('g').attr('class','table footer').attr('transform',`translate(600,${yscale(user.length)})`);
        table_footer(table_footerNode);

        let userNode = nodeg.selectAll('.userNode').data(user,d=> d.name);
        userNode.exit().remove();
        let userNode_n = userNode.enter().append('g').attr('class',d=>'node userNode '+fixName2Class(fixstr(d.name)));

        updaterow(userNode.merge(userNode_n));

        userNode_n.append('circle').attrs(
            {'class':'userNodeSig',
                'r': graphicopt.user.r,
                'fill': d=>colorFunc(d.name)
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


        userNode=userNode_n.merge(userNode);
        userNode.select('.userNodeSig_label')
        .text(d=>d.name);


        let node = nodeg.selectAll('.node');

        var ticked = function() {
            node.each(d => {
                d.x = Math.max(graphicopt.node.r, Math.min(d.x, graphicopt.widthG() - graphicopt.node.r));
            });
            if(this.alpha()<0.69) {
                let range_com = d3.extent(computers.data(), d => d.x);
                scaleNode.domain(range_com).range([20, 120]);

                computers.transition().attr('transform', d => {
                    d.x2 = scaleNode(d.x);
                    return `translate(${d.x2},${d.y})`
                });
                let range_job = d3.extent(jobNode.data(), d => d.x);
                scaleNode.domain(range_job).range([300, 370]);
                jobNode.transition().attr('transform', d => {
                    d.x2 = scaleNode(d.x);
                    return `translate(${d.x2},${d.y})`
                });
                link.transition()
                    .attr("x1", function (d) {
                        return d.source.x2 || d.source.x;
                    })
                    .attr("y1", function (d) {
                        return d.source.y2 || d.source.y;
                    })
                    .attr("x2", function (d) {
                        return d.target.x2 || d.target.x;
                    })
                    .attr("y2", function (d) {
                        return d.target.y2 || d.target.y;
                    });
            }
        };


        g.selectAll('.userNode')
            .on('mouseover',function(d){
                d3.select(this).classed('hightlight',true);
                d3.selectAll('.jobNode').filter(e=>e.nodes.find(f=>f!==d.name)).classed('hide',true);
                let jobl = d3.selectAll('.jobNode').filter(e=>e.user===d.name).classed('hide',false);
                const jobd = jobl.data();
                d3.selectAll( '.computeNode').classed('fade',true);
                d3.selectAll( '.computeNode.'+d.unqinode.map(e=>fixName2Class(fixstr(e))).join(', .computeNode.')).classed('hightlight',true);
                link.classed('hide',true);
                link.filter(f=> jobd.find(e=>e===f.source||e===f.target)).classed('hide',false).classed('hightlight',true);
            }).on('mouseout',function(d){
            d3.select(this).classed('hightlight',false);
                d3.selectAll('.jobNode').classed('hide',false);
                let jobl = d3.selectAll('.jobNode').filter(e=>e.user===d.name);
                const jobd = jobl.data();
            d3.selectAll( '.computeNode').classed('fade',false);
                d3.selectAll( '.computeNode.'+d.unqinode.map(e=>fixName2Class(fixstr(e))).join(', .computeNode.')).classed('hightlight',false);
            link.classed('hide',false).classed('hightlight',false);
            })
            .transition().attr('transform',d=>{
            d.fy=yscale(d.order);
            d.fx=600;
            return `translate(${d.fx},${d.fy})`
        });
        g.selectAll('.computeNode')
        .on('mouseover',function(d){
            d3.selectAll( '.computeNode').classed('fade',true);
            d3.select(this).classed('hightlight',true);
            d3.selectAll('.jobNode').filter(e=>e.nodes.find(f=>f!==d.name)).classed('hide',true);
            let jobl = d3.selectAll('.jobNode').filter(e=>e.nodes.find(f=>f===d.name)).classed('hide',false);
            const jobd = jobl.data();
            d3.selectAll( '.userNode').filter(e=>jobd.find(f=>f.user===e.name)).classed('hightlight',true);
            link.classed('hide',true);
            link.filter(f=> d===f.source||jobd.find(e=>e===f.source)).classed('hide',false).classed('hightlight',true);
        }).on('mouseout',function(d){
            d3.selectAll( '.computeNode').classed('fade',false);
            d3.select(this).classed('hightlight',false);
            d3.selectAll('.jobNode').classed('hide',false);
            let jobl = d3.selectAll('.jobNode').filter(e=>e.nodes.find(f=>f===d.name));
            const jobd = jobl.data();
            d3.selectAll( '.userNode').filter(e=>jobd.find(f=>f.user===e.name)).classed('hightlight',false);
            link.classed('hide',false).classed('hightlight',false);
        });
        g.selectAll('.jobNode')
            .on('mouseover',function(d){
                g.selectAll('.jobNode').classed('hide',true);
                d3.select(this).classed('hide',false);
                d3.selectAll( '.userNode').filter(e=>d.user===e.name).classed('hightlight',true);
                d3.selectAll( '.computeNode').classed('fade',true);
                d3.selectAll( '.computeNode.'+d.nodes.map(e=>fixName2Class(fixstr(e))).join(', .computeNode.')).classed('hightlight',true);
                link.classed('hide',true);
                link.filter(f=> d===f.source||d===f.target).classed('hide',false).classed('hightlight',true);
            }).on('mouseout',function(d){
            g.selectAll('.jobNode').classed('hide',false);
            d3.selectAll( '.userNode').filter(e=>d.user===e.name).classed('hightlight',false);
            d3.selectAll( '.computeNode').classed('fade',false);
                d3.selectAll( '.computeNode.'+d.nodes.map(e=>fixName2Class(fixstr(e))).join(', .computeNode.')).classed('hightlight',false);

                link.classed('hide',false).classed('hightlight',false);
        });
        initForce();

        simulation
            .nodes(node.data()).stop();
        simulation.force("link")
            .links(linkdata);
        let link = linkg.selectAll('.links').data(linkdata.filter(d=>d.type===undefined),function(d){return d.source.name+ "-" +d.target.name});
        // let link = linkg.selectAll('.links').data(linkdata,function(d){return d.source.name+ "-" +d.target.name});
        // let link = linkg.selectAll('.links').data(linkdata);
        link.exit().remove();
        link = link.enter().append('line')
            .attr("class", "links")
            // .attr("stroke", "#ddd")
            .attr("stroke", d=>
                colorFunc((_.isString(d.source.user)&&d.source.user)||d.target.user))
            .merge(link).attr("x1", function (d) {
                return d.source.x2 || d.source.x;
            })
            .attr("y1", function (d) {
                return d.source.y2 || d.source.y;
            })
            .attr("x2", function (d) {
                return d.target.x2 || d.target.x;
            })
            .attr("y2", function (d) {
                return d.target.y2 || d.target.y;
            })
            .style("stroke-width", function (d) {
                return d.links===undefined?1:linkscale(d.links);
            })
        ;
        simulation.alphaTarget(0.3).on("tick", ticked).restart();
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


    };

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
        // cells_n.append('image').attrs({
        //     href:"../HiperView/images/sort_both.png",
        //     height: 20,
        //     width: 20,
        //     y: -15,
        //     x:d=>tableLayout.column[d.key].type!=='num'?tableLayout.column[d.key].width-20:-20
        // })
        cells = cells.merge(cells_n);
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
                        d3.select(this).select('text').text(d=>d.value).call(d=>truncate(d,'-'));
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
        cellsText.merge(cellsText_n).select('text').text(d=>d.value);

        let cellsGraph = cells.filter(d=>d&&tableLayout.column[d.key].type==='graph');
        let cellsGraph_n = cells_n.filter(d=>d&&tableLayout.column[d.key].type==='graph');
        cellsGraph_n.append('g').attr('class','violing');
        cellsGraph.merge(cellsGraph_n).select('g.violing').each(function(d){
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
        cellsText=cellsText.merge(cellsText_n).select('text').text(d=>{
            let custom = tableLayout.column[d.key].format;
            if (custom)
                return d3.format(custom)(d.value);
            else
                return d.value;
        });

        let cellsGraph = cells.filter(d=>tableLayout.column[d.key].type==='graph');
        let cellsGraph_n = cells_n.filter(d=>tableLayout.column[d.key].type==='graph');
        cellsGraph_n.append('g').attr('class','violing');
        cellsGraph.merge(cellsGraph_n)
            .on('click',function(d){
                let rangetime = [+Infinity,-Infinity];
                let username = d3.select(this.parentNode).datum().id;
                let data_temp = user.find(u=>u.key===username).dataRaw;
                let scaleY = d3.scaleLinear().range(schema.find(s=>s.text===d.key).range);
                let data = d3.nest().key(e=>e.name).rollup(f=>{
                    let temp = f.map((e,i)=>{
                        if (rangetime[0]>e.time)
                            rangetime[0]=e.time;
                        if (rangetime[1]<e.time)
                            rangetime[1]=e.time;
                        return {y:scaleY(e.find(a=>a.axis===d.key).value),
                            x: e.time,};
                    });
                    temp.label = f[0].name;
                    return temp;
                }).entries(data_temp).map(e=>e.value);
                let layout = tooltip_lib.layout();
                layout.axis.y.label = d.key;
                layout.axis.x.domain = rangetime;
                layout.axis.y.domain = scaleY.range();
                layout.title = `User: ${username}`;
                if (layout.axis.y.domain[1]>1000)
                    layout.axis.y.tickFormat = d3.format('~s');
                tooltip_lib.data(data).layout(layout).show()
            })
            .select('g.violing').each(function(d){
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
            'userID': {id:'userID',type:'text',x: 10,y:20,width:60},
            'hosts': {id:'hosts',type:'num',x: 130,y:20,width:60},
            'jobs': {id:'jobss',type:'num',x: 190,y:20,width:60},
        }
    };
    // let violiin_chart = d3.viiolinChart().graphicopt({width:tableLayout.row["graph-width"],height:20,opt:{dataformated:true},tick:{visibile:false},middleAxis:{'stroke-width':0.5}});
    let violiin_chart = d3.histChart().graphicopt({width:tableLayout.row["graph-width"],height:20,opt:{dataformated:true},tick:{visibile:false},middleAxis:{'stroke-width':0.5},symmetric: true});
    let linkdata = [];
    let user = [];
    let hostOb={};
    let hiddenlink = [];

    function handle_sort(disableLinkSort) {
        if(tableHeader.currentsort===undefined)
            user.sort((a, b) => b.values.length - a.values.length);
        else
            switch (tableHeader.currentsort) {
                case 'userID':
                    user.sort((a, b) => a.name.localeCompare(b.name)*(-1+2*tableHeader.direction));
                    break;
                case 'hosts':
                    user.sort((a, b) => (b.unqinode.length - a.unqinode.length)*(-1+2*tableHeader.direction));
                    break;
                case 'jobs':
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
            hosts.forEach(d => {
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
            return `translate(${d.fx},${d.fy})`
        });
    }

    function handle_links (){
        if (simulation)
            simulation.stop();
        linkdata = [];
        hosts.forEach(h=>h.user=[]);
        user = current_userData().sort((a,b)=>b.unqinode.length-a.unqinode.length).filter((d,i)=>i<10);
        // tableData = {}
        Object.keys(tableData).forEach(k=>tableData[k].keep =false);
        data=data.filter(d=>user.findIndex(e=>e.key===d.user)!==-1)
        data.forEach(d=>{
          d.name = d.jobID+'';
          d.type = 'job';
          d.nodes.forEach(n=>{
              let temp  ={source:n,target:d.jobID+''};
              let temp2  ={source:d.jobID+'',target:d.user};

              linkdata.push(temp);
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

        user = user.map((d,i)=>{
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
                    let namearr = group_temp_ob[k].map(d=>d.name);
                    temp.name = namearr.join(' ');
                    let sameSource = linkdata.filter(e=>namearr.find(f=>f===e.source+''));
                    sameSource.forEach((e,i)=>{
                        if (i===0) {
                            e.source = temp.name;
                            e.links = sameSource.length;
                        } else
                            e.del = true;
                    });
                    sameSource = linkdata.filter(e=>namearr.find(f=>f===e.target+''));
                    let temp_g = _.groupBy(sameSource,function(e){return e.source});
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
            d.dataRaw = (g.selectAll('.userNode').filter(e=>e.name==d.name).data()[0]|| {dataRaw:[]}).dataRaw;
            tableData[d.name] = tableData[d.name] || [{key:'hosts', value:0},
                {key:'jobs',value: 0}];
            tableData[d.name][0].value = d.unqinode.length;
            tableData[d.name][1].value = d.values.length;
            tableData[d.name].id = d.name;
            tableData[d.name].keep = true;
            return d
        });
        if (runopt.compute.clusterJobID) {
            linkdata = linkdata.filter(d => !d.del);
            linkscale.domain(d3.extent(linkdata,d=>d.links));
            data = newdata
        }
        Object.keys(tableData).forEach(k=>{
            if (!tableData[k].keep)
                delete tableData[k];
        });

        handle_sort(true);

        tableFooter[0] = {key:'userID',value:'Summary'}
        tableFooter[1] = {key:'hosts', value:hosts.filter(d=>d.user.length).length}
        tableFooter[2] = {key:'jobs', value:d3.sum(user,d=>d.values.length)};

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
        g.selectAll('.userNode').each(d=>d.needRender=false)
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
        schema.forEach((s,i)=>{
            let r = getViolinData(tableFooter, i, s);
            tableFooter[i+3] = {key:r.axis,value:r};
        });
        let user_update = g.selectAll('.userNode').filter(d=>d.needRender);
        let rangechange = false;
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
                // if (v.length > 20) {
                //     var x = d3.scaleLinear()
                //         .domain([0, 1]);
                //     let x_change = d3.scaleLinear()
                //         .domain([0, runopt.histodram.resolution - 1]).range(x.domain());
                //
                //     var histogram = d3.histogram()
                //         .domain(x.domain())
                //         .thresholds(d3.range(0, runopt.histodram.resolution).map(e => x_change(e)))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
                //         // .thresholds(x.ticks(runopt.histodram.resolution))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
                //         .value(d => d);
                //     let hisdata = histogram(v);
                //
                //     const iqr = r.q3 - r.q1;
                //     r.outlier = _.uniq(v.filter(e => e > (r.q3 + 2.5 * iqr) || e < (r.q1 - 2.5 * iqr)));
                //     r.point = [];
                //     sumstat = hisdata.map((d, i) => [d.x0 + (d.x1 - d.x0) / 2, (d || []).length]);
                //     if(d.type)
                //         violinRange [1] = Math.max(violinRange [1], d3.max(sumstat, e => e[1]));
                // } else {
                //     r.point = _.uniq(v);
                //     r.outlier = [];
                // }
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
                if(d.type && localmax>violinRange [1]) {
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
                    point : [],
                    arr: []
                };
            }
            return r;
        }

        user_update.each(d=>{
            schema.forEach((s,i)=>{
                let r = getViolinData(d, i, s);
                tableData[d.name][i+2] = {key:r.axis,value:r};
            })
            tableData[d.name][schema.length+2] = {key:'PowerUsage',value:d.PowerUsage.kwh};
            // tableData[d.name] =[{key:'hosts', value:d.unqinode.length}
        });

        user_update.selectAll('text').interrupt().selectAll("*").interrupt();
        user_update.selectAll('text').styles({'stroke': 'yellow','stroke-opacity': 1}).transition().duration(3000).styles({'stroke-opacity': 0});

        if (tableHeader.currentsort)
            handle_sort(true);
        updaterow(rangechange?g.selectAll('.userNode'):user_update);
        table_footer(nodeg.select('.table.footer'));
    }
    let zoom_toogle=true;
    function zoom_func(val){
        zoom_toogle = val;
        d3.select('.pantarget').classed('lock',zoom_toogle);
    };
    function makeOb (){
        hostOb={};
        hosts.forEach(h=>{h.data=[]; hostOb[h.name]=h;});
    }

    function makeheader() {
// make table header
        table_header(table_headerNode);
    }

    function updatalayout(data){
        let currentsort = tableHeader.currentsort;
        let currentdirection = tableHeader.direction;
        tableHeader = [{key:'userID', value:'userID'},{key:'hosts', value:'hosts'}, {key:'jobs',value: 'jobs'}];
        let offset = tableLayout.column['jobs'].x;
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
            return jobMap;
        }else {
            return runopt;
        }

    };

    jobMap.svg = function (_) {
        return arguments.length ? (svg = _, jobMap) : svg;
    };

    jobMap.data = function (_) {
        return arguments.length ? (data = _, handle_links (), jobMap) : data;
    };

    jobMap.zoomtoogle = function (_) {
        return arguments.length ? (zoom_func(_), jobMap) : zoom_toogle;
    };

    jobMap.hosts = function (a) {
        return arguments.length ? (hosts = _.cloneDeep( a),makeOb(), jobMap) : hosts;
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
    return jobMap;
};
