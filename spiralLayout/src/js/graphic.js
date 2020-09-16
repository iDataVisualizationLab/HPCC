// plugin
d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};
//general function
let vizservice=[];
function serviceControl(){
    vizservice =serviceFullList.slice();
    vizservice.push({text:'User',range:[]});
    vizservice.push({text:'Radar',range:[]});
    d3.select('#serviceSelection')
        .on('change',function(){
            serviceSelected = +$(this).val();
            createdata();
            drawObject.color(getColorScale())
            currentDraw();
        })
        .selectAll('option')
        .data(vizservice)
        .enter()
        .append('option')
        .attr('value',(d,i)=>i)
        .attr('class',d=>d.text==='User'?'innerName':null)
        .attr('data-value',(d,i)=>d)
        .attr('selected',(d,i)=>i===serviceSelected?'':null)
        .text(d=>d.text)
}
function initdraw(){
    $('.informationHolder').draggable({ handle: ".card-header" ,containment: "parent", scroll: false });
    d3.select('#userSort').on('change',function(){
        currentDraw(serviceSelected);
    });
    d3.select('#innerDisplay').on('change',function(){
        d3.selectAll('.innerName').text(getInnerNodeAttr())
        currentDraw(serviceSelected);
    });
    d3.select('#sort_apply').on('click',function(){
        sortData();
        currentDraw()
    });
    serviceControl();
    drawObject.init().color(getColorScale()).getRenderFunc(getRenderFunc).getDrawData(getDrawData).onFinishDraw(makelegend);
}
function getColorScale(){
    serviceName = vizservice[serviceSelected]
    let _colorItem = d3.scaleSequential()
        .interpolator(d3.interpolateSpectral);
    if(serviceName==='User') {
        vizservice[serviceSelected].range = d3.keys(innerObj);
        debugger
        _colorItem = userColor;
    } else if (serviceName==='Radar') {
        _colorItem = colorCluster;
    }
    const range_cal = (vizservice[serviceSelected].filter||vizservice[serviceSelected].range).slice();
    if(serviceName!=='User'){
        if(serviceName!=='Radar')
            _colorItem.domain(range_cal.slice().reverse());
    }else if(serviceName==='Radar')
        _colorItem.domain(range_cal.slice());
    return _colorItem;
}
function makelegend(){
    let graphicopt = drawObject.graphicopt();
    if (vizservice[serviceSelected].text==='User'){
        d3.select('.legendView').classed('hide',true);
        d3.select('.clusterView').classed('hide',true);
    }else if (vizservice[serviceSelected].text==='Radar'){
        d3.select('.legendView').classed('hide',true);
        d3.select('.clusterView').classed('hide',false);
    }else{
        d3.select('.clusterView').classed('hide',true);
        const color = drawObject.color();
        const marginTop = 10;
        const marginBottom = 10;
        const marginLeft = 40;
        const marginRight = 0;
        const width = 10;
        const height = 200;
        const legendHolder = d3.select('.legendView').classed('hide',false);
        // legendHolder.style('left', Math.min(d3.zoomIdentity.x + graphicopt.diameter() / 2 + 80, graphicopt.width - graphicopt.margin.right) + 'px');
        // legendHolder.select('.legendView').classed('hide',false);
        const svg = legendHolder.select('svg.legend')
            .attr('width', width + marginLeft + marginRight)
            .attr('height', height + marginTop + marginBottom);
        svg.select('g.legend').remove();
        let legend = svg.append('g').attr('class', 'legend')
            .attr('transform', `translate(${marginLeft},${marginTop})`);
        // .attr('transform',`translate(${Math.min(graphicopt.diameter()+max_radius+40+graphicopt.margin.left,graphicopt.width-graphicopt.margin.right)},${graphicopt.margin.top+30})`);

        if (color.interpolate) {
            const n = Math.min(color.domain().length, color.range().length);

            let y = color.copy().rangeRound(d3.quantize(d3.interpolate(0, height), n));

            legend.append("image")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", width)
                .attr("height", height)
                .attr("preserveAspectRatio", "none")
                .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
        }// Sequential
        else if (color.interpolator) {
            let y = Object.assign(color.copy()
                    .interpolator(d3.interpolateRound(0, height)),
                {
                    range() {
                        return [0, height];
                    }
                });

            legend.append("image")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", width)
                .attr("height", height)
                .attr("preserveAspectRatio", "none")
                .attr("xlink:href", ramp(color.interpolator()).toDataURL());

            // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
            if (!y.ticks) {
                if (tickValues === undefined) {
                    const n = Math.round(ticks + 1);
                    tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
                }
                if (typeof tickFormat !== "function") {
                    tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
                }
            } else {
                graphicopt.legend = {scale: y};
                legend.append('g').attr('class', 'legendTick').call(d3.axisLeft(y));
            }
        }

        function ramp(color, n = 256) {
            const canvas = createContext(1, n);
            const context = canvas.getContext("2d");
            for (let i = 0; i < n; ++i) {
                context.fillStyle = color(i / (n - 1));
                context.fillRect(0, i, 1, 1);
            }
            return canvas;
        }

        function createContext(width, height) {
            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            return canvas;
        }

        // make custom input button
        let legendRange = vizservice[serviceSelected].range;
        let customRange = legendRange.slice();
        const groupbtn = legendHolder.select('.btn-group')
        let applybtn = legendHolder.select('#range_apply')
            .on('click', function () {
                legendRange = customRange.slice();
                serviceFullList[serviceSelected].filter = customRange.slice();
                currentDraw(serviceSelected);
                groupbtn.classed('hide', true);
            });
        let canclebtn = legendHolder.select('#range_reset')
            .on('click', function () {
                customRange = serviceFullList[serviceSelected].range.slice();
                rangeo.each(function (d) {
                    $(this).val(customRange[+(d.key === 'upLimit')]);
                });
                currentDraw(serviceSelected);
                groupbtn.classed('hide', true);
            });
        let rangeo = legendHolder.selectAll('input.range')
            .data([{key: 'upLimit', value: legendRange[1]},
                {key: 'lowLimit', value: legendRange[0]}])
            .attr('value', d => d.value)
            .on('input', function (d) {
                let index = +(d.key === 'upLimit');
                customRange[index] = +$(this).val();
                // if (_.isEqual(customRange, legendRange)) {
                //     groupbtn.classed('hide', true);
                // } else {
                groupbtn.classed('hide', false);
                if ((index * 2 - 1) * (-customRange[index] + legendRange[index]) < 0) {
                    // wrong input
                    applybtn.attr('disabled', '');
                } else {
                    if (!(((!index) * 2 - 1) * (-customRange[+!index] + legendRange[+!index]) < 0)) {
                        applybtn.attr('disabled', null);
                    }
                }
                // }
            });
    }
}
function getRenderFunc(d){
    let serviceName = vizservice[serviceSelected].text;
    if (serviceName!=='Radar'|| !d.isRadar)
        return d3.arc()
            .innerRadius(0)
            .outerRadius(d.r )(d);
    // else
    //     return _.partial(createRadar)
}
function getDrawData(e) {
    let serviceName = vizservice[serviceSelected].text;
    if (serviceName === 'Radar'){
        if (!e.children) {
            let radarvalue = [serviceFullList.map(d=>({axis:d.text,value:Math.max(d3.scaleLinear().domain(d.range)(e.data.metrics[d.text])??0,0)}))];
            radarvalue[0].name = e.data.metrics['Radar']
            radarvalue.isRadar = true;
            radarvalue.r = e.r*2;
            radarvalue.type = 'radar';
            return radarvalue
        }
        const radarvalue = [{startAngle:0,endAngle:360,r:e.r}];
        radarvalue.type = 'radar';
        return radarvalue
    }else if (serviceName ==='User'){
        if (e.data.relatedNodes.length>1) {
            const data = d3.pie().value(1)(e.data.relatedNodes);
            data.forEach(d => {
                d.r = e.r;
                d.color = d.data.data.color;
            });

            return data;
        }
        return [{
            data: {},
            endAngle: 360,
            index: 0,
            padAngle: 0,
            startAngle: 0,
            value: 1,
            r:e.r,
            color: e.data.relatedNodes[0]?e.data.relatedNodes[0].data.color:'unset'
        }]
    }else{
        const dataout =  [{startAngle:0,endAngle:360,r:e.r,invalid: e.data.invalid}];
        return dataout;
    }
}
// setting
let tooltip = d3.tip().attr('class', 'd3-tip').html(function (d){return `<span>${d}</span>`})
let drawObject = new SpitalLayout();
