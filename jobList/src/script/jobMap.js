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

        });
        svg.append('rect').attr('class','pantarget')
            .attrs({
                'opacity':0,
                width: graphicopt.width,
                height: graphicopt.height,
            }).call(d3.zoom().on("zoom", function () {
            g.attr("transform", d3.event.transform);
        }))

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
        let attractForce = d3.forceManyBody().strength(d=> (d.type==='job')?0:-150);
        let repelForce = d3.forceManyBody().strength(d=> (d.type==='job')?0:100);
        simulation = d3.forceSimulation()
            .alphaDecay(0.03)
            .force("link", d3.forceLink().id(function(d) { return d.name; }).strength(0.9))
            .force("collide",d3.forceCollide(d=>
                (d.type==='job')?0:graphicopt.node.r).strength(0.8))
            .force("charge1", attractForce)
            .force("charge2", repelForce)
            // .force("center", d3.forceCenter(graphicopt.widthG() / 2, graphicopt.heightG() / 2))
            // .force("y", d3.forceY(graphicopt.heightG() / 2).strength(function(d){return d.type==="job"?0.5:0.1}))
            .force("x", d3.forceX(function(d){return (d.type==='job')?graphicopt.widthG() / 2:((d.type==='user')?graphicopt.widthG():0)}).strength(function(d){return d.type==='job'?0.8:1}))
        return jobMap;
    };
    jobMap.remove = function (){
        simulation.stop();
        nodeg.selectAll('*').remove();
        linkg.selectAll('*').remove();
        return jobMap;
    };
    jobMap.draw = function (timeStep){
        if (!timeStep)
            timeStep = new Date();
        timebox.text(timeStep.toLocaleTimeString())
        let yscale = d3.scaleLinear().domain([0,user.length-1]).range([0,graphicopt.heightG()]);

        let computers = nodeg.selectAll('.computeNode').data(hosts,function(d){return d.name});
        computers.exit().remove();
        let computers_n = computers.enter().append('g').attr('class',d=>'node computeNode '+fixName2Class(fixstr(d.name)))
            .attrs(
                {
                    'stroke':'black',
                });
        computers_n.append('circle').attrs(
            {'class':'computeSig',
                'r': graphicopt.node.r,
                'fill':'white',
            });


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
        // let b_spiral = d3.interpolateDate(timerange);
        // let b_spiral_s = d3.scaleLinear().range([0,(time_daynum-1)*12]);
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
                'stroke':'black',
                'stroke-opacity':0.1,
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

        let userNode = nodeg.selectAll('.userNode').data(user,function(d){return d.name});
        userNode.exit().remove();
        let userNode_n = userNode.enter().append('g').attr('class',d=>'node userNode '+fixName2Class(fixstr(d.name)));
        userNode_n.append('circle').attrs(
            {'class':'computeSig',
                'r': graphicopt.node.r
            });

        let node = nodeg.selectAll('.node');

        var ticked = function() {
            node.attr('transform',d=>{
                d.x = Math.max(graphicopt.node.r,Math.min(d.x,graphicopt.widthG()-graphicopt.node.r) );
                // d.y = Math.max(graphicopt.node.r,Math.min(d.y,graphicopt.heightG()-graphicopt.node.r) );
                return `translate(${d.x},${d.y})`
            });
            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

        };


        simulation
            .nodes(node.data())
            .on("tick", ticked);

        simulation.force("link")
            .links(linkdata);
        let link = linkg.selectAll('.links').data(linkdata,function(d){return d.source.name+ "-" +d.target.name});
        // let link = linkg.selectAll('.links').data(linkdata);
        link.exit().remove();
        link = link.enter().append('line')
            .attr("class", "links")
            .attr("stroke", "#ddd")

            .merge(link);
        simulation.alphaTarget(0.3).restart();
        g.selectAll('.userNode')
            .on('mouseover',d=> {
                d3.selectAll('.jobNode').filter(e=>e.nodes.find(f=>f!==d.name)).style('opacity',0);
                let jobl = d3.selectAll('.jobNode').filter(e=>e.user===d.name).style('opacity',1);
                const jobd = jobl.data();
                d3.selectAll( '.computeNode.'+d.unqinode.map(e=>fixName2Class(fixstr(e))).join(', .computeNode.')).style('stroke','red');
                link.filter(d=> jobd.find(e=>e===d.source||e===d.target)).style('stroke','red');
            }).on('mouseout',d=> {
                d3.selectAll('.jobNode').style('opacity',undefined);
                let jobl = d3.selectAll('.jobNode').filter(e=>e.user===d.name);
                const jobd = jobl.data();
                d3.selectAll( '.computeNode.'+d.unqinode.map(e=>fixName2Class(fixstr(e))).join(', .computeNode.')).style('stroke',undefined);
                link.filter(d=> jobd.find(e=>e===d.source||e===d.target)).style('stroke',undefined);
            })
            .data().forEach(d=>{d.fx=graphicopt.widthG();d.fy=yscale(d.order);});
        g.selectAll('.computeNode')
            .on('mouseover',d=> {
                d3.selectAll('.jobNode').filter(e=>e.nodes.find(f=>f!==d.name)).style('opacity',0);
                let jobl = d3.selectAll('.jobNode').filter(e=>e.nodes.find(f=>f===d.name)).style('opacity',1);
                const jobd = jobl.data();
                d3.selectAll( '.userNode').filter(e=>jobd.find(f=>f.user===e.name)).style('fill','red');
                link.style('opacity',0);
                link.filter(f=> d===f.source||jobd.find(e=>e===f.source)).style('opacity',1).style('stroke','red');
            }).on('mouseout',d=> {
            d3.selectAll('.jobNode').style('opacity',undefined);
            let jobl = d3.selectAll('.jobNode').filter(e=>e.nodes.find(f=>f===d.name));
            const jobd = jobl.data();
            d3.selectAll( '.userNode').filter(e=>jobd.find(f=>f.user===e.name)).style('fill',undefined);
            // link.filter(f=> d===f.source||jobd.find(e=>e===f.source)).style('stroke',undefined);
            link.style('opacity',undefined).style('stroke',undefined);
        });
        g.selectAll('.jobNode')
            .on('mouseover',function(d){
                g.selectAll('.jobNode').style('opacity',0);
                d3.select(this).style('opacity',1);
                d3.selectAll( '.userNode').filter(e=>d.user===e.name).style('fill','red');
                d3.selectAll( '.computeNode.'+d.nodes.map(e=>fixName2Class(fixstr(e))).join(', .computeNode.')).style('stroke','red');
                link.style('opacity',0);
                link.filter(f=> d===f.source||d===f.target).style('opacity',1).style('stroke','red');
            }).on('mouseout',function(d){
            g.selectAll('.jobNode').style('opacity',undefined);
            d3.selectAll( '.userNode').filter(e=>d.user===e.name).style('fill',undefined);
                d3.selectAll( '.computeNode.'+d.nodes.map(e=>fixName2Class(fixstr(e))).join(', .computeNode.')).style('stroke',undefined);
                // link.filter(f=> d===f.source||jobd.find(e=>e===f.source)).style('stroke',undefined);
                link.style('opacity',undefined).style('stroke',undefined);
        });

    };
    let linkdata = [];
    let user = [];
    function handle_links (){
        linkdata.length = 0;
        user = current_userData().sort((a,b)=>b.values.length-a.values.length).map((d,i)=>{
            d.name = d.key;
            d.order = i;
            d.type='user';
            return d});
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

        return linkdata
    };
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
    jobMap.hosts = function (_) {
        return arguments.length ? (hosts = _, jobMap) : hosts;
    };
    return jobMap;
};