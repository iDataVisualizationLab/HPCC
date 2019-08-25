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
            // overflow: "visible",

        });
        g = svg.append("g")
            .attr('class','pannel')
            .attr('transform',`translate(${graphicopt.margin.left},${graphicopt.margin.top})`);
        linkg = g.append("g")
            .attr('class','linkg');
        nodeg = g.append("g")
            .attr('class','nodeg');
        timebox = g.append('text').attr('class','timebox').style('font-size','16px').attr('dy','1rem');
        simulation = d3.forceSimulation()
            .alphaDecay(0.03)
            .force("link", d3.forceLink().id(function(d) { return d.name; }))
            .force("collide",d3.forceCollide(d=>(d.type==='job')?0:graphicopt.node.r).strength(0.5) )
            .force("charge", d3.forceManyBody().strength(d=> (d.type==='job')?0:-40))
            // .force("center", d3.forceCenter(graphicopt.widthG() / 2, graphicopt.heightG() / 2))
            .force("y", d3.forceY(graphicopt.heightG() / 2).strength(function(d){return d.type==="job"?0.1:0}))
            .force("x", d3.forceX(function(d){return (d.type==='job')?graphicopt.widthG() / 2:((d.type==='user')?graphicopt.widthG():0)}).strength(function(d){return d.type==='job'?0.1:0.8}))
        return jobMap;
    };
    jobMap.remove = function (){
        simulation.stop();
        nodeg.selectAll('*').remove();
        linkg.selectAll('*').remove();
        return jobMap;
    }
    jobMap.draw = function (timeStep){
        if (timeStep)
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
                'fill':'none',
            });

        let jobNode = nodeg.selectAll('.jobNode').data(data,function(d){return d.name});
        jobNode.exit().remove();
        let jobNode_n = jobNode.enter().append('g').attr('class',d=>'node jobNode '+fixName2Class(fixstr(d.name)));
        jobNode_n.append('circle').attrs(
            {'class':'computeSig',
                'r': graphicopt.node.r
            });

        let userNode = nodeg.selectAll('.userNode').data(user,function(d){return d.name});
        userNode.exit().remove();
        let userNode_n = userNode.enter().append('g').attr('class',d=>'node userNode '+fixName2Class(fixstr(d.name)));
        userNode_n.append('circle').attrs(
            {'class':'computeSig',
                'r': graphicopt.node.r
            });

        let node = nodeg.selectAll('.node');

        var ticked = function() {
            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node.attr('transform',d=>`translate(${d.x},${d.y})`);
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
        simulation.alphaTarget(0.7).restart();
        g.selectAll('.userNode')
            .on('mouseover',d=> {
                let jobl = d3.selectAll('.jobNode').filter(e=>e.user===d.name).style('fill','red')
                const jobd = jobl.data();
                d3.selectAll( '.computeNode.'+d.unqinode.map(e=>fixName2Class(fixstr(e))).join(', .computeNode.')).style('stroke','red');
                link.filter(d=> jobd.find(e=>e===d.source||e===d.target)).style('stroke','red');
            }).on('mouseout',d=> {
                let jobl = d3.selectAll('.jobNode').filter(e=>e.user===d.name).style('fill',undefined)
                const jobd = jobl.data();
                d3.selectAll( '.computeNode.'+d.unqinode.map(e=>fixName2Class(fixstr(e))).join(', .computeNode.')).style('stroke',undefined);
                link.filter(d=> jobd.find(e=>e===d.source||e===d.target)).style('stroke',undefined);
            })
            .data().forEach(d=>{d.fx=graphicopt.widthG();d.fy=yscale(d.order);});

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