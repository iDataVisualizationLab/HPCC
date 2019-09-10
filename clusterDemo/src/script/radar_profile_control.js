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
    let schema=[],schemaOb={};
    function getangle (id){
        return schemaOb[id].angle;
    }
    master.draw = function(mRadar) {
        let cloneNode = mRadar.node().cloneNode(true);

        //copy node
        svg = d3.select(cloneNode).select('svg');
        svg.attrs({
            width: '100%',
            height: '100%',
            viewBox: `0 0 ${svg.attr('width')} ${svg.attr('height')}`
        }).classed('chart',true) //zoom existed chart
        svg.selectAll('.highlight').classed('highlight',false);
        div.select('.chart').remove();
        div.node().appendChild(svg.node());
        schema = mRadar.selectAll('.axis').data();
        schema.forEach(d=>schemaOb[d.text]=d);
        svg.selectAll('.axis').data(schema); // transfer data


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
                target.classed('active',true);
                dialogvalue_arr.push({id:d.text,description:''});
                updatebubble();
                // addbubble(d,{x:-$('#radar_Des_div')[0].getBoundingClientRect().x+ this.getBoundingClientRect().x,y:-$('#radar_Des_div')[0].getBoundingClientRect().y+ this.getBoundingClientRect().y})
            }else{
                target.classed('active',false);
                _.pull(dialogvalue_arr,dialogvalue_arr.find(e=>e.id===d.text));
                updatebubble();
            }
        });

        let ds = div.selectAll('.dialogScript').data(d3.entries(dialogvalue_arr));
        ds.exit().remove();
        return master;
    };
    function getpos(id){
        let point = svg.selectAll('.axis .actionpoint').filter(d=>d.text===id);
        return {
            x:-$('#radar_Des_div')[0].getBoundingClientRect().x+ point.node().getBoundingClientRect().x,
            y:-$('#radar_Des_div')[0].getBoundingClientRect().y+ point.node().getBoundingClientRect().y
        };
    }

    let dialogvalue_arr =[];
    function updatebubbleInit(){
        svg.selectAll('.axis').filter(d=>dialogvalue_arr.find(e=>e.id===d.text)).classed('active',true);
        updatebubble();

    }
    function updatebubble(){
        dialogvalue_arr = dialogvalue_arr.filter(d=>schema.find(e=>e.text===d.id));
        let dbox = div.selectAll('div.dialogScript')
            .data(dialogvalue_arr,d=>d.id);

        dbox.exit().remove();

        let dbox_n = dbox.enter().append('div')
            .attr('class','dialogScript bubble z-0');
        dbox_n.append('input').attr('class','truncate ');

        dbox = dbox.merge(dbox_n);
        dbox.attr('class','dialogScript bubble z-0')
            .each(function (d){
                let cstr = 'l';
                if (getangle(d.id)>Math.PI)
                    cstr='r';
                if (getangle(d.id)<Math.PI/4||getangle(d.id)>Math.PI*7/4)
                    cstr+='b';
                else if (getangle(d.id)<Math.PI*5/4&&getangle(d.id)>Math.PI*3/4)
                    cstr+='t';
                d3.select(this).classed(cstr,true);
            })
            .styles({
                top: d=>getpos(d.id).y+'px',
                left:d=>getpos(d.id).x+'px'
            });
        dbox.select('input').property("value",d=>d.description).on('change',function(d){
            d.description = $(this).val()});
        // dialogvalue_arr.push({id:d.axis,description:''});
    }
    master.update = updatebubbleInit;
    master.div = function(_){
        return arguments.length?(div=_,master):div;
    }
    master.description = function(v){
        return arguments.length?(dialogvalue_arr=_.cloneDeep(v),master):dialogvalue_arr;
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