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
        isbusy = false;
        // tsne = new tsnejs.tSNE(graphicopt.opt);

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
    function create_worker (){
        tsne = new Worker ('myscripts/tSNEworker.js');
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
        tsne.postMessage({action:"inittsne",value:graphicopt.opt});
    }

    Tsneplot.init = function(){
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

        panel = d3.select("#subzone").style('top',(graphicopt.offset.top-4)+'px');
        panel.select(".details").append("span").text('t-SNE cost: ');
        panel.select(".details").append("span").attr('class','cost');
        const maxsubheight = graphicopt.heightView()-54;
        const sizegraph = sizebox - 5;
        scaleX_small.range([0,sizegraph]);
        scaleY_small.range([0,sizegraph]);
        // panel.select(".top10DIV").style('max-height', sizebox*10+"px");
        panel.select(".top10DIV").style('max-height', (maxsubheight-1)+"px");
        panel.select(".top10").attrs({width: 200,
        height: sizebox*20});

        panel_user = d3.select("#userList").style('top',(graphicopt.offset.top-4)+'px');
        panel_user.select(".top10DIV").style('max-height', maxsubheight+"px");
        list_user = Sortable.create($('tbody')[0], {
            animation: 500,
            sort: false,
            dataIdAttr: 'data-id',
            filter: ".disable",
        });
        // search box event
        $('#search_User').on('input', searchHandler); // register for oninput
        $('#search_User').on('propertychange', searchHandler); // for IE8

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
        tsne.terminate();
        clearInterval(intervalUI);
        // clearInterval(intervalCalculate);
    };

    Tsneplot.resume  = function (){
        intervalUI = setInterval(graphicopt.step,50);
        // intervalCalculate = setInterval(updateData,2000);
    };

    Tsneplot.redraw  = function (){
        panel.classed("active",true).select('.top10').selectAll('*').remove();
        panel_user.classed("active",true).select('.top10DIV tbody').selectAll('*').remove();
        panel_user.select('table').classed('empty',true);
        panel_user.select('.search-wrapper').classed('empty',true);
        svg.style('visibility','visible');
        create_worker();
        tsne.postMessage({action:"initDataRaw",value:arr});
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
    function user_sortBY (key,data){
        switch (key) {
            case 'user':
                data.sort((a,b)=>b.unqinode.length-a.unqinode.length);
                data.sort((a,b)=>b.values.length-a.values.length);
                data.sort((a,b)=>b.key-a.key);
                break;
            case 'jobs':
                data.sort((a,b)=>b.key-a.key);
                data.sort((a,b)=>b.unqinode.length-a.unqinode.length);
                data.sort((a,b)=>b.values.length-a.values.length);
                break;
            case 'nodes':
                data.sort((a,b)=>b.key-a.key);
                data.sort((a,b)=>b.values.length-a.values.length);
                data.sort((a,b)=>b.unqinode.length-a.unqinode.length);
                break;
        }
        list_user.sort(data.map(d=>d.key));
    }
    function searchHandler (e){
        if (e.target.value!=="") {
            panel_user.selectAll('tr.collection-item[data-id*="' + e.target.value + '"]').classed('displayNone', false);
            panel_user.selectAll('tr.collection-item:not([data-id*="' + e.target.value + '"]').classed('displayNone', true);
        }else{
            panel_user.selectAll('tr.collection-item').classed('displayNone', false);
        }
    }
    function drawUserlist(currentTime) {
        currentTime =new Date(currentTime);
        $(userList_lastupdate).text('Last update: '+currentTime.timeNow2());
        let userl = current_userData();
        //ranking----
        panel_user.select('table').classed('empty',!userl.length);
        panel_user.select('.search-wrapper').classed('empty',!userl.length);

        // userl.sort((a,b)=>b.values.length-a.values.length);
        user_sortBY ('nodes',userl);

        const totalUser = userl.length;

        const sh = 20;
        const sw = 150;
        const tickh = 6;
        const margin = {top:tickh/2,bottom:tickh/2,left:1,right:1};
        // let rangestartTime = d3.extent(jobList,d=>new Date (d.startTime));
        let rangesubmitTime = d3.min(jobList,d=>new Date (d.submitTime));
        let xscale = d3.scaleTime().range([0,sw]).domain([rangesubmitTime,currentTime]);
        const minstep = 7;
        let yscale = function (d,l) {
            let scale = d3.scalePoint().range([0,sh]).domain(d3.range(l));
                if (scale.step()>minstep)
                scale = scale.padding((sh-minstep*(l-1))/2/minstep);
            const r = scale(d);
            return isNaN(r)?sh/2:r;
        };
        let yscaleItem = {};
        // let xFisheye = d3.fisheye.scale(xscale).focus(0);
        let userli = panel_user.select('tbody')
            .selectAll('tr').data(userl,d=>d.key)
            .attr('data-id',d=>d.key)
            .attr('class',d=>'collection-item '+ d.unqinode.join(' '));
        //remove
        userli.exit().remove();
        //new
        let contain_n = userli.enter().append('tr')
            .attr('class',d=>'collection-item '+ d.unqinode.join(' '))
            .attr('data-id',d=>d.key)
            .on('mouseover',function(d){
                const list_node = d.unqinode;
                let filterhosttemp = _.intersection(filterhost,list_node);
                d3.selectAll("." + _.difference(hosts.map(d=>d.name),filterhosttemp ).join(':not(tr), .')+':not(tr)')
                    .classed("displayNone", true);
                    d3.selectAll("." + filterhosttemp.join(', .'))
                        .classed("displayNone", false);
            }).on('mouseleave',function(d){
                $('#search_User')[0].value =""
                d3.selectAll("." + _.difference(filterhost,d.unqinode ).join(':not(tr), .')+':not(tr)')
                    .classed("displayNone", true);
                d3.selectAll("." + filterhost.join(', .'))
                    .classed("displayNone", false);
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

        contain_n.append('td')
            .attr('class','user_timeline')
            .append('svg')
            .attrs({'height':sh+margin.top+margin.bottom,
                    'width': sw+margin.left+margin.right})
            .append('g')
            .attr("transform", "translate("+margin.left+", "+margin.top+")");


        //update

        userli.select('.jobs').filter(function(d){return ~~d3.select(this).text()!==d.values.length})
            .text(d=>d.values.length)
            .style('background-color','yellow')
            .transition()
            .duration(2000)
            .style('background-color',null);
        userli.select('.nodes') .text(d=>d.unqinode.length);

        let mini_timeline = panel_user.selectAll('.user_timeline').select('g');

        let timeBox = mini_timeline.selectAll('line.timeBox')
            .data(d=>{
                let temp =  d3.nest().key(k=>k.submitTime).entries(d.values);
                // hard way handle all data
                temp.sort((a,b)=>new Date(a.key)-new Date(b.key));
                // yscaleItem[temp[0].user] = temp.length-1; //add length of data item
                temp.forEach((t,i)=>
                {   t.max_startTime =new Date(0);
                    t.values.forEach(it=>{
                        if (new Date(it.startTime)>t.max_startTime)
                            t.max_startTime = new Date(it.startTime);
                        it.y= yscale(i,(temp.length))});
                });
                return temp;

                // easy way
                // let temp = _(d.values).uniq(e=>e.submitTime);
                // temp.sort((a,b)=>new Date(a.submitTime)-new Date(b.submitTime));
                // // yscaleItem[temp[0].user] = temp.length-1; //add length of data item
                // temp.forEach((t,i)=> t.y= yscale(i/(temp.length-1)));
                // return temp;
            },e=>e.key);
        timeBox.exit().remove();
        timeBox
            .enter()
            .append('line')
            .attr('class','timeBox')
            .attr('x1',d=>xscale(new Date (d.key)))
            .attr('x2',d=>xscale(d.max_startTime))
            .attr('y1',(d,i)=>d.values[0].y)
            .attr('y2',(d,i)=>d.values[0].y);
        // .attr('y1',(d,i)=>yscale(i/yscaleItem[d.user]))
        //     .attr('y2',(d,i)=>yscale(i/yscaleItem[d.user]));
        // .on('mousemove',function(d){
        //     xFisheye.focus(d3.event.x);
        //     panel_user.selectAll('line.startTime').attr('x',d=>xFisheye(new Date (d.submitTime)))
        //         .attr('width',d=>xFisheye(new Date (d.startTime))-xFisheye(new Date (d.submitTime)));
        //     panel_user.selectAll('line.startTime').attr('x1',d=>xFisheye(new Date (d.startTime)))
        //         .attr('x2',d=>xFisheye(new Date (d.startTime)));
        //     panel_user.selectAll('line.submitTime').attr('x1',d=>xFisheye(new Date (d.submitTime)))
        //         .attr('x2',d=>xFisheye(new Date (d.submitTime)));
        // });
        timeBox.transition().duration(500)
            .attr('x1',d=>xscale(new Date (d.key)))
            .attr('x2',d=>xscale(d.max_startTime))
            .attr('y1',(d,i)=>d.values[0].y)
            .attr('y2',(d,i)=>d.values[0].y);

        let timeBoxRunning = mini_timeline.selectAll('line.timeBoxRunning')
            .data(d=>{
                let temp =  d3.nest().key(k=>k.startTime)
                    .rollup((t,i)=>
                    { return t[0];})
                    .entries(d.values);
                return temp;
            },e=>e.key);
        timeBoxRunning.exit().remove();
        timeBoxRunning
            .enter()
            .append('line')
            .attr('class','timeBoxRunning')
            .attr('x1',d=>xscale(new Date (d.key)))
            .attr('x2',d=>xscale(currentTime))
            .attr('y1',(d,i)=>d.value.y)
            .attr('y2',(d,i)=>d.value.y);

        timeBoxRunning.transition().duration(500)
            .attr('x1',d=>xscale(new Date (d.key)))
            .attr('x2',d=>xscale(currentTime))
            .attr('y1',(d,i)=>d.value.y)
            .attr('y2',(d,i)=>d.value.y);
        //draw tick

        let linesubmitTime = mini_timeline.selectAll('line.submitTime')
        // .data(d=>_(d.values).uniq(e=>e.submitTime))
            .data(d=> d3.nest().key(k=>k.submitTime).rollup(e=>d3.mean(e,ie=>ie.y)).entries(d.values),d=>d.key);
        linesubmitTime.exit().remove();
        linesubmitTime.enter()
            .append('line')
            .attr('class','submitTime')
            .attr('x1',d=>xscale(new Date (d.key)))
            .attr('x2',d=>xscale(new Date (d.key)))
            .attr('y1',-tickh/2)
            .attr('y2',tickh/2)
            .attr("transform",d=>"translate("+0+", "+d.value+")");
        linesubmitTime.transition().duration(500)
            .attr('x1',d=>xscale(new Date (d.key)))
            .attr('x2',d=>xscale(new Date (d.key)))
            .attr("transform",d=>"translate("+0+", "+d.value+")");

        let linestartTime = mini_timeline.selectAll('line.startTime')
        // .data(d=>_(d.values).uniq(e=>e.startTime))
            .data(d=>d3.nest().key(k=>k.startTime).rollup(e=>d3.mean(e,ie=>ie.y)).entries(d.values),d=>d.key);
        linestartTime.exit().remove();
        linestartTime
            .enter()
            .append('line')
            .attr('class','startTime')
            .attr('x1',d=>xscale(new Date (d.key)))
            .attr('x2',d=>xscale(new Date (d.key)))
            .attr('y1',-tickh/2)
            .attr('y2',tickh/2)
            .attr("transform",d=>"translate("+0+", "+d.value+")");
        linestartTime.transition().duration(500)
            .attr('x1',d=>xscale(new Date (d.key)))
            .attr('x2',d=>xscale(new Date (d.key)))
            .attr("transform",d=>"translate("+0+", "+d.value+")");
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
    Tsneplot.drawUserlist = function (_) {drawUserlist(_)};
    return Tsneplot;
};
