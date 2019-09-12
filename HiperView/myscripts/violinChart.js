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
            opt:{
                method : 'DensityEstimator', // epsilon is learning rate (10 = default)
                resolution : 50, // resolution
                dataformated: false
            }
        },
        runopt,
        arr = [],viiolin = undefined,
        isBusy = false;
    // viiolin = new viiolinjs.viiolin(graphicopt.opt);

    let sizebox = 50;
    let maxlist = 20;
    let viiolinplot ={};
    let svg, g,linepointer,radarcreate,trackercreate,glowEffect,panel,panel_user,list_user,
        scaleX_small = d3.scaleLinear(),
        scaleY_small = d3.scaleLinear(),
        store={},
        ss = 1,
        tx = 0,
        ty =0;
    let needUpdate = false;
    let groupMethod = 'outlier';
    let first = true;
    let returnEvent;
    let schema;


    let crateviolin = d3.area()
        .x0(function(d){
            return(xNum(-d[1])) } )
        .x1(function(d){ return(xNum(d[1])) } )
        .y(function(d){ return(h(d[0])) } )
        // .curve(d3.curveLinear)
        .curve(d3.curveCardinal.tension(0.3))
    ;
    let circleoption = function (d){
        return {
            r: graphicopt.dotRadius,
            // cy: h(d),
        }
    };
    viiolinplot.draw = function(contain){
        let axisg = contain.select('.gvisaxis');
        if (axisg.empty()) {
            axisg = contain.append('g').attr('class', 'gvisaxis')
                .attr('transform','translate('+graphicopt.margin.left+','+(graphicopt.margin.top+graphicopt.heightG()/2)+')')
                .style('stroke','black');
            axisg.append('line').attr('class','laxis')
                .attrs({
                    x2: h(1),
                })
                .styles(graphicopt.middleAxis)
            ;

            if(graphicopt.tick===undefined || graphicopt.tick.visibile!= false) {
                axisg.append('line').attr('class', 'tick')
                    .attrs({
                        y1: -5,
                        y2: 5,
                    })
                axisg.append('line').attr('class', 'tick')
                    .attrs({
                        x2: h(1),
                        x1: h(1),
                        y1: -5,
                        y2: 5,
                    })
            }
        }
        let viol_chart = contain.selectAll('.violin').data(arr);
        viol_chart.exit().remove();
        let viol_n = viol_chart.enter()
            .append('g')
            .attr('class','violin')
            .attr('transform','translate('+graphicopt.margin.left+','+(graphicopt.margin.top+graphicopt.heightG()/2)+')');
        viol_n.append("path");
        viol_chart = viol_n.merge(viol_chart);
        viol_chart.select('path').datum(d=>{return d;})
            .style('fill','black')
            // .style('fill','currentColor')
            .attr("d",d=> crateviolin(d.arr)   // This makes the line smoother to give the violin appearance. Try d3.curveStep to see the difference
        );

        const circledata =  arr[0].outlier.map(d=>{return d.x?d:{x:d}});

    //     var simulation = d3.forceSimulation(circledata)
    //         .force("x", d3.forceX(function(d) { return h(d.val); }).strength(1))
    //         .force("y", d3.forceY(0))
    //         .force("collide", d3.forceCollide(graphicopt.dotRadius))
    //         .stop();
    //     for (var i = 0; i < 120; ++i) simulation.tick();
    // console.log(circledata.map(d=>h(d.x)));
        let circle_o = viol_chart.selectAll('circle').data(circledata);
        circle_o.exit().remove();
        let circlem = circle_o.enter().append('circle')
            .styles({opacity:0.5,
            fill: 'rgb(138, 0, 26)'})
            .merge(circle_o)
            .attrs(circleoption)
            .attr('cx',d=> d.y?d.x:h(d.x)).attr('cy',d=>d.y?d.y:0);
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
    //     }
    // };


    let kde;
    let h = d3.scaleLinear();
    let xNum = d3.scaleLinear()
    function handledata(data){
        h.range([0, graphicopt.direction === 'v' ? graphicopt.heightG() : graphicopt.widthG()]);
        xNum.range([0, (graphicopt.direction === 'h' ? graphicopt.heightG() : graphicopt.widthG())/2]);
        let sumstat;
        if (graphicopt.opt.dataformated){
            // if (data[0].arr.length)
            //     h.domain(d3.extent(data[0].arr, d => d[0]));
            // else
            //     h.domain([0,1]);
            h.domain([0,1]);

            sumstat = data;
        }else {
            h.domain(d3.extent(_.flatten(data)));
            kde = kernelDensityEstimator(kernelEpanechnikov(.2), h.ticks(graphicopt.opt.resolution));
            let sumstat = data.map(d => kde(d));
        }
        if (rangeY){
            xNum.domain(rangeY);
        }else{
            var maxNum = 0
            for (i in sumstat) {
                allBins = sumstat[i].arr;
                kdeValues = allBins.map(function (a) {
                    return a[1]
                });
                biggest = d3.max(kdeValues)
                if (biggest > maxNum) {
                    maxNum = biggest
                }
            }
            xNum.domain([0, maxNum]);
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

    viiolinplot.graphicopt = function (_) {//Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in _) {
                if ('undefined' !== typeof _[i]) {
                    graphicopt[i] = _[i];
                }
            }
            if (graphicopt.direction=="v") {
                crateviolin
                    // = d3.area()
                    .x0(function (d) {
                        return (xNum(-d[1]))
                    })
                    .x1(function (d) {
                        return (xNum(d[1]))
                    })
                    .y(function (d) {
                        return (h(d[0]))
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
                crateviolin
                    // = d3.area()
                    .y0(function (d) {
                        return (xNum(-d[1]))
                    })
                    .y1(function (d) {
                        return (xNum(d[1]))
                    })
                    .x(function (d) {
                        return (h(d[0]))
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
