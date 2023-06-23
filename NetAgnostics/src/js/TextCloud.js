let TextCloud = function ({
                              scale,
                              data= [],
                              height=60,
                              numeLine=6,
                              fontSize = 12
                          }) {
    const defaultScale = ()=>1;
    let master = {};
    master.el = null;
    let graphicopt = {
        scale,
        data,
        height,
        numeLine,
        fontSize
    };
    let sizeScale= defaultScale;
    master.init = (container)=>{
        master.el = container??d3.select('body').select('g.textCloudHolder');
        if (master.el.empty()){
            master.el = container.append('g')
                .attr('class','textCloudHolder');
        }
    }
    master.draw = ()=>{
        const {
            scale,
            data,
            height,
            numeLine,
            fontSize
        } = graphicopt;
        const scaleGrid = d3.scaleLinear().domain([0,numeLine]).range([0,height]);
        const sizeScale =(()=>{
            const oldRange = scale.range(); // min low high max
            const mainband = (oldRange[2] - oldRange[1])*.25;
            const adjustRange = [oldRange[0],oldRange[1],oldRange[1]+mainband,oldRange[2]-mainband,oldRange[2],oldRange[3]];
            const rangeScale = [0, 0, 1, 1, 0, 0];
            return d3.scaleLinear().domain(adjustRange).range(rangeScale)
        })()
        master.el.selectAll('g.textCloudCell')
            .data(data.filter(d=>sizeScale(scale(d.timestep))),d=>d.timestep)
            .join('g')
            .attr("class", "textCloudCell")
            .attr("transform", d => `translate(${scale(d.timestep)},0)`)
                .selectAll('text.scatterCellText')
                    .data(d=>d.value,t=>t.key)
                    .join('text')
                    .attr("class", "scatterCellText")
                    .attr("text-anchor", "middle")
                    .attr("y",(t,i)=>scaleGrid(i))
                    .text(t=>t.key)
        ;

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