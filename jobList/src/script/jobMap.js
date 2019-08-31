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
        },
        svg, g,
        data = [],
        hosts = []
    ;
    let jobMap = {};
    let simulation;
    let timebox,linkg,nodeg;
    jobMap.init = function () {
        svg.attrs({
            width: graphicopt.width,
            height: graphicopt.height,

        }).call(d3.zoom().on("zoom", function () {
            g.attr("transform", d3.event.transform);
        }));
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
            });
        g = svg.append("g")
            .attr('class','pannel')
            .attr('transform',`translate(${graphicopt.margin.left},${graphicopt.margin.top})`);
        linkg = g.append("g")
            .attr('class','linkg');
        nodeg = g.append("g")
            .attr('class','nodeg');

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
        return jobMap;
    };
    let colorCategory  = d3.scaleOrdinal().range(d3.schemeCategory20);
    let colorBy = 'user';
    function colorFunc (key){
        switch (colorBy) {
            case 'user':
                return colorCategory(key);
            default:
                return 'black';
        }
    }


    jobMap.draw = function (timeStep){
        if (!timeStep)
            timeStep = new Date();
        timebox.text(timeStep.toLocaleTimeString())
        let yscale = d3.scaleLinear().domain([0,user.length-1]).range([0,graphicopt.heightG()]);
        let deltey = yscale(1)-yscale(0);

        // compute pie
        var arc = d3.arc()
            .outerRadius(graphicopt.node.r)
            .innerRadius(0);
        let pie = d3.pie()
            .value(function(d) {
                return d.value; })
            .sort(function(a, b) { return d3.ascending(a.order, b.order);} )

        let computers = nodeg.selectAll('.computeNode').data(hosts,function(d){return d.name});
        computers.exit().remove();
        let computers_n = computers.enter().append('g').attr('class',d=>'node computeNode '+fixName2Class(fixstr(d.name)))
            .attrs(
                {
                    'stroke':'black',
                });
        // computers_n.append('circle').attrs(
        //     {'class':'computeSig',
        //         'r': graphicopt.node.r,
        //         'fill':'white',
        //     });
        computers_n.append('g').attrs(
            {'class':'computeSig',
                // 'fill':'white',
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

        let piePath = computers
            .select('.computeSig')
            .selectAll('.piePath').data(d=>{
                let tempdata = d.user.map(e=>{return{value: e.unqinode_ob[d.name].length,
                        order: e.order,
                        user: e.name,

                    }});
                return pie(tempdata)
            });
        piePath.exit().remove();
        piePath.enter().append('path').attr('class','piePath')
            .attr('d',arc).style('fill',d=> colorFunc(d.data.user));

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
        // jobNode_n.append('circle').attrs(
        //     {'class':'computeSig',
        //         'r': graphicopt.node.r
        //     });
        jobNode_n.append('path')
            .attrs(
            {'class':'computeSig_b',
                // 'd': d=>spiral([new Date(d.submitTime),new Date(d.startTime),timeStep]),
                'd': d=>spiral(backdround_spiral),
                // 'stroke':'#ddd',
            });
        jobNode_n.append('path')
            .attrs(
            {'class':'computeSig_sub submitTime',
            })
            .attr('d',function(d){
                let temp = d3.timeHour.every(1).range(new Date(d.submitTime),new Date(d.startTime));
                temp.pop();
                temp.push(new Date(d.startTime))
                return spiral(temp);
            })
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
            })
        ;
        jobNode = jobNode.merge(jobNode_n)
        let userNode = nodeg.selectAll('.userNode').data(user,function(d){return d.name});
        userNode.exit().remove();
        let userNode_n = userNode.enter().append('g').attr('class',d=>'node userNode '+fixName2Class(fixstr(d.name)));
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
            {'class':'userNodeSig_label',
                'y': -graphicopt.user.r,
                'text-anchor':'middle',
            });


        userNode=userNode_n.merge(userNode);
        userNode.select('.userNodeSig_label')
        .text(d=>d.name);
        let node = nodeg.selectAll('.node');

        let scaleNode = d3.scaleLinear();
        var ticked = function() {
            if (this.alpha()<0.9 && this.fistTime)
                triggerForce ();
            userNode.data().sort((a,b)=>a.y-b.y).forEach((d,i)=> d.y = yscale(i));

            let range_com = d3.extent(computers.data(),d=>d.x);
            scaleNode.domain(range_com).range([20,120]);

            node.each(d=>{
                d.x = Math.max(graphicopt.node.r,Math.min(d.x,graphicopt.widthG()-graphicopt.node.r) );
            });
            computers.transition().attr('transform',d=>{
                d.x2 = scaleNode(d.x);
                return `translate(${d.x2},${d.y})`
            });
            let range_job = d3.extent(computers.data(),d=>d.x);
            scaleNode.domain(range_com).range([400,450]);
            jobNode.transition().attr('transform',d=>{
                d.x2 = scaleNode(d.x);
                return `translate(${d.x2},${d.y})`
            });
            userNode.transition().attr('transform',d=>{
                d.x2 = 800;
                return `translate(${d.x2},${d.y})`
            });
            link.transition()
                .attr("x1", function(d) { return d.source.x2||d.source.x; })
                .attr("y1", function(d) { return d.source.y2||d.source.y; })
                .attr("x2", function(d) { return d.target.x2||d.target.x; })
                .attr("y2", function(d) { return d.target.y2||d.target.y; });

        };

        intiForce();

        simulation
            .nodes(node.data())
            .on("tick", ticked);

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

            .merge(link);

        simulation.alphaTarget(0.8).restart();
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
            .data()
            .forEach(d=>{
                // d.fx=graphicopt.widthG();
                // d.fy=yscale(d.order);
                d.fx=graphicopt.widthG();
                d.y=yscale(d.order);
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
        function intiForce(){
            if (simulation) simulation.stop();
            let repelForce = d3.forceManyBody().strength(d=> (d.type==='job')?0:-150);
            let attractForce = d3.forceManyBody().strength(d=> (d.type==='job')?0:100);
            simulation = d3.forceSimulation()
                .force("link", d3.forceLink().id(function(d) { return d.name; }).distance(1).strength(d=>d.type?1:0.9))
                // .force("collide",d3.forceCollide(d=>
                //     (d.type==='job')?0:graphicopt.node.r).strength(0.8))
                // .force("charge1", attractForce)
                .force("charge2", repelForce)
                // .force("center", d3.forceCenter(graphicopt.widthG() / 2, graphicopt.heightG() / 2))
                // .force("y", d3.forceY(d=>
                //     yscale(d.order)||graphicopt.heightG()/2).strength(function(d){return d.type==='user'?0.8:0}))
                .force("x", d3.forceX(function(
                    d){return (d.type==='job')?graphicopt.widthG()/2:((d.type==='user')?graphicopt.widthG():0)}).strength(function(d){return d.type==='job'?0.8:1}))
            simulation.fistTime = true;
        }

        function triggerForce () {
            simulation.stop()
            let repelForce = d3.forceManyBody().strength(d=> (d.type==='job')?0:-150);
            let attractForce = d3.forceManyBody().strength(d=> (d.type==='job')?0:100);

            // _.pullAll(linkdata,hiddenlink); //delete hidden link

            //recompute distance
            // let newrange = d3.extent(computers.data(),d=>d.y);
            // const thehalf = (newrange[1]-newrange[0] - graphicopt.heightG())/10;
            // newrange = [0-thehalf,graphicopt.heightG()+thehalf];
            // yscale.range(newrange);

            simulation.force("link")
                .links(linkdata).strength(1);
            simulation.force("collide",d3.forceCollide(d=>
                (d.type==='job')?0:graphicopt.node.r).strength(0.8))
                .force("charge1", attractForce)
                // .force("charge2", repelForce)
                // .force("y", undefined);
            // .force("link", d3.forceLink().id(function(d) { return d.name; }).distance(1).strength(1))
            simulation.fistTime = false;
            simulation.alphaTarget(0.5).restart();
        }

        function updaterow(path){
            let rows = path.selectAll('.row').data(d=>tableData[d.id]);
            rows.exit().remove();
            let rows_n = rows.enter().append('g').attr('class','row');
            rows.append('rect').attrs({'class':'back-row','width':tableLayout.row.height})
        }
    };
    let tableLayout = {
        row:{
            width: 500,
            height: deltey,
        }
    };
    let linkdata = [];
    let user = [];
    let hostOb={};
    let hiddenlink = [];
    function handle_links (){
        linkdata = [];
        hosts.forEach(h=>h.user=[]);


        data.forEach(d=>{
          d.name = d.jobID+'';
          d.type = 'job';
          d.nodes.forEach(n=>{
              let temp  ={source:n,target:d.jobID};
              let temp2  ={source:d.jobID,target:d.user};

              linkdata.push(temp);
              // linkn.push(_.find(linkdata, { 'source': 1, 'target': true })||);
              linkdata.push(temp2);
          });
          let oldData = nodeg.select('.node.jobNode.'+fixName2Class(fixstr(d.name))).data();
          if (oldData.length){
              d.x = oldData[0].x;
              d.y = oldData[0].y;
              d.fx = oldData[0].fx;
              d.fy = oldData[0].fy;
              d.vx = oldData[0].vx;
              d.vy = oldData[0].vy;
          }
        });

        user = current_userData().sort((a,b)=>b.values.length-a.values.length).map((d,i)=>{
            d.name = d.key;
            d.order = i;
            d.type='user';
            d.unqinode_ob = {};
            d.unqinode.forEach(n=>{
                d.unqinode_ob[n] = d.values.filter(e=>e.nodes.find(f=>f===n));
                hostOb[n].user.push(d)});
            return d
        });
        hiddenlink = [];
        hosts.forEach(d=>{
            let n = d.user.length;
            if (n>1){
                for (let i = 0; i<n; i++) {
                    for (let j = 0; j < n; j++) {
                        let temp = {
                            source: d.user[i].name,
                            target: d.user[j].name,
                            type: 'ranking'
                        };
                        hiddenlink.push(temp);
                        linkdata.push(temp);
                    }
                    let temp = {
                        source: d.name,
                        target: d.user[i].name,
                        type: 'ranking'
                    };
                    hiddenlink.push(temp);
                    linkdata.push(temp);
                }
            }
        });
        return linkdata
    };
    let zoom_toogle=true;
    function zoom_func(val){
        zoom_toogle = val;
        d3.select('.pantarget').classed('lock',zoom_toogle);
    };
    function makeOb (){
        hostOb={};
        hosts.forEach(h=>hostOb[h.name]=h);
    }
    jobMap.graphicopt = function (_) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in _) {
                if ('undefined' !== typeof _[i]) {
                    graphicopt[i] = _[i];
                }
            }
            return jobMap;
        }else {
            return graphicopt;
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
    return jobMap;
};