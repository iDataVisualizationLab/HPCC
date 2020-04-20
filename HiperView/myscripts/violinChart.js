// Ngan - May 4 2019




d3.viiolinChart = function () {
    let graphicopt = {
            margin: {top: 0, right: 10, bottom: 0, left: 10},
            width: 200,
            height: 10,
            scalezoom: 1,
            widthView: function(){return this.width*this.scalezoom},
            heightView: function(){return this.height*this.scalezoom},
            widthG: function(){return this.widthView()-this.margin.left-this.margin.right},
            heightG: function(){return this.heightView()-this.margin.top-this.margin.bottom},
            direction: 'h',
            dotRadius: 2,
            showOutlier:true,
            color:()=>'#00000029',
            stroke:'black',
            opt:{
                method : 'DensityEstimator', // epsilon is learning rate (10 = default)
                resolution : 50, // resolution
                dataformated: false
            },
            isStack:false
        },
        runopt,
        arr = [],viiolin = undefined,
        isBusy = false;
    // viiolin = new viiolinjs.viiolin(graphicopt.opt);

    let sizebox = 50;
    let maxlist = 20;
    let viiolinplot ={};
    let svg, g,linepointer;
    let needUpdate = false;
    let groupMethod = 'outlier';
    let first = true;
    let returnEvent;
    let schema;
    let ticksDisplay = [];


    let createviolin = d3.area()
            .x0(function(d){
                return(xNum(-d[1])) } )
            .x1(function(d){ return(xNum(d[1])) } )
            .y(function(d){ return(h(d[0])) } )
        // .curve(d3.curveLinear)
        // .curve(d3.curveCardinal.tension(0.3))
    ;
    let circleoption = function (d){
        return {
            r: graphicopt.dotRadius,
            // cy: h(d),
        }
    };
    viiolinplot.draw = function(contain){
        // h
        let getpos_func = (p)=>{
            return p.attr('transform',(d,i)=>`translate(${graphicopt.margin.left},${graphicopt.margin.top+gpos(d.axis+i)})`);
        };
        let laxis =(p)=> {
            return p.styles(graphicopt.middleAxis).attrs({
                x2: h(1),
                x1: 0,
                y1: 0,
                y2: 0,
            });
        };
        let tick1 = (p)=> {
            return p
                .attrs({
                    y1: -5,
                    y2: 5,
                }).styles(graphicopt.ticks)
        };
        let tick2 = (p)=> {
            return p
                .attrs({
                    x2: h(1),
                    x1: h(1),
                    y1: -5,
                    y2: 5,
                }).styles(graphicopt.ticks)
        };
        let tickLower = p=>{
            return p.styles({'text-anchor':'end','stroke-width':0}).text(d3.format(".2s")(ticksDisplay[0]))
                .attrs({
                    dx: -1,
                    dy: 4,
                })
        };
        let tickHigher = p=>{
            return p .styles({'text-anchor':'start','stroke-width':0}).text(d3.format(".2s")(ticksDisplay[1]))
                .attrs({
                    dx: 1,
                    x: h.range()[1],
                    dy: 4,
                });
        };
        let draw_median = p=>{
            return p.attrs({
                class: 'median',
                width:2,
                height: 8,
                x: d=>h(d),
                y: -4,
            })
        };
        if (graphicopt.direction==='v') {
            getpos_func = (p) => {
                return p.attr('transform', (d, i) => `translate(${graphicopt.margin.left + gpos(d.axis + i)},${graphicopt.margin.top})`);
            };
            laxis =(p)=> {
                return p.styles(graphicopt.middleAxis).attrs({
                    x2: 0,
                    x1: 0,
                    y1: h.range()[0],
                    y2: h.range()[1],
                });
            };
            tick1 = (p)=> {
                return p
                    .attrs({
                        x1: -5,
                        x2: 5,
                    }).styles(graphicopt.ticks)
            };
            tick2 = (p)=> {
                return p
                    .attrs({
                        y2: h.range()[1],
                        y1: h.range()[1],
                        x1: -5,
                        x2: 5,
                    }).styles(graphicopt.ticks)
            };
            tickLower = p=>{
                return p.styles({'text-anchor':'end','stroke-width':0}).text(d3.format(".2s")(ticksDisplay[0]))
                    .attrs({
                        dx: 0,
                        dy: -1,
                    })
            };
            tickHigher = p=>{
                return p .styles({'text-anchor':'start','stroke-width':0}).text(d3.format(".2s")(ticksDisplay[1]))
                    .attrs({
                        dx: 0,
                        y: h.range()[1],
                        dy: -1,
                    });
            };
            draw_median = p=>{
                return p.attrs({
                    class: 'median',
                    width:8,
                    height: 2,
                    y: d=>h(d),
                    x: -4,
                })
            };
        }
        let viol_chart = contain.selectAll('.violin').data(arr,d=>d.axis)
            .classed('hide',d=>!d.arr.length);
        viol_chart
            .transition()
            .call(getpos_func);
        viol_chart.select('.gvisaxis .laxis') .call(laxis);
        viol_chart.exit().remove();
        let viol_n = viol_chart.enter()
            .append('g')
            .attr('class','violin')
            .call(getpos_func);
        let axisg = viol_n.append('g').attr('class', 'gvisaxis')
            .style('stroke','black');
        axisg.append('line').attr('class','laxis')
            .call(laxis);

        if(graphicopt.tick===undefined && graphicopt.tick.visibile!= false) {
            viol_chart.select('.gvisaxis .tick1') .call(tick1);
            viol_chart.select('.gvisaxis .tick2') .call(tick1);
            axisg.append('line').attr('class', 'tick1')
                .call(tick1);
            axisg.append('line').attr('class', 'tick2')
                .call(tick2);
            if(ticksDisplay.length){
                viol_chart.select('.gvisaxis text.lower') .call(tickLower);
                viol_chart.select('.gvisaxis text.higher') .call(tickHigher);

                axisg.append('text').attr('class', 'tickDisplay lower')
                    .call(tickLower);

                axisg.append('text').attr('class', 'tickDisplay higher')
                    .call(tickHigher);

            }
        }


        viol_n.append("path");
        viol_chart = viol_n.merge(viol_chart);
        viol_chart.select('path').datum(d=>{return d;})
            .style('stroke',graphicopt.stroke)
            .style('stroke-width','0.2')
            .style('fill',d=>graphicopt.color(d.axis))
            .transition()
            // .style('fill','currentColor')
            .attr("d",d=> createviolin(d.arr)   // This makes the line smoother to give the violin appearance. Try d3.curveStep to see the difference
            );

        let median_rect = viol_chart.selectAll('rect.median').data(d=>d.median!==undefined?[d.median]:[]).call(draw_median);
        median_rect.exit().remove();
        median_rect.enter().append('rect').style('fill','black').call(draw_median);


        if(graphicopt.showOutlier) {
            const circledata = arr[0].outlier.map(d => {
                return d.x !== undefined ? d : {x: d}
            });

            //     var simulation = d3.forceSimulation(circledata)
            //         .force("x", d3.forceX(function(d) { return h(d.val); }).strength(1))
            //         .force("y", d3.forceY(0))
            //         .force("collide", d3.forceCollide(graphicopt.dotRadius))
            //         .stop();
            //     for (var i = 0; i < 120; ++i) simulation.tick();
            // console.log(circledata.map(d=>h(d.x)));
            let circle_o = viol_chart.selectAll('circle.outlier').data(circledata);
            circle_o.exit().remove();
            let circlem = circle_o.enter().append('circle').attr('class', 'outlier')
                .styles({
                    opacity: 0.5,
                    fill: 'rgb(138, 0, 26)'
                })
                .merge(circle_o)
                .attrs(circleoption)
                // .attr('cx',d=> d.y?d.x:h(d.x)).attr('cy',d=>d.y?d.y:0);
                .attr('cx', d => h(d.x)).attr('cy', d => xNum(d.y ? d.y : 0));
        }else{
            viol_chart.selectAll('circle.outlier').remove();
        }
        return viol_chart;
    };

    // viiolinplot.remove  = function (){
    //     if (!first){
    //         d3.select('#viiolinzone').classed("active",false);
    //         // panel.classed("active",false);
    //         // panel_user.classed("active",false);
    //         svg.style('visibility','hidden');
    //         viiolinplot.pause();
    //         g.selectAll('*').remove();
    //     }debugger
    // };


    let kde;
    let h = d3.scaleLinear();
    let xNum = d3.scaleLinear();
    let gpos = d3.scalePoint().padding(0.5);
    function handledata(data){
        // h.range([0, graphicopt.direction === 'v' ? graphicopt.heightG() : graphicopt.widthG()]);
        // xNum.range([0, (graphicopt.direction === 'h' ? graphicopt.heightG() : graphicopt.widthG())/2]);
        if(graphicopt.direction === 'v') {
            h.range([graphicopt.heightG(),0]);
            if (graphicopt.isStack){
                gpos = ()=> 0
            }else
                gpos = d3.scalePoint().padding(0.5).domain(data.map((d,i)=>d.axis+i))
                    .range([-graphicopt.widthG()/2,graphicopt.widthG()/2]);
            createviolin = createviolin.curve(d3.curveMonotoneY)
        }else {
            h.range([0, graphicopt.widthG()]);

            gpos = d3.scalePoint().padding(0.5).domain(data.map((d,i)=>d.axis+i))
                .range([graphicopt.heightG(),0]);
            createviolin = createviolin.curve(d3.curveMonotoneX)
        }
        xNumrange = (graphicopt.single_w||gpos.step())/2;
        if (graphicopt.isStack)
            if (data.length===1)
                xNumrange = xNumrange*2;
            else
                xNumrange = graphicopt.widthG()/data.length
        xNum.range([0, xNumrange]);
        console.log(xNum.range()[1])
        let sumstat;
        if (graphicopt.opt.dataformated){
            // if (data[0].arr.length)
            //     h.domain(d3.extent(data[0].arr, d => d[0]));
            // else
            //     h.domain([0,1]);
            h.domain(graphicopt.customrange||[0,1]);

            sumstat = data;
        }else {
            h.domain(d3.extent(_.flatten(data)));
            kde = kernelDensityEstimator(kernelEpanechnikov(.2), h.ticks(graphicopt.opt.resolution));
            let sumstat = data.map(d => kde(d));
        }
        if (rangeY){
            xNum.domain(rangeY);
        }else{
            var maxNum = 0;
            sumstat.forEach((s,i)=>{
                allBins = sumstat[i].arr;
                kdeValues = allBins.map(function (a) {
                    return a[1]
                });
                biggest = d3.max(kdeValues)
                if (biggest > maxNum) {
                    maxNum = biggest
                }
            });
            xNum.domain([0, maxNum]);
        }
        if (graphicopt.isStack) {
            let temp ={};
            let min=Infinity,max=-Infinity;
            sumstat = data.map(d=>({axis:d.axis,arr:[]}));
            data.forEach((d,i)=>d.arr.forEach(e=>{
                if (!temp[e[0]]) {
                    temp[e[0]] = [];
                    if (min > e[0])
                        min = e[0];
                    if (max < e[0])
                        max = e[0];
                    temp[e[0]].total = 0;
                }
                temp[e[0]].push({id:i,value:e[1]});
                temp[e[0]].total+=e[1];
                temp[e[0]].offset = -temp[e[0]].total/2;
            }));
            Object.keys(temp).forEach(i=>{
                temp[i].forEach((d,di)=>{
                    let y0 = temp[i].offset;
                    let y1 = temp[i].offset+d.value;
                    sumstat[d.id].arr.push([+i,y0,y1]);
                    temp[i].offset = y1
                })
            });
            sumstat.forEach(s=>s.arr.sort((a,b)=>a[0]-b[0]));
        }
        return sumstat;
    }

    // 2 functions needed for kernel density estimate
    function kernelDensityEstimator(kernel, X) {
        return function(V) {
            return X.map(function(x) {
                return [x, d3.mean(V, function(v) { return kernel(x - v); })];
            });
        };
    }

    function kernelEpanechnikov(k) {
        return function(v) {
            return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
        };
    }

    function fixstr(s) {
        return s.replace(/ |#/gi,'');
    }
    viiolinplot.data = function (_) {
        return arguments.length ? (arr = handledata(_), viiolinplot) : arr;

    };


    viiolinplot.svg = function (_) {
        return arguments.length ? (svg = _, viiolinplot) : svg;

    };
    let rangeY;
    viiolinplot.rangeY = function (_) {
        return arguments.length ? (rangeY = _, viiolinplot) : rangeY;

    };

    viiolinplot.linepointer = function (_) {
        return arguments.length ? (linepointer = _, viiolinplot) : linepointer;

    };
    viiolinplot.setTicksDisplay = function (_) {
        return arguments.length ? (ticksDisplay = _, viiolinplot) : ticksDisplay;

    };

    viiolinplot.graphicopt = function (_) {//Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in _) {
                if ('undefined' !== typeof _[i]) {
                    graphicopt[i] = _[i];
                }
            }
            if (graphicopt.direction=="v") {
                createviolin
                    .x0(function (d) {
                        return (xNum(-d[1]))
                    })
                    .x1(function (d) {
                        return (xNum(d[1]))
                    })
                    .y(function (d) {
                        return (h(d[0]))
                    })
                if (graphicopt.isStack)
                    createviolin.x0(function (d) {
                        return (xNum(d[2]))
                    }).x1(function (d) {
                        return (xNum(d[1]))
                    })
                // .curve(d3.curveCatmullRom);
                circleoption = function (d){
                    return {
                        r: graphicopt.dotRadius,
                        // cy: h(d),
                    }
                };
            }
            else {
                createviolin
                    // = d3.area()
                    .y0(function (d) {
                        return (xNum(d[1]))
                    })
                    .y1(function (d) {
                        return (xNum(-d[1]))
                    })
                    .x(function (d) {
                        return (h(d[0]))
                    })
                if (graphicopt.isStack)
                    createviolin.y1(function (d) {
                        return (xNum(d[2]))
                    })
                // .curve(d3.curveCatmullRom);
                circleoption = function (d){
                    return {
                        r: graphicopt.dotRadius,
                        // cx: h(d),
                    }
                };
            }
            return viiolinplot;
        }else {
            return graphicopt;
        }
    };


    viiolinplot.dispatch = function (_) {
        return arguments.length ? (returnEvent = _, viiolinplot) : returnEvent;
    };
    return viiolinplot;
};
