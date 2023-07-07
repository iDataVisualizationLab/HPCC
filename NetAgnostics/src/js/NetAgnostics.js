let NetAgnostics = function () {
    let master = {};
    let simulations;
    const NUMTEXTCLOUD = 6;
    const FONTSIZE = 12;
    let graphicopt = {
        maindiv : '#dynamicHolder',
        margin: {top: 40,
            right: 20,
            bottom: 0,
            left: 80},
        width: 1500,
        height: 800,
        scalezoom: 1,
        zoom: d3.zoom(),
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
            return this.margin.left + this.widthG() / 2;
        },
        centerY: function () {
            return this.margin.top + this.heightG() / 2;
        },
        animationTime: 1000,
        colorNet:initColorFunc

    }

    let isFreeze = false;
    let data = {timeRange : [],
        node : {},
        dimensions : [],
        serviceSelected : 0,
        time : []};
    let onFinishDraw = [];
    let contentCollections = {};
    let color = d3.scaleSequential()
        .interpolator(d3.interpolateSpectral);
    let currentNet = [];
    let textCloud = [];
    let boxplotNodes = [];
    let streamData = [];
    let drawAxisTime = {},
    drawScatterArray = {},
    drawCloudText = {},
    drawBoxplotArray = {},
    drawStreamArray = {}
    ;
    const streamH = 20;

    let lensingTarget,
    islensing=true,
    streamOrderIndex,
    lensingConfig={expandRate:3,zoomScale:80},
    _xScaleLinear = d3.scaleTime(),
    _xScale = d3.scaleTime();

    master.init = function (arr) {
        updateProcess({percentage: 1, text: 'Prepare rendering ...'});

        graphicopt.height = $(graphicopt.maindiv).height();
        graphicopt.width = $(graphicopt.maindiv).width();


        contentCollections.axistime_svg = d3.select('#axisTime')
            .attr("width", graphicopt.width)
            .attr("height", graphicopt.margin.top)
            .style('overflow','visible');

        contentCollections.main_svg = d3.select('#mainContent')
            .attr("width", graphicopt.width)
            .attr("height", graphicopt.height-graphicopt.margin.top)
            .style('overflow','visible');

        const g = contentCollections.main_svg.append('g')
            .attr("transform",`translate(${graphicopt.margin.left},0)`);

        contentCollections.scatterArray = g.append('g')
            .attr('class','scatterHolder')
            .attr("transform",`translate(0,${40})`);

        contentCollections.textCloud = g.append('g')
            .attr('class','textCloudHolder')
            .attr("transform",`translate(0,${30+FONTSIZE*NUMTEXTCLOUD})`);

        contentCollections.boxplotArray = g.append('g')
            .attr('class','boxplotArrayHolder')
            .attr("transform",`translate(0,${30+FONTSIZE*NUMTEXTCLOUD+120})`);

        contentCollections.streamArray = g.append('g')
            .attr('class','streamArrayHolder')
            .attr("transform",`translate(0,${30+FONTSIZE*NUMTEXTCLOUD+200})`);

        drawAxisTime = AxisTime({
            width: graphicopt.width,
            height:graphicopt.margin.top,
            majorTicks:20,
            minorTicks:100,
            gridHeight:graphicopt.height,
            margin:graphicopt.margin
        });
        drawAxisTime.init( contentCollections.axistime_svg);

        drawScatterArray = ScatterArray({})
        drawScatterArray.init(contentCollections.scatterArray)

        drawCloudText = TextCloud({
            height:FONTSIZE*NUMTEXTCLOUD,
            numeLine:NUMTEXTCLOUD,
            fontSize:FONTSIZE,
        })
        drawCloudText.init(contentCollections.textCloud)

        drawBoxplotArray = BoxplotArray({
            height:80,
            boxW:2
        })
        drawBoxplotArray.init(contentCollections.boxplotArray)

        drawStreamArray = StreamArray({
            height:streamH
        })
        drawStreamArray.init(contentCollections.streamArray)

        return master;
    }

    master.draw = function() {
        const {colorNet}=graphicopt;
        const {time}=data;
        if (isFreeze)
            freezeHandle();

        updateXscale();

        // time box
        const onMouseMove = ((event)=> {
            if (islensing) {
                const _lensTime = _xScaleLinear.invert(d3.pointer(event)[0]);
                const index = d3.bisect(time,_lensTime);
                lensingTarget = {time:_lensTime,index};
                streamOrderIndex = index;
                // update data
                drawStreamArray.order(orderStream())

                master.draw();
            }
        })
        drawAxisTime.graphicopt({scale:_xScale,
            minorTicksEnable:(t)=> {
                if (lensingTarget) {
                    return d3.scaleThreshold().domain(_xScale.range()).range([0,0,1,0,0])(_xScale(t))
                }
                return 0;
            },
            lensingTarget:lensingTarget?lensingTarget.time:undefined,
            onMouseMove})
            .draw();

        drawScatterArray.graphicopt({
            scale:_xScale,
            triggerScale:lensingTarget,
            colorScale:colorNet,
            data:currentNet,
            markedIndex: lensingTarget?lensingTarget.index:undefined,
            onClick: (t)=> {
                lensingTarget = {index:t,time:time[t]};
                streamOrderIndex = t;
                drawStreamArray.order(orderStream());
                master.draw();
            }
         }).draw();

        drawCloudText.graphicopt({
            scale:_xScale,
            data:lensingTarget?textCloud:[]
        }).draw();

        drawBoxplotArray.graphicopt({
            scaleX:_xScale,
            data:boxplotNodes
        }).draw();
        const yDomain = data.dimensions[data.serviceSelected]?(data.dimensions[data.serviceSelected].scale?data.dimensions[data.serviceSelected].scale.domain():undefined):undefined;
        drawStreamArray.graphicopt({
            scaleX:_xScale,
            yDomain
        }).draw();

    }

    function orderStream(){
        return (streamOrderIndex!==undefined)?((a,b)=> {
            return Math.abs(b[1][streamOrderIndex]?.sudden??0) - Math.abs(a[1][streamOrderIndex]?.sudden??0)
        }):undefined
    }

    function updateXscale() {
        const {timeRange,time} = data;
        const width = graphicopt.widthG();
        // adjust xscale
        _xScaleLinear.domain(timeRange).range([0,width])
        if (islensing&&(lensingTarget!==undefined)){
            const or = d3.scaleTime().domain(timeRange);
            const orRang = d3.scaleLinear().range([0,width]);
            const _target = or(lensingTarget.time);
            const ratio = lensingConfig.zoomScale / (orRang(or(time[1]))-orRang(or(time[0])));
            const lensRang = d3.scaleLinear().range([0,width*ratio]);
            const dx = orRang(_target) - lensRang(_target);
            const lensingRange= [or(time[Math.max(0,lensingTarget.index-lensingConfig.expandRate)]),or(time[Math.min(time.length-1,lensingTarget.index+lensingConfig.expandRate)])];

            const domain = [];
            const range = [];
            // if (lensingRange[0]>0){
            domain.push(timeRange[0]);
            range.push(orRang(0));
            // }
            const upper = Math.max(lensRang(lensingRange[0])+dx,0); //lensRang(lensingRange[0])+dx
            domain.push(or.invert(lensingRange[0]));
            range.push(upper);


            const downer = Math.min(lensRang(lensingRange[1])+dx,width); //lensRang(lensingRange[1])+dx
            domain.push(or.invert(lensingRange[1]));
            range.push(downer);
            // if (lensingRange[1]<1){
            domain.push(timeRange[1]);
            range.push(orRang(1));
            // }
            _xScale.domain(domain).range(range);
        }else
            _xScale.domain(timeRange).range([0, width]);
    }

    function freezeHandle(){
        if (isFreeze){
            const func = isFreeze;
            isFreeze = false;
            func();
        }else{
            isFreeze = true;
            isFreeze = (function(){d3.select(this).dispatch('mouseout')}).bind(this);
            if (d3.event.stopPropagation) d3.event.stopPropagation();
        }
    }

    function boxplot ({dimensions,serviceSelected,time,node}) {
        const newMap = {};
        let currentNet = time.map((t,i) => ({timestep: t,timeIndex:i, value: 0, hasValue:false}));
        let boxplotNodes = time.map((t,i) => ({
            timeIndex:i,
            timestep: t, sumAbove: 0, sumBelow: 0,
            countAbove: 0, countBelow: 0, maxAbove: 0, maxBelow: 0, nodes: [], hasValue:false
        }));

        if (dimensions[serviceSelected] && time.length) {
            const key = dimensions[serviceSelected].text;
            Object.keys(node).forEach(comp => {
                if (node[comp][key]) {
                    newMap[comp] = node[comp][key].map((d, i) => {
                        const sudden = node[comp][key].sudden[i];
                        if (!_.isNumber(d))
                            return {timestep: time[i], value: undefined}
                        if (!currentNet[i])
                            debugger
                        currentNet[i].hasValue = true;
                        if (Math.abs(sudden) > Math.abs(currentNet[i].value))
                            currentNet[i].value = sudden;

                        boxplotNodes[i].hasValue = true;
                        if (sudden > 0) {
                            boxplotNodes[i].sumAbove += sudden;
                            boxplotNodes[i].countAbove++;
                        }
                        if (sudden < 0) {
                            boxplotNodes[i].sumBelow += sudden;
                            boxplotNodes[i].countBelow++;
                        }
                        boxplotNodes[i].nodes.push(sudden);

                        return {timestep: time[i], value: d};
                    })
                }
            });
            boxplotNodes.forEach((obj) => {
                obj.nodes.sort((a, b) => b - a);
                if (obj.countAbove > 0)
                    obj.averageAbove = obj.sumAbove / obj.countAbove;
                else
                    obj.averageAbove = 0;
                if (obj.countBelow > 0)
                    obj.averageBelow = obj.sumBelow / obj.countBelow;
                else
                    obj.averageBelow = 0;
                obj.maxAbove = obj.nodes[0];
                obj.maxBelow = obj.nodes[obj.nodes.length - 1];
            })
        }
        currentNet.forEach((d,i)=>{
            if (!d.hasValue)
                currentNet[i].value = undefined;
        })

        return {newMap, currentNet, boxplotNodes};
    }

    function streamFunc({dimensions,serviceSelected,node,time}){
        const newMap = {};
        if (dimensions[serviceSelected]) {
            const key = dimensions[serviceSelected].text;
            Object.keys(node).forEach(comp => {
                if (node[comp][key]) {
                    newMap[comp] = node[comp][key].map((d, i) => {
                        const sudden = node[comp][key].sudden[i];
                        if (!_.isNumber(d))
                            return {timestep: time[i], value: undefined,sudden}
                        else
                            return {timestep: time[i], value: d,sudden}
                    })
                }
            })
        }
        const data = Object.entries(newMap);
        data.forEach((d,i)=>d.index=i);
        return data;
    }

    function textCloudFunc({dimensions,serviceSelected,node,time}){
        const textCloud = time.map((t) => ({timestep: t, value: []}));
        if (dimensions[serviceSelected] && time.length) {
            const key = dimensions[serviceSelected].text;
            Object.keys(node).forEach(comp => {
                if (node[comp][key]) {
                    node[comp][key].forEach((d, i) => {
                        const sudden = node[comp][key].sudden[i];
                        textCloud[i].value.push({key: comp, value: sudden,abs:Math.abs(sudden??0)})
                    })
                }
            })
            textCloud.forEach(d=>{
                d.value.sort((a,b)=>-a.abs +b.abs);
                d.value = d.value.slice(0,NUMTEXTCLOUD)
            })
        }
        return textCloud;
    }

    function updateData() {
        const boxdata = boxplot(data);
        currentNet = boxdata.currentNet;
        boxplotNodes = boxdata.boxplotNodes;
        streamData = streamFunc(data)
        textCloud = textCloudFunc(data);

        drawStreamArray.data(streamData);
        debugger
        // adjust height
        graphicopt.height = Math.max($(graphicopt.maindiv).height(),30+FONTSIZE*NUMTEXTCLOUD+200+streamData.length*streamH);
        contentCollections.main_svg.attr("height", graphicopt.height-graphicopt.margin.top);
        drawAxisTime.gridHeight(graphicopt.height)
    }


    master.mouseover = [];
    master.mouseover.dict={};
    master.mouseout = [];
    master.mouseout.dict={};
    master.click = [];
    master.click.dict={};
    master.mouseoverAdd = function(id,func){
        if (master.mouseover.dict[id]!==undefined)
            master.mouseover[master.mouseover.dict[id]] = func;
        else {
            master.mouseover.push(func)
            master.mouseover.dict[id] = master.mouseover.length-1;
        }
    }
    master.mouseoutAdd = function(id,func){
        if (master.mouseout.dict[id]!==undefined)
            master.mouseout[master.mouseout.dict[id]] = func;
        else {
            master.mouseout.push(func)
            master.mouseout.dict[id] = master.mouseout.length-1;
        }
    }
    master.clickAdd = function(id,func){
        if (master.click.dict[id]!==undefined)
            master.click[master.click.dict[id]] = func;
        else {
            master.click.push(func)
            master.click.dict[id] = master.click.length-1;
        }
    }

    master.data = function(_data) {
        if ( arguments.length){
            Object.keys(_data).forEach(k=>{
                data[k] = _data[k];
            });
            updateData();
            return master;
        }
        return data;
    };

    master.graphicopt = function(_data) {
        if (arguments.length){
            Object.keys(_data).forEach(k=>graphicopt[k]=_data[k]);
            return master;
        }else
            return graphicopt;
    };

    master.getColorScale = function (_data) {
        return arguments.length ? (getColorScale = _data ? _data : function () {
            return color
        }, master) : getColorScale;
    };

    master.service = function (_data) {
        return arguments.length ? (graphicopt.service = _data, master) : graphicopt.service;
    };


    master.isFreeze = function () {
        return isFreeze
    };

    return master;
}