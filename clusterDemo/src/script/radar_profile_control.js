let radarDescription = function (){
    let graphicopt = {
            margin: {top: 20, right: 0, bottom: 0, left: 0},
            width: 250,
            height: 50,
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
        },
        svg, g, div,
        data = [],
        hosts = []
    ;
    let master = {};

    master.init = function (){
        svg.attrs({
            width: graphicopt.width,
            height: graphicopt.height,

        });
        g = svg.append("g")
            .attr('class','pannel')
            .attr('transform',`translate(${graphicopt.margin.left},${graphicopt.margin.top})`);

        return master;
    };
    master.getValue = function(){

    }
    master.draw = function(mRadar) {
        let cloneNode = mRadar.node().cloneNode(true);
        svg = d3.select(cloneNode).select('svg');
        svg.attrs({
            width: '100%',
            height: '100%',
            viewBox: `0 0 ${svg.attr('width')} ${svg.attr('height')}`
        }).classed('chart',true) //zoom existed chart
        svg.selectAll('.highlight').classed('highlight',false);
        div.select('.chart').remove();
        div.node().appendChild(svg.node());

        svg.selectAll('.axis').data(mRadar.selectAll('.axis').data()); // transfer data
        let outl = svg.select('.axis').select('line').attr('y2');
        let action_points = svg.selectAll('.axis')
            .append("g")
            .attrs({
                class: 'actionpoint',
                transform:`translate(0,${outl})`
            });
        action_points.append('circle')
            .attrs({
                fill: '#ddd',
                opacity: 0.5,
            })
            .attr("cx", 0)
            .attr("cy", 0)
            .attr('r',4);
        action_points.append('text').attrs({
            'text-anchor':'middle',
            'transform':d=>`rotate(${-d.angle/Math.PI*180})`,
            dy:5
        }).text('');
        action_points.on("mouseover", function() {
            let target = d3.select(this.parentNode).classed('mouseon',true);
            if (target.classed('active'))
                target.select('text').text('x')
            else
                target.select('text').text('+')
        }).on("mouseleave", function() {
            let target = d3.select(this.parentNode).classed('mouseon',false);
            target.select('text').text('')
        }).on('click',function(d){
            let target = d3.select(this.parentNode);
            if (!target.classed('active')) {
                target.classed('active',true)
                addbubble(d,{x:d3.event.layerX,y:d3.event.layerY})
            }
        });

        let ds = div.selectAll('.dialogScript').data(d3.entries(dialogvalue_arr));
        ds.exit().remove();
        // const d = d3.select(d3.event.detail || this).datum();
        // d3.selectAll('.axis' + d.idroot + '_' + d.id).classed('highlight', true);
        return master;
    };

    let dialogvalue_arr =[];
    function addbubble(d,pos){
        let dbox = div.append('div')
            .attr('class','dialogScript bubble z-0')
            .styles({
                top:pos.y+'px',
                left:pos.x+'px'
            });
        let cstr = 'l';
        if (d.angle>Math.PI)
            cstr='r';
        if (d.angle<Math.PI/4||d.angle>Math.PI*7/4)
            cstr+='b';
        else if (d.angle<Math.PI*5/4&&d.angle>Math.PI*3/4)
            cstr+='t';
        dbox.classed(cstr,true);
        dbox.append('input').attr('class','truncate ');
        dialogvalue_arr.push({id:d.axis,description:''});
    }
    function removebubble(d){
        let dbox = div.append('div')
            .attr('class','dialogScript bubble z-0')
            .styles({
                top:pos.y+'px',
                left:pos.x+'px'
            });
        let cstr = 'l';
        if (d.angle>Math.PI)
            cstr='r';
        if (d.angle<Math.PI/4||d.angle>Math.PI*7/4)
            cstr+='b';
        else if (d.angle<Math.PI*5/4&&d.angle>Math.PI*3/4)
            cstr+='t';
        dbox.classed(cstr,true);
        dbox.append('input').attr('class','truncate ');
        dialogvalue_arr.push({id:d.axis,description:''});
    }
    master.div = function(_){
        return arguments.length?(div=_,master):master;
    }
    master.graphicopt = function (_) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in _) {
                if ('undefined' !== typeof _[i]) {
                    graphicopt[i] = _[i];
                }
            }
            return master;
        }else {
            return graphicopt;
        }

    };

    return master;
}