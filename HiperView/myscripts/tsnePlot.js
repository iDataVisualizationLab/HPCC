// Ngan - May 4 2019




d3.Tsneplot = function () {
    let graphicopt = {
        margin: {top: 5, right: 0, bottom: 0, left: 0},
        width: 1000,
            height: 600,
            scalezoom: 10,
            widthView: function(){return this.width*this.scalezoom},
        heightView: function(){return this.height*this.scalezoom},
        widthG: function(){return this.widthView()-this.margin.left-this.margin.right},
        heightG: function(){return this.heightView()-this.margin.top-this.margin.bottom},
        dotRadius: 2,
            opt:{
                epsilon : 20, // epsilon is learning rate (10 = default)
                perplexity : 30, // roughly how many neighbors each point influences (30 = default)
                dim : 2, // dimensionality of the embedding (2 = default)
                maxtries: 50
            }
    },
        arr = [],
        isbusy = false,
        // tsne = new tsnejs.tSNE(graphicopt.opt);
        tsne = new Worker ('myscripts/tSNEworker.js');
    let sizebox = 50;
    let maxlist = 20;
    let Tsneplot ={};
    let svg, g,linepointer,radarcreate,trackercreate,glowEffect,panel,panel_user,list_user,
        scaleX_small = d3.scaleLinear(),
        scaleY_small = d3.scaleLinear(),
        store={},
        ss = 1,
        tx = 0,
        ty =0;
    let needUpdate = false;
    let first = true;
    function updateRenderRanking(data) {
        var max = d3.max(d3.extent(d3.merge(d3.extent(data.top10,d=>d3.extent(d3.merge(d))))).map(d=>Math.abs(d)));
        scaleX_small.domain([-max,max]);
        scaleY_small.domain(scaleX_small.domain());
        // console.log(data.top10);
        const dataTop = panel.select('.top10').selectAll('.top10_item')
            .data(data.top10, d => d.name);
        // EXIT
        dataTop.exit().moveToBack()
            .transition()
            .attr('transform', function (d) {
                return 'translate(20,' + getTransformation(d3.select(this).attr('transform')).translateY + ')'
            })
            .transition('exit')
            .duration((d, i) => i * 100)
            .style('opacity', 0)
            .attr('transform', 'translate(20,' + (maxlist + 0.5) * sizebox + ")")
            .on('interrupt',function(d){d3.active(this).remove})
            .remove();
        // ENTER
        const newdiv = dataTop.enter().append("g")
            .attr('class', 'top10_item');
        newdiv
            .attr('transform', 'translate(0,' + (maxlist + 0.5) * sizebox + ")")
            .style('opacity', 0)
            .transition('update')
            .duration((d, i) => i * 100)
            .style('opacity', 1)
            .attr('transform', (d, i) => 'translate(0,' + (i + 0.5) * sizebox + ")");
        newdiv.append('rect').attrs(
            {class : 'detailDecoration',
                y: -(sizebox-2)/2,
                width: 190,
                height: sizebox-2,
            });
        newdiv.append("text").text(d => d.name).attr('x',4);
        const gDetail = newdiv.append("g")
            .attr('class','gd')
            .attr('transform', 'translate(120,'+(-sizebox/2)+')')
            .datum(d=>d);
        gDetail.append("path")
            .attr("d",trackercreate)
            .styles(graphicopt.top10.details.path.style);
        gDetail.call(createDetailCircle);

        // UPDATE
        dataTop
            .transition()
            .duration((d, i) => i * 100)
            .attr('transform', (d, i) => 'translate(0,' + (i + 0.5) * sizebox + ")");

        const gd = dataTop.select('.gd').datum(d=>d);
        gd.select("path")
            .attr("d",trackercreate);
        gd
            .call(createDetailCircle);
    }
    function createDetailCircle (g){
        let newg = g.selectAll('circle').data(d=>d);
        newg.exit().remove();
        // newg.classed('new',false);
        return newg.enter().append('circle')
            // .classed('new',true)
            .attrs(graphicopt.top10.details.circle.attr)
            .styles(graphicopt.top10.details.circle.style)
            .merge(newg).attrs(d=> {return {
                cx:scaleX_small(d[0]),
                cy:scaleY_small(d[1]),}
            });
    }
    tsne.addEventListener('message',({data})=>{
        if (data.status==='done') {
            isbusy = false;
        }
        if (data.action==='step'){
            store.Y = data.result.solution;
            store.cost = data.result.cost;
            updateEmbedding(store.Y,store.cost);
        }
        if (data.action==="updateTracker")
        {
            updateRenderRanking(data);
        }
    }, false);

    Tsneplot.init = function(){
        tsne.postMessage({action:"inittsne",value:graphicopt.opt});
        // radar
        var total = 10,                 //The number of different axes
            angle1= Math.PI * 2 / total,
            angle2= Math.PI * 2 / (total+4);
        angleSlice = [];
        for (var i=0;i<total;i++){
            if (i==0 || i==1 || i==2)       // Temperatures
                angleSlice.push(angle2*(i-1));
            else if (i==5 || i==6 || i==7 || i==8)  // Fan speeds
                angleSlice.push(Math.PI/4.62+angle2*(i-1));
            else if (i==9)  // Power consumption
                angleSlice.push(Math.PI * 1.5);
            else
                angleSlice.push(angle1*(i-1));
        }      //TOMMY DANG
        angleSlice[0] = Math.PI * 2 +angleSlice[0];
        var rScale = d3.scaleLinear()
            .range([0, graphicopt.dotRadius])
            .domain([0, 1]);
        radarcreate = d3.radialLine()
            .curve(d3.curveCardinalClosed.tension(0))
            .radius(function(d) { return rScale(d); })
            .angle(function(d,i) {  return angleSlice[i]; });

        trackercreate = d3.line()
            .x(d=> scaleX_small(d[0]))
            .y(d=> scaleY_small(d[1]))
            .curve(d3.curveCardinal);


        svg.attrs({
            width: graphicopt.width,
            height: graphicopt.height,
            // overflow: "visible",

        });
        svg.style('visibility','hidden');
        svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", graphicopt.widthG())
            .attr("height", graphicopt.heightG());
        const rg = svg.append("defs").append("radialGradient")
            .attr("id", "rGradient");
        const legntharrColor = arrColor.length-1;
        rg.append("stop")
            .attr("offset","0%")
            .attr("stop-opacity", 0);
        rg.append("stop")
            .attr("offset", 3 / legntharrColor * 100 + "%")
            .attr("stop-color", arrColor[4])
            .attr("stop-opacity", 0);
        arrColor.forEach((d,i)=>{
            if (i>3) {
                rg.append("stop")
                    .attr("offset", i / legntharrColor * 100 + "%")
                    .attr("stop-color", d)
                    .attr("stop-opacity", i / legntharrColor);
                if (i != legntharrColor)
                    rg.append("stop")
                        .attr("offset", (i + 1) / legntharrColor * 100 + "%")
                        .attr("stop-color", arrColor[i + 1])
                        .attr("stop-opacity", i / legntharrColor);
            }
        });
        glowEffect = svg.append('defs').append('filter').attr('id', 'glowTSne'),
            feGaussianBlur = glowEffect.append('feGaussianBlur').attr('stdDeviation', 2.5).attr('result', 'coloredBlur'),
            feMerge = glowEffect.append('feMerge'),
            feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
            feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
        //blink ();
        function blink (){
            feGaussianBlur.transition('glow')
                .transition().duration(500).attr('stdDeviation', 50)
                .transition().duration(100).attr('stdDeviation', 200)
                .on('end', blink)
        }
        g = svg.append("g")
            .attr('class','pannel')
            .attr('transform',`translate(0,${graphicopt.margin.top})`)
            .attr("clip-path", "url(#clip)");
        const rect = g.append('rect').attr("rx", 10)
            .attr("ry", 10)
            .attr("width", graphicopt.widthG()-2)
            .attr("height", graphicopt.heightG())
            .attr("stroke-width", 1)
            .style("box-shadow", "10px 10px 10px #666");

        panel = d3.select("#subzone").style('top',graphicopt.offset.top+'px');
        panel.select(".details").append("span").text('t-SNE cost: ');
        panel.select(".details").append("span").attr('class','cost');
        const maxsubheight = graphicopt.heightView()-57;
        const sizegraph = sizebox - 5;
        scaleX_small.range([0,sizegraph]);
        scaleY_small.range([0,sizegraph]);
        // panel.select(".top10DIV").style('max-height', sizebox*10+"px");
        panel.select(".top10DIV").style('max-height', (maxsubheight-7)+"px");
        panel.select(".top10").attrs({width: 200,
        height: sizebox*20});

        panel_user = d3.select("#userList").style('top',graphicopt.offset.top+'px');
        panel_user.select(".top10DIV").style('max-height', maxsubheight+"px");
        list_user = Sortable.create($('tbody')[0], {
            animation: 500,
            sort: true,
            dataIdAttr: 'data-id',
            filter: ".disable",
        });

        g = g.append('g')
            .attr('class','graph');
        function zoomed() {
            ss = d3.event.transform.k;
            tx = d3.event.transform.x;
            ty = d3.event.transform.y;
            if (store.Y) updateEmbedding(store.Y,store.cost, true);
        }
        var zoom = d3.zoom()
        // .scaleExtent([1/netConfig.scalezoom, 40])
            .scaleExtent([0.25, 100])
            //.translateExtent([[-netConfig.width/2,-netConfig.height/2], [netConfig.width*1.5,netConfig.height*1.5]])
            .on("zoom", zoomed);
        svg.call(zoom);

        ss= graphicopt.scalezoom;
        svg.call(zoom.translateBy, graphicopt.widthG() / 2,graphicopt.heightG() / 2);
        // svg.call(zoom.scaleBy, graphicopt.scalezoom);

        graphicopt.step = function () {
            if (!isbusy) {
                isbusy = true;
                tsne.postMessage({action: 'step'});
            }
        };
    };
    function updateEmbedding(Y,cost, skipAnimation) {
        d3.select("#subzone").select('.cost').text(cost.toFixed(2));
        let updatePoints = g.selectAll('.linkLineg');
        if (skipAnimation ===undefined || skipAnimation==false)
            updatePoints = updatePoints
                .transition()
                .duration(10)
                // .on('interrupt end',function(d){
                //     console.log(this.__transition__.count)
                //     d3.active(this).attr("transform", function(d, i) {
                //     return "translate(" +
                //         (Y[i][0]*10*ss+tx) + "," +
                //         (Y[i][1]*10*ss+ty) + ")"; });});
        updatePoints
                .attr("transform", function(d, i) {
                    return "translate(" +
                        (Y[i][0]*10*ss+tx) + "," +
                        (Y[i][1]*10*ss+ty) + ")"; });
        //let curentHostpos = currenthost.node().getBoundingClientRect();
        linepointer.attr("x2", Math.max(Math.min(Y[currenthost.index][0]*10*ss+tx,graphicopt.widthG()),0) )
            .attr("y2", Math.max(Math.min(Y[currenthost.index][1]*10*ss+ty,graphicopt.heightG()),0)+ graphicopt.offset.top);


    }
    let currenthost = {};
    Tsneplot.draw = function(name){
        if (first){
            Tsneplot.redraw();
        }else {
            needUpdate = true;
            let newdata = g.selectAll(".linkLineg")
                .data(arr,d=>d.name);
            newdata.select('clipPath').select('path')
                .transition('expand').duration(100).ease(d3.easePolyInOut)
                .attr("d", d => radarcreate(d));
            newdata.select('.tSNEborder')
                .transition('expand').duration(100).ease(d3.easePolyInOut)
                .attr("d", d => radarcreate(d));

            currenthost.name = name;
            currenthost.g = g.selectAll(".linkLineg").filter((d,i)=>{
                if (d.name===name){
                    currenthost.index = i;
                    return true;
                }   return false;});
            currenthost.g.select('.tSNEborder')
                .style("filter", "url(#glowTSne)")
                .style("stroke-width", 1)
                .style("stroke-opacity", 1)
                .transition('hightlightp').delay(2000).duration(1000)
                .style("filter",null)
                .style("stroke-width", 0.5)
                .style("stroke-opacity", 0.5);
            currenthost.g.select('text').style("opacity", 1)
                .transition('hightlight').duration(3000).style("opacity",0);

            //update user
            // drawUserlist();

            if (!isbusy) {
                isbusy = true;
                tsne.postMessage({action: "updateData", value: arr});
            }


        }
    };
    Tsneplot.getTop10  = function (){
        tsne.postMessage({action:"updateTracker"});
        // clearInterval(intervalCalculate);
    };

    Tsneplot.pause  = function (){
        clearInterval(intervalUI);
        // clearInterval(intervalCalculate);
    };

    Tsneplot.resume  = function (){
        intervalUI = setInterval(graphicopt.step,50);
        // intervalCalculate = setInterval(updateData,2000);
    };

    Tsneplot.redraw  = function (){
        panel.classed("active",true);
        panel_user.classed("active",true);
        svg.style('visibility','visible');
        tsne.postMessage({action:"initDataRaw",value:arr})//.initDataRaw(arr);
        drawEmbedding(arr);
        first = false;
        isbusy = false;
        // for (let  i =0; i<40;i++)
        //     tsne.step();
        Tsneplot.resume();
    };

    Tsneplot.remove  = function (){
        if (!first){
            panel.classed("active",false);
            panel_user.classed("active",false);
            svg.style('visibility','hidden');
            Tsneplot.pause();
            g.selectAll('*').remove();
        }
    };

    let colorScale =d3.scaleSequential(d3.interpolateSpectral);
    let meanArr=[];
    function distanace(a,b){
        let sum =0;
        a.forEach((d,i)=>sum+=(d-b[i])*(d-b[i]));
        return sum;
    }
    function updateData(){
        if (needUpdate) {
            // meanArr = arr[0].map((dd,i)=>d3.mean(arr.map(d=>d[i])));
            // console.log(meanArr);
            // arr.forEach(d=> d.gap = distanace(d,meanArr));
            tsne.updateData(arr);
            // colorScale.domain(d3.extent(arr,d=>d.gap).reverse());
            // g.selectAll('path').style('stroke',d=>colorScale(d.gap));
            needUpdate = false;
        }
    }


    function handledata(){

        return arr;
    }
    function user_sortBY (key){
        switch (key) {
            case 'user':
                list_user.sort(panel_user.select('tbody')
                    .selectAll('tr').data().map(d=>d.key));
                break;
            case 'jobs':
                list_user.sort(panel_user.select('tbody')
                    .selectAll('tr').data().map(d=>d.values.length));
                break;
            case 'nodes':
                list_user.sort(panel_user.select('tbody')
                    .selectAll('tr').data().map(d=>d.unqinode.length));
                break;
        }
    }
    function drawUserlist() {
        let userl = current_userData();
        //ranking----
        userl.sort((a,b)=>b.values.length-a.values.length);

        const totalUser = userl.length;

        list_user.sort(userl.map(d=>d.key));
        let userli = panel_user.select('tbody')
            .selectAll('tr').data(userl,d=>d.key)
            .attr('data-id',d=>d.key)
            .attr('class',d=>'collection-item '+ _(d.values.map(e=>e.nodes)).uniq().join(' '));
        //remove
        userli.exit().remove();
        //new
        let contain_n = userli.enter().append('tr')
            .attr('class',d=>'collection-item '+ d.unqinode.join(' '))
            .attr('data-id',d=>d.key)
            .on('mouseover',function(d){
                const list_node = d.unqinode;
                filterhost = _.union(filterhost,list_node);
                // d3.selectAll('.radarWrapper').filter(d=>_.intersection(filterhost,d.bin.name).length)
                //     .select(".radarStroke").dispatch('mouseenter');
                hosts.forEach(l => {
                    d3.selectAll("." + l.name+':not(tr)')
                        .classed("displayNone", true);
                    // .style("visibility", 'hidden');
                });
                filterhost.forEach(l => {
                    d3.selectAll("." + filterhost.join(', .'))
                        .classed("displayNone", false);
                    // .style("visibility", 'hidden');
                });
            }).on('mouseleave',function(d){
                // d3.selectAll("g[cloned='true']").select(".radarStroke").dispatch('mouseleave');
                d3.selectAll(".displayNone").classed('displayNone',false);
                filterhost= [];
            });
        contain_n.append('td')
            .attr('class','title')
            .text(d=>d.key);
        contain_n.append('td')
            .attr('class','jobs alignRight')
            .text(d=>d.values.length);
        contain_n.append('td')
            .attr('class','nodes alignRight')
            .text(d=>d.unqinode.length);

        //update

        userli.select('.jobs').filter(function(d){return ~~d3.select(this).text()!==d.values.length})
            .text(d=>d.values.length)
            .style('background-color','yellow')
            .transition()
            .duration(2000)
            .style('background-color',null);
        userli.select('.nodes') .text(d=>d.unqinode.length);
        user_sortBY ('user');
    }

    function drawEmbedding(data) {

        let datapoint = g.selectAll(".linkLineg")
            .data(data);
        let datapointN = datapoint
            .enter().append("g")
            .attr("class", d=>"linkLineg "+d.name)
            .on('mouseover',function(d){
                d3.select(this).select('text').style('opacity',1);
            }).on('mouseout',function(d){
                d3.select(this).select('text').style('opacity',0);
            });

        datapointN.append("clipPath")
            .attr("id",d=>"tSNE"+d.name)
            .append("path")
            .attr("d", d => radarcreate(d));
        datapointN
            .append("rect")
            .style('fill', 'url(#rGradient)')
            .attr("clip-path", d=>"url(#tSNE"+d.name+")")
            .attr("x",-graphicopt.dotRadius)
            .attr("y",-graphicopt.dotRadius)
            .attr("width",graphicopt.dotRadius*2)
            .attr("height",graphicopt.dotRadius*2);
        datapointN
            .append("path")
            .attr("class","tSNEborder")
            .attr("d", d => radarcreate(d))
            .style("stroke", 'black')
            .style("stroke-width", 0.5)
            .style("stroke-opacity", 0.5);
        datapointN.append("text")
            .attr("text-anchor", "top")
            .attr("transform", "translate(5, -5)")
            .attr("font-size", 12)
            .style('opacity',0);

        datapoint.exit().remove();


        // TODO: need fix here
        g.selectAll(".linkLineg").selectAll('text')
            .text(function(d,i) {return d.name.replace("compute-","") })

    }

    Tsneplot.data = function (_) {
        return arguments.length ? (arr = _, Tsneplot) : arr;

    };

    Tsneplot.reset = function (_) {
        return arguments.length ? (first = _, Tsneplot) : first;

    };

    Tsneplot.svg = function (_) {
        return arguments.length ? (svg = _, Tsneplot) : svg;

    };

    Tsneplot.linepointer = function (_) {
        return arguments.length ? (linepointer = _, Tsneplot) : linepointer;

    };

    Tsneplot.graphicopt = function (_) {return arguments.length ? (graphicopt = _, Tsneplot) : graphicopt;};
    Tsneplot.drawUserlist = function () {drawUserlist()};
    return Tsneplot;
};
