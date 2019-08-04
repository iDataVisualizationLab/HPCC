// Ngan - May 4 2019




d3.viiolinChart = function () {
    let graphicopt = {
            margin: {top: 0, right: 0, bottom: 0, left: 0},
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

    // viiolinplot.init = function(){
    //     var rScale = d3.scaleLinear()
    //         .range([0, graphicopt.dotRadius])
    //         .domain([0, 1]);
    //     radarcreate = d3.radialLine()
    //         .curve(d3.curveCardinalClosed.tension(0))
    //         .radius(function(d) { return rScale(d.value); })
    //         .angle(function(d) {
    //             return schema.find(s=>s.text===d.axis).angle; });
    //
    //     trackercreate = d3.line()
    //         .x(d=> scaleX_small(d[0]))
    //         .y(d=> scaleY_small(d[1]))
    //         .curve(d3.curveCardinal);
    //
    //
    //     svg.attrs({
    //         width: graphicopt.width,
    //         height: graphicopt.height,
    //         // overflow: "visible",
    //
    //     });
    //     svg.style('visibility','hidden');
    //     svg.append("defs").append("clipPath")
    //         .attr("id", "clip")
    //         .append("rect")
    //         .attr("width", graphicopt.widthG())
    //         .attr("height", graphicopt.heightG());
    //     const rg = svg.append("defs").append("radialGradient")
    //         .attr("id", "rGradient");
    //     const legntharrColor = arrColor.length-1;
    //     rg.append("stop")
    //         .attr("offset","0%")
    //         .attr("stop-opacity", 0);
    //     rg.append("stop")
    //         .attr("offset", 3.5 / legntharrColor * 100 + "%")
    //         .attr("stop-color", arrColor[4])
    //         .attr("stop-opacity", 0);
    //     arrColor.forEach((d,i)=>{
    //         if (i>3) {
    //             rg.append("stop")
    //                 .attr("offset", (i+1) / legntharrColor * 100 + "%")
    //                 .attr("stop-color", d)
    //                 .attr("stop-opacity", (i+1) / legntharrColor);
    //             // if (i != legntharrColor)
    //             //     rg.append("stop")
    //             //         .attr("offset", (i + 1) / legntharrColor * 100 + "%")
    //             //         .attr("stop-color", arrColor[i + 1])
    //             //         .attr("stop-opacity", i / legntharrColor);
    //         }
    //     });
    //     glowEffect = svg.append('defs').append('filter').attr('id', 'glowviiolin'),
    //         feGaussianBlur = glowEffect.append('feGaussianBlur').attr('stdDeviation', 2.5).attr('result', 'coloredBlur'),
    //         feMerge = glowEffect.append('feMerge'),
    //         feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
    //         feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    //     //blink ();
    //     function blink (){
    //         feGaussianBlur.transition('glow')
    //             .transition().duration(500).attr('stdDeviation', 50)
    //             .transition().duration(100).attr('stdDeviation', 200)
    //             .on('end', blink)
    //     }
    //     g = svg.append("g")
    //         .attr('class','pannel')
    //         .attr('transform',`translate(0,${graphicopt.margin.top})`)
    //         .attr("clip-path", "url(#clip)");
    //     const rect = g.append('rect').attr("rx", 10)
    //         .attr("ry", 10)
    //         .attr("width", graphicopt.widthG()-2)
    //         .attr("height", graphicopt.heightG())
    //         .attr("stroke-width", 1)
    //         .style("box-shadow", "10px 10px 10px #666");
    //
    //     d3.select("#viiolinzone").style('top',(graphicopt.offset.top+4)+'px');
    //     panel = d3.select("#subzone");
    //     panel.select(".details").append("span").text('t-SNE cost: ');
    //     panel.select(".details").append("span").attr('class','cost');
    //     panel.select(".details").append("span").text('# community: ');
    //     panel.select(".details").append("span").attr('class','community');
    //
    //     const maxsubheight = graphicopt.heightView()-56;
    //     const sizegraph = sizebox - 5;
    //     scaleX_small.range([0,sizegraph]);
    //     // scaleY_small.range([0,sizegraph]);
    //     scaleY_small.range([sizegraph/4-3,sizegraph*5/4-3]);
    //     graphicopt.top10.width = Math.min(graphicopt.width/4,250);
    //     if (!graphicopt.eventpad)
    //         graphicopt.eventpad ={};
    //     graphicopt.eventpad.size = graphicopt.eventpad.size || 10;
    //     graphicopt.eventpad.eventpadtotalwidth = graphicopt.top10.width - sizebox;
    //     graphicopt.eventpad.maxstack = Math.floor(graphicopt.eventpad.eventpadtotalwidth /graphicopt.eventpad.size);
    //     graphicopt.top10.details.clulster.attr.width = graphicopt.eventpad.size;
    //     graphicopt.top10.details.clulster.attr.height = graphicopt.eventpad.size;
    //     panel.select(".top10DIV").style('max-height', (maxsubheight-1)+"px");
    //     panel.select(".top10").attrs({width: graphicopt.top10.width,
    //         height: sizebox*20});
    //     // panel.select(".top10DIV").style('max-height', sizebox*10+"px");
    //     // panel.select(".top10DIV").style('max-height', (maxsubheight-1)+"px");
    //     // panel.select(".top10").attrs({width: 200,
    //     // height: sizebox*20});
    //
    //     // panel_user = d3.select("#userList").style('top',(graphicopt.offset.top-4)+'px');
    //     panel_user = d3.select("#userList");
    //     panel_user.select(".top10DIV").style('max-height', maxsubheight+"px");
    //     list_user = Sortable.create($('.top10DIV tbody')[0], {
    //         animation: 500,
    //         sort: false,
    //         dataIdAttr: 'data-id',
    //         filter: ".disable",
    //     });
    //     // search box event
    //     $('#search_User').on('input', searchHandler); // register for oninput
    //     $('#search_User').on('propertychange', searchHandler); // for IE8
    //
    //     g = g.append('g')
    //         .attr('class','graph');
    //     function zoomed() {
    //         ss = d3.event.transform.k;
    //         tx = d3.event.transform.x;
    //         ty = d3.event.transform.y;
    //         if (store.Y) updateEmbedding(store.Y,store.cost, true);
    //     }
    //     var zoom = d3.zoom()
    //     // .scaleExtent([1/netConfig.scalezoom, 40])
    //         .scaleExtent([0.25, 100])
    //         //.translateExtent([[-netConfig.width/2,-netConfig.height/2], [netConfig.width*1.5,netConfig.height*1.5]])
    //         .on("zoom", zoomed);
    //     svg.call(zoom);
    //
    //     ss= graphicopt.scalezoom;
    //     svg.call(zoom.translateBy, graphicopt.widthG() / 2,graphicopt.heightG() / 2);
    //     // svg.call(zoom.scaleBy, graphicopt.scalezoom);
    //
    //     graphicopt.step = function () {
    //         if (!isBusy) {
    //             isBusy = true;
    //             calTime[0] =  performance.now();
    //             viiolin.postMessage({action: 'step'});
    //         }
    //     };
    //     d3.select('#viiolinzone').select('.seperate').on('click', function(d){
    //         forceviiolinmode = !forceviiolinmode;
    //         d3.select(this).attr('value',forceviiolinmode?'false':'true');
    //     });
    //     forceviiolin = d3.forceSimulation()
    //         .alphaDecay(0.005)
    //         .alpha(0.1)
    //         .force('collide', d3.forceCollide().radius(graphicopt.dotRadius))
    //         .on('tick', function () {
    //             if (store.cost){
    //                 updateEmbedding(store.Y, store.cost);
    //             }
    //         }).stop();
    //
    // };
    let crateviolin = d3.area()
        .x0(function(d){
            return(xNum(-d[1])) } )
        .x1(function(d){ return(xNum(d[1])) } )
        .y(function(d){ return(h(d[0])) } )
        .curve(d3.curveCatmullRom);
    viiolinplot.draw = function(contain){
        let viol_chart = contain.selectAll('.violin').data(arr);
        viol_chart.exit().remove();
        let viol_n = viol_chart.enter()
            .append('g')
            .attr('class','violin')
            // .attr('transform','translate(0,'+(graphicopt.heightG()/2)+')');
        viol_n.append("path");
        viol_chart = viol_n.merge(viol_chart);
        viol_chart.select('path').datum(d=>{return d;})
            .style('fill','black')
            .attr("d",d=> crateviolin(d.arr)   // This makes the line smoother to give the violin appearance. Try d3.curveStep to see the difference
        );
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
        xNum.range([0, graphicopt.direction === 'h' ? graphicopt.heightG() : graphicopt.widthG()]);
        let sumstat;
        if (graphicopt.opt.dataformated){
            if (data[0].arr.length)
                h.domain(d3.extent(data[0].arr,d=>d[0]));
            else
                h.domain([0,1]);
            sumstat = data;
        }else {
            h.domain(d3.extent(_.flatten(data)));
            kde = kernelDensityEstimator(kernelEpanechnikov(.2), h.ticks(graphicopt.opt.resolution));
            let sumstat = data.map(d => kde(d));
        }
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
        xNum.domain([-maxNum, maxNum]);
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
            if (graphicopt.direction=="v")
                crateviolin = d3.area()
                    .x0(function(d){
                        return(xNum(-d[1])) } )
                    .x1(function(d){ return(xNum(d[1])) } )
                    .y(function(d){ return(h(d[0])) } )
                    .curve(d3.curveCatmullRom);
            else
                crateviolin = d3.area()
                    .y0(function(d){
                        return(xNum(-d[1])) } )
                    .y1(function(d){ return(xNum(d[1])) } )
                    .x(function(d){ return(h(d[0])) } )
                    .curve(d3.curveCatmullRom);
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
