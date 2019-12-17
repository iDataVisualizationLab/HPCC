d3.tsneTimeSpace = function () {
    let graphicopt = {
            margin: {top: 40, right: 40, bottom: 40, left: 40},
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
            },radaropt : {
                // summary:{quantile:true},
                mini:true,
                levels:6,
                gradient:true,
                w:40,
                h:40,
                showText:false,
                margin: {top: 0, right: 0, bottom: 0, left: 0},
            }
        },
        runopt = {},
        isBusy = false;
    let tsne,colorscale;
    let master={},solution,datain,filter_by_name=[],table_info,path;
    let xscale=d3.scaleLinear(),yscale=d3.scaleLinear();
    // grahic 
    let background_canvas,background_ctx,front_canvas,front_ctx,svg;
    //----------------------color----------------------
    let createRadar = _.partialRight(createRadar_func,graphicopt.radaropt,colorscale);

    function renderSvgRadar() {
        let datapoint = svg.selectAll(".linkLinegg").interrupt().data(d => datain.map(e => e.__metrics), d => d.name + d.timestep);
        datapoint.exit().remove();
        let datapoint_n = datapoint.enter().append('g')
            .attr('class', 'linkLinegg timeline');
        datapoint_n.each(function (d, i) {
            createRadar(d3.select(this).select('.linkLineg'), d3.select(this), d, {colorfill: true}).classed('hide', d.hide);// hide 1st radar
        });

        datapoint_n.merge(datapoint).attr('transform', function (d) {
            return `translate(${xscale(d.position[0])},${yscale(d.position[1])})`
        })
            .on('mouseover', d => {
                master.hightlight([d.name_or])
                svg.selectAll('.linkLinegg').filter(e => d.name_or !== e.name_or).classed('hide', true)
                // d3.selectAll('.h'+d[0].name).dispatch('mouseover');
            }).on('mouseleave', d => {
            master.unhightlight(d.name_or)
            svg.selectAll('.linkLinegg.hide').classed('hide', false)
            // d3.selectAll('.h'+d[0].name).dispatch('mouseleave');
        })
    }

    master.init = function(arr,cluster) {
        datain = arr;
        handle_data(datain);
        background_canvas = document.getElementById("tsneScreen");
        background_canvas.width  = graphicopt.width;
        background_canvas.height = graphicopt.height;
        background_ctx = background_canvas.getContext('2d');
        front_canvas = document.getElementById("tsneScreen_fornt");
        front_canvas.width  =  graphicopt.width;
        front_canvas.height = graphicopt.height;
        front_ctx = front_canvas.getContext('2d');
        svg = d3.select('#tsneScreen_svg').attrs({width: graphicopt.width,height:graphicopt.height});
        svg.selectAll('*').remove();
        table_info = d3.select('#tsneInformation table').styles({'width':'150px'});
        xscale.range([graphicopt.margin.left,background_canvas.width-graphicopt.margin.right]);
        yscale.range([graphicopt.margin.top,background_canvas.height-graphicopt.margin.bottom]);
        if (tsne)
            tsne.terminate();
        tsne = new Worker('src/script/worker/tSNETimeSpaceworker.js');
        // tsne.postMessage({action:"initcanvas", canvas: offscreen, canvasopt: {width: graphicopt.widthG(), height: graphicopt.heightG()}}, [offscreen]);
        tsne.postMessage({action:"initcanvas", canvasopt: {width: graphicopt.widthG(), height: graphicopt.heightG()}});
        console.log(`----inint tsne with: `,graphicopt.opt)
        colorarr = colorscale.domain().map((d,i)=>({name:d, order: +d.split('_')[1], value: colorscale.range()[i]}))
        colorarr.sort((a,b)=>a.order-b.order);

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
                    updateTableInformation(data);
                    render(solution);
                    break;
                case "stable":
                    isBusy = false;
                    render(solution,true);
                    tsne.terminate();
                default:
                    break;
            }
        })

        return master;
        function render (solution,isradar){
            createRadar = _.partialRight(createRadar_func,graphicopt.radaropt,colorscale)
            background_ctx.clearRect(0, 0, graphicopt.width, graphicopt.height);
            if(filter_by_name&&filter_by_name.length)
                front_ctx.clearRect(0, 0, graphicopt.width, graphicopt.height);
            path = {};
            solution.forEach(function(d, i) {
                const target = datain[i];
                target.__metrics.position = d;
                if (!path[target.name])
                    path[target.name] = [];
                path[target.name].push({name:target.name,key:target.timestep,value:d,cluster:target.cluster});
                let fillColor = d3.color(colorarr[target.cluster].value);
                fillColor.opacity = 0.8
                background_ctx.fillStyle = fillColor+'';
                background_ctx.fillRect(xscale(d[0])-2, yscale(d[1])-2, 4, 4);
            });
            d3.values(path).filter(d=>d.length>1?d.sort((a,b)=>a.t-b.t):false).forEach(path=>{
                // make the combination of 0->4 [0,0,1,2] , [0,1,2,3], [1,2,3,4],[2,3,4,4]
                for (let i=0;i<path.length-1;i++){
                    let a =( path[i-1]||path[i]).value;
                    let b = path[i].value;
                    let c = path[i+1].value;
                    let d = (path[i+2]||path[i+1]).value;
                    drawline(background_ctx,[a,b,c,d],path[i].cluster);
                }
            })

            if(isradar) {
                renderSvgRadar();
            }
        }
    };

    function handle_data(data){
        data.forEach(d=>{
            d.__metrics = d.map((m,i)=>{
                return {axis: serviceFullList[i].text, value: m}
            });
            d.__metrics.name = d.clusterName;
            d.__metrics.name_or = d.name;
            d.__metrics.timestep = d.timestep;
        })
    }

    master.stop = function(){
        if (tsne) {
            tsne.terminate();
            renderSvgRadar()
        }
    };



    function positionLink_canvas(path,ctx) { //path 4 element
        // return p = new Path2D(positionLink(a,b));
        ctx.beginPath();
        return d3.line()
            .x(function(d) { return xscale(d[0]); })
            .y(function(d) { return yscale(d[1]); })
            .curve(d3.curveCardinalOpen)
            .context(ctx)(path);
    }

    function drawline(ctx,path,cluster) {
        positionLink_canvas(path,ctx);

        // ctx.beginPath();
        // ctx.moveTo(xscale(d[0]), yscale(d[1]));
        // ctx.lineTo(xscale(nexttime[0]), yscale(nexttime[1]));
        ctx.strokeStyle = colorarr[cluster].value;
        ctx.stroke();
    }



    master.hightlight = function(namearr){
        filter_by_name = namearr||[];
        if (filter_by_name.length) {
            front_ctx.clearRect(0, 0, graphicopt.width, graphicopt.height);
            d3.values(path).filter(d=>(filter_by_name.find(n => n === d[0].name)&& d.length)>1?d.sort((a,b)=>a.t-b.t):false).forEach(path=>{
                // make the combination of 0->4 [0,0,1,2] , [0,1,2,3], [1,2,3,4],[2,3,4,4]
                for (let i=0;i<path.length-1;i++){
                    let a =( path[i-1]||path[i]).value;
                    let b = path[i].value;
                    let c = path[i+1].value;
                    let d = (path[i+2]||path[i+1]).value;
                    drawline(front_ctx,[a,b,c,d],path[i].cluster);
                }
            })

            d3.select(background_canvas).style('opacity', 0.1);
            d3.select(front_canvas).style('opacity', 1);


        }
    };
    master.unhightlight = function() {
        filter_by_name = [];
        d3.select(background_canvas).style('opacity',1);
        d3.select(front_canvas).style('opacity',0);
    };
    function updateTableInformation(output){
        let tableData = [
            [
                {text:"Setting",type:"title"},
            ],
            [
                {text:"Output",type:"title"},
                {id:"#Iterations",text:output.iteration?d3.format('.4')(output.iteration):'_'},
                {id:"cost",text:output.cost?d3.format('.2')(output.cost):'_'},
                {id:"delta cost",text:output.epsilon?d3.format('.2')(output.epsilon):'_'},
                {id:"time",text:output.time?(millisecondsToStr(output.time)):'_'},
            ]
        ];
        d3.entries(graphicopt.opt).forEach(d=>{
            tableData[0].push({id:d.key,text:d.value})
        });
        tableData[0].push({id:'#Radars',text:datain.length});


        let tbodys = table_info.selectAll('tbody').data(tableData);
        tbodys.selectAll('tr').data(d=>d) .selectAll('td').data(d=>d.type?[d]:[{text:d.id},{text:d.text}]);
        tbodys
            .enter().append('tbody')
                .selectAll('tr').data(d=>d)
                .enter().append('tr')
                    .selectAll('td').data(d=>d.type?[d]:[{text:d.id},{text:d.text}])
                    .enter().append('td')
                    .attr('colspan',d=>d.type?"2":null)
                    .style('text-align',(d,i)=>d.type?"center":(i?"right":"left"));
        table_info.selectAll('tbody').selectAll('tr').selectAll('td')
            .text(d=>d.text);


    }
    


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
    master.graphicopt = function (__) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in __) {
                if ('undefined' !== typeof __[i]) {
                    graphicopt[i] = __[i];
                }
            }
            if (graphicopt.radaropt)
                graphicopt.radaropt.schema = serviceFullList;
            createRadar = _.partialRight(createRadar_func,graphicopt.radaropt,colorscale)
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

function handle_data_tsne(tsnedata) {
    let dataIn = [];

    d3.values(tsnedata).forEach(axis_arr => {
        let lastcluster;
        let lastdataarr;
        let count = 0;
        sampleS.timespan.forEach((t, i) => {
            let index = axis_arr[i].cluster;
            axis_arr[i].clusterName = cluster_info[index].name
            // timeline precalculate
            if (!(lastcluster !== undefined && index === lastcluster) || runopt.suddenGroup&& calculateMSE_num(lastdataarr,axis_arr[i])>cluster_info[axis_arr[i].cluster].mse*runopt.suddenGroup) {
                lastcluster = index;
                lastdataarr = axis_arr[i];
                axis_arr[i].timestep = count; // TODO temperal timestep
                count++;
                dataIn.push(axis_arr[i])
            }
            return index;
            // return cluster_info.findIndex(c=>distance(c.__metrics.normalize,axis_arr)<=c.radius);
        })
    });

    TsneTSopt.opt = {
            epsilon: 20, // epsilon is learning rate (10 = default)
            perplexity: Math.round(dataIn.length / cluster_info.length), // roughly how many neighbors each point influences (30 = default)
            dim: 2, // dimensionality of the embedding (2 = default)
    }
    tsneTS.graphicopt(TsneTSopt).color(colorCluster).init(dataIn, cluster_info.map(c => c.__metrics.normalize));
}
function calculateMSE_num(a,b){
    return ss.sum(a.map((d,i)=>(d-b[i])*(d-b[i])));
}
