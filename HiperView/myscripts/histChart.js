// Ngan - May 4 2019




d3.histChart = function () {
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
            symmetric: false,
            dotRadius: 2,
            opt:{
                method : 'DensityEstimator', // epsilon is learning rate (10 = default)
                resolution : 50, // resolution
                dataformated: false
            },
            displayDetail:false,
            formatx:d=>d,
            color: ()=>'black',
        },
        runopt,
        arr = [],viiolin = undefined,
        isBusy = false;
    // viiolin = new viiolinjs.viiolin(graphicopt.opt);

    let sizebox = 50;
    let maxlist = 20;
    let hisplot ={};
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
    let datalength=1;
    let h_bandwidth = 0;
    function hist_bar(path){
        return path.transition().attrs({
            width: h_bandwidth ,
            height: d=> xNum(d[1])*(1+graphicopt.symmetric),
            x: -h_bandwidth/2
        }).styles({
            fill :(d,i)=> graphicopt.color(i/(datalength-1))
        })
    }
    let circleoption = function (d){
        return {
            r: graphicopt.dotRadius,
            // cy: h(d),
        }
    };
    hisplot.draw = function(contain){
        let g = contain.select('g.contain');
        if(g.empty())
            g = contain.append('g').attrs({
                'class':'contain',
                'transform':'translate('+graphicopt.margin.left+','+(graphicopt.margin.top)+')'
            });
        let axisg = g.select('.ghisaxis');
        if (axisg.empty()) {
            axisg = g.append('g').attr('class', 'ghisaxis')
                .style('stroke','black');
            axisg.append('line').attr('class','laxis')
                .attrs({
                    x2: h(1),
                    x1: h(0),
                    y1: xNum.range()[1],
                    y2: xNum.range()[1],
                })
                .styles(graphicopt.middleAxis)
            ;
            
        }
        if (arr[0].mean) {
            let line = g.selectAll('.lineMean').data([arr[0].mean]);
            line.exit().remove();
            line.enter().append('line').attr('class', 'lineMean')
                .merge(line)
                .attrs({
                    x2: d => h(d),
                    x1: d => h(d),
                    y1: xNum.range()[0],
                    y2: xNum.range()[1] + graphicopt.symmetric * graphicopt.heightG() / 2,
                });
        }
        let his_chart = g.selectAll('.hisin').data(arr);
        his_chart.exit().remove();
        let his_n = his_chart.enter()
            .append('g')
            .attr('class','hisin')
            // .attr('transform','translate('+graphicopt.margin.left+','+(graphicopt.margin.top+graphicopt.heightG())+')');

        his_chart = his_n.merge(his_chart);
        let his_bar = his_chart.selectAll('g.bar').data(d=>(mm=d3.max(d.arr,e=>e[1]),d.arr.find(e=>e[1]===mm).mark = true,d.arr));
        his_bar.select('.detailBar').remove();
        his_bar.exit().remove();
        let his_bar_n = his_bar.enter().append('g').attr('class','bar');
        his_bar_n.append('rect');
        his_bar = his_bar_n.merge(his_bar).attr('transform',d=>`translate(${h(d[0])},${xNum.range()[1]})`);
        his_bar.each(function(d){d.elbar=d3.select(this)});
        his_bar.transition().attr('transform',d=>`translate(${h(d[0])},${xNum.range()[1]-xNum(d[1])})`);
        his_bar.select('rect')
            .call(hist_bar);
        if (graphicopt.displayDetail) {
            let bisect = d3.bisector(d=>d[0]);
            let labelTop = his_bar_n.append('g').attr('class','detailBar').classed('hide',d=>!d.mark).each(function(d){d.el = d3.select(this)});
            labelTop.append('text').attr('class','yvalue').style('text-anchor','middle').attr('dy',-3)
                .text(d=>d[1]);
            labelTop.append('text').attr('class','xvalue').style('text-anchor','middle')
                .attr('dy',10)
                .attr('y',d=>xNum(d[1])*(1+graphicopt.symmetric)).classed('hide',d=>true)
                .text(d=>graphicopt.formatx(d[0]));
            his_chart.append('rect').attrs({width: graphicopt.widthG(),height:graphicopt.heightG()}).style('opacity',0)
                .on('mousemove',function(d){
                    let index = bisect.right(d.arr,h.invert(d3.mouse(this)[0]))
                    if (d.arr[index]) {
                        d.arr.forEach(e => {e.elbar.classed('fade', true);e.el.classed('hide', true)})
                        d.arr[index].el.classed('hide', false).select('.xvalue').classed('hide',false);
                        d.arr[index].elbar.classed('fade', false);
                    }
                }).on('mouseleave',function(d){d.arr.forEach(e=>{e.elbar.classed('fade', false);e.el.classed('hide',f=>!f.mark).select('.xvalue').classed('hide',true)})})
        }
        arr[0].outlier = arr[0].outlier||[]
        let circledata =  arr[0].outlier.map(d=>{return d.x?d:{x:d}});

        //     var simulation = d3.forceSimulation(circledata)
        //         .force("x", d3.forceX(function(d) { return h(d.val); }).strength(1))
        //         .force("y", d3.forceY(0))
        //         .force("collide", d3.forceCollide(graphicopt.dotRadius))
        //         .stop();
        //     for (var i = 0; i < 120; ++i) simulation.tick();
        // console.log(circledata.map(d=>h(d.x)));
        let circle_o = his_chart.selectAll('circle.outlier').data(circledata);
        circle_o.exit().remove();
        let circlem = circle_o.enter().append('circle')
            .attr('class','outlier')
            .styles({opacity:0.8,
                fill: 'rgb(255, 0, 0)'})
            .merge(circle_o)
            .attrs(circleoption)
            .attr('cx',d=> d.y?d.x:h(d.x)).attr('cy',d=>d.y?d.y:xNum.range()[1]);
        arr[0].point = arr[0].point||[]
        circledata =  arr[0].point.map(d=>{return d.x?d:{x:d}});
        circle_o = his_chart.selectAll('circle.point').data(circledata);
        circle_o.exit().remove();
        circlem = circle_o.enter().append('circle')
            .attr('class','point')
            .styles({opacity:0.8,
                fill: 'rgb(0, 0, 0)'})
            .merge(circle_o)
            .attrs(circleoption)
            .attr('cx',d=> d.y?d.x:h(d.x)).attr('cy',d=>d.y?d.y:xNum.range()[1]);

        if (graphicopt.title){
            if (g.select('g.title').empty())
                g.append('g').attr('class','title');
            g.select('g.title').attr('transform',`translate(${graphicopt.widthG()/2},10)`)
            let title = g.select('g.title').selectAll('text').data(graphicopt.title);
            title.exit().remove();
            title.enter().append('text')
                .attr('y',(d,i)=>i*12)
                .style('text-anchor','middle').text(d=>d.text);
        }
        g.selectAll('text').style('opacity',0.8)
        return his_chart;
    };

    // hisplot.remove  = function (){
    //     if (!first){
    //         d3.select('#viiolinzone').classed("active",false);
    //         // panel.classed("active",false);
    //         // panel_user.classed("active",false);
    //         svg.style('visibility','hidden');
    //         hisplot.pause();
    //         g.selectAll('*').remove();
    //     }
    // };


    let kde;
    let h = d3.scaleLinear();
    let xNum = d3.scaleLinear()
    function handledata(data){
        h.range([0, graphicopt.direction === 'v' ? graphicopt.heightG() : graphicopt.widthG()]);
        xNum.range([0, (graphicopt.direction === 'h' ? graphicopt.heightG() : graphicopt.widthG())/(1+graphicopt.symmetric)]);
        let sumstat;
        if (graphicopt.opt.dataformated){
            // if (data[0].arr.length)
            //     h.domain(d3.extent(data[0].arr, d => d[0]));
            // else
            //     h.domain([0,1]);
            h.domain([0,1]);

            sumstat = data;
            datalength = sumstat[0].arr.length;
        }else {
            h.domain(d3.extent(_.flatten(data)));
            kde = kernelDensityEstimator(kernelEpanechnikov(.2), h.ticks(graphicopt.opt.resolution));
            let sumstat = data.map(d => kde(d));
        }
        h_bandwidth = (h.range()[1]-h.range()[0])/data[0].arr.length;
        if (rangeY){
            xNum.domain(rangeY);
        }else{
            var maxNum = 0;
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
    hisplot.data = function (_) {
        return arguments.length ? (arr = handledata(_), hisplot) : arr;

    };


    hisplot.svg = function (_) {
        return arguments.length ? (svg = _, hisplot) : svg;

    };
    let rangeY;
    hisplot.rangeY = function (_) {
        return arguments.length ? (rangeY = _, hisplot) : rangeY;

    };

    hisplot.linepointer = function (_) {
        return arguments.length ? (linepointer = _, hisplot) : linepointer;

    };

    hisplot.graphicopt = function (_) {//Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in _) {
                if ('undefined' !== typeof _[i]) {
                    graphicopt[i] = _[i];
                }
            }
            return hisplot;
        }else {
            return graphicopt;
        }
    };


    hisplot.dispatch = function (_) {
        return arguments.length ? (returnEvent = _, hisplot) : returnEvent;
    };
    return hisplot;
};
