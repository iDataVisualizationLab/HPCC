let radarController = function () {
    let graphicopt = {
        margin: {top: 5, right: 5, bottom: 5, left: 5},
        width: 310,
        height: 310,
        radius: 150,
        scalezoom: 1,
        widthView: function(){return this.width*this.scalezoom},
        heightView: function(){return this.height*this.scalezoom},
        widthG: function(){return this.widthView()-this.margin.left-this.margin.right},
        heightG: function(){return this.heightView()-this.margin.top-this.margin.bottom},
        roundStrokes: true,
        labelFactor: 1.05,
        levels: 6,
        arrColor: ["#110066", "#4400ff", "#00cccc", "#00dd00", "#ffcc44", "#ff0000", "#660000"],
        arrThresholds: [],
        opacityCircles: 0.1,
        wrapWidth: 60,
        bin: true,
        color: function () {
            return 'rgb(167, 167, 167)'
        },
        violinMode:1 // 0: default: 0->max, 1: min-max range, 2: min-max indivitual
    };

    let svg,g,div,tablediv;
    let arr, deltaAng = Math.PI/10;
    let radarcomp = { // schema
        axis: {}, // axis objects
        axisList : [],  // axis array
    };
    let charType = "radar";
    let radarController ={};
    // color control
    let colorLength = graphicopt.arrColor.length-1;
    var dif = 1 / (graphicopt.levels-2);
    var right = 1 + dif;
    // graphicopt.arrThresholds = [-dif];
    graphicopt.arrThresholds = [-4/graphicopt.widthG()];
    for (var i=0;i<colorLength-1;i++)
        graphicopt.arrThresholds.push(i*dif);
    graphicopt.arrThresholds.push(right);
    let colorTemperature = d3.scaleLinear()
        .domain(graphicopt.arrThresholds)
        .range(graphicopt.arrColor)
        .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb
    function updatecolorscale (){
        let colorLength = graphicopt.arrColor.length-1;
        var dif = 1 / (graphicopt.levels-2);
        var right = 1 + dif;
        // graphicopt.arrThresholds = [-dif];
        graphicopt.arrThresholds = [-dif];
        for (var i=0;i<colorLength-1;i++)
            graphicopt.arrThresholds.push(i/(colorLength-1));
        graphicopt.arrThresholds.push(right);
        colorTemperature
            .domain(graphicopt.arrThresholds)
            .range(graphicopt.arrColor)
            .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb

        /////////////////////////////////////////////////////////
        /////////////// Draw the Circular grid //////////////////
        /////////////////////////////////////////////////////////
        //Wrapper for the grid & axes
        if (svg)
            svg.select(".axisWrapper").selectAll(".gridCircle")
                .style("stroke", function (d) {
                    var v = (d) / (graphicopt.levels-1);
                    return graphicopt.gradient? '#d0d0d0': colorTemperature(v);
                });

    }
    // FUNCTION ZONE
    let onChangeValueFunc = function(){};
    let onChangeFilterFunc = function(){};
    let onChangeMinMaxFunc = function(){};

    // TODO: REPLACE

    let rScale = d3.scaleLinear()
        .domain([graphicopt.arrThresholds[0], graphicopt.arrThresholds[graphicopt.arrThresholds.length-1]]);

    radarController.axisSchema = function (){
        if (arguments.length<3) {
            const axis = arguments[0];
            const resetrequest = arguments[1];
            if(resetrequest)
                createSchemaInit(axis,true)
            else
            {
                if (Array.isArray(axis)) //array axis
                {
                    createSchemaInit(axis);
                } else // schema axis
                {
                    updateSchemas(axis);
                }
            }
        }else {
            return radarcomp.axisList;
        }
        return radarController;
    };
    let idleTimeout,
        idleDelay = 350;
    function getBrush(d) {
        return d3.brushY(radarcomp.axis[d.data.text].scale)
            .extent( [ [-10,-rScale(1)], [10,-rScale(0)] ] )
            .on("brush end", brushended);
    }
    function brushed(){
        if (d3.event.sourceEvent.type === "brush") return;
        var d0 = d3.event.selection.map(v=>radarcomp.axis[this.__data__.data.text].scale.invert(-rScale.invert(v)-0.5)).sort((a,b)=>a-b),
            d1 = d0.map(Math.round);

        // If empty when rounded, use floor instead.
        if (d1[0] >= d1[1]) {
            d1[0] = Math.floor(d0[0]);
            d1[1] = Math.floor(d1[0]);
        }
        d1 = d1.sort((a,b)=>b-a).map(radarcomp.axis[this.__data__.data.text].scale).map(d=>-rScale(d))
        d3.select(this).call(d3.event.target.move, d1);
    }
    function brushed(){
        if (d3.event.sourceEvent.type === "brush") return;
        var d0 = d3.event.selection.map(v=>radarcomp.axis[this.__data__.data.text].scale.invert(-rScale.invert(v)-0.5)).sort((a,b)=>a-b),
            d1 = d0.map(Math.round);

        // If empty when rounded, use floor instead.
        if (d1[0] >= d1[1]) {
            d1[0] = Math.floor(d0[0]);
            d1[1] = Math.floor(d1[0]);
        }
        d1 = d1.sort((a,b)=>b-a).map(radarcomp.axis[this.__data__.data.text].scale).map(d=>-rScale(d))
        d3.select(this).call(d3.event.target.move, d1);
    }
    function brushended() {
        var actives = [];
        svg.selectAll(".axis")
            .filter(function(d) {
                if (d3.brushSelection(this))
                    radarcomp.axis[d.data.text].filter = d3.brushSelection(this).map(v=>radarcomp.axis[d.data.text].scale.invert(-rScale.invert(v)-0.5)).sort((a,b)=>a-b);
                else
                    radarcomp.axis[d.data.text].filter = null;
                return radarcomp.axis[d.data.text].filter;

            })
            .each(function(d) {
                // Get extents of brush along each active selection axis (the Y axes)
                console.log(d.filter)
                actives.push(d);
            });
        onChangeFilterFunc(radarcomp);
    }
    function idled() {
        idleTimeout = null;
    }
    let getangle = function (count) { // auto dive angle function base on neighbor angle
        if (count===radarcomp.axisList.length) //max stack call
            return 0;
        count = (count||0)+1;
        const index = this.order;
        let combo = [];
        if (index === 0)
            combo = [negativeAngle(_(radarcomp.axisList).last().angle(count)),radarcomp.axisList[1].angle(count)];
        else
            combo = [radarcomp.axisList[index-1].angle(count),radarcomp.axisList[index+1].angle(count)];
        if (combo[0]===combo[1]&& combo[0]===0) //fresh angle
            return Math.PI*2/radarcomp.axisList.length*index;
    };
    function createSchemaInit (axisArray,reset){ // input {text: 'axis',range:[],filter:[],angle:0}
        let update= false;
        if (radarcomp.axisList&&!reset) {
            update = true;
        }else{
            radarcomp.axisList = [];
            radarcomp.axis = {};
        }
        if (axisArray[0].order)
            axisArray.sort((a,b)=>a.order-b.order);
        axisArray.forEach((axiselement,index)=>{
            let axis;
            if (typeof axiselement === 'string')
                axis = axiselement;
            else
                axis = axiselement.text;
            radarcomp.axis[axis] = {
                scale: axiselement.range!==undefined?d3.scaleLinear().domain(axiselement.range):d3.scaleLinear(),
                filter: axiselement.filter!==undefined?axiselement.filter:[], //filter for axis
                angle: axiselement.angle!==undefined?function () {return axiselement.angle}:getangle,
                order: axiselement.order!==undefined? axiselement.order: index,
                summary:{
                    axis: axis,
                    q1: undefined ,
                    q3: undefined,
                    median: undefined ,
                    outlier: [],
                    arr: []}
            };
            radarcomp.axis[axis].data = axiselement;
            radarcomp.axisList[index] = radarcomp.axis[axis];
        });

        // deltaAng = updateDeltaAng ();
        // radarcomp.axisList.forEach(d=>d.angle())
    }
    function updateDeltaAng (){
        let listang = radarcomp.axisList.map(d=> positiveAngle(d.angle())).sort((a,b)=>a-b);
        let mindis = Math.PI/4;
        for (let i = 1;i<listang.length;i++){
            const a = listang[i] - listang[i-1];
            if (mindis>a)
                mindis = a;
        }
        return mindis;
    }
    function positiveAngle(angle){
        return angle>0? angle: (angle+Math.PI*2);
    }
    function negativeAngle(angle){
        return angle<0? angle: (angle - Math.PI*2);
    }
    function updateSchemas (axisObject) {
        Object.keys(axisObject).forEach(axis => {
            radarcomp.axis[axis] = axisObject[axis];
        });
    }

    function maketableCotrol() {
        if (tablediv) {
            let table = tablediv.select("table");
            dataTable = $(table.node()).DataTable({
                data: radarcomp.axisList,
                "order": [[3, "desc"],[2, "asc"]],
                "pageLength": 20,
                "columnDefs": [
                    {   targets: 0,
                        title: "Service name",
                        orderable: true,
                        "data": null,
                        className:'text',
                        "render": function ( d, type, row, meta ) {
                            if (type=='display')
                                return d.data.text;
                            else
                                return d.data.text;
                        }
                    },
                    {   targets: 1,
                        title: 'Summary',
                        orderable: true,
                        "data": null,
                        className:'summary_chart',
                        "render": function ( d, type, row, meta ) {
                            if (type=='display') {
                                return '<svg class="s_chart" width="160" height="25"></svg>';
                            }
                            return d.summary.outlier.length;
                        }
                    },
                    {   targets: 2,
                        title: "\u00B0 ",
                        orderable: true,
                        "data": null,
                        className:'angle',
                        "render": function ( d, type, row, meta ) {
                            if (type=='display') {
                                return '<input type="number" value=' + toDegrees(d.angle()).toFixed(0) + '></input>';
                            }
                            else
                                return d.angle();
                        }
                    },
                    {   targets: 3,
                        title: '',
                        orderable: true,
                        "data": null,
                        className:'btngroup',
                        "render": function ( d, type, row, meta ) {
                            if (type=='display')
                                return '<span class="no-shrink  toggleDisable"> <a class="disable-field"><i class="fa fa-check"></i></a></span>';
                            else
                                return d.data.enable;
                        }
                    },
                ],
                rowCallback: function (row, data) {
                    if ( !data.data.enable) {
                        $(row).addClass('fieldDisable');
                    }else{
                        $(row).removeClass('fieldDisable');
                    }
                },
                // "columns": [
                //     null,
                //     {"orderDataType": "dom-text-numeric"},
                //     {"orderDataType": "dom-disablebtn"},
                // ]
                    "dom":'<"toolbar">frtip',
                fnInitComplete: function(){
                    $("#RadarController_Table .toolbar")
                        .html(`<label class="col left-align" style="margin-top:6px"> <input id="dataRange_control" type="checkbox" class="filled-in"> <span>Min-max scale</span> </label>`);
// <label class="col left-align" style="margin-top:6px"> <input id="dataRange_control" type="checkbox" class="filled-in"> <span>Remove isngle value</span> </label>`);
                    d3.select('#dataRange_control').on('change',function(){
                        console.log(this.checked)
                            onChangeMinMaxFunc(this.checked);
                    });
                }
            });
            eventTable();
            dataTable.rows().draw();
            dataTable.on( 'draw', function () { // add event when redraw
                eventTable();
            } );

        }
    }
    let violiin_chart = d3.viiolinChart().graphicopt({width:160,height:25,opt:{dataformated:true},margin: {top: 0, right: 30, bottom: 0, left: 30},middleAxis:{'stroke-width':0.5},ticks:{'stroke-width':0.5},tick:{visibile:false}});;
    function eventTable(){
        tablediv.select("table").selectAll('td.angle').on('input', function (d) {
            updateAngle(svg.selectAll('.dragpoint').filter(s => s.data.text === dataTable.cell(this).data().data.text).node().parentElement, toRadian(this.firstElementChild.value * 1));
            onChangeValueFunc(radarcomp);
        });
        tablediv.select("table").selectAll('td.btngroup .disable-field')
            .on('click', function() {
                c =  dataTable.cell(this.parentNode.parentElement);
                d = c.data();
                r =  dataTable.row(c.index().row).node();
                d.data.enable = !d.data.enable;
                if ( !d.data.enable) {
                    $(r).addClass('fieldDisable');
                }else{
                    $(r).removeClass('fieldDisable');
                }
                g.selectAll('.axis').filter(t => t.data.text === d.data.text).classed('disable', t => !t.data.enable);
                onChangeValueFunc(radarcomp);
            });
        tablediv.select("table").selectAll('td.summary_chart svg.s_chart').each(function(d){
            let sg = d3.select(this).datum(dataTable.cell(this.parentElement).data());
            sg.call(function(selection){
                let customrange,displaytick;
                switch (graphicopt.violinMode) {
                    case 1:
                        if (sg.datum().summary.arr.length) {
                            customrange = [0,1];
                            displaytick = sg.datum().data.range;
                        }else{
                            customrange = [0,0];
                            displaytick = [0, 0];
                        }
                        break;
                    case 2:
                        if (sg.datum().summary.arr.length) {
                            customrange = [sg.datum().summary.arr[0][0], _.last(sg.datum().summary.arr)[0]];
                            displaytick = [sg.datum().scale.invert(customrange[0]), sg.datum().scale.invert(customrange[1])];
                        }else{
                            customrange = [0,0];
                            displaytick = [0, 0];
                        }
                        break;
                    default:
                        customrange = [sg.datum().scale(0),1];
                        displaytick = [0,sg.datum().data.range[1]];
                }
                violiin_chart.graphicopt({customrange:customrange});//fix range from 0
                violiin_chart.data([ sg.datum().summary]).setTicksDisplay(displaytick).draw(selection)
            })})

    }
    let dataSumIn;
    function updateSummaryData (dSum){
        if(dSum)
            dataSumIn = dSum;
        try{
            radarcomp.axisList.forEach(d=>{d.summary = dataSumIn[d.data.text];d.summary.range = d.scale.domain()});
            eventTable();
        }catch(e){
            console.log(e)
        }
    }
    let dataTable;
    radarController.init = function ()
    {
        try {
            // <editor-fold des=radar>
            if (!div) throw 'div not defined';
            /////////////////////////////////////////////////////////
            //////////// Create the container SVG and g /////////////
            /////////////////////////////////////////////////////////


            let first = false;

            //Initiate the radar chart SVG or update it

            svg = div.select(".radarController");


            g = svg.select("#radarGroup");
            if (svg.empty()) {
                first = true;
                svg = div.append("svg")
                    .attr("width", graphicopt.width)
                    .attr("height", graphicopt.height)
                    .attr("class", "radarController radarPlot");
                //Append a g element
                g = svg.append("g")
                    .attr('class','radarControllerg')
                    .attr('transform',`translate(${graphicopt.widthG()/2+graphicopt.margin.left},${graphicopt.heightG()/2+graphicopt.margin.top})`)
            }
            svg.attrs({
                width: graphicopt.width,
                height: graphicopt.height,
            });


            if (first) {
                // const rg = svg.append("defs").append("radialGradient")
                //     .attr("id", "rGradient2");
                // createGradient(rg,1,graphicopt.arrColor);
                var filter = g.append('defs').append('filter').attr('id', 'glowc'),
                    feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur'),
                    feMerge = filter.append('feMerge'),
                    feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
                    feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
                /////////////////////////////////////////////////////////
                /////////////// Draw the Circular grid //////////////////
                /////////////////////////////////////////////////////////
                //Wrapper for the grid & axes
                let axisGrid = g.append("g").attr("class", "axisWrapper");
                let radius = Math.min(graphicopt.widthG() / 2, graphicopt.heightG() / 2),
                    Format = d3.format('');
                rScale.range([0,radius]);
                //Draw the background circles
                axisGrid.   selectAll(".gridCircle")
                    .data(d3.range(1, (graphicopt.levels)).reverse())
                    .enter()
                    .append("circle")
                    .attr("class", "gridCircle")
                    .attr("r", function (d, i) {
                        return rScale(d/(graphicopt.levels-2));
                    })
                    .style("fill", graphicopt.gradient?'white':"#CDCDCD")
                    .style("stroke", function (d) {
                        var v = (d) / (graphicopt.levels-2);
                        return graphicopt.gradient? '#d0d0d0': colorTemperature(v);
                    })
                    .style("stroke-width", 0.3)
                    .style("stroke-opacity", 1)
                    .style("fill-opacity", graphicopt.opacityCircles)
                    .style("filter", "url(#glowc)")
                    .style("visibility", (d, i) => ((graphicopt.bin||graphicopt.gradient) && i === 0) ? "hidden" : "visible");


                /////////////////////////////////////////////////////////
                //////////////////// Draw the axes //////////////////////
                /////////////////////////////////////////////////////////

                //Create the straight lines radiating outward from the center
                var axis = axisGrid.selectAll(".axis")
                    .data(radarcomp.axisList,d=>d.data.text)
                    .enter()
                    .append("g")
                    .attr("class", "axis")
                    .classed('disable',d=>d.data.enable)
                    .call(d=>d3.brushY()
                        .extent( [ [-10,-rScale(1)], [10,-rScale(0)] ] )
                        .on("brush", brushed)
                        .on("end", brushended)(d))
                    .style('transform-origin','0,0')
                    .style('transform',function (d, i) {
                        return "rotate(" + toDegrees(d.angle()) + "deg)"});
                create_axis(axis);
            }

            // update
            g.selectAll('.axis').classed('disable',d=>!d.data.enable);


            // <editor-fold des=tablediv>
            maketableCotrol();
            // </editor-fold>
        }catch (e) {
            return e;
        }
        return radarController;
    };
    function toDegrees(rad) {
        return rad * (180/Math.PI)%360;
    }
    function toRadian(deg) {
        return deg * (Math.PI/180);
    }
    function updateAngle(target,value) {
        d3.select(target).style('transform',function (d, i) {
            d.angle = ()=>{return positiveAngle(value);};
            return "rotate(" + toDegrees(positiveAngle(value)) + "deg)"});
        d3.select(target).select('.angleValue').text(function (d) {
            return toDegrees(d.angle()).toFixed(0) + 'o';
        });
    }
    function create_axis(axis){
        //Append the lines
        axis.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", function (d, i) {
                return -rScale( graphicopt.bin||graphicopt.gradient?1:1.05) ;
            })
            .attr("class", "line")
            .style("stroke", graphicopt.gradient?'#eaeaea':"white")
            .style("stroke-width", "1px");

        //Append the labels at each axis

        axis.append("text")
            .attr("class", "legend")
            .style("font-size", "12px")
            .attr("font-family", "sans-serif")
            .attr("fill", "black")
            .attr("text-anchor", "middle")
            .attr("dy", "-1em")
            .attr("x", 0)
            .attr("y", -rScale( graphicopt.bin||graphicopt.gradient?1:1.05)*graphicopt.labelFactor)
            .text(function (d) {
                return d.data.text;
            }).call(wrap, graphicopt.wrapWidth);
        axis.append("text")
            .attr("class", "angleValue")
            .style("font-size", "12px")
            .attr("font-family", "sans-serif")
            .attr("text-anchor", "middle")
            .attr("dy", "2em")
            .attr("x", 0)
            .attr("y", -rScale( graphicopt.bin||graphicopt.gradient?1:1.05))
            .text(function (d) {
                return toDegrees(d.angle()).toFixed(0) + '\u00B0';
            });
        let dragContain = axis.append("circle")
            .attr("cx", 0)
            .attr("cy", function (d, i) {
                return -rScale( graphicopt.bin||graphicopt.gradient?1:1.05) ;
            })
            .attr('r',4)
            .attr("class", "dragpoint")
            .style("fill", graphicopt.gradient?'#eaeaea':"white")
            .style("stroke", "var(--colorMain2)")
            .on('mouseover',function(){
                d3.select(this).attr('r',8)
            })
            .on('mouseleave',function(){
                d3.select(this).attr('r',4)
            });
        try{
            dragContain.call(d3.drag().container(function () {
                return this.parentNode.parentNode;
            }).touchable(navigator.maxTouchPoints).on("start", onDragAxisStarted).on("drag", onDragAxisDragged).on("end", onDragAxisEnded))
        }catch(e){
            console.log('Your device not support navigator.maxTouchPoints')
            dragContain.call(d3.drag().container(function () {
                return this.parentNode.parentNode;
            }).on("start", onDragAxisStarted).on("drag", onDragAxisDragged).on("end", onDragAxisEnded))
        }

        function onDragAxisStarted (d){
            d3.select(this).style('fill','black');
            d3.select(this.parentElement).classed('active',true);
        }
        function onDragAxisDragged (d){
            // FIXME: rotation not smooth

            let dAngle = Math.atan2(d3.event.y - 0, d3.event.x - 0)+Math.PI/2;
            // let dAngle = Math.atan2(d3.event.sourceEvent.y-radius,d3.event.sourceEvent.x-radius);
            updateAngle(this.parentNode,dAngle);
            // console.log(datat[i].angle())
            // $(tablediv.select("table").node()).dataTable().fnUpdate(datat[i],i,undefined,false);
            dataTable.row(d.order).invalidate().draw(false);
            // tablediv.selectAll('.angle').filter(e=>e.text===d.data.text).select('input').attr('value',toDegrees(d.angle()).toFixed(0));
        }
        function onDragAxisEnded (d){
            d3.select(this.parentNode).classed('active',false);
            d3.select(this).style("fill", graphicopt.gradient?'#eaeaea':"white");
            d.__origin__= null;
            onChangeValueFunc(radarcomp);
            d3.select(this).select('.dragpoint').style('fill','white');
        }
    }
    radarController.update = function () {
        let axis = g.selectAll('.axis')
            .data(radarcomp.axisList,d=>d.data.text);
        axis.exit().remove();
        let naxis = axis.enter().append('g')
            .attr('class','axis');
        naxis.merge(axis)
            .classed('disable',d=>!d.data.enable)
            .style('transform',function (d, i) {
                return "rotate(" + toDegrees(d.angle()) + "deg)"});

        create_axis(naxis);

        axis = naxis.merge(axis);

        axis.select('.dragpoint').datum(d=>d);
        axis.select('.angleValue').text(function (d) {
            return toDegrees(d.angle()).toFixed(0) + '\u00B0';
        });



        // let rows = tablediv.select('tbody').selectAll('tr')
        //     .data(radarcomp.axisList,d=>d.text||d.data.text);
        // rows.each(function(){
        //         d3.select(this).datum(d=>d.data)});
        // rows.select('td.text').text(d=>d.text);
        // rows.select('td.angle input')
        //     .attr('value',d=>toDegrees(d.angle).toFixed(0));
        // rows.select('td a.disable-field').datum(d=>d);
        // rows.classed('fieldDisable',t=>!t.enable);
        dataTable.clear();
        dataTable.rows.add(radarcomp.axisList).draw();
        onChangeValueFunc(radarcomp);
    };
    let old_hindex = 0;
    radarController.drawSummary = function(hindex_input){
        try {
            let hindex = hindex_input || old_hindex;
            old_hindex = hindex
            let data = [handledataRate(hindex)];
            if (data[0].length === 0)
                data[0] = arr;
            data = data.map(ditem => {
                const ditem_filtered = ditem.filter(d => radarcomp.axis[d.axis].data.enable);
                let temp = _.sortBy(ditem_filtered, d => getAngle(d));
                temp.bin = ditem.bin;
                return temp;
            });

            function getAngle(d) {
                return radarcomp.axis[d.axis].angle();
            }

            /////////////////////////////////////////////////////////
            ///////////// Draw the radar chart blobs ////////////////
            /////////////////////////////////////////////////////////
            //The radial line function
            //Create a wrapper for the blobs
            var blobWrapperg = g.selectAll(".radarWrapper")
                .data(data);
            blobWrapperg.exit().remove();
            var blobWrapper = blobWrapperg
                .enter().append("g")
                .attr("class", "radarWrapper").style('pointer-events', 'none');

            //update the outlines
            var blobWrapperpath = blobWrapperg.select(".radarStroke").datum(d => d);

            let radarLine, radialAreaGenerator, radialAreaQuantile;
            switch (charType){
                case "rose":
                    radarLine = d3.arc()
                        .outerRadius(function (d) {
                            return rScale(d.value === undefined ? d : d.value);
                        })
                        .innerRadius(0)
                        .startAngle(function (d, i) {
                            return -deltaAng;
                        })
                        .endAngle(function (d, i) {
                            return deltaAng;
                        });
                    radialAreaGenerator = d3.arc()
                        .innerRadius(function (d, i) {
                            return rScale(d.minval);
                        })
                        .outerRadius(function (d, i) {
                            return rScale(d.maxval);
                        })
                        .startAngle(function (d, i) {
                            return -deltaAng;
                        })
                        .endAngle(function (d, i) {
                            return deltaAng;
                        });
                    radialAreaQuantile = d3.arc()
                        .innerRadius(function (d, i) {
                            return rScale(d.q1);
                        })
                        .outerRadius(function (d, i) {
                            return rScale(d.q3);
                        })
                        .startAngle(function (d, i) {
                            return -deltaAng;
                        })
                        .endAngle(function (d, i) {
                            return deltaAng;
                        });
                    break;
                case "flower":
                    const path = d3.line()
                        .curve(d3.curveBasis);
                function flowerpath(value) {
                    let dx = value * deltaAng;
                    return [[0, 0],
                        [0.2 * dx, -value * (10 / 19)],
                        [dx, -value * 0.89],
                        [0, -value * 1.03],
                        [-dx, -value * 0.89],
                        [-0.2 * dx, -value * (10 / 19)],
                        [0, 0]];
                }
                    radarLine = function(d){
                        let value = rScale(d.value === undefined ? d : d.value);
                        return path(flowerpath(value));
                    };
                    radialAreaGenerator =
                        function(d){
                            let value = rScale(d.maxval)-rScale(d.minval);
                            return path(flowerpath(value).map(p=>p[1]+rScale(d.minval)));
                        };

                    radialAreaQuantile =
                        function(d){
                            let value = rScale(d.q3)-rScale(d.q1);
                            return path(flowerpath(value).map(p=>p[1]+rScale(d.q1)));
                        };
                    break;
                default:
                    deltaAng = Math.PI/10
                    radarLine = d3.radialLine()
                    // .curve(d3.curveCatmullRom.alpha(0.5))
                        .radius(function (d) {
                            return rScale(d.value || d);
                        })
                        .angle(function (d, i) {
                            return getAngle(d);
                        });

                    radialAreaGenerator = d3.radialArea()
                        .angle(function (d, i) {
                            return getAngle(d);
                        })
                        .innerRadius(function (d, i) {
                            return rScale(d.minval);
                        })
                        .outerRadius(function (d, i) {
                            return rScale(d.maxval);
                        });

                    radialAreaQuantile = d3.radialArea()
                        .angle(function (d, i) {
                            return getAngle(d);
                        })
                        .innerRadius(function (d, i) {
                            return rScale(d.q1);
                        })
                        .outerRadius(function (d, i) {
                            return rScale(d.q3);
                        });

                    if (graphicopt.roundStrokes) {
                        radarLine.curve(d3.curveCardinalClosed.tension(charType==="star"?1:0.5));
                        radialAreaGenerator.curve(d3.curveCardinalClosed.tension(charType==="star"?1:0.5));
                        radialAreaQuantile.curve(d3.curveCardinalClosed.tension(charType==="star"?1:0.5));
                    }
                function drawMeanLine(paths) {
                    return paths
                        .attr("d", function (d) {
                            return radarLine(d)
                        })
                        .styles({
                            "fill": 'none',
                            'stroke': 'black',
                            'stroke-width': 0.5,
                            'stroke-dasharray': '1 2'
                        });
                }

                function drawQuantileArea(paths) {
                    return paths
                        .attr("d", d => radialAreaQuantile(d))
                        .styles({
                            "fill": 'none',
                            'stroke': 'black',
                            'stroke-width': 0.2
                        });
                }

                    //update the outlines
                    blobWrapperg.select('.radarLine').transition().call(drawMeanLine);

                    blobWrapperpath.style("fill", "none").transition()
                        .attr("d", d => radialAreaGenerator(d))
                        .style("stroke-width", () => graphicopt.strokeWidth + "px")
                        .style("stroke", (d, i) => graphicopt.color(i));
                    blobWrapperg.select('clipPath')
                        .select('path')
                        .transition('expand').ease(d3.easePolyInOut)
                        .attr("d", d => radialAreaGenerator(d));
                    //Create the outlines
                    blobWrapper.append("clipPath")
                        .attr("id", (d, i) => "sumC")
                        .append("path")
                        .attr("d", d => radialAreaGenerator(d));
                    blobWrapper.append("rect")
                        .style('fill', 'url(#rGradient2)')
                        .attr("clip-path", (d, i) => "url(#sumC)")
                        .attr("x", -rScale(1.25))
                        .attr("y", -rScale(1.25))
                        .attr("width", rScale(1.25) * 2)
                        .attr("height", rScale(1.25) * 2);
                    blobWrapper.append("path")
                        .attr("class", "radarStroke")
                        .attr("d", d => radialAreaGenerator(d))
                        .style("fill", "none")
                        .transition()
                        .style("stroke-width", () => graphicopt.strokeWidth + "px")
                        .style("stroke", (d, i) => graphicopt.color(i));
                    blobWrapper
                        .append("path").classed('radarLine', true).style("fill", "none").call(drawMeanLine);
            }

            if (charType==="rose"||charType==="flower"){
                deltaAng = Math.PI/9/2;
                blobWrapperpath.transition()                        .attr('transform',(d,i)=>`rotate(${getAngle(d,i)*180/Math.PI},0,0)`)
                    .attr("d", d => radarLine(d))
                    .style("fill-opacity", 0.5)
                    .style("fill", '#8c8c8c')
                    .style("stroke-width", () => graphicopt.strokeWidth + "px")
                    .style("stroke-opacity", d => 0.5)
                    .style("stroke", (d, i) => graphicopt.color(i,d));
                //Create the outlines
                blobWrapper.selectAll('.radarStroke').data(d=>d).enter()
                    .append("path")
                    .attr("class", "radarStroke")
                    .attr('transform',(d,i)=>`rotate(${getAngle(d,i)*180/Math.PI},0,0)`)
                    .attr("d", d => radarLine(d))
                    .style("fill", '#8c8c8c')
                    .style("fill-opacity", 0.5)
                    .style("stroke-width", () => graphicopt.strokeWidth + "px")
                    .style("stroke-opacity", d =>  0.5)
                    .style("stroke", (d, i) => graphicopt.color(i,d));
            }
        }catch(err){

        }
    };

    function handledataRate (hindex){
        return _.unzip(arr.slice(0,hindex+1)).map((d,i)=>{return {axis: radarcomp.axisList[i].data.text, value: ss.mean(d),minval: ss.min(d),maxval: ss.max(d), q1: ss.quantile(d,0.25),q3: ss.quantile(d, 0.75)}});
    }
    /////////////////////////////////////////////////////////
    /////////////////// Helper Function /////////////////////
    /////////////////////////////////////////////////////////

    //Taken from http://bl.ocks.org/mbostock/7555321
    //Wraps SVG text
    function wrap(text, width) {
        text.each(function() {
            var text = d3.select(this),
                words = text.text().trim().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 0.9, // ems
                y = text.attr("y"),
                x = text.attr("x"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                let size = tspan.node().getComputedTextLength();
                if (size===0)
                    size = getTextWidth(tspan.text(),tspan.style('font'));
                if (size > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }//wrap
    function getTextWidth(text, font) {
        var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
        var context = canvas.getContext("2d");
        context.font = font;
        var metrics = context.measureText(text);
        return metrics.width;
    }
    radarController.graphicopt = function (_) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in _) {
                if ('undefined' !== typeof _[i]) {
                    graphicopt[i] = _[i];
                }
            }
            return radarController;
        }else {
            return graphicopt;
        }

    };
    radarController.div = function (_) {
        return arguments.length ? (div = _, radarController) : div;

    };

    radarController.updatecolor = function (_) {
        graphicopt.arrColor = _;
        updatecolorscale();
        return radarController;
    };

    radarController.tablediv = function (_) {
        return arguments.length ? (tablediv = _, radarController) : tablediv;
    };

    radarController.charType = function (_) {
        return arguments.length ? (charType = _, radarController) : charType;
    };

    radarController.onChangeValue = function (_) {
        return arguments.length ? (onChangeValueFunc = _, radarController) : onChangeValueFunc;
    };

    radarController.onChangeFilterFunc = function (_) {
        return arguments.length ? (onChangeFilterFunc = _, radarController) : onChangeFilterFunc;
    };

    radarController.onChangeMinMaxFunc = function (_) {
        return arguments.length ? (onChangeMinMaxFunc = _, radarController) : onChangeMinMaxFunc;
    };

    radarController.data = function (_) {
        return arguments.length ? (arr = _, radarController) : arr;
    };

    radarController.datasummary = function (_) {
        return arguments.length ? (updateSummaryData(_), radarController) : arr;
    };

    radarController.schema = function () {
        return radarcomp;
    };
    //ulti
    /* Create an array with the values of all the input boxes in a column */
    $.fn.dataTable.ext.order['dom-text'] = function  ( settings, col )
    {
        return this.api().column( col, {order:'index'} ).nodes().map( function ( td, i ) {
            return $('input', td).val();
        } );
    }

    /* Create an array with the values of all the input boxes in a column, parsed as numbers */
    $.fn.dataTable.ext.order['dom-text-numeric'] = function  ( settings, col )
    {
        return this.api().column( col, {order:'index'} ).nodes().map( function ( td, i ) {
            return $('input', td).val() * 1;
        } );
    }

    /* Create an array with the values of all the select options in a column */
    $.fn.dataTable.ext.order['dom-select'] = function  ( settings, col )
    {
        return this.api().column( col, {order:'index'} ).nodes().map( function ( td, i ) {
            return $('select', td).val();
        } );
    }
    $.fn.dataTable.ext.order['dom-disablebtn'] = function  ( settings, col )
    {
        return this.api().column( col, {order:'index'} ).nodes().map( function ( td, i ) {
            return d3.select($('a.disable-field',td)[0]).datum().enable;
        } );
    }
    /* Create an array with the values of all the checkboxes in a column */
    $.fn.dataTable.ext.order['dom-checkbox'] = function  ( settings, col )
    {
        return this.api().column( col, {order:'index'} ).nodes().map( function ( td, i ) {
            return $('input', td).prop('checked') ? '1' : '0';
        } );
    }
    return radarController;
};
