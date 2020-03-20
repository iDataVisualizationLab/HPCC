/////////////////////////////////////////////////////////
/////////////// The Radar Chart Function ////////////////
/////////////// Written by Nadieh Bremer ////////////////
////////////////// VisualCinnamon.com ///////////////////
/////////// Inspired by the code of alangrafu ///////////
/////////////////////////////////////////////////////////
    
function RadarChart(id, data, options, name) {
    this.smooth = this.smooth===undefined?0.5:this.smooth;
    var cfg = {
        w: 600,                //Width of the circle
        h: 600,                //Height of the circle
        margin: {top: 10, right: 55, bottom: 0, left: 55}, //The margins of the SVG
        levels: 3,             //How many levels or inner circles should there be drawn
        maxValue: 0,           //What is the value that the biggest circle will represent
        labelFactor: 1.1,     //How much farther than the radius of the outer circle should the labels be placed
        wrapWidth: 60,         //The number of pixels after which a label needs to be given a new line
        opacityArea: 0.35,     //The opacity of the area of the blob
        dotRadius: 3,          //The size of the colored circles of each blog
        opacityCircles: 0.1,   //The opacity of the circles of each blob
        strokeWidth: 0.5,        //The width of the stroke around each blob
        roundStrokes: true,   //If true the area and stroke will follow a round path (cardinal-closed)
        radiuschange: true,
        markedLegend:undefined,
        showText: true,
        bin: false,
        gradient: false,
        isNormalize: false,
        showHelperPoint: true,
        arrColor: ["#110066", "#4400ff", "#00cccc", "#00dd00", "#ffcc44", "#ff0000", "#660000"],
        legend: [],
        mini:false,
        fillin:false,
        ringColor: undefined,
        pathColor: undefined,
        ringStroke_width: 0.5,
        schema: undefined,
        animationDuration:100,
        events:{
            axis: {
                mouseover: function(){},
                mouseleave: function(){},
                click: function(){},
                },
        },
        color: function () {
            return 'rgb(167, 167, 167)'
        }
        //d3.scaleOrdinal(d3.schemeCategory10) //Color function
    };
    //Put all of the options into a variable called cfg
    if ('undefined' !== typeof options) {
        for (var i in options) {
            if ('undefined' !== typeof options[i]) {
                cfg[i] = options[i];
            }
        }//for i
    }//if

    var maxValue,minValue,range,arrThresholds,colorTemperature,opaTemperature,allAxis,rScale,scaleMarkedLegend;
    range = thresholds[0];
    // NEW SETTING
    //If the supplied maxValue is smaller than the actual one, replace by the max in the data
    maxValue = Math.max(cfg.maxValue, d3.max(data, function (i) {
        return d3.max(i.map(function (o) {
            return o.value;
        }))
    }));

    if (cfg.isNormalize){
        minValue = 0;
        maxValue = 1;
        range = [minValue,maxValue];
    } else {
        maxValue = Math.max(cfg.maxValue, d3.max(data, function (i) {
            return d3.max(i.map(function (o) {
                return o.value;
            }))
        }));
        minValue = Math.min(cfg.minValue, d3.min(data, function (i) {
            return d3.min(i.map(function (o) {
                return o.value;
            }))
        }));
        range = [minValue,maxValue]
    }
    if (cfg.markedLegend) scaleMarkedLegend = d3.scaleLinear().domain(range).range(cfg.markedLegend);

    let colorLength = cfg.arrColor.length-1;
    var dif = 1 / (cfg.levels-2);
    var right = 1 + dif;
    cfg.arrThresholds = [-dif];
    for (var i=0;i<colorLength-1;i++)
        cfg.arrThresholds.push(i*dif);
    cfg.arrThresholds.push(right);
    colorTemperature = d3.scaleLinear()
        .domain(cfg.arrThresholds)
        .range(cfg.arrColor)
        .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb



    if (cfg.schema){
        range = [0,1];
        allAxis = cfg.schema.filter(d=>d.enable);
    }else{
        //Names of each axis
        angleSlice = cfg.angleSlice;
        allAxis = (data[0].map(function (i, j) {
                return {text: i.axis, angle: angleSlice[j]};
            }));
    }
    let deltaAng = Math.PI/10;
    // Re-adjust angles
    minValue = range[0]-dif*(range[1]-range[0]);
    maxValue = range[1]+dif*(range[1]-range[0]);

    let  radius = Math.min(cfg.w / 2, cfg.h / 2);    //Radius of the outermost circle
    Format = d3.format('');               //Percentage formatting

    data = data.map(ditem=>{
        if (ditem.bin)
            ditem.bin.val = ditem.bin.val.map(v=>v.filter((d,i)=>allAxis.find(e=>e.text===ditem[i].axis)));

        const ditem_filtered = ditem.filter(d=>allAxis.find(e=>e.text===d.axis));
        let temp = _.sortBy(ditem_filtered,d=>allAxis.find(e=>e.text===d.axis).angle);
        temp.type = ditem.type;
        temp.name = ditem.name;
        temp.bin = ditem.bin; return temp;});
    //Scale for the radius
    rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([minValue, maxValue]);


    /////////////////////////////////////////////////////////
    //////////// Create the container SVG and g /////////////
    /////////////////////////////////////////////////////////

    //Remove whatever chart with the same id/class was present before
    var first = false;

    d3.select(id).selectAll("svg").nodes().forEach(d => {
        if (!d3.select(d).classed("radar" + correctId (id)))
            d3.select(d).remove();
    });

    //Initiate the radar chart SVG or update it

    var svg = d3.select(id).select(".radar" + correctId (id));

    function correctId (id){
        if (typeof (id) === "string") {
            return id.replace(".", "");
        }else {
            return "Gen"
        }
    }
    var g = svg.select("#radarGroup");
    if (svg.empty()) {
        first = true;
        svg = d3.select(id).append("svg");
        //Append a g element
        g = svg.append("g")
            .attr("id","radarGroup");
    }
    svg.attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
        .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
        .attr("class", "radar" + correctId (id)  +" radarPlot");
    g.attr("transform", "translate(" + (cfg.w/2 + cfg.margin.left) + "," + (cfg.h/2 + cfg.margin.top) + ")");

    if (cfg.showText) {
        var temptest = svg.selectAll(".currentTimeText");
        if (temptest.empty())
            svg.append("text")
            .attr("class", "currentTimeText")
            .attr("x", 10)
            .attr("y", 12)
            .attr("fill", "#000")
            .style("text-anchor", "start")
            .style("font-weight", "bold")
            .style("font-size", "12px")
            .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
            .attr("font-family", "sans-serif")
            .text(name);
        else
            temptest.text(name);
    }
    function toDegrees(rad) {
        let deg = rad * (180/Math.PI)%360;
        return deg;
    }
    function toRadian(deg) {
        return deg * (Math.PI/180);
    }
    if (first&& !cfg.mini) {
        //Filter for the outside glow
        var filter = g.append('defs').append('filter').attr('id', 'glow'),
            feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur'),
            feMerge = filter.append('feMerge'),
            feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
            feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        //Filter for the outside glow
        var filter = g.append('defs').append('filter').attr('id', 'glow2'),
            feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '1').attr('result', 'coloredBlur'),
            feMerge = filter.append('feMerge'),
            feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
            feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    //     const rg = svg.append("defs").append("radialGradient")
    //         .attr("id", "rGradient2");
    //     createGradient(rg,1,arrColor)
    //     //Filter for the outside glow
    //     var filter = g.append('defs').append('filter').attr('id', 'glow'),
    //         feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur'),
    //         feMerge = filter.append('feMerge'),
    //         feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
    //         feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    //
    //     //Filter for the outside glow
    //     var filter = g.append('defs').append('filter').attr('id', 'glow2'),
    //         feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '1').attr('result', 'coloredBlur'),
    //         feMerge = filter.append('feMerge'),
    //         feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
    //         feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    // /////////////////////////////////////////////////////////
    // /////////////// Draw the Circular grid //////////////////
    // /////////////////////////////////////////////////////////

        //Wrapper for the grid & axes
        var axisGrid = g.append("g").attr("class", "axisWrapper");





    }
    const angle_scale = d3.scaleLinear().domain(allAxis.map(d=>d.angle).sort((a,b)=>a-b)).range(d3.range(0,allAxis.length));

    if (!cfg.mini) {
        /////////////////////////////////////////////////////////
        //////////////////// Draw the axes //////////////////////
        /////////////////////////////////////////////////////////
        var axisGrid = g.select(".axisWrapper");
        axisGrid.on("touchmove mousemove", function() {
            const dd = angle_scale( positiveAngle(Math.atan2(d3.mouse(this)[1] - 0, d3.mouse(this)[0] - 0)+Math.PI/2));
            const val = allAxis[Math.round(dd)];
            if (val) {
                d3.selectAll('.axisWrapper .highlight').classed('highlight',false);
                const target = d3.select(this).select("line.axis" + val.idroot + '_' + val.id);
                target.dispatch('mouseover', {detail: target.node().parentNode});
            }
        });
        //Draw the background circles
        var levels = axisGrid.selectAll(".levels.gridCircle")
            .data(d3.range(1, (cfg.levels + 1)).reverse());
        levels.exit().remove();
        levels.enter()
            .append("circle")
            .attr("class", "levels gridCircle")
            .merge(levels)
            .attr("r", function (d, i) {
                return radius / cfg.levels * d;
            })
            .style("fill", "#CDCDCD")
            .style("stroke", function (d) {
                if (cfg.ringColor===undefined) {
                    var v = (maxValue - minValue) * d / cfg.levels + minValue;
                    return colorTemperature(v);
                }
                return cfg.ringColor;
            })
            .style("stroke-width", cfg.ringStroke_width===undefined?0.3:cfg.ringStroke_width)
            .style("stroke-opacity", 1)
            .style("fill-opacity", cfg.opacityCircles)
            .style("filter", "url(#glow)")
            .style("visibility", (d, i) => ((cfg.bin||cfg.gradient) && i == 0) ? "hidden" : "visible");


        //Create the straight lines radiating outward from the center
        var axis_o = axisGrid.selectAll(".axis")
            .data(allAxis, d => d.text);

        axis_o.exit().remove();

        var axis_n = axis_o.enter()
            .append("g")
            .attr("class", "axis")
            .style('transform-origin', '0,0');

        axis_n.merge(axis_o)
            .style('transform', function (d, i) {
                return "rotate(" + toDegrees(d.angle) + "deg)"
            });

        //Append the lines
        axis_n.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0);
        axis_n.merge(axis_o).select('line')
            .attr("y2", function (d, i) {
                return -rScale(maxValue * (cfg.bin || cfg.gradient ? ((cfg.levels - 1) / cfg.levels) : 1.05));
            })
            .attr("class", d=>"line axis"+d.idroot+'_'+d.id)
            .style("stroke", "white")
            .style("stroke-width", "1px")
            .on('mouseover',cfg.events.axis.mouseover)
            .on('mouseleave',cfg.events.axis.mouseleave);

        //Append the labels at each axis
        if (cfg.showText) {
            axis_n.append("text")
                .attr("class", "legend")
                .style("font-size", "12px")
                .attr("font-family", "sans-serif")
                .attr("text-anchor", "middle")
                .attr("dy", "0.35em")
                .attr("x", 0)
                .merge(axis_o.select('.legend'))
                // .classed('flip_h',(d,i)=>(d.angle>Math.PI*3/4)&&(d.angle<5*Math.PI/4))
                .attr("y", function (d, i) {
                    return -rScale(maxValue * cfg.labelFactor);
                })
                .text(function (d) {
                    return d.text;
                })
                .call(wrap, cfg.wrapWidth);
        }
    }
    /////////////////////////////////////////////////////////
    ///////////// Draw the radar chart blobs ////////////////
    /////////////////////////////////////////////////////////

    if (cfg.bin) {
        var densityscale = cfg.scaleDensity;
        var scaleStroke = d3.scaleLinear()
            .domain([0,1])
            .range([0,5]);
        data.forEach(d=> d.forEach((v,i)=> {
            v.minval = d3.min(d.bin.val,e=>e[getindex(v)]);
            v.maxval = d3.max(d.bin.val,e=>e[getindex(v)]);}));
    }
    function getindex (v){
        return allAxis.findIndex(e=>e.text===v.axis);
    }
    //The radial line function
    let radarLine, radialAreaGenerator, radialAreaQuantile,keyLine='value';
        radarLine  = d3.radialLine()
        // .interpolate("linear-closed")
            .curve(d3.curveCatmullRom.alpha(this.smooth))
            .radius(function (d) {
                return rScale(d[keyLine] === undefined ? d : d[keyLine]);
            })
            .angle(function (d, i) {
                return getAngle(d, i);
            });

        radialAreaGenerator = d3.radialArea()
            .angle(function (d, i) {
                return getAngle(d, i);
            })
            .innerRadius(function (d, i) {
                return rScale(d.minval);
            })
            .outerRadius(function (d, i) {
                return rScale(d.maxval);
            });

        radialAreaQuantile = d3.radialArea()
            .angle(function (d, i) {
                return getAngle(d, i);
            })
            .innerRadius(function (d, i) {
                return rScale(d.q1);
            })
            .outerRadius(function (d, i) {
                return rScale(d.q3);
            });
        if(cfg.roundStrokes) {
            radarLine.curve(d3.curveCardinalClosed.tension(this.smooth));
            radialAreaGenerator.curve(d3.curveCardinalClosed.tension(this.smooth));
            radialAreaQuantile.curve(d3.curveCardinalClosed.tension(this.smooth));
        }

    //Create a wrapper for the blobs
    var blobWrapperg = g.selectAll(".radarWrapper")
        .data(data);
    blobWrapperg.exit().remove();
    var blobWrapper = blobWrapperg
        .enter().append("g")
        .attr("class", "radarWrapper");

    //function update
    function drawCluster(paths){
        return paths.style("stroke", (d, i) => cfg.color(i,d))
            .style("stroke-width", () => cfg.strokeWidth + "px")
            .style("fill-opacity", d => densityscale(d.bin.val.length))
            .style("fill", (d, i) =>cfg.color(i,d))
            .transition().duration(cfg.animationDuration).attr("d",radialAreaGenerator);
    }


    function drawOutlying(paths){
        return paths.attr("d", d => radarLine(d)).transition().duration(cfg.animationDuration)
            .style("stroke", (d, i) => 'black')
            .style("stroke-width", () => cfg.strokeWidth + "px")
            .style("stroke-opacity", undefined)
            //.style("fill-opacity", d => 1)
            .style("fill", 'none')
            .attr("d", d =>radarLine(d));
    }

    //update the outlines
    var blobWrapperpath = blobWrapperg.select(".radarStroke");
    if (cfg.bin) { // bin type
        blobWrapperpath.select('.radarLine').remove();
        blobWrapperpath.select('.radarQuantile').remove();
        blobWrapperpath.data().forEach(d => {
            d.forEach((v,i)=>{
                let temp = d.bin.val.map(ve=>ve[allAxis.findIndex(e=>e.text===v.axis)]);
                let mean = d3.mean(temp);
                let std = d3.deviation(temp)||0;
                v.minval =  mean - std/2;
                v.maxval =  mean + std/2;
            })
        });
        // area radar shape
        blobWrapperpath.filter(d=>d.type!=="outlying")
            .classed("outlying",false)
            .call(drawCluster);
        blobWrapperpath.filter(d=>d.type==="outlying")
            .classed("outlying",true)
            .call(drawOutlying);
        //Create the outlines
        blobWrapper.filter(d=>d.type!=="outlying")
            .append("path")
            .attr("class", "radarStroke")
            .call(drawCluster);
        blobWrapper.filter(d=>d.type==="outlying")
            .append("path")
            .attr("class", "radarStroke outlying")
            .call(drawOutlying);
    }else if (cfg.gradient && cfg.mini){
        function drawMeanLine(paths){
            return paths
                .attr("d", d =>radarLine(d))
                .styles({"fill":'none',
                    'stroke':'black'});
        }
        blobWrapperpath.select('.radarQuantile').remove();
        //update the outlines
        blobWrapperg.select('.radarLine').transition().duration(cfg.animationDuration).call(drawMeanLine);

        blobWrapperpath.style("fill", "none").transition().duration(cfg.animationDuration)
            .attr("d", d => radarLine(d))
            .style("stroke-width", () => cfg.strokeWidth + "px")
            .style("stroke", (d, i) => cfg.color(i,d));
        blobWrapperg.select('clipPath')
            .select('path')
            .transition('expand').ease(d3.easePolyInOut)
            .attr("d", d =>radarLine(d));
        //Create the outlines
        blobWrapper.append("clipPath")
            .attr("id",(d,i)=>"sum"+correctId (id))
            .append("path")
            .attr("d", d => radarLine(d));
        blobWrapper.append("rect")
            .style('fill', 'url(#rGradient2)')
            .attr("clip-path",( d,i)=>"url(#sum"+correctId (id)+")")
            .attr("x",-radius)
            .attr("y",-radius)
            .attr("width",(radius)*2)
            .attr("height",(radius)*2);
        blobWrapper.append("path")
            .attr("class", "radarStroke")
            .attr("d", d => radarLine(d))
            .style("fill", "none")
            .transition().duration(cfg.animationDuration)
            .style("stroke-width", () => cfg.strokeWidth + "px")
            //.style("stroke-opacity", d => cfg.bin ? densityscale(d.bin.val.length) : 0.5)
            .style("stroke", (d, i) => cfg.color(i,d));
        blobWrapper
            .append("path").classed('radarLine',true).style("fill", "none").call(drawMeanLine);
    }else if (cfg.gradient){
        function drawMeanLine(paths){
            return paths
                .attr("d", d =>radarLine(d))
                .styles({"fill":'none',
                    'stroke':'black',
                    'stroke-width':0.5,
                    'stroke-dasharray': '1 2'});
        }
        function drawQuantileArea(paths){
            return paths
                .attr("d", d =>radialAreaQuantile(d))
                .styles({"fill":'none',
                    'stroke':'black',
                    'stroke-width':0.2});
        }
        //update the outlines
        blobWrapperg.select('.radarLine').transition().duration(cfg.animationDuration).call(drawMeanLine);
        blobWrapperg.select('.radarQuantile').transition().duration(cfg.animationDuration).call(drawQuantileArea);
        blobWrapperpath.style("fill", "none").transition().duration(cfg.animationDuration)
            .attr("d", d => radialAreaGenerator(d))
            .style("stroke-width", () => cfg.strokeWidth + "px")
            .style("stroke", (d, i) => cfg.color(i,d));
        blobWrapperg.select('clipPath')
            .select('path')
            .transition('expand').ease(d3.easePolyInOut)
            .attr("d", d =>radialAreaGenerator(d));
        //Create the outlines
        blobWrapper.append("clipPath")
            .attr("id",(d,i)=>"sum"+correctId (id))
            .append("path")
            .attr("d", d => radialAreaGenerator(d));
        blobWrapper.append("rect")
            .style('fill', 'url(#rGradient2)')
            .attr("clip-path",( d,i)=>"url(#sum"+correctId (id)+")")
            .attr("x",-radius)
            .attr("y",-radius)
            .attr("width",(radius)*2)
            .attr("height",(radius)*2);
        blobWrapper.append("path")
            .attr("class", "radarStroke")
            .attr("d", d => radialAreaGenerator(d))
            .style("fill", "none")
            .transition().duration(cfg.animationDuration)
            .style("stroke-width", () => cfg.strokeWidth + "px")
            //.style("stroke-opacity", d => cfg.bin ? densityscale(d.bin.val.length) : 0.5)
            .style("stroke", (d, i) => cfg.color(i,d));
        blobWrapper
            .append("path").classed('radarLine',true).style("fill", "none").call(drawMeanLine);

        blobWrapper
            .append("path").classed('radarQuantile',true).style("fill", "none").call(drawQuantileArea);
    }else if(cfg.boxplot){
        keyLine = data[0][0].mean===undefined?'value':'mean';
        let quantile_exist = data[0][0].q1!==undefined;
        function drawMeanLine(paths){
            return paths
                .attr("d", d =>radarLine(d))
                .styles({"fill":'none',
                    'stroke':'black',
                    'stroke-width':0.5,
                    'stroke-dasharray': '1 2'});
        }
        function drawQuantileArea(paths){
            return paths
                .attr("d", d =>radialAreaQuantile(d))
                .styles({"fill":(d,i)=>cfg.fillin?cfg.color(i,d):"none",
                    'stroke':'black',
                    'stroke-width':0.2});
        }
        function drawMinMaxArea(paths){
            return paths
                .attr("d", d =>radialAreaGenerator(d))
                .styles({
                    'stroke':(d, i) => cfg.color(i,d),
                    'stroke-width':() => cfg.strokeWidth + "px"});
        }
        //update the outlines
        blobWrapperg.select('.radarLine').transition().duration(cfg.animationDuration).call(drawMeanLine);
        if(quantile_exist) {
            blobWrapperg.select('.radarQuantile').transition().duration(cfg.animationDuration).call(drawQuantileArea);
            blobWrapperpath.style("fill", "none").transition().duration(cfg.animationDuration).call(drawMinMaxArea);
            blobWrapper.append("path")
                .attr("class", "radarStroke")
                .style("fill", "none")
                .call(drawMinMaxArea);
        }else{
            blobWrapperpath
                .style("fill", (d,i)=>cfg.fillin?cfg.color(i,d):"none")
                .style("fill-opacity", cfg.fillin)
                .transition().duration(cfg.animationDuration).call(drawMinMaxArea);
            blobWrapper.append("path")
                .attr("class", "radarStroke")
                .style("fill", (d,i)=>cfg.fillin?cfg.color(i,d):"none")
                .style("fill-opacity", cfg.fillin)
                .call(drawMinMaxArea);
        }
        if (blobWrapperg.each(function(){
            if (d3.select(this).select('.radarLine').empty())
                d3.select(this).append("path").classed('radarLine',true).style("fill", "none").call(drawMeanLine);
        }))
        blobWrapper
            .append("path").classed('radarLine',true).style("fill", "none").call(drawMeanLine);

        if(quantile_exist)
            blobWrapper.append("path").classed('radarQuantile',true).style("fill", "none").call(drawQuantileArea);
    }
    else {
        g.selectAll(".radarWrapper").selectAll('.radarLine').remove();
        g.selectAll(".radarWrapper").selectAll('.radarQuantile').remove();
        blobWrapperpath.transition().duration(cfg.animationDuration).attr("d", d => radarLine(d))
            .style("fill-opacity", (d,i)=>cfg.fillin?cfg.fillin:null)
            .style("fill", (d,i)=>cfg.fillin?cfg.color(i,d):"none")
            .style("stroke-width", () => cfg.strokeWidth + "px")
            .style("stroke-opacity", d => cfg.bin ? densityscale(d.bin.val.length) : 0.5)
            .style("stroke", (d, i) => cfg.color(i,d));
        //Create the outlines
        blobWrapper.append("path")
            .attr("class", "radarStroke")
            .attr("d", d => radarLine(d))
            .style("stroke-width", () => cfg.strokeWidth + "px")
            .style("stroke-opacity", d => cfg.bin ? densityscale(d.bin.val.length) : 0.5)
            .style("stroke", (d, i) => cfg.color(i,d))
            .style("fill-opacity", (d,i)=>cfg.fillin?cfg.fillin:null)
            .style("fill", (d,i)=>cfg.fillin?cfg.color(i,d):"none");
    }
        //.style("filter" , "url(#glow2)");
    blobWrapperpath = g.selectAll(".radarWrapper").selectAll(".radarStroke");
    if (cfg.bin) {
        var listhost = [];
        data.forEach(d=>{
           d.bin.name.forEach(n=>{listhost.push(n)});
        });
        blobWrapperpath.on("mouseenter",mouseenterfunctionbold );
    }

    function mouseenterfunctionbold (d, i) {
        var state = state||false;
        //console.dir(d3.selectAll(document.elementsFromPoint(d3.event.x, d3.event.y)).filter("path"));
        //console.log(d3.event);
        // let overlapElements = d3.selectAll(document.elementsFromPoint(d3.event.x, d3.event.y)).filter("path");
        if (!d3.select(d3.select(this).node().parentNode).attr("cloned")) {
            // playchange();
            var allbold = d3.select(".summaryGroup").selectAll(".radarWrapper").filter(a => a !== undefined);
            allbold.style("opacity", 0);
            allbold.selectAll(".radarStroke").style('pointer-events','none');
            // link to other blod
            var binlist = d.bin.name;
            filterhost = _.intersection(filterhost,d.bin.name);
            var matchbold = allbold.filter(a => {
                if (a !== undefined) {
                    // var keys = false;
                    // a.bin.name.forEach(e => {
                    //     keys = keys || (binlist.find(f => f === e) !== undefined)
                    // });
                    // return keys;
                    return _.intersection(a.bin.name,filterhost).length;
                } else
                    return false;
            }).nodes();
            matchbold.forEach(t => {

                let clonedNode = t;//.cloneNode(true);
                var fff = t.__data__.bin;
                var ff = fff.scaledval.filter((e, i) => (binlist.find(f => f === fff.name[i]) !== undefined));
                let path = d3.select(clonedNode).attrs({
                    cloned: true,
                }).style("opacity", 1)
                    .selectAll(".radarStroke").style('pointer-events','auto');
                path
                    .style("cursor", "pointer")
                    //.on("mouseenter", null)
                    .on("mouseleave ", function () {
                        clearclone();
                    })
                    .on("click", () => {
                        state = !state;
                        console.log(state);
                        document.querySelectorAll("g[cloned='true']").forEach(node => {
                            var nodes = d3.select(node).selectAll(".radarStroke");
                            if (state)
                                nodes.on("mouseleave ", null);
                            else
                                nodes.on("mouseleave ", function () {
                                    clearclone();
                                });
                        });
                    });
                //t.parentNode.appendChild(clonedNode);
            });
            let hiddenClass =  _.difference(hosts.map(d=>d.name),filterhost ).map(d=>fixName2Class(d)).join(', .');
            if (hiddenClass!=='')
                d3.selectAll("." + _.difference(hosts.map(d=>d.name),filterhost ).map(d=>fixName2Class(d)).join(', .'))
                    .classed("displayNone", true);
            // hosts.forEach(l => {
            //         d3.selectAll("." + l.name)
            //             .classed("displayNone", true);
            //             // .style("visibility", 'hidden');
            // });
            let showClass = filterhost.map(d=>fixName2Class(d)).join(', .');
            if (showClass!=='')
                d3.selectAll("." + filterhost.map(d=>fixName2Class(d)).join(', .'))
                    .classed("displayNone", false);
                // .style("visibility", 'hidden');

            // hosts.forEach(l => {
            //     if (d.bin.name.filter(e => e === l.name).length === 0)
            //         d3.selectAll("." + l.name)
            //             .style("visibility", 'hidden');
            // });
        }
    }
    //Update the circles
    blobWrapper = g.selectAll(".radarWrapper");
    //Append the circles
    if (!cfg.bin&&!cfg.gradient&&!cfg.mini&&cfg.showHelperPoint) {
        var circleWrapper = blobWrapper.selectAll(".radarCircle")
            .data(function (d, i) {
                d.forEach(function (d2) {
                    d2.index = i;
                });
                return d;
            })
            .attr("r", function (d) {
                if (cfg.radiuschange)
                    return 1 + Math.pow((d.index + 2), 0.3);
                return cfg.dotRadius;
            })
            .attr("cx", function (d, i) {
                return rScale(d.value) * Math.cos(getAngle(d,i) - Math.PI / 2);
            })
            .attr("cy", function (d, i) {
                return rScale(d.value) * Math.sin(getAngle(d,i) - Math.PI / 2);
            })
            // .style("fill", function(d,i,j) {  return cfg.color(d.index); })
            .style("fill", function (d) {
                return colorTemperature(d.value);
            })
            .style("fill-opacity", 0.5)
            .style("stroke", "#000")
            .style("stroke-width", 0.2)
            .style("visibility", (d, i) => (cfg.bin) ? "hidden" : "visible");
        circleWrapper.exit().remove();
        circleWrapper
            .enter().append("circle")
            .attr("class", "radarCircle")
            .attr("r", function (d) {
                if (cfg.radiuschange)
                    return 1 + Math.pow((d.index + 2), 0.3);
                return cfg.dotRadius;
            })
            .attr("cx", function (d, i) {
                return rScale(d.value) * Math.cos(getAngle(d,i) - Math.PI / 2);
            })
            .attr("cy", function (d, i) {
                return rScale(d.value) * Math.sin(getAngle(d,i) - Math.PI / 2);
            })
            // .style("fill", function(d,i,j) {  return cfg.color(d.index); })
            .style("fill", function (d) {
                return colorTemperature(d.value);
            })
            .style("fill-opacity", 0.5)
            .style("stroke", "#000")
            .style("stroke-width", 0.2)
            .style("visibility", (d, i) => (cfg.bin) ? "hidden" : "visible");

    }

    //Append the backgrounds
    // blobWrapper
    //     .append("path")
    //     .attr("class", "radarArea")
    //     .attr("d", function(d,i) { return radarLine(d); })
    //     .style("fill", function(d,i) { return cfg.color(i,d); })
    //     .style("fill-opacity", 0.05)
    //     .on('mouseover', function (d,i){
    //         //Dim all blobs
    //         d3.selectAll(".radarArea")
    //             .transition().duration(cfg.animationDuration).duration(200)
    //             .style("fill-opacity", 0.0);
    //         //Bring back the hovered over blob
    //         d3.select(this)
    //             .transition().duration(cfg.animationDuration).duration(200)
    //             .style("fill-opacity", 0.3);
    //     })
    //     .on('mouseout', function(){
    //         //Bring back all blobs
    //         d3.selectAll(".radarArea")
    //             .transition().duration(cfg.animationDuration).duration(200)
    //             .style("fill-opacity",  0.05);
    //     });

    /////////////////////////////////////////////////////////
    //////// Append invisible circles for tooltip ///////////
    /////////////////////////////////////////////////////////
    
    //Wrapper for the invisible circles on top
    if (!cfg.bin&&!cfg.gradient&&!cfg.mini&&cfg.showHelperPoint) {
        var blobCircleWrapperg = g.selectAll(".radarCircleWrapper")
            .data(data);
        blobCircleWrapperg.exit().remove();
        blobCircleWrapperg.enter().append("g")
            .attr("class", "radarCircleWrapper");
        var blobCircleWrapper = g.selectAll(".radarCircleWrapper");
        //Append a set of invisible circles on top for the mouseover pop-up
        var blobCircleWrappergg = blobCircleWrapper.selectAll(".radarInvisibleCircle")
            .data(function (d, i) {
                return d;
            })
            .attr("r", cfg.dotRadius * 1.5)
            .attr("cx", function (d, i) {
                return rScale(d.value) * Math.cos(getAngle(d,i) - Math.PI / 2);
            })
            .attr("cy", function (d, i) {
                return rScale(d.value) * Math.sin(getAngle(d,i) - Math.PI / 2);
            })
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseenter", function (d, i) {
                newX = parseFloat(d3.select(this).attr('cx')) - 10;
                newY = parseFloat(d3.select(this).attr('cy')) - 10;

                tooltip
                    .attr('x', newX)
                    .attr('y', newY)
                    .text(Format(d.value))
                    .transition().duration(cfg.animationDuration).duration(200)
                    .style('opacity', 1);
            })
            .on("mouseleave", function () {
                tooltip.transition().duration(cfg.animationDuration).duration(200)
                    .style("opacity", 0);
            });
        blobCircleWrappergg.exit().remove();
        blobCircleWrappergg
            .enter().append("circle")
            .attr("class", "radarInvisibleCircle")
            .attr("r", cfg.dotRadius * 1.5)
            .attr("cx", function (d, i) {
                return rScale(d.value) * Math.cos(getAngle(d,i) - Math.PI / 2);
            })
            .attr("cy", function (d, i) {
                return rScale(d.value) * Math.sin(getAngle(d,i) - Math.PI / 2);
            })
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseenter", function (d, i) {
                newX = parseFloat(d3.select(this).attr('cx')) - 10;
                newY = parseFloat(d3.select(this).attr('cy')) - 10;

                tooltip
                    .attr('x', newX)
                    .attr('y', newY)
                    .text(Format(d.value))
                    .transition().duration(cfg.animationDuration).duration(200)
                    .style('opacity', 1);
            })
            .on("mouseleave", function () {
                tooltip.transition().duration(cfg.animationDuration).duration(200)
                    .style("opacity", 0);
            });
    }
    //Set up the small tooltip for when you hover over a circle
    var tooltip = g.selectAll(".tooltip");
    if (first) {
        tooltip = g.append("text")
            .attr("class", "tooltip")
            .style("opacity", 0);
    }
    function getAngle(d,i){
        return (allAxis.find(a=>a.text===d.axis)||allAxis[i]).angle;
    }
    function getAngleStart(d,i){
        return (allAxis.find(a=>a.text===d.axis)||allAxis[i]).angle - deltaAng;
    }
    function getAngleEnd(d,i){
        return (allAxis.find(a=>a.text===d.axis)||allAxis[i]).angle + deltaAng;
    }
    /////////////////////////////////////////////////////////
    /////////////////// Helper Function /////////////////////
    /////////////////////////////////////////////////////////

    //Taken from http://bl.ocks.org/mbostock/7555321
    //Wraps SVG text    
    function wrap(text, width) {
      text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
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
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
          }
        }
      });
    }//wrap
    //Text indicating at what % each level is
    if (!cfg.mini&&cfg.showText) {
        var axisLabel = axisGrid.selectAll(".axisLabel")
            .data(d3.range(1, (cfg.levels)).reverse())
            .attr("x", 4)
            .attr("y", function (d) {
                return -d * radius / cfg.levels;
            })
            .attr("dy", "0.4em")
            .attr("font-family", "sans-serif")
            .style("font-size", "12px")
            .attr("fill", "#111")
            .text(function (d, i) {
                var v = (maxValue - minValue) * d / cfg.levels + minValue;
                if (cfg.markedLegend) {
                    v = scaleMarkedLegend(v);
                }
                return Math.round(v);
            });
        axisLabel.exit().remove();
        axisLabel.enter().append("text")
            .attr("class", "axisLabel")
            .attr("x", 4)
            .attr("y", function (d) {
                return -d * radius / cfg.levels;
            })
            .attr("dy", "0.4em")
            .attr("font-family", "sans-serif")
            .style("font-size", "12px")
            .attr("fill", "#111")
            .text(function (d, i) {
                var v = (maxValue - minValue) * d / cfg.levels + minValue;
                if (cfg.markedLegend) {
                    v = scaleMarkedLegend(v);
                }
                return Math.round(v);
            });
        var legendg = cfg.legend.map(function (d, i) {
            return Object.keys(d).map(function (k) {
                return {key: k, value: d[k], index: i}
            })
        }).filter(d => d.length = 0);

        var subaxisg = axisGrid.selectAll(".axisLabelsub")
            .data(legendg);
        subaxisg.exit().remove();

        subaxisg.enter().append('g').attr('class', 'axisLabelsub');
        var subaxis = axisGrid.selectAll(".axisLabelsub");
        subaxis.selectAll('.axisLabelsubt')
            .data(d => d)
            .enter().append("text")
            .attr("class", "axisLabelsubt")
            .attr("x", function (d, i) {
                return d.key * radius / cfg.levels * Math.cos(angleSlice[d.index] - Math.PI / 2);
            })
            .attr("y", function (d, i) {
                return d.key * radius / cfg.levels * Math.sin(angleSlice[d.index] - Math.PI / 2);
            })
            // .attr("x", d => {4+d.key*radius/cfg.levels})
            // .attr("y", function(d){return -d.key*radius/cfg.levels;})
            .attr("dy", "0.4em")
            .attr("font-family", "sans-serif")
            .style("font-size", "12px")
            .attr("fill", "#111")
            .text(function (d) {
                return d.value;
            });
    }
    // return {radarLine: radarLine,
    //     rScale: rScale,
    //     colorTemperature: colorTemperature};
    return svg;
    
}//RadarChart
