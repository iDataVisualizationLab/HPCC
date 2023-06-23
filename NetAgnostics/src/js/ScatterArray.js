let ScatterArray = function ({
                                 scale,
                                 size=30,
                                 triggerScale=false,
                                 colorScale,
                                 data=[],
                                 markedIndex,
                                 onClick
                             }) {
    const defaultScale = ()=>1;
    let master = {};
    master.el = null;
    let graphicopt = {
        scale,
        size,
        triggerScale,
        colorScale,
        data,
        markedIndex,
        onClick
    };
    let sizeScale= defaultScale;
    master.init = (container)=>{
        master.el = container??d3.select('body').select('g.scatterHolder');
        if (master.el.empty()){
            master.el = container.append('g')
                .attr('class','scatterHolder');
        }
    }
    master.draw = ()=>{
        const {
            scale,
            size,
            triggerScale,
            colorScale,
            data,
            markedIndex,
            onClick
        } = graphicopt;
        const rsize = (d)=>size*sizeScale(scale(d.timestep));
        master.el.selectAll('g.scatterCell')
            .data(data.filter(d=>d.value!==undefined),d=>d.timestep)
            .join(
                enter => {
                    const g = enter.append("g")
                        .attr("class", "scatterCell")
                        .attr("transform", d => `translate(${scale(d.timestep)},-10)`)
                        .on("click",(p,d)=> onClick(d.timeIndex));
                    g
                        .append("rect")
                        .attr('class', 'scatterCellBack')
                        .attr('x', d=>-rsize(d)/2)
                        .attr('y', d=>-rsize(d)/2)
                        .attr('width', rsize)
                        .attr('height', rsize)
                        .attr('rx', 3)
                        .attr('ry', 3)
                        .attr('stroke', (d,i)=>markedIndex===i?'red':'none')
                        .attr('fill', (d,i)=>colorScale?colorScale(d.value):'none')
                    ;
                    return g;
                },
                update => {
                    const g = update
                        .attr("transform", d => `translate(${scale(d.timestep)},-10)`)
                        .on("click",(p,d)=> onClick(d.timeIndex));
                    g
                        .select("rect.scatterCellBack")
                        .attr('x', d=>-rsize(d)/2)
                        .attr('y', d=>-rsize(d)/2)
                        .attr('width', rsize)
                        .attr('height', rsize)
                        .attr('stroke', (d,i)=>markedIndex===i?'red':'none')
                        .attr('fill', (d,i)=>colorScale?colorScale(d.value):'none');
                    return g;
                }
            );

    }
    function updateSizeScaleconst (){
        const {triggerScale,scale} = graphicopt;
        if (triggerScale) {
            const oldRange = scale.range(); // min low high max
            const mainband = (oldRange[2] - oldRange[1])*.25;
            const adjustRange = [oldRange[0],oldRange[1],oldRange[1]+mainband,oldRange[2]-mainband,oldRange[2],oldRange[3]];
            const rangeScale = [1, 1, 2.5, 2.5, 1, 1];
            if (adjustRange[4]===adjustRange[5]) {
                rangeScale[4] = 2.5;
                rangeScale[5] = 2.5;
            }
            if (adjustRange[0]===adjustRange[1]) {
                rangeScale[0] = 2.5;
                rangeScale[1] = 2.5;
            }
            sizeScale= d3.scaleLinear().domain(adjustRange).range(rangeScale)
        }else
            sizeScale= defaultScale;
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
        triggerScale: updateSizeScaleconst,
        scale: updateSizeScaleconst
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