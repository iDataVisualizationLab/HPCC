// Ngan - May 4 2019





d3.Tsneplot = function () {
    let graphicopt = {
        margin: {top: 5, right: 0, bottom: 0, left: 0},
        width: 1000,
            height: 600,
            scalezoom: 1,
            widthView: function(){return this.width*this.scalezoom},
        heightView: function(){return this.height*this.scalezoom},
        widthG: function(){return this.widthView()-this.margin.left-this.margin.right},
        heightG: function(){return this.heightView()-this.margin.top-this.margin.bottom},
        dotRadius: 2,
            opt:{
            epsilon : 10, // epsilon is learning rate (10 = default)
                perplexity : 30, // roughly how many neighbors each point influences (30 = default)
                dim : 2, // dimensionality of the embedding (2 = default)
                maxtries: 50
        }},
        arr = [],
        tsne = new tsnejs.tSNE(graphicopt.opt);
    let Tsneplot ={};
    let svg, g,linepointer,radarcreate,
        ss = 1,
        tx = 0,
        ty =0;
    let needUpdate = false;
    let first = true;
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
        g = svg.append("g")
            .attr('class','pannel')
            .attr('transform',`translate(0,${graphicopt.margin.top})`)
            .attr("clip-path", "url(#clip)");
        g.append('rect').attr("rx", 10)
            .attr("ry", 10)
            .attr("width", graphicopt.widthG()-2)
            .attr("height", graphicopt.heightG())
            .attr("fill", "#fff")
            .attr("stroke", "#000")
            .attr("stroke-width", 1)
            .style("box-shadow", "10px 10px 10px #666");
        g = g.append('g')
            .attr('class','graph');
        function zoomed() {
            ss = d3.event.transform.k;
            tx = d3.event.transform.x;
            ty = d3.event.transform.y;
        }
        var zoom = d3.zoom()
        // .scaleExtent([1/netConfig.scalezoom, 40])
            .scaleExtent([0.25, 40])
            //.translateExtent([[-netConfig.width/2,-netConfig.height/2], [netConfig.width*1.5,netConfig.height*1.5]])
            .on("zoom", zoomed);
        svg.call(zoom);
        // tsnesvg.call(tip);
        zoom.scaleTo(svg, 1/graphicopt.scalezoom);
        svg.call(zoom.translateBy, graphicopt.widthG() / 2,graphicopt.heightG() / 2);

        graphicopt.step = function () {
            tsne.step(); // do a few steps
            updateEmbedding();
        };
        function updateEmbedding() {
            // get current solution
            var Y = tsne.getSolution();
            // move the groups accordingly
            g.selectAll('.linkLineg')
                .transition('move')
                .duration(100)
                .attr("transform", function(d, i) { return "translate(" +
                (Y[i][0]*10*ss+tx) + "," +
                (Y[i][1]*10*ss+ty ) + ")"; });
            let curentHostpos = currenthost.node().getBoundingClientRect();
            linepointer.attr("x2", curentHostpos.x)
                .attr("y2", curentHostpos.y);

        }
    };
    let currenthost;
    Tsneplot.draw = function(name){
        if (first){
            Tsneplot.redraw();
        }else {
            needUpdate = true;
            currenthost = g.select('.'+name);
            g.selectAll(".linkLineg")
                .data(arr).select('path')
                .transition('expand').duration(100).ease(d3.easePolyInOut)
                .attr("d", d => radarcreate(d));
        }
    };

    Tsneplot.pause  = function (){
        clearInterval(intervalUI);
        clearInterval(intervalCalculate);
    };

    Tsneplot.resume  = function (){
        intervalUI = setInterval(graphicopt.step,10);
        intervalCalculate = setInterval(updateData,2000);
    };

    Tsneplot.redraw  = function (){
        svg.style('visibility','visible');
        tsne.initDataRaw(arr);
        drawEmbedding(arr);
        first = false;
        for (let  i =0; i<40;i++)
            tsne.step();
        Tsneplot.resume();
    };

    Tsneplot.remove  = function (){
        if (!first){
            svg.style('visibility','hidden');
            Tsneplot.pause();
            g.selectAll('*').remove();
        }
    };


    function updateData(){
        if (needUpdate) {
            tsne.updateData(arr);
            needUpdate = false;
        }
    }
    Tsneplot.drawpoint = function(){
        tsne.updateData(handledata());
        graphicopt.step();
    };

    function handledata(){

        return arr;
    }

    function drawEmbedding(data) {

        let datapoint = g.selectAll(".linkLineg")
            .data(data);
        let datapointN = datapoint
            .enter().append("g")
            .attr("class", d=>"linkLineg "+d.name);

        datapointN.append("path")
            .attr("d", d => radarcreate(d))
            .attr('stroke', 'black')
            .attr('fill', 'rgb(100,100,255)')
            .attr("transform", "translate(" + (0) + "," + (0) + ")");;

        datapointN.append("text")
            .attr("text-anchor", "top")
            .attr("transform", "translate(5, -5)")
            .attr("font-size", 12);

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

    Tsneplot.graphicopt = function (_) {
        return arguments.length ? (graphicopt = _, Tsneplot) : graphicopt;

    };
    return Tsneplot;
};
