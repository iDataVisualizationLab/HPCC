const emptyFunction = ()=>{};
let AxisTime = function ({width,height,margin={},
                             scale,
                             majorTicks,
                             minorTicks,
                             gridHeight=100,
                             minorTicksEnable=emptyFunction,
                             lensingTarget,
                             onMouseMove=emptyFunction,
                             onMouseLeave=emptyFunction}) {
    let master = {
    };
    let graphicopt = {scale,
        majorTicks,
        minorTicks,
        gridHeight,
        minorTicksEnable,
        lensingTarget,
        onMouseMove,
        onMouseLeave
    }
    master.el = null;
    master.holder = null;
    master.tickHolder = null;
    master.init = (container)=>{
        master.el = container??d3.select('body').select('svg.axisTime');
        if (master.el.empty()){
            master.el = container.append('svg')
                .attr('class','axisTime w-full overflow-visible');
        }
        master.holder = master.el.select('g.holder');
        if (master.holder.empty()){
            master.holder = master.el.append('g')
                .attr('class','holder');
            master.holder.append('rect')
                .attr('class','background');
        }

        master.holder.attr('transform',`translate(${margin.left??0},${margin.top??0})`);

        master.holder.select('rect.background')
            .attr('width',width)
            .attr('height',height)
            .attr('x',-(margin.left??0))
            .attr('y',-(margin.top??0))
            .attr('fill','#adabab')
        ;
        master.tickHolder = master.holder.select('g.tickHolder');
        if (master.tickHolder.empty()){
            master.tickHolder = master.holder.append('g')
                .attr('class','tickHolder');
        }
        if (master.holder.select('rect.timeBrushBox').empty()){
            master.holder.append('rect')
                .attr('class','timeBrushBox')
                .style('opacity',0)
                .attr('width',width)
                .attr('y',-(margin.top??0))
                .attr('height',height)
                .on('mousemove',onMouseMove)
                .attr('mouseleave',onMouseLeave)
        }

    }
    master.draw = ()=>{
        const {scale,
            majorTicks,
            minorTicks,
            gridHeight,
            minorTicksEnable,
            onMouseMove,
            onMouseLeave} = graphicopt;
        master.holder.select('rect.timeBrushBox')
            .on('mousemove',onMouseMove)
            .attr('mouseleave',onMouseLeave)
        master.tickHolder.selectAll('g.timeLegendLine.major')
            .data(scale.ticks(majorTicks),t=>`tick ${t}`)
            .join(
                enter => {
                    const g = enter.append("g")
                        .attr("class", "timeLegendLine major")
                        .attr("transform", t => `translate(${scale(t)},-10)`);
                    g
                        .append("text")
                        .attr('class', 'timeticks')
                        .attr('text-anchor', 'middle')
                        .text(t => multiFormat(t));
                    g
                        .append("line")
                        .attr('class', 'timeticksline')
                        .attr('y1', gridHeight)
                        .attr('stroke', 'currentColor')
                        .attr('stroke-dasharray', '4 2')
                        .attr('stroke-width', 0.5);
                    return g;
                },
                update => {
                    const g = update
                        .attr("transform", t => `translate(${scale(t)},-10)`);
                    g
                        .select('text.timeticks')
                        .text(t => multiFormat(t));
                    g
                        .select("line.timeticksline")
                        .attr('y1', gridHeight)
                        .attr('stroke', 'currentColor')
                        .attr('stroke-dasharray', '4 2')
                        .attr('stroke-width', 0.5);
                    return g;
                }
            );
        const minor = master.tickHolder.selectAll('g.timeLegendLine.minor')
            .data(scale.ticks(minorTicks),t=>`tick ${t}`)
            .join(
                enter => {
                    const g = enter.append("g")
                        .attr("class", "timeLegendLine minor")
                        .attr("transform", t => `translate(${scale(t)},-10)`);
                    g
                        .append("text")
                        .attr('class', 'timeticks')
                        .style('display',t=>minorTicksEnable(t)?'block':'none')
                        .attr('text-anchor', 'middle')
                        .text(t => multiFormat(t));
                    g
                        .append("line")
                        .attr('class', 'timeticksline')
                        .attr('y1', gridHeight)
                        .attr('stroke', 'currentColor')
                        .attr('stroke-dasharray', '4 2')
                        .attr('stroke-width', 0.5);
                    return g;
                },
                update => {
                    const g = update
                        .attr("transform", t => `translate(${scale(t)},-10)`);
                    g
                        .select('text.timeticks')
                        .style('display',t=>minorTicksEnable(t)?'block':'none')
                        .text(t => multiFormat(t));
                    g
                        .select("line.timeticksline")
                        .attr('y1', gridHeight)
                        .attr('stroke', 'currentColor')
                        .attr('stroke-dasharray', '4 2')
                        .attr('stroke-width', 0.5);
                    return g;
                }
            );
    }
    Object.keys(graphicopt).forEach(k=>{
        master[k] = function(_data) {
            if (arguments.length){
                graphicopt[k]=_data;
                return master;
            }else
                return graphicopt[k];
        };
    })
    master.graphicopt = function(_data) {
        if (arguments.length){
            Object.keys(_data).forEach(k=>graphicopt[k]=_data[k]);
            return master;
        }else
            return graphicopt;
    };

    return master;
}