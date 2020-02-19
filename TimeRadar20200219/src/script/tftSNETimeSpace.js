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
            //https://github.com/tensorflow/tfjs-tsne
            opt: {
                perplexity: 18, // defaults to 18. Max value is defined by hardware limitations.
                exaggeration: 4, // defaults to 4
                exaggerationIter: 300, // defaults to 300
                exaggerationDecayIter: 200, // defaults to 200
                momentum: 0.8, // defaults to 0.8
            }, radaropt: {
                // summary:{quantile:true},
                mini: true,
                levels: 6,
                gradient: true,
                w: 40,
                h: 40,
                showText: false,
                margin: {top: 0, right: 0, bottom: 0, left: 0},
            },
            linkConnect: true,
        },
        controlPanel = {
            perplexity: {text: "Perplexity", range: [1, 1000], type: "slider", variable: 'perplexity', width: '100px'},
            exaggeration: {text: "Exaggeration", range: [1, 1000], type: "slider", variable: 'exaggeration', width: '100px'},
            exaggerationIter: {text: "Exaggeration Iter", range: [1, 1000], type: "slider", variable: 'exaggerationIter', width: '100px'},
            exaggerationDecayIter: {text: "Exaggeration DecayI ter", range: [1, 1000], type: "slider", variable: 'exaggerationDecayIter', width: '100px'},
            momentum: {text: "Momentum", range: [0.1, 2], type: "slider", variable: 'momentum', step:0.1, width: '100px'},

            linkConnect: {text: "Draw link", type: "checkbox", variable: 'linkConnect', width: '100px',callback:()=>render(!isBusy)},
        },
        formatTable = {
            'time': function (d) {
                return millisecondsToStr(d)
            },
            'totalTime': function (d) {
                return millisecondsToStr(d)
            },
            'iteration': function (d) {
                return d
            },
            'stopCondition': function (d) {
                return '1e' + Math.round(d)
            }
        }, tableWidth = 200
        ,
        runopt = {},
        isBusy = false;
    let tsne_ob, colorscale;
    let master = {}, solution, datain = [], filter_by_name = [], table_info, path, cluster = [];
    let xscale = d3.scaleLinear(), yscale = d3.scaleLinear();
    // grahic 
    let background_canvas, background_ctx, front_canvas, front_ctx, svg;
    //----------------------color----------------------
    let createRadar = _.partialRight(createRadar_func, graphicopt.radaropt, colorscale);

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
        if (tsne_ob)
            // tsne_ob.terminate();

        console.log(`----inint tsne with: `, graphicopt.opt);
        colorarr = colorscale.domain().map((d, i) => ({name: d, order: +d.split('_')[1], value: colorscale.range()[i]}))
        colorarr.sort((a, b) => a.order - b.order);
        console.log(`----inint tsne with: `, graphicopt.opt)
        tsne_ob = tsne.tsne(tf.tensor(datain),graphicopt.opt);
        iterativeTsne()
        async function iterativeTsne() {
            isBusy = true;
            let count=1;
            let totalTime_marker=performance.now();
            let t0 = performance.now();
            // Get the suggested number of iterations to perform.
            const knnIterations = tsne_ob.knnIterations();
            // Do the KNN computation. This needs to complete before we run tsne
            for(let i = 0; i < knnIterations; ++i){
                await tsne_ob.iterateKnn();
                // You can update knn progress in your ui here.
            }
            console.log('finish init Data in ', performance.now()-t0);

            const tsneIterations = 1000;
            for(let i = 0; i < tsneIterations; ++i){
                t0 = performance.now();
                await tsne_ob.iterate();
                // Draw the embedding here...
                // const coordinates = tsne_ob.coordinates();
            
                timeCalculation = performance.now()-t0;
                // updateTableOutput(processData(await coordinates.data()));
                updateTableOutput(processData(await tsne_ob.coordsArray()));
                render();

                count++;
            }
            isBusy = false;
            render(true);

            function processData(sol){
                // let sol =[];
                // datain.forEach((d,i)=>{
                //     sol.push([sol1D[(i<<1)],sol1D[(i<<1)+1]])
                // });

                // let xrange = d3.extent(sol, d => d[0]);
                // let yrange = d3.extent(sol, d => d[1]);
                // const ratio = graphicopt.heightG() / graphicopt.heightG();
                // if ((yrange[1] - yrange[0]) / (xrange[1] - xrange[0]) > graphicopt.heightG() / graphicopt.heightG()) {
                //     yscale.domain(yrange);
                //     let delta = ((yrange[1] - yrange[0]) / ratio - (xrange[1] - xrange[0])) / 2;
                //     xscale.domain([xrange[0] - delta, xrange[1] + delta])
                // } else {
                //     xscale.domain(xrange);
                //     let delta = ((xrange[1] - xrange[0]) * ratio - (yrange[1] - yrange[0])) / 2;
                //     yscale.domain([yrange[0] - delta, yrange[1] + delta])
                // }
                solution = sol;
                return {iteration: count,time: timeCalculation, totalTime: performance.now()-totalTime_marker};
            }
        }
    }

    master.init = function (arr, clusterin) {
        datain = arr;
        cluster = clusterin
        handle_data(datain);
        updateTableInput();
        xscale.range([graphicopt.margin.left, graphicopt.width - graphicopt.margin.right]);
        yscale.range([graphicopt.margin.top, graphicopt.height - graphicopt.margin.bottom]);

        background_canvas = document.getElementById("tsneScreen");
        background_canvas.width = graphicopt.width;
        background_canvas.height = graphicopt.height;
        background_ctx = background_canvas.getContext('2d');
        front_canvas = document.getElementById("tsneScreen_fornt");
        front_canvas.width = graphicopt.width;
        front_canvas.height = graphicopt.height;
        front_ctx = front_canvas.getContext('2d');
        svg = d3.select('#tsneScreen_svg').attrs({width: graphicopt.width, height: graphicopt.height});

        start();

        return master;
    };

    function render(isradar) {
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
            fillColor.opacity = 0.8
            background_ctx.fillStyle = fillColor + '';
            background_ctx.fillRect(xscale(d[0]) - 2, yscale(d[1]) - 2, 4, 4);
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

        if (isradar) {
            renderSvgRadar();
        }
    }

    function handle_data(data) {
        data.forEach(d => {
            d.__metrics = d.map((m, i) => {
                return {axis: serviceFullList[i].text, value: m}
            });
            d.__metrics.name = d.clusterName;
            d.__metrics.name_or = d.name;
            d.__metrics.timestep = d.timestep;
        })
    }

    master.stop = function () {
        if (tsne_ob) {
            // tsne_ob.terminate();
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
            .curve(d3.curveCardinalOpen)
            .context(ctx)(path);
    }

    function drawline(ctx, path, cluster) {
        positionLink_canvas(path, ctx);

        // ctx.beginPath();
        // ctx.moveTo(xscale(d[0]), yscale(d[1]));
        // ctx.lineTo(xscale(nexttime[0]), yscale(nexttime[1]));
        ctx.strokeStyle = colorarr[cluster].value;
        ctx.stroke();
    }


    master.hightlight = function (namearr) {
        filter_by_name = namearr || [];
        if (filter_by_name.length) {
            front_ctx.clearRect(0, 0, graphicopt.width, graphicopt.height);
            d3.values(path).filter(d => (filter_by_name.find(n => n === d[0].name) && d.length) > 1 ? d.sort((a, b) => a.t - b.t) : false).forEach(path => {
                // make the combination of 0->4 [0,0,1,2] , [0,1,2,3], [1,2,3,4],[2,3,4,4]
                for (let i = 0; i < path.length - 1; i++) {
                    let a = (path[i - 1] || path[i]).value;
                    let b = path[i].value;
                    let c = path[i + 1].value;
                    let d = (path[i + 2] || path[i + 1]).value;
                    drawline(front_ctx, [a, b, c, d], path[i].cluster);
                }
            })

            d3.select(background_canvas).style('opacity', 0.1);
            d3.select(front_canvas).style('opacity', 1);


        }
    };
    master.unhightlight = function () {
        filter_by_name = [];
        d3.select(background_canvas).style('opacity', 1);
        d3.select(front_canvas).style('opacity', 0);
    };
    master.generateTable = function () {
        d3.select('#tsneInformation table').selectAll('*').remove();
        table_info = d3.select('#tsneInformation table').styles({'width': tableWidth + 'px'});
        let tableData = [
            [
                {text: "Input", type: "title"},
                {label: '#Radars', content: datain.length, variable: 'datain'}
            ],
            [
                {text: "Setting", type: "title"},
            ],
            [
                {text: "Output", type: "title"},
                {label: "#Iterations", content: '_', variable: 'iteration'},
                {label: "Cost", content: '_', variable: 'cost'},
                {label: "\u0394 cost", content: '_', variable: 'deltacost'},
                {label: "Time per step", content: '_', variable: 'time'},
                {label: "Total time", content: '_', variable: 'totalTime'},
            ]
        ];
        d3.values(controlPanel).forEach(d => {
            tableData[1].push({label: d.text, type: d.type, content: d, variable: d.variable})
        });

        let tbodys = table_info.selectAll('tbody').data(tableData);
        tbodys
            .enter().append('tbody')
            .selectAll('tr').data(d => d)
            .enter().append('tr')
            .selectAll('td').data(d => d.type === "title" ? [d] : [{text: d.label}, d.type ? {
            content: d.content,
            variable: d.variable
        } : {text: d.content, variable: d.variable}])
            .enter().append('td')
            .attr('colspan', d => d.type ? "2" : null)
            .style('text-align', (d, i) => d.type === "title" ? "center" : (i ? "right" : "left"))
            .attr('class', d => d.variable)
            .each(function (d) {
                if (d.text !== undefined) // value display only
                    d3.select(this).text(d.text);
                else { // other component display
                    let formatvalue = formatTable[d.content.variable] || (e => Math.round(e));
                    if (d.content.type === "slider") {
                        let div = d3.select(this).style('width', d.content.width).append('div').attr('class', 'valign-wrapper');
                        noUiSlider.create(div.node(), {
                            start: (graphicopt.opt[d.content.variable]),
                            connect: 'lower',
                            tooltips: {
                                to: function (value) {
                                    return formatvalue(value)
                                }, from: function (value) {
                                    return +value.split('1e')[1];
                                }
                            },
                            step: d.content.step || 1,
                            orientation: 'horizontal', // 'horizontal' or 'vertical'
                            range: {
                                'min': d.content.range[0],
                                'max': d.content.range[1],
                            },
                        });
                        div.node().noUiSlider.on("change", function () { // control panel update method
                            graphicopt.opt[d.content.variable] = +this.get();
                            start();
                        });
                    } else if (d.content.type === "checkbox") {
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

    function updateTableInput() {
        table_info.select(`.datain`).text(e => datain.length);
        d3.select('.perplexity div').node().noUiSlider.updateOptions({
            range: {
                'min': 1,
                'max': Math.round(datain.length / 2),
            }
        });
        d3.select('.perplexity div').node().noUiSlider.set(20);
    }

    function updateTableOutput(output) {
        d3.entries(output).forEach(d => {
            table_info.select(`.${d.key}`).text(e => d.value ? formatTable[e.variable] ? formatTable[e.variable](d.value) : d3.format('.4s')(d.value) : '_');
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
        } else {
            return runopt;
        }

    };
    master.graphicopt = function (__) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in __) {
                if ('undefined' !== typeof __[i]) {
                    if (i === "opt") {
                        for (let j in __[i]) {
                            if ('undefined' !== typeof __[i][j]) {
                                graphicopt[i][j] = __[i][j];
                            }
                        }
                    } else
                        graphicopt[i] = __[i];
                }
            }
            if (graphicopt.radaropt)
                graphicopt.radaropt.schema = serviceFullList;
            createRadar = _.partialRight(createRadar_func, graphicopt.radaropt, colorscale)
            return master;
        } else {
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
        return arguments.length ? (graphicopt.radaropt.schema = _, schema = _, master) : schema;
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
            if (!(lastcluster !== undefined && index === lastcluster) || runopt.suddenGroup && calculateMSE_num(lastdataarr, axis_arr[i]) > cluster_info[axis_arr[i].cluster].mse * runopt.suddenGroup) {
                lastcluster = index;
                lastdataarr = axis_arr[i];
                axis_arr[i].timestep = count; // TODO temperal timestep
                count++;
                dataIn.push(axis_arr[i])
            }
            // // return index;
            // // return cluster_info.findIndex(c=>distance(c.__metrics.normalize,axis_arr)<=c.radius);

            // dataIn.push(axis_arr[i]) // testing with full data
        })
    });

    TsneTSopt.opt = {
        // perplexity: 5,
    }
    tsneTS.graphicopt(TsneTSopt).color(colorCluster).init(_.shuffle(dataIn), cluster_info.map(c => c.__metrics.normalize));
}

function calculateMSE_num(a, b) {
    return ss.sum(a.map((d, i) => (d - b[i]) * (d - b[i])));
}
