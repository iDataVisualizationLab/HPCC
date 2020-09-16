let SpitalLayout = function(){
    let tooltip = d3.tip().attr('class', 'd3-tip').html(function (d){return `<span>${d}</span>`})
    let graphicopt = {
        margin: {top: 0, right: 0, bottom: 0, left: 0},
        width: 500,
        height: 500,
        scalezoom: 1,
        zoom:d3.zoom(),
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
        centerX: function () {
            return this.margin.left+this.widthG()/2;
        },
        centerY: function () {
            return this.margin.top+this.heightG()/2;
        },
        color:{},
        numSpirals:4,
        start: 0,
        end: 2.25,
    };

    let informationdiv = '.informationHolder', maindiv='#circularLayout';
    let isFreeze= false;
    let data=[],svg,g,r=0;
    // used to assign nodes color by group
    var color = d3.scaleSequential()
        .interpolator(d3.interpolateSpectral);
    function closeToolTip(){
        d3.select(informationdiv).classed('hide',true);
    }
    let master={};
    master.draw = function() {
        isFreeze= false;
        var radius = d3.scaleLinear()
            .domain([graphicopt.start, graphicopt.end])
            .range([r*0.1, r]);
        var points = d3.range(graphicopt.start, graphicopt.end + 0.001, (graphicopt.end - graphicopt.start) / 1000);
        var spiral = d3.radialLine()
            .curve(d3.curveCardinal)
            .angle(theta)
            .radius(radius);
        var path = g.selectAll('#spiral')
            .data([points]).join("path")
            .attr("id", "spiral")
            .attr("d", spiral)
            .style("fill", "none")
            .style("stroke", "lightgrey")
            .style("stroke-dasharray", ("6, 5"))
            .style("opacity",0.2);
        var spiralLength = path.node().getTotalLength(),
            N = 274,
            barWidth = (spiralLength / N) - 1;
        var miniradius = spiralLength/data.length/2;
        var formatNum=d3.format(".2s")
        var spiralScale = d3.scaleLinear()
            .domain(d3.extent(data, function(d){
                return d.id;
            }))
            .range([0, spiralLength]);
        g.selectAll("circle")
            .data(data)
            .join("circle")
            .attr("cx", function(d,i){

                var linePer = spiralScale(d.id),
                    posOnLine = path.node().getPointAtLength(linePer),
                    angleOnLine = path.node().getPointAtLength(linePer - barWidth);

                d.linePer = linePer; // % distance are on the spiral
                d.cx = posOnLine.x; // x postion on the spiral
                d.cy = posOnLine.y; // y position on the spiral

                d.a = (Math.atan2(angleOnLine.y, angleOnLine.x) * 180 / Math.PI) - 90; //angle at the spiral position

                return d.cx;
            })
            .attr("cy", function(d){
                return d.cy;
            })
            .attr("r", d=>d.r??miniradius)
            .attr("opacity", 0.85)
            .style("fill", d=>color(d.value));
    };
    master.init=function(){
        // graphicopt.width = d3.select(maindiv).node().getBoundingClientRect().width;
        // graphicopt.height = d3.select(maindiv).node().getBoundingClientRect().height;
        r = d3.min([graphicopt.width, graphicopt.height]) / 2-20 ;
        let svg = d3.select(maindiv)
            .attr("width", graphicopt.width)
            .attr("height", graphicopt.height)
            .style('overflow','visible');
        g = svg
            .select("g.content");
        function zoomed(){
            g.attr("transform", d3.event.transform);
        }
        if (g.empty()){
            g = d3.select(maindiv)
                .call(graphicopt.zoom.on("zoom", zoomed))
                .attr("width", graphicopt.width)
                .attr("height", graphicopt.height)
                .append("g")
                .attr('class','content')
                // .attr("transform", "translate(" + (graphicopt.margin.left+graphicopt.diameter()/2) + "," + graphicopt.centerY() + ")")
                .on('click',()=>{if (isFreeze){
                    const func = isFreeze;
                    isFreeze = false;
                    func();
                }});
            g.call(tooltip);
            let startZoom = d3.zoomIdentity;
            startZoom.x = graphicopt.centerX();
            startZoom.y = graphicopt.centerY();
            g.call(graphicopt.zoom.transform, d3.zoomIdentity);
        }
    };
    master.data = function(_data) {
        data=_data;
    };
    function mouseover(d){
        if (!isFreeze)
        {     // Bring to front
            graphicopt.el.classed('onhighlight',true);
            d3.selectAll('.links .link').sort(function(a, b){ return d.relatedLinks.indexOf(a.node); });
            d3.select(this).classed('highlight', true);
            if (d.node){
                d.node.classed('highlight', true);
            }
            for (let i = 0; i < d.relatedNodes.length; i++)
            {
                if (d.relatedNodes[i].key)
                    try {
                        d.relatedNodes[i].data.childrenNode[d.relatedNodes[i].key].classed('highlight', true);
                    }catch(e){
                        console.log(d.relatedNodes[i].key)
                    }
                else {
                    d.relatedNodes[i].data.node.classed('highlight', true);

                }
                // .attr("width", 18).attr("height", 18);
            }

            for (let i = 0; i < d.relatedLinks.length; i++){
                d.relatedLinks[i].moveToFront().classed('highlight', true);
            }}
        if (d.tooltip) {
            tooltip.show(d.name)
        }
    }
    function mouseout(d){
        if(!isFreeze)
        {
            graphicopt.el.classed('onhighlight',false);
            d3.select(this).classed('highlight', false);
            if(d.node){
                d.node.classed('highlight', false).classed('highlightSummary', false);
            }
            for (let i = 0; i < d.relatedNodes.length; i++)
            {
                if (d.relatedNodes[i].key)
                    try {
                        d.relatedNodes[i].data.childrenNode[d.relatedNodes[i].key].classed('highlight', false);
                    }catch(e){

                    }
                else
                    d.relatedNodes[i].data.node.classed('highlight', false);
                // .attr("width", config.rect_width).attr("height", config.rect_height);
            }

            for (let i = 0; i < d.relatedLinks.length; i++){
                d.relatedLinks[i].classed("highlight", false );
            }
        }
        if (d.tooltip) {
            tooltip.hide()
        }
    }
    var theta = function(r) {
        return graphicopt.numSpirals * Math.PI * r;
    };

    return master;
};
