d3.TimeSpace = function () {
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
                // dim: 2, // dimensionality of the embedding (2 = default)
            },radaropt : {
                // summary:{quantile:true},
                mini:true,
                levels:6,
                gradient:true,
                w:40,
                h:40,
                showText:false,
                margin: {top: 0, right: 0, bottom: 0, left: 0},
            },
            linkConnect: true,
            component:{
                dot:{size:4,opacity:0.2},
                link:{size:0.8,opacity:0.1},
            }
        },
        controlPanelGeneral = {
            linkConnect: {text: "Draw link", type: "checkbox", variable: 'linkConnect', width: '100px',callback:()=>render(!isBusy)},
        },
        formatTable = {
            'time': function(d){return millisecondsToStr(d)},
            'totalTime': function(d){return millisecondsToStr(d)},
            'iteration': function(d){return d},
            'stopCondition': function(d) {return '1e'+Math.round(d)}
        },tableWidth = 200
        ,
        runopt = {},
        isBusy = false;
    let modelWorker,colorscale;
    let master={},solution,datain=[],filter_by_name=[],table_info,path,cluster=[];
    let xscale=d3.scaleLinear(),yscale=d3.scaleLinear();
    // grahic 
    let camera,background_canvas,background_ctx,front_canvas,front_ctx,svg;
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

    function start() {
        svg.selectAll('*').remove();
        if (modelWorker)
            modelWorker.terminate();
        modelWorker = new Worker(self.workerPath);
        // modelWorker.postMessage({action:"initcanvas", canvas: offscreen, canvasopt: {width: graphicopt.widthG(), height: graphicopt.heightG()}}, [offscreen]);
        modelWorker.postMessage({action: "initcanvas", canvasopt: {width: graphicopt.widthG(), height: graphicopt.heightG()}});
        console.log(`----inint ${self.workerPath} with: `, graphicopt.opt)
        colorarr = colorscale.domain().map((d, i) => ({name: d, order: +d.split('_')[1], value: colorscale.range()[i]}))
        colorarr.sort((a, b) => a.order - b.order);

        modelWorker.postMessage({action: "colorscale", value: colorarr});
        // modelWorker.postMessage({action: "initmodelWorker", value: graphicopt.opt});
        modelWorker.postMessage({action: "initDataRaw", value: datain, clusterarr: cluster});
        modelWorker.addEventListener('message', ({data}) => {
            switch (data.action) {
                case "render":
                    isBusy = true;
                    xscale.domain(data.xscale.domain);
                    yscale.domain(data.yscale.domain);
                    solution = data.sol;
                    updateTableOutput(data.value);
                    render();
                    isBusy = false;
                    break;
                case "stable":
                    modelWorker.terminate();
                    render(true);
                    break;
                default:
                    break;
            }
        })
    }

    master.init = function(arr,clusterin) {
        datain = arr;
        cluster = clusterin
        handle_data(datain);
        updateTableInput();
        xscale.range([graphicopt.margin.left,graphicopt.width-graphicopt.margin.right]);
        yscale.range([graphicopt.margin.top,graphicopt.height-graphicopt.margin.bottom]);

        background_canvas = document.getElementById("modelWorkerScreen");
        background_canvas.width  = graphicopt.width;
        background_canvas.height = graphicopt.height;
        background_ctx = background_canvas.getContext('2d');
        front_canvas = document.getElementById("modelWorkerScreen_fornt");
        front_canvas.width  =  graphicopt.width;
        front_canvas.height = graphicopt.height;
        front_ctx = front_canvas.getContext('2d');
        svg = d3.select('#modelWorkerScreen_svg').attrs({width: graphicopt.width,height:graphicopt.height});

        d3.select('#modelWorkerInformation+.title').text(self.name)

        start();

        return master;
    };

    function render (isradar){
        if(solution) {
            createRadar = _.partialRight(createRadar_func, graphicopt.radaropt, colorscale)
            background_ctx.clearRect(0, 0, graphicopt.width, graphicopt.height);
            if (filter_by_name && filter_by_name.length)
                front_ctx.clearRect(0, 0, graphicopt.width, graphicopt.height);
            path = {};
            solution.forEach(function (d, i) {
                const target = datain[i];
                target.__metrics.position = d;
                if (!path[target.name])
                    path[target.name] = [];
                path[target.name].push({name: target.name, key: target.timestep, value: d, cluster: target.cluster});
                let fillColor = d3.color(colorarr[target.cluster].value);
                fillColor.opacity = graphicopt.component.dot.opacity;
                background_ctx.fillStyle = fillColor + '';
                background_ctx.fillRect(xscale(d[0]) - graphicopt.component.dot.size / 2, yscale(d[1]) - graphicopt.component.dot.size / 2, graphicopt.component.dot.size, graphicopt.component.dot.size);
            });
            if (graphicopt.linkConnect) {
                d3.values(path).filter(d => d.length > 1 ? d.sort((a, b) => a.t - b.t) : false).forEach(path => {
                    // make the combination of 0->4 [0,0,1,2] , [0,1,2,3], [1,2,3,4],[2,3,4,4]
                    for (let i = 0; i < path.length - 1; i++) {
                        let a = (path[i - 1] || path[i]).value;
                        let b = path[i].value;
                        let c = path[i + 1].value;
                        let d = (path[i + 2] || path[i + 1]).value;
                        drawline(background_ctx, [a, b, c, d], path[i].cluster);
                    }
                })
            }

            if (isradar && datain.length < 5000) {
                renderSvgRadar();
            }
        }
    }

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
        if (modelWorker) {
            modelWorker.terminate();
            renderSvgRadar()
        }
    };



    function positionLink_canvas(path, ctx) { //path 4 element
        // return p = new Path2D(positionLink(a,b));
        ctx.beginPath();
        return d3.line()
            .x(function (d) {
                return xscale(d[0]);
            })
            .y(function (d) {
                return yscale(d[1]);
            })
            .curve(d3.curveCardinalOpen.tension(0.75))
            .context(ctx)(path);
    }

    function drawline(ctx,path,cluster) {
        positionLink_canvas(path,ctx);
        let fillColor = d3.color(colorarr[cluster].value);
        fillColor.opacity = graphicopt.component.link.opacity;
        ctx.strokeStyle = fillColor+'';
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
    let self = this;
    master.generateTable = function(){
        d3.select('#modelWorkerInformation table').selectAll('*').remove();
        table_info = d3.select('#modelWorkerInformation table').styles({'width':tableWidth+'px'});
        let tableData = [
            [
                {text:"Input",type:"title"},
                {label:'#Radars',content:datain.length,variable: 'datain'}
            ],
            [
                {text:"Setting",type:"title"},
            ],
            [
                {text:"Output",type:"title"},
            ]
        ];
        d3.values(self.controlPanel).forEach(d=>{
            tableData[1].push({label:d.text,type:d.type,content:d,variable: d.variable})
        });
        d3.values(controlPanelGeneral).forEach(d=>{
            tableData[1].push({label:d.text,type:d.type,content:d,variable: d.variable})
        });
        tableData[2] = _.concat(tableData[2],self.outputSelection);
        let tbodys = table_info.selectAll('tbody').data(tableData);
        tbodys
            .enter().append('tbody')
            .selectAll('tr').data(d=>d)
            .enter().append('tr')
            .selectAll('td').data(d=>d.type==="title"?[d]:[{text:d.label},d.type?{content:d.content,variable:d.variable}:{text:d.content,variable:d.variable}])
            .enter().append('td')
            .attr('colspan',d=>d.type?"2":null)
            .style('text-align',(d,i)=>d.type==="title"?"center":(i?"right":"left"))
            .attr('class',d=>d.variable)
            .each(function(d){
                if (d.text!==undefined) // value display only
                    d3.select(this).text(d.text);
                else{ // other component display
                    let formatvalue = formatTable[d.content.variable]||(e=>Math.round(e));
                    if (d.content.type==="slider"){
                        let div = d3.select(this).style('width',d.content.width).append('div').attr('class','valign-wrapper');
                        noUiSlider.create(div.node(), {
                            start: (graphicopt.opt[d.content.variable])|| d.content.range[0],
                            connect: 'lower',
                            tooltips: {to: function(value){return formatvalue(value)}, from:function(value){return +value.split('1e')[1];}},
                            step: d.content.step||1,
                            orientation: 'horizontal', // 'horizontal' or 'vertical'
                            range: {
                                'min': d.content.range[0],
                                'max': d.content.range[1],
                            },
                        });
                        div.node().noUiSlider.on("change", function () { // control panel update method
                            graphicopt.opt[d.content.variable] = + this.get();
                            start();
                        });
                    }else if (d.content.type === "checkbox") {
                        let div = d3.select(this).style('width', d.content.width).append('label').attr('class', 'valign-wrapper left-align');
                        div.append('input')
                            .attrs({
                                type: "checkbox",
                                class: "filled-in"
                            }).on('change',function(){
                            graphicopt[d.content.variable]  =  this.checked;
                            if (d.content.callback)
                                d.content.callback();
                        }).node().checked = graphicopt[d.content.variable];
                        div.append('span')
                    }
                }
            });
    }
    function updateTableInput(){
        table_info.select(`.datain`).text(e=>datain.length);
        try {
            d3.values(self.controlPanel).forEach((d)=>{
                if (graphicopt.opt[d.variable]) {
                    // d3.select('.nNeighbors div').node().noUiSlider.updateOptions({
                    //     range: {
                    //         'min': 1,
                    //         'max': Math.round(datain.length / 2),
                    //     }
                    // });
                    d3.select(`.${d.variable} div`).node().noUiSlider.set(graphicopt.opt[d.variable]);
                }
            });
        }catch(e){

        }
    }
    function updateTableOutput(output){
        d3.entries(output).forEach(d=>{
            table_info.select(`.${d.key}`).text(e=>d.value? formatTable[e.variable]? formatTable[e.variable](d.value):d3.format('.4s')(d.value) :'_');
        });

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

function calculateMSE_num(a,b){
    return ss.sum(a.map((d,i)=>(d-b[i])*(d-b[i])));
}

d3.pcaTimeSpace = _.bind(d3.TimeSpace,{name:'PCA',controlPanel: {},workerPath:'src/script/worker/PCAworker.js',outputSelection:[{label:"Total time",content:'_',variable:'totalTime'}]});
d3.tsneTimeSpace = _.bind(d3.TimeSpace,
    {name:'t-SNE',controlPanel: {
        epsilon: {text: "Epsilon", range: [1, 40], type: "slider", variable: 'epsilon', width: '100px'},
        perplexity: {text: "Perplexity", range: [1, 1000], type: "slider", variable: 'perplexity', width: '100px'},
        stopCondition: {
            text: "Limit \u0394 cost",
            range: [-12, -3],
            type: "slider",
            variable: 'stopCondition',
            width: '100px'
        },
    },workerPath:'src/script/worker/tSNETimeSpaceworker.js',outputSelection:[ {label: "#Iterations", content: '_', variable: 'iteration'},
        {label: "Cost", content: '_', variable: 'cost'},
        {label: "\u0394 cost", content: '_', variable: 'deltacost'},
        {label: "Time per step", content: '_', variable: 'time'},
        {label: "Total time", content: '_', variable: 'totalTime'}]});
d3.umapTimeSpace  = _.bind(d3.TimeSpace,
    {name:'UMAP',controlPanel: {
            minDist:{text:"Minimum distance", range:[0,1], type:"slider", variable: 'minDist',width:'100px',step:0.1},
            nNeighbors:{text:"#Neighbors", range:[1,200], type:"slider", variable: 'nNeighbors',width:'100px'},
        },workerPath:'src/script/worker/umapworker.js',outputSelection:[ {label:"#Iterations",content:'_',variable: 'iteration'},
            {label:"Time per step",content:'_',variable:'time'},
            {label:"Total time",content:'_',variable:'totalTime'},]});


function handle_data_model(tsnedata) {
    let dataIn = [];
    d3.values(tsnedata).forEach(axis_arr => {
        let lastcluster;
        let lastdataarr;
        let count = 0;
        sampleS.timespan.forEach((t, i) => {
            let index = axis_arr[i].cluster;
            axis_arr[i].clusterName = cluster_info[index].name
            // timeline precalculate
            if (!(lastcluster !== undefined && index === lastcluster) || runopt.suddenGroup && calculateMSE_num(lastdataarr, axis_arr[i]) > cluster_info[axis_arr[i].cluster].mse * runopt.suddenGroup) {
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
    return dataIn;
}

function handle_data_umap(tsnedata) {
    const dataIn = handle_data_model(tsnedata);
    umapopt.opt = {
        // nEpochs: 20, // The number of epochs to optimize embeddings via SGD (computed automatically = default)
        nNeighbors: Math.round(dataIn.length/cluster_info.length/5)+2, // The number of nearest neighbors to construct the fuzzy manifold (15 = default)
        // nNeighbors: 15, // The number of nearest neighbors to construct the fuzzy manifold (15 = default)
        nComponents: 2, // The number of components (dimensions) to project the data to (2 = default)
        minDist: 0.1, // The effective minimum distance between embedded points, used with spread to control the clumped/dispersed nature of the embedding (0.1 = default)
    }
    umapTS.graphicopt(umapopt).color(colorCluster).init(dataIn, cluster_info.map(c => c.__metrics.normalize));
}
function handle_data_tsne(tsnedata) {
    const dataIn = handle_data_model(tsnedata);
    TsneTSopt.opt = {
        epsilon: 20, // epsilon is learning rate (10 = default)
        perplexity: Math.round(dataIn.length / cluster_info.length), // roughly how many neighbors each point influences (30 = default)
        dim: 2, // dimensionality of the embedding (2 = default)
    }
    tsneTS.graphicopt(TsneTSopt).color(colorCluster).init(dataIn, cluster_info.map(c => c.__metrics.normalize));
}
function handle_data_pca(tsnedata) {
    const dataIn = handle_data_model(tsnedata);
    PCAopt.opt = {
        dim: 2, // dimensionality of the embedding (2 = default)
    };
    pcaTS.graphicopt(PCAopt).color(colorCluster).init(dataIn, cluster_info.map(c => c.__metrics.normalize));
}