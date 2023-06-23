let BoxplotArray = function ({
                                 scaleX,
                                 height,
                                 boxW=5,
                                 data=[]
                             }) {
    const defaultScale = ()=>1;
    let master = {};
    master.el = null;
    let graphicopt = {
        scaleX,
        height,
        boxW,
        data
    };
    let sizeScale= defaultScale;
    master.init = (container)=>{
        master.el = container??d3.select('body').select('g.boxplotArrayHolder');
        if (master.el.empty()){
            master.el = container.append('g')
                .attr('class','boxplotArrayHolder');
        }
        if (master.el.select('layerTopAbove').empty()){
            master.el.append('path')
                .attr('class','layerTopAbove');
        }
        if (master.el.select('layerTopBelow').empty()){
            master.el.append('path')
                .attr('class','layerTopBelow');
        }
    }
    master.draw = ()=>{
        const {
            scaleX,
            height,
            boxW,
            data
        } = graphicopt;

        const scaleY = d3.scaleLinear().domain([0, d3.max(data,d=>Math.max(d.maxAbove,Math.abs(d.maxBelow)))])
                .range([1, height]);

        const areaTopAbove = d3.area()
                .x(d=>scaleX(d.timestep))
                .y0(() => 0)
                .y1(function (d, i) {
                    return -scaleY(d.maxAbove);
                })
                .defined(d => !isNaN(d.maxAbove));

        const areaTopBelow = d3.area()
                .x(d=>scaleX(d.timestep))
                .y0(() => 0)
                .y1(function (d, i) {
                    return -scaleY(d.maxBelow);
                })
                .defined(d => !isNaN(d.maxBelow));

        master.el.selectAll('g.boxplotCell')
            .data(data.filter(d=>d.nodes.length),d=>d.timestep)
            .join(
                enter => {
                    const g = enter.append("g")
                        .attr("class", "boxplotCell")
                        .attr("transform", d => `translate(${scaleX(d.timestep)},0)`);
                    g
                        .append("line")
                        .attr('class', 'boxplotLine')
                        .attr('y1', d=>-scaleY(d.maxAbove))
                        .attr('y2', d=>-scaleY(d.averageAbove));
                    g
                        .append("rect")
                        .attr('class', 'boxplotRectAbove')
                        .attr('width', boxW)
                        .attr('x', -boxW / 2)
                        .attr('height', d=>scaleY(d.averageAbove))
                        .attr('y', d=>-scaleY(d.averageAbove));
                    g
                        .append("rect")
                        .attr('class', 'boxplotRectBelow')
                        .attr('width', boxW)
                        .attr('x', -boxW / 2)
                        .attr('height', d=>scaleY(-d.averageBelow));
                    return g;
                },
                update => {
                    const g = update
                        .attr("transform", d => `translate(${scaleX(d.timestep)},0)`);
                    g
                        .select("line.boxplotLine")
                        .attr('y1', d=>-scaleY(d.maxAbove))
                        .attr('y2', d=>-scaleY(d.averageAbove));
                    g
                        .select("rect.boxplotRectAbove")
                        .attr('height', d=>scaleY(d.averageAbove))
                        .attr('y', d=>-scaleY(d.averageAbove));
                    g
                        .select("rect.boxplotRectBelow")
                        .attr('height', d=>scaleY(-d.averageBelow));
                    return g;
                }
            );
        master.el.select('path.layerTopAbove').attr('d',areaTopAbove(data));
        master.el.select('path.layerTopBelow').attr('d',areaTopBelow(data));
    }

    Object.keys(graphicopt).forEach(k=>{
        master[k] = function(_data) {
            if (arguments.length){
                graphicopt[k]=_data;
                if (extraAction[k])
                    extraAction[k]();
                return master;
            }else
                return graphicopt[k];
        };
    })

    let extraAction = {
    }

    master.graphicopt = function(_data) {
        if (arguments.length){
            Object.keys(_data).forEach(k=> {
                graphicopt[k] = _data[k];
                if (extraAction[k])
                    extraAction[k]();
            });
            return master;
        }else
            return graphicopt;
    };

    return master;
}