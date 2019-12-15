d3.tsneTimeSpace = function () {
    let graphicopt = {
            margin: {top: 0, right: 0, bottom: 0, left: 0},
            width: 1500,
            height: 1000,
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
            opt: {
                epsilon: 20, // epsilon is learning rate (10 = default)
                perplexity: 1000, // roughly how many neighbors each point influences (30 = default)
                dim: 2, // dimensionality of the embedding (2 = default)
            }
        },
        runopt = {},
        isBusy = false;
    let tsne,colorscale;
    let master={},solution,datain,maptimestep,filter_by_name=[];
    let xscale=d3.scaleLinear(),yscale=d3.scaleLinear();
    // grahic 
    let background_canvas,background_ctx,front_canvas,front_ctx,svg;
    master.init = function(arr,cluster) {
        datain = arr;
        // background_canvas = document.getElementById("tsneScreen");
        // background_canvas.width  =  graphicopt.widthG();
        // background_canvas.height = graphicopt.heightG();
        // background_ctx = background_canvas.getContext('2d');
        // front_canvas = document.getElementById("tsneScreen_fornt");
        // front_canvas.width  =  graphicopt.widthG();
        // front_canvas.height = graphicopt.heightG();
        // front_ctx = front_canvas.getContext('2d');
        svg = d3.select('#tsneScreen_svg').attrs({width: graphicopt.widthG(),height:graphicopt.heightG()}).style('opacity',0);
        xscale.range([0,background_canvas.width]);
        yscale.range([0,background_canvas.height]);

        // var offscreen = background_canvas.transferControlToOffscreen();
        if (tsne)
            tsne.terminate();
        tsne = new Worker('src/script/worker/tSNETimeSpaceworker.js');
        // tsne.postMessage({action:"initcanvas", canvas: offscreen, canvasopt: {width: graphicopt.widthG(), height: graphicopt.heightG()}}, [offscreen]);
        tsne.postMessage({action:"initcanvas", canvasopt: {width: graphicopt.widthG(), height: graphicopt.heightG()}});
        console.log(`----inint tsne with: `,graphicopt.opt)
        colorarr = colorscale.domain().map((d,i)=>({name:d, order: +d.split('_')[1], value: colorscale.range()[i]}))
        colorarr.sort((a,b)=>a.order-b.order);

        maptimestep = {};

        arr.forEach((d,i)=>{
            if (!maptimestep[d.name])
                maptimestep[d.name]={};
            if (d.timestep>0)
                maptimestep[d.name][d.timestep-1] = i;
        });

        tsne.postMessage({action:"colorscale",value:colorarr});
        tsne.postMessage({action:"inittsne",value:graphicopt.opt});
        tsne.postMessage({action:"initDataRaw",value:arr,clusterarr:cluster});
        tsne.addEventListener('message',({data})=>{
            switch (data.action) {
                case "render":
                    isBusy = true;
                    xscale.domain(data.xscale.domain)
                    yscale.domain(data.yscale.domain)
                    solution = data.sol;
                    render(solution);
                    break;
                case "stable":
                    isBusy = false;
                    tsne.terminate();
                default:
                    break;
            }
        })

        return master;
        function render (solution){
            background_ctx.clearRect(0, 0, graphicopt.widthG(), graphicopt.heightG());
            if(filter_by_name&&filter_by_name.length)
                front_ctx.clearRect(0, 0, graphicopt.widthG(), graphicopt.heightG());
            let path = {};
            solution.forEach((d, i) => {
                const target = arr[i];
                if (!path[target.name])
                    path[target.name] = [];
                path[target.name].push({name:target.name,key:target.timestep,value:d});
                background_ctx.fillStyle = colorarr[target.cluster].value;
                background_ctx.fillRect(xscale(d[0])-2, yscale(d[1])-2, 4, 4);
                // draw connection
                if (maptimestep[target.name][target.timestep]!==undefined) {
                    drawline(background_ctx,target, d);
                }
                hightlight_render_single(target, d);
            })
            let linepath = svg.selectAll('path').data(d3.values(path).map(d=>d.sort((a,b)=>a.t-b.t)));
            linepath
                .enter().append('path')
                .merge(linepath)
                .styles({'stroke-width':4,'stroke':'black'})
                .attr('d',d3.line().x(function(d) { return xscale(d.value[0]); })
                    .y(function(d) { return yscale(d.value[1]); }))
                .on('mouseover',d=>{
                    console.log(d[0].name);
                    d3.selectAll('.h'+d[0].name).dispatch('mouseover');
                }).on('mouseleave',d=>{
                    d3.selectAll('.h'+d[0].name).dispatch('mouseleave');
                })

        }
    };

    function drawline(ctx,target, d) {
        let nexttime = solution[maptimestep[target.name][target.timestep]];
        ctx.beginPath();
        ctx.moveTo(xscale(d[0]), yscale(d[1]));
        ctx.lineTo(xscale(nexttime[0]), yscale(nexttime[1]));
        ctx.strokeStyle = colorarr[target.cluster].value;
        ctx.stroke();
    }

    function hightlight_render_single(target, d) {
        if (filter_by_name.find(n => n === target.name))
            if (maptimestep[target.name][target.timestep] !== undefined) {
                drawline(front_ctx, target, d);
            }
    }

    master.hightlight = function(namearr){
        filter_by_name = namearr;
        front_ctx.clearRect(0, 0, graphicopt.widthG(), graphicopt.heightG());
        solution.forEach((d, i) => {
            const target = datain[i];
            hightlight_render_single(target, d);

        });
        d3.select(background_canvas).style('opacity',0.1);
        d3.select(front_canvas).style('opacity',1);
    };
    master.unhightlight = function() {
        filter_by_name = [];
        d3.select(background_canvas).style('opacity',1);
        d3.select(front_canvas).style('opacity',0);
    };
    master.runopt = function (_) {
        //Put all of the options into a variable called runopt
        if (arguments.length) {
            for (let i in _) {
                if ('undefined' !== typeof _[i]) {
                    runopt[i] = _[i];
                }
            }
            return master;
        }else {
            return runopt;
        }

    };
    master.graphicopt = function (_) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in _) {
                if ('undefined' !== typeof _[i]) {
                    graphicopt[i] = _[i];
                }
            }
            if (graphicopt.radaropt)
                graphicopt.radaropt.schema = schema
            return master;
        }else {
            return graphicopt;
        }

    };

    master.solution = function (_) {
        return solution;
    };

    master.color = function (_) {
        return arguments.length ? (colorscale = _, master) : colorscale;
    };

    master.schema = function (_) {
        return arguments.length ? (graphicopt.radaropt.schema = _,schema = _, master) : schema;
    };
    master.dispatch = function (_) {
        return arguments.length ? (returnEvent = _, master) : returnEvent;
    };

    return master;
}