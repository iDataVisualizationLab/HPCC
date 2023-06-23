let StreamArray = function ({
                                scaleX,
                                height,
                                yDomain=[0,1],
                                data=[],
                                order
                            }) {
    let master = {};
    master.el = null;
    let graphicopt = {
        scaleX,
        height,
        yDomain,
        data,
        order
    };
    let _data= [];
    master.init = (container)=>{
        master.el = container??d3.select('body').select('g.streamArrayHolder');
        if (master.el.empty()){
            master.el = container.append('g')
                .attr('class','streamArrayHolder');
        }
    }

    master.draw = ()=>{
        const {
            scaleX,
            height,
            yDomain,
            order
        } = graphicopt;

        const scaleY = d3.scaleLinear().domain(yDomain)
                .range([height,0]);

        const scaleGrid = d3.scaleLinear().domain([0,1])
                .range([0, height]);

        const areaChart = d3.area()
                .x(d=>scaleX(d.timestep))
                .y0(()=>scaleY(0))
                .y1(function (d, i) {
                    return scaleY(d.value);
                })
                .defined(d => !(isNaN(d.value)|| d.value===undefined));

        const lineChart = d3.line()
                .x(d=>scaleX(d.timestep))
                .y(function (d, i) {
                    return scaleY(d.value);
                })
                .defined(d => !(isNaN(d.value)|| d.value===undefined));

        master.el.selectAll('g.streamCell')
            .data(_data,([key,value])=>key)
            .join(
                enter => {
                    const g = enter.append("g")
                        .attr("class", "streamCell")
                        .attr("transform", (d,i) => `translate(0,${scaleGrid(d.index)})`);
                    g
                        .append("path")
                        .attr('class', 'layerAreaProfile')
                        .attr('d', d=>areaChart(d[1]));
                    g
                        .append("path")
                        .attr('class', 'layerLineProfile')
                        .attr('stroke', 'black')
                        .attr('d', d=>lineChart(d[1]));
                    g
                        .append("text")
                        .attr('class', 'layerTextProfile')
                        .attr('text-anchor', 'end')
                        .attr('dx', -2)
                        .attr('dy', height)
                        .text(d=>d[0]);
                    return g;
                },
                update => {
                    const g = update
                        .attr("transform", (d,i) => `translate(0,${scaleGrid(d.index)})`);
                    g
                        .select("path.layerAreaProfile")
                        .attr('d', d=>areaChart(d[1]));
                    g
                        .select("path.layerLineProfile")
                        .attr('d', d=>lineChart(d[1]));
                    g
                        .select("text.layerTextProfile")
                        .text(d=>d[0]);
                    return g;
                }
            );
    }
    function updateData (){
        _data = [...graphicopt.data];
        if (graphicopt.order) {
            _data.sort(graphicopt.order)
            _data.forEach((d,i)=>d.index=i)
        }
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
        data: updateData,
        order: updateData
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