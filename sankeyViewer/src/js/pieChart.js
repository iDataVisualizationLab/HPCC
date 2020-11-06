function UserPie(){
    let graphicopt = {
        margin: {top: 50, right: 50, bottom: 50, left: 50},
        width: 300,
        height: 300,
        'max-height': 500,
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
        hi: 12,
        padding: 0,
        animationTime:1000,
        color:{}
    };

    let maindiv='#pieChart';
    let master = {},data=[];
    var color = d3.scaleOrdinal(d3.schemeCategory20);
    let maxValue = 0;
    let main_svg,g;
    let emptyKey = "No User";
    let tooltip = d3.tip().attr('class', 'd3-tip').html(function (d){return`<div class="card"><div class="card-body">${d}</div></div>`})
    master.init = function(){
        main_svg = d3.select(maindiv)
            .attr("width", graphicopt.width)
            .attr("height", graphicopt.height)
            .style('overflow','visible');
        g = main_svg
            .select("g.content");
        if (g.empty()) {
            g = main_svg
                .append("g")
                .attr('class', 'content');
            g.append('g').attr('class',"slices")
            g.append('g').attr('class',"labels");
            g.append('g').attr('class',"lines")
                .attr('opacity',0.5)
                .attr('fill','none');
            g.append('text').attr('class',"sumLabels");
        };
        g.call(tooltip);
    };

    master.draw = function(){
        const dataViz = d3.pie().sort(null).value(d=>d.value.totalCore)(data);
        let radius = Math.min(graphicopt.widthG(),graphicopt.heightG())/2;
        g.attr('transform',`translate(${graphicopt.centerX()},${graphicopt.centerY()})`);

        var arc = d3.arc()
            .outerRadius(radius * 0.8)
            .innerRadius(radius * 0.4);

        var outerArc = d3.arc()
            .innerRadius(radius * 0.9)
            .outerRadius(radius * 0.9);

        /* ------- PIE SLICES -------*/
        var slice = g.select(".slices").selectAll("g.slice")
            .data(dataViz, d=>d.data.key)
            .join(enter=>{
                let e = enter.append('g').attr('class','slice');
                e.append('path').attr('class','slice').style("opacity", 0.5);
                e.append('title');
                return e;
            }   );
        // slice.each(function(d){d.node=d3.select(this)});
        slice.select('path')
            .style("fill", d=>color(d.data.key))
            .classed('hide',d=>d.data.key===emptyKey)
            .transition().duration(1000)
            .attrTween("d", function(d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    return arc(interpolate(t));
                };
            });
        slice.select('title').text(d=>d.data.key+' #Cores: '+d.value);
        slice.on('mouseover',function(d){tooltip.show(`<h6>${d.data.key}</h6><br><span> #Cores: ${d.value}</span>
<br><span> #Compute: ${d.data.value.node.length}</span>`);
        d3.select(this).style('stroke','black');
        })
            .on('mouseout',function(d){d3.select(this).style('stroke','none');tooltip.hide()})
        /* ------- TEXT LABELS -------*/

        var text = g.select(".labels").selectAll("text")
            .data(dataViz, d=>d.data.key)
            .join("text")
            .classed('hide',d=>(d.data.key===emptyKey)||(d.endAngle-d.startAngle)<Math.PI/10)
            .attr("dy", ".35em")
            .text(function(d) {
                return d.data.key;
            });

        function midAngle(d){
            return d.startAngle + (d.endAngle - d.startAngle)/2;
        }

        text.transition().duration(1000)
            .attrTween("transform", function(d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    var d2 = interpolate(t);
                    var pos = outerArc.centroid(d2);
                    pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
                    return "translate("+ pos +")";
                };
            })
            .styleTween("text-anchor", function(d){
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    var d2 = interpolate(t);
                    return midAngle(d2) < Math.PI ? "start":"end";
                };
            });


        /* ------- SLICE TO TEXT POLYLINES -------*/

        var polyline = g.select(".lines").selectAll("polyline")
            .data(dataViz, d=>d.data.key)
            .join("polyline")
            .classed('hide',d=>(d.data.key===emptyKey)||(d.endAngle-d.startAngle)<Math.PI/10)
            .attr('stroke','black');

        polyline.transition().duration(1000)
            .attrTween("points", function(d){
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    var d2 = interpolate(t);
                    var pos = outerArc.centroid(d2);
                    pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                    return [arc.centroid(d2), outerArc.centroid(d2), pos];
                };
            });

        let sumlabel = _.last(dataViz)
        g.select('text.sumLabels').attr('text-anchor','middle')
            .style('font-weight','bold')
            .style('font-size','16px')
            .text(d3.format('.2f')(100-((sumlabel.endAngle-sumlabel.startAngle)/Math.PI/2)*100)+'%')
    }
    master.data = function(_data) {
        if (arguments.length){
            data= d3.entries(_data);
            data.forEach(d=>d.key = 'User '+d.key.replace('user',''))
            data.sort((a,b)=>b.value.totalCore-a.value.totalCore)
            data.push({
                key: emptyKey,
                value:{totalCore: maxValue - d3.sum(data,d=>d.value.totalCore)}
            });
            return master;
        }
        return data;
    };
    master.color = function(_data) {
        return arguments.length?(color=_data,master):color;
    };

    master.maxValue = function(_data) {
        return arguments.length?(maxValue=_data,master):maxValue;
    };
    return master;
}

let userPie = UserPie();
