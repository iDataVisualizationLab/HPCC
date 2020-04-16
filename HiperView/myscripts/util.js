var w = 380,
    h = 72;
var firstTime =true;


// time format
Date.prototype.timeNow = function () {return d3.timeFormat("%H:%M %p")(this)};
Date.prototype.timeNow2 = function () {return d3.timeFormat("%H:%M:%S %p")(this)};

var svgLengend = d3.select('.legendHolder').append('svg')
    .attr("class", "legendView")
    .attr("width", w)
    .attr("height", h);

var x = d3.scaleLinear()
    .domain([0, 50])
    .range([0, 180])
    .clamp(true);

var slider = svgLengend.append("g")
    .attr("class", "slider")
    .attr("transform", "translate(" + 116 + "," + 53+ ")");

slider.append("line")
    .attr("class", "track")
    .attr("x1", x.range()[0])
    .attr("x2", x.range()[1])
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-inset")
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-overlay")
    .call(d3.drag()
        .on("start.interrupt", function() { slider.interrupt(); })
        .on("start drag", function() { hue(x.invert(d3.event.x)); }));

slider.insert("g", ".track-overlay")
    .attr("class", "ticks")
    .attr("transform", "translate(0," + 18 + ")")
    .selectAll("text")
    .data(x.ticks(5))
    .enter().append("text")
    .attr("x", x)
    .attr("text-anchor", "middle")
    .text(function(d) { return d + "°"; });

var handle = slider.insert("circle", ".track-overlay")
    .attr("class", "handle")
    .attr("r", 5)
    .attr("cx",100);

slider.transition() // Gratuitous intro!
    .duration(750)
    .tween("hue", function() {
        var i = d3.interpolate(0, 70);
        return function(t) { hue(i(t)); };
    });



/// When we move slider *****************************************************************
function hue(hhh) {
    var xx = x(hhh);
    if (xx < 0)
        xx = 0;
    if (firstTime)
        handle.attr("cx", 0);
    else
        handle.attr("cx", xx);

    if (firstTime==false){
        for (var name in hostResults) {
            var r = hostResults[name];
            // Process the array of historical temperatures
            if (r.arr){
                var maxIncrease = 0;
                var preTemp1 = 0;
                var preTemp2 = 0;
                for (var i = 0; i < r.arr.length; i++) {
                    // var a = processData(r.arr[i].data.service.plugin_output,selectedService);
                    var a = r.arr[i];
                    var temp1 = a[0];
                    var temp2 = a[1];
                    if (i>=1){
                        var dif1 = Math.abs(temp1-preTemp1);
                        var dif2 = Math.abs(temp2-preTemp2);
                        var max = Math.max(dif1,dif2);
                        if (max>maxIncrease)
                            maxIncrease=max;
                    }
                    preTemp1 = temp1;
                    preTemp2 = temp2;
                }
                var sliderValue = xx/3;  // based on the range above
                if (maxIncrease>sliderValue){
                    //console.log(name+" "+maxIncrease +" "+xx/3);
                }
                else{
                    svg.selectAll('.'+fixName2Class(name)).attr("fill-opacity",0);
                }
            }
        }
    }
}


/// drawLegend *****************************************************************
function drawLegend(s,arrThresholds, arrColor, dif){
    var x =100;
    var y = 30;
    var r = 15;
    var barW= 5;
    if (selectedService==="Memory_usage" || selectedService==="Job_load")
        barW =8;
    var xScale = d3.scaleLinear()
        .domain([arrThresholds[0], arrThresholds[arrThresholds.length-1]]) // input
        .range([x, x+200]); // output
    var arr2 = [];
    var xStep = dif/10.;
    for (var i=arrThresholds[0]; i<arrThresholds[arrThresholds.length-1];i=i+xStep){
        arr2.push(i);
    }
    svgLengend.selectAll(".legendRect").remove();
    svgLengend.selectAll(".legendRect")
        .data(arr2)
        .enter().append("rect")
        .attr("class", "legendRect")
        .attr("x", function (d,i) {
            return xScale(d);
        })
        .attr("y", y)
        .attr("width", barW)
        .attr("height", r)
        .attr("fill",function (d,i) {
            return color(d);
        })
        .attr("fill-opacity",function (d,i) {
            return opa(d);
        })
        .attr("stroke-width", 0);
    svgLengend.selectAll(".legendText").remove();
    svgLengend.selectAll(".legendText")
        .data(arrThresholds)
        .enter().append("text")
        .attr("class", "legendText")
        .attr("x", function (d,i) {
            return xScale(d);
        })
        .attr("y", y-2)
        .attr("fill", "#000")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .attr("font-family", "sans-serif")
        .text(function (d,i) {
            if (selectedService===serviceList[2] && (i==0 || i==2 || i==4 || i==6))  // memory
                return "";
            else if (selectedService===serviceList[3] && i==0)  // Fan speed
                return "";
            else
                return Math.round(d);
        });

    svgLengend.selectAll(".legendText2").remove();
    svgLengend.selectAll(".legendText2")
        .data(arrThresholds)
        .enter().append("text")
        .attr("class", "legendText")
        .attr("x", function (d,i) {
            return xScale(d);
        })
        .attr("y", y-15)
        .attr("fill",function (d,i) {
            return color(d);
        })
        .style("text-anchor", "middle")
        //.style("font-weight","bold")
        .style("font-size", "12px")
        .attr("font-family", "sans-serif")
        .text(function (d,i) {
            if (i==1 || i==5){
                if (selectedService==serviceList[1] && (i==1 || i==5))   // No lower & upper bound for CPU load
                    return "";
                else if (selectedService==serviceList[2] && i==1)   // No lower bound for Memory usage
                    return "";
                else
                    return "Critical";
            }
            else if (i==3)
                return "OK";
            else
                return "";
        });

    svgLengend.selectAll(".legendText1").remove();
    svgLengend.append("text")
        .attr("class", "legendText1")
        .attr("x", x-7)
        .attr("y", y+12.5)
        .style("text-anchor", "end")
        .attr("fill", "#000")
        .style("font-style","italic")
        .style("font-size", "12px")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        //.text("Temperature (°F)");
        .text(s+"");
    svgLengend.append("text")
        .attr("class", "legendText22")
        .attr("x", x-5)
        .attr("y", y+39)
        .style("text-anchor", "end")
        .attr("fill", "#000")
        .style("font-style","italic")
        .style("font-size", "12px")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text("Sudden change: ");
}

function isContainRack(array, id) {
    var foundIndex = -1;
    for(var i = 0; i < array.length; i++) {
        if (array[i].id == id) {
            foundIndex = i;
            break;
        }
    }
    return foundIndex;
}


function dragstarted(d) {
    if (!d3.event.active) sulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

function areaChart(){
    // Do nothing
}

function saveResults(){
    var filename = "service"+d3.timeFormat("%a%d%b_%H%M")(new Date());
    var type = "json";

    var clone_hostResults = JSON.parse( JSON.stringify(hostResults));
    var jobarr = {};
    var validJobInfo = false;
    hosts.forEach(h=>{
        if (clone_hostResults[h.name].arrJob_scheduling&&clone_hostResults[h.name].arrJob_scheduling.length) {
            jobarr[h.name] = clone_hostResults[h.name].arrJob_scheduling;
            jobarr[h.name].reduce((o, n) => validJobInfo = validJobInfo || n[0] != undefined);
            delete clone_hostResults[h.name].arrJob_scheduling;
        }
        delete clone_hostResults[h.name].arr;
    });

    clone_hostResults['timespan'] = clone_hostResults['timespan'].map(d=>new Date(d).toISOString())

    var str = JSON.stringify(clone_hostResults);


    var file = new Blob([str], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename+'.'+type);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename+'.'+type;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
    if (validJobInfo){
        var str = JSON.stringify(jobarr);


        var file = new Blob([str], {type: type});
        if (window.navigator.msSaveOrOpenBlob) // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename+'_job'+'.'+type);
        else { // Others
            var a = document.createElement("a"),
                url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename+'_job'+'.'+type;
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        }
    }
}

d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};

d3.selection.prototype.moveToBack = function() {
    this.each(function() {
        this.parentNode.firstChild
        && this.parentNode.insertBefore(this, firstChild);
    });
};
function getTransformation(transform) {
    // Create a dummy g for calculation purposes only. This will never
    // be appended to the DOM and will be discarded once this function
    // returns.
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Set the transform attribute to the provided string value.
    g.setAttributeNS(null, "transform", transform);

    // consolidate the SVGTransformList containing all transformations
    // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
    // its SVGMatrix.
    var matrix = g.transform.baseVal.consolidate().matrix;

    // Below calculations are taken and adapted from the private function
    // transform/decompose.js of D3's module d3-interpolate.
    var {a, b, c, d, e, f} = matrix;   // ES6, if this doesn't work, use below assignment
    // var a=matrix.a, b=matrix.b, c=matrix.c, d=matrix.d, e=matrix.e, f=matrix.f; // ES5
    var scaleX, scaleY, skewX;
    if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
    if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
    if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
    if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
    return {
        translateX: e,
        translateY: f,
        rotate: Math.atan2(b, a) * 180 / Math.PI,
        skewX: Math.atan(skewX) * 180 / Math.PI,
        scaleX: scaleX,
        scaleY: scaleY
    };
}

$.fn.exchangePositionWith = function(selector) {
    var other = $(selector);
    this.after(other.clone());
    other.after(this).remove();
};


// Below are the functions that handle actual exporting:
// getSVGString ( svgNode ) and svgString2Image( svgString, width, height, format, callback )
const xmlns = "http://www.w3.org/2000/xmlns/";
const xlinkns = "http://www.w3.org/1999/xlink";
const svgns = "http://www.w3.org/2000/svg";
function serialize(svg,isLight) {

    svg = svg.cloneNode(true);
    if (isLight) {
        d3.select(svg).selectAll('.axis').remove();
        d3.select(svg).selectAll('.axisLabel').remove();
        d3.select(svg).selectAll('.radarCircle').remove();
        d3.select(svg).selectAll('.gridCircle').filter((d,i)=>i!=1).remove();
        d3.select(svg).select('.axisWrapper').append('circle').attr('r',2).style('fill','black'); // ad center
    }
    const fragment = window.location.href + "#";
    const walker = document.createTreeWalker(svg, NodeFilter.SHOW_ELEMENT, null, false);
    while (walker.nextNode()) {
        for (const attr of walker.currentNode.attributes) {
            if (attr.value.includes(fragment)) {
                attr.value = attr.value.replace(fragment, "#");
            }
        }
    }
    svg.setAttributeNS(xmlns, "xmlns", svgns);
    svg.setAttributeNS(xmlns, "xmlns:xlink", xlinkns);
    const serializer = new window.XMLSerializer;
    const string = serializer.serializeToString(svg);
    return new Blob([string], {type: "image/svg+xml"});
}

function rasterize(svg,isLight) {
    let resolve, reject;
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");

    const promise = new Promise((y, n) => (resolve = y, reject = n));
    const image = new Image;
    image.onerror = reject;
    image.onload = () => {
        const rect = svg.getBoundingClientRect();
        canvas.width = rect.width||d3.select(svg).attr('width');
        canvas.height = rect.height||d3.select(svg).attr('height');
        context.clearRect ( 0, 0, canvas.width, canvas.height );
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve);
    };
    image.src = URL.createObjectURL(serialize(svg,isLight));
    return promise;
}
function creatContain(contain,colorScaleList,colorArr,callback){
    const  n = colorScaleList.n;
    const ul = contain.append('ul').style('width','100%');
    const colorListitems = ul.selectAll('li').data(colorArr)
        .enter().append('li')
        .attr('class','colorScale div row s12 valign-wrapper');
    colorListitems.append('div')
        .attr('class','col s4 colorscale-label')
        // .attr('class','colorscale-label')
        .text(d=>d.label)
    const colorpalette = colorListitems.append('div')
        .attr('class','col s7 colorscale-palette-container')
        // .attr('class','colorscale-palette-container')
        .append('div')
        .attr('class','colorscale-block')
        .on('click',callback)
        .call(createColorbox);

}
function createColorbox(g) {

    const boxs = g.selectAll('div.colorscale-swatch').data(function(d)
    {
        const name = d.val;
        let colors;
        if (d.type==='d3') {
            colors = colorScaleList.d3colorChosefunc(name)
        }else{
            colors = colorScaleList.customFunc(name);
        }

        if (d.invert)
            colors = colors.reverse();
        (this.parentNode.__data__||this.__data__).arrColor = colors;

        let colors_display;
        if (d.type==='d3') {
            colors_display = colorScaleList.d3colorChosefunc(name,50)
        }else{
            colors_display = colorScaleList.customFunc(name,undefined,50);
        }

        if (d.invert)
            colors_display = colors_display.reverse();

        return colors_display;
    });
    boxs.exit().remove();
    boxs.enter().append('div')
        .attr('class','colorscale-swatch')
        .merge(boxs)
        .styles(function (d,i){
            const n = 50;
            return {
                'background-color': d,
                'width': `${(1/n)*100}%`
            }})
}
function createGradient(rg,limitcolor,arrColor,opacitycallback) {
    const legntharrColor = arrColor.length - 1;
    opacitycallback = opacitycallback||((i)=>i / legntharrColor);
    rg.selectAll('stop').remove();
    rg.append("stop")
        .attr("offset", "0%")
        .attr("stop-opacity", limitcolor?0:opacitycallback(0));
    rg.append("stop")
        .attr("offset", (limitcolor - 1) / legntharrColor * 100 + "%")
        .attr("stop-color", arrColor[limitcolor])
        .attr("stop-opacity", limitcolor?0:opacitycallback(0));
    arrColor.forEach((d, i) => {
        if (i > (limitcolor - 1)) {
            rg.append("stop")
                .attr("offset", i / legntharrColor * 100 + "%")
                .attr("stop-color", d)
                .attr("stop-opacity", opacitycallback(i));
            if (i != legntharrColor)
                rg.append("stop")
                    .attr("offset", (i + 1) / legntharrColor * 100 + "%")
                    .attr("stop-color", arrColor[i + 1])
                    .attr("stop-opacity", opacitycallback(i));
        }
    });
}

function createLinearGradient(direction,rg,limitcolor,arrColor,opacitycallback) {
    if (direction=='v')
        rg.attr('x1', '0%')
            .attr('y1', '100%')
            .attr('x2', '0%')
            .attr('y2', '0%')
    const legntharrColor = arrColor.length - 1;
    opacitycallback = opacitycallback||((i)=>i / legntharrColor);
    rg.selectAll('stop').remove();
    rg.append("stop")
        .attr("offset", "0%")
        .attr("stop-opacity", limitcolor?0:opacitycallback(0));
    arrColor.forEach((d, i) => {
        if (i > (limitcolor - 1)) {
            rg.append("stop")
                .attr("offset", i / legntharrColor * 100 + "%")
                .attr("stop-color", d)
                .attr("stop-opacity", opacitycallback(i));
        }
    });
}
function UpdateGradient(svg) { // using global arrcolor
    let rdef = svg.select('defs.gradient');
    let rg,rg2,lg;
    if (rdef.empty()){
        rdef = svg.append("defs").attr('class','gradient');
        rg = rdef
            .append("radialGradient")
            .attr("id", "rGradient");
        rg2 = rdef.append("radialGradient")
            .attr("id", "rGradient2");
        lg = rdef.append("linearGradient")
            .attr("id", "lradient");
    }
    else {
        rg = rdef.select('#rGradient');
        rg2 = rdef.select('#rGradient2');
        lg = rdef.select('#lradient');
    }
    let opacityGradient =undefined
    // const rangeop = d3.range(0,arrColor.length);
    // const opas = d3.scaleLinear().domain([1,arrColor.length/2-1]).range([1,0.5]);
    // let opacityGradient = d3.scaleLinear().domain(rangeop).range(rangeop.map(d=>opas(d>(arrColor.length/2-1)?(arrColor.length-1-d):d)));
    createGradient(rg,4,arrColor,opacityGradient);
    createGradient(rg2,0,arrColor,opacityGradient);
    createLinearGradient('v',lg,0,arrColor,opacityGradient);

}
function fixName2Class(s) {
    return 'h'+s.replace(/ |#|\./gi,''); //avoid . and number format
}
function positiveAngle(angle){
    return angle>0? angle: (angle+Math.PI*2);
}
function downloadProfile(event){
    $('#savename_profile').val("profile"+d3.timeFormat("%a%d%b_%H%M")(new Date()));
}
function onSaveProfile (){
    var filename = $('#savename_profile').val()+".json";
    var type = "json";
    var str = JSON.stringify(conf);
    var file = new Blob([str], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}
function uploadProfile(){
    $('#profile_input_file').trigger( "click" );
    $('#profile_input_file').on('change', (evt) => {
        var f = evt.target.files[0];
        var reader = new FileReader();
        reader.onload = (function(theFile) {
            return function(e) {
                // Render thumbnail.
                d3.json(e.target.result,function (error, data) {
                    if (error){
                    }else{
                        if (data.serviceLists[0].sub[0].angle ===undefined)
                            throw "wrong file";
                        conf = data;
                        variablesNames.forEach(d=>{ window[d] = conf[d]});
                        // relink object
                        serviceFullList = serviceLists2serviceFullList(serviceLists);
                        MetricController.axisSchema(serviceFullList).update();
                    }
                })
                // span.innerHTML = ['<img class="thumb" src="', e.target.result,
                //     '" title="', escape(theFile.name), '"/>'].join('');
                // document.getElementById('list').insertBefore(span, null);
            };
        })(f);

        // Read in the image file as a data URL.
        reader.readAsDataURL(f);
    })
}

// ui part
function openNav(e) {
    let target = "#mySidenav";
    let source = "#Maincontent";
    let customclass = "sideIn";
    if(e) {
        target = d3.select(e).attr('data-target') ||target;
        source = d3.select(e).attr('data-source') || source;
        customclass = d3.select(e).attr('data-class') ||customclass;
    }
    d3.select(target).classed(customclass,true).dispatch('change');
    d3.select(source).classed(customclass,true);
    // _.delay(resetSize, 500);
}

function closeNav(e) {
    let target = "#mySidenav";
    let source = "#Maincontent";
    let openbtn = "#sideNavbtn";
    let customclass = "sideIn";
    if(e) {
        target = d3.select(e).attr('data-target') ||target;
        source = d3.select(e).attr('data-source') || source;
        openbtn = d3.select(e).attr('data-link')|| openbtn;
        customclass = d3.select(e).attr('data-class') ||customclass;
    }
    d3.select(target).classed(customclass,false);
    d3.select(source).classed(customclass,false);
    discovery(openbtn);
    // _.delay(resetSize, 500);
}

function changeRadarColor(d) {
    profile.radarcolor = d.val;
    d3.select('#RadarColor')
        .select('.collapsible-header .colorscale-block').datum(d)
        .call(createColorbox);
    arrColor=d.arrColor;
    updateColorScale();
    UpdateGradient(svg);
}
let colorTemperature;
function updateColorScale(){
    let colorLength = arrColor.length-1;
    var dif = 1 / (TsnePlotopt.radaropt.levels-2);
    var right = 1 + dif;
    let arrThresholds = [-dif];
    for (var i=0;i<colorLength-1;i++)
        arrThresholds.push(i*dif);
    arrThresholds.push(right);
    colorTemperature = d3.scaleLinear()
        .domain(arrThresholds)
        .range(arrColor)
        .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb
}
function onClickRadarColor (d){
    changeRadarColor(d);
    if (jobMap)
        jobMap.color(colorTemperature);
    MetricController.updatecolor(arrColor);
    TSneplot.RadarColor(d);
}

function discovery(d){
    d3.select(d).classed('discovery',true)
        .classed("pulse",true)
        .transition().delay(5000)
        .on('end',function() {
            d3.select(d).classed("discovery",false).classed("pulse",false);
        });

}
function switchTheme(){
    if (this.getAttribute('value')==="light"){
        this.setAttribute('value', "dark");
        this.querySelector('span').textContent = "Light";
        d3.select('body').classed('light',false);
        d3.select('.logoLink').select('img').attr('src',"https://idatavisualizationlab.github.io/HPCC/HiperView/images/TTUlogoWhite.png");
        return;
    }
    this.setAttribute('value', "light");
    this.querySelector('span').textContent = "Dark";
    d3.select('body').classed('light',true);
    d3.select('.logoLink').select('img').attr('src',"https://idatavisualizationlab.github.io/HPCC/HPCViz/images/TTUlogo.png");
    return;
}
function addDatasetsOptions() {
    let select= d3.select("#datasetsSelect")
        .selectAll('li')
        .data(serviceList_selected);
    select.exit().remove();
    let nselect = select
        .enter()
        .append('li')
        .attr('class','collection-item avatar valign-wrapper');

    nselect.append('img')
        .attr('class',"circle");
    nselect.append('h6').attr('class','title');
    nselect.on("click",function(d){loadNewData(d.text)});

    select = nselect.merge(select).attr('value',d=>d.text);
    select.select('img').attr('src',d=>srcpath+"images/"+d.text+".png").on('error',function(d){handlemissingimage(this,d.text)});
    select.select('h6').text(d=>d.text);

    document.getElementById('datasetsSelect').value = serviceList.find(d=>d===initialService)||serviceList[0];  //************************************************
    loadNewData(document.getElementById('datasetsSelect').value,true)
    // selectedService = document.getElementById("datasetsSelect").value;
    const trig = d3.select("#datasetsSelectTrigger");
    trig.select('img').attr('src',srcpath+"images/"+selectedService+".png").on('error',function(){handlemissingimage(this,selectedService)});
    trig.select('span').text(selectedService);

    //loadData();
}
function handlemissingimage(node,selectedService){
    d3.select(node).on('error',null);
    const keys =Object.keys(basic_service).map(k=>extractWordsCollection(getTermsArrayCollection(k),selectedService,k)).filter(d=>Object.keys(d).length);

    if (keys.length)
        node.src = srcpath+"images/"+Object.keys(keys[0])[0]+".png";
    else
        node.src = srcpath+"images/TTUlogo.png";
    d3.select(node).attr('src',node.src)
    console.log(node.src)
}

let srcpath ='';

function concaveHull() {
    let calcDist = stdevDist
    let padding = 0
    let voronoi
    const dist = (a, b) => ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5

    function stdevDist(voronoi) {
        const sides = new Array(voronoi.length * 3)
        voronoi.forEach((d, i) => {
            sides[i * 3 + 0] = dist(d[0], d[1])
            sides[i * 3 + 1] = dist(d[0], d[2])
            sides[i * 3 + 2] = dist(d[1], d[2])
        })
        return d3.mean(sides) + d3.deviation(sides)
    }

    function concaveHull(vertices) {
        voronoi = d3.voronoi().triangles(vertices)
        const long = calcDist(voronoi)
        const mesh = voronoi.filter(d => dist(d[0], d[1]) < long && dist(d[0], d[2]) < long && dist(d[1], d[2]) < long)
        const counts = {}
        const edges = {}
        let r
        const result = []

        // Traverse the edges of all triangles and discard any edges that appear twice.
        mesh.forEach(triangle => {
            for (let i = 0; i < 3; i++) {
                const edge = [triangle[i], triangle[(i + 1) % 3]].sort(ascendingCoords).map(String);
                (edges[edge[0]] = (edges[edge[0]] || [])).push(edge[1]);
                (edges[edge[1]] = (edges[edge[1]] || [])).push(edge[0]);
                var k = edge.join(":")
                if (counts[k]) delete counts[k]
                else counts[k] = 1
            }
        })

        while (true) {
            let k = null
            // Pick an arbitrary starting point on a boundary.
            for (k in counts) break
            if (k === null) break
            result.push(r = k.split(":").map(d => d.split(",").map(Number)))
            delete counts[k]
            let q = r[1]
            while (q[0] !== r[0][0] || q[1] !== r[0][1]) {
                const p = q
                const qs = edges[p.join(",")]
                const n = qs.length
                for (let i = 0; i < n; i++) {
                    q = qs[i].split(",").map(Number)
                    const edge = [p, q].sort(ascendingCoords).join(":")
                    if(counts[edge]) {
                        delete counts[edge]
                        r.push(q)
                        break
                    }
                }
            }
        }

        return padding !== 0 ? pad(result, padding) : result
    }

    function pad(bounds, amount) {
        return bounds.map(bound => {
            // http://forums.esri.com/Thread.asp?c=2&f=1718&t=174277
            const handedness = bound.map((p, i) => {
                const pm = bound[i === 0 ? bound.length - 1 : i - 1]
                return (p[0] - pm[0]) * (p[1] + pm[1]) * 0.5
            }).reduce((a, b) => a + b) > 0 ? -1 : 1

            return bound.map((p, i) => {
                const normal = rotate(tan(p, bound[i === 0 ? bound.length - 2 : i - 1]), 90 * handedness)
                return [p[0] + normal.x * amount, p[1] + normal.y * amount]
            })
        })
    }

    function tan(a, b) {
        const vec = {x: b[0] - a[0], y: b[1] - a[1]}
        const mag = Math.sqrt(vec.x * vec.x + vec.y * vec.y)
        vec.x /= mag
        vec.y /= mag
        return vec
    }

    function rotate(vec, angle) {
        angle *= Math.PI / 180
        return {
            x: vec.x * Math.cos(angle) - vec.y * Math.sin(angle),
            y: vec.x * Math.sin(angle) + vec.y * Math.cos(angle)
        }
    }

    const ascendingCoords = (a, b) => a[0] === b[0] ? b[1] - a[1] : b[0] - a[0]

    concaveHull.padding = function (newPadding) {
        if (!arguments.length) return padding
        padding = newPadding
        return concaveHull
    }

    concaveHull.distance = function (newDist) {
        if (!arguments.length) return calcDist
        calcDist = typeof newDist === "number" ? () => newDist : newDist
        return concaveHull
    }

    return concaveHull
};
function truncate (text,endsymbol) {
    text.each(function() {
        var text = d3.select(this);
        var words = text.text().trim().split(/\s+/);
        var ellipsis = text.text('').append('tspan').attr('class', 'elip').text('...'+(endsymbol||''));
        var width = parseFloat(text.attr('width')) - ellipsis.node().getComputedTextLength();
        var numWords = words.length;

        var tspan = text.insert('tspan', ':first-child').text(words.join(' '));

        // Try the whole line
        // While it's too long, and we have words left, keep removing words
        let old_words ='';
        while (tspan.node().getComputedTextLength() > width && words.length) {
            old_words = words.pop();
            tspan.text(words.join(' '));
        }

        if (words.length === numWords) {
            ellipsis.remove();
            tspan.text(tspan.text()+endsymbol||'')
        }else{
            if (old_words!=='')
                old_words = old_words.split('');
                tspan.text(words.join(' ')+' '+old_words.join(''));
                while (tspan.node().getComputedTextLength() > width && old_words.length) {
                    old_words.pop();
                    tspan.text(words.join(' ')+' '+old_words.join(''));
                }
        }
    });
}//wrap
function wrap(text, istruncate,width) {
    if (istruncate){
        truncate(text,'');
    }else {
        text.each(function () {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1, // ems
                y = text.attr("y"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
            width = width || parseFloat(text.attr('width'));
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", lineHeight + dy + "em").text(word);
                }
            }
        });
    }
    return text;
}
function controlView(config){
    switch(config.charType){
        case 'T-sne Chart':
            d3.selectAll('.radarcontroller_layout').classed('hide',false);
            d3.selectAll('.singleservice_layout').classed('hide',true);
            break;
        default:
            d3.selectAll('.singleservice_layout').classed('hide',false);
            d3.selectAll('.radarcontroller_layout').classed('hide',true);
            break;
    }
    switch(config.sumType){
        case 'RadarSummary':
        case 'Radar':
            d3.selectAll('.radarcontroller_layout').classed('hide',false);
            break;
        case 'Boxplot':
            d3.selectAll('.singleservice_layout').classed('hide',false);
            break;
        default:

            break;
    }
}
function onloaddetermire (data,divid){
    divid = divid|| '.cover';
    d3.select(divid+' .status').text('');
    const determinate =  d3.select(divid+' .determinate').style('width',data.process.toFixed(2)+'%');
    d3.select(divid+' .progressText').text(data.message);
    if (data.message==='finish'){
        d3.select(divid+' .progressDiv').classed('hidden', true);
        d3.select(divid).classed('hidden', true);
        d3.select(divid+' .status').text('load data....');
    }else{
        d3.select(divid+' .progressDiv').classed('hidden', false);
    }
}
function preloader(on,percentage,message,divid){
    divid = divid|| '.cover';
    if (on){
        d3.select(divid).classed('hidden', false);
        if(percentage)
            onloaddetermire({message:message||'collecting data....',process:percentage},divid)
        else {
            spinner.spin(target);
            if (message)
            {
                d3.select(divid).select('h5.spinnerC').text(message);
            }
        }
    }else {
        onloaddetermire({message:'finish',process:100},divid);
        d3.select(divid).classed('hidden', true);
        spinner.stop();
    }
}

function millisecondsToStr (milliseconds) {
    // TIP: to find current time in milliseconds, use:
    // var  current_time_milliseconds = new Date().getTime();

    function numberEnding (number) {
        return (number > 1) ? 's' : '';
    }

    var temp = Math.floor(milliseconds / 1000);
    var years = Math.floor(temp / 31536000);
    var str = '';
    if (years) {
        str+= years + ' year' + numberEnding(years);
    }
    //TODO: Months! Maybe weeks?
    var days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
        str+= days + ' day' + numberEnding(days)+' ';
    }
    var hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
        str+= hours + ' hour' + numberEnding(hours)+' ';
    }
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
        str+= minutes + ' minute' + numberEnding(minutes)+' ';
    }
    var seconds = temp % 60;
    if (seconds) {
        str+= seconds + ' second' + numberEnding(seconds)+' ';
    }
    if(str==='')
        return Math.round(milliseconds)+' ms' ; //'just now' //or other string you like;
    else
        return str;
}

function updateDatainformation(timearray,filename){
    dataInformation.size = bytesToString(dataInformation.size);
    dataInformation.hostsnum = hosts.length;
    dataInformation.timerange = millisecondsToStr(_.last(timearray)-timearray[0]);
    dataInformation.interval = millisecondsToStr(timearray[1] - timearray[0]);
    dataInformation.totalstep = timearray.length;
    dataInformation.datanum = d3.format(",.0f")(dataInformation.totalstep*dataInformation.hostsnum);
    let dataholder = d3.select('#datainformation');
    for (key in dataInformation)
        dataholder.select(`.${key}`).text(dataInformation[key]);
    if(sampleS)
        d3.select(".currentDate")
            .text("" + (sampleS['timespan'][0]).toDateString());
}
function bytesToString (bytes) {
    // One way to write it, not the prettiest way to write it.

    var fmt = d3.format('.0f');
    if (bytes < 1024) {
        return fmt(bytes) + 'B';
    } else if (bytes < 1024 * 1024) {
        return fmt(bytes / 1024) + 'kB';
    } else if (bytes < 1024 * 1024 * 1024) {
        return fmt(bytes / 1024 / 1024) + 'MB';
    } else {
        return fmt(bytes / 1024 / 1024 / 1024) + 'GB';
    }
}
function onSaveDescription (){
    var filename = $('#savename_description').val()+".json";
    var type = "json";
    var str = JSON.stringify(clusterDescription);
    var file = new Blob([str], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}
function onSaveClusterInfo() {
    csv_header = ['labels'];
    serviceFullList.forEach(d => {
        csv_header.push(d.text);
        csv_header.push(d.text + '_min');
        csv_header.push(d.text + '_max');
    });
    csv_header.push('mse');
    csv_header.push('radius');
    csv_header.push('description');

    dataout = [];
    serviceFullList.forEach(d => {
        d.scale = d3.scaleLinear().range(d.range);
    });
    cluster_info.forEach((d, i) => {
        let temp = [i];
        d.__metrics.forEach((s, i) => {
            temp.push(serviceFullList[i].scale(s.value));
            temp.push(serviceFullList[i].scale(s.minval));
            temp.push(serviceFullList[i].scale(s.maxval));
        });
        // if (binopt.clusterMethod ==='leaderbin')
        //     temp.push(d.bin.distance);
        temp.push(d.mse);
        temp.push(d.radius);
        temp.push(clusterDescription[d.name].text.replace(/,/g,' '));
        dataout.push(temp);
    });

    download_csv();

    function download_csv() {
        var csv = csv_header.join(',') + '\n';
        dataout.forEach(function (row) {
            csv += row.join(',');
            csv += "\n";
        });

        var filename = $('#savename_clusterInfo').val()+".csv";
        var hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
        hiddenElement.target = '_blank';
        hiddenElement.download = filename;
        hiddenElement.click();
    }
}

// chart controll ------------------------------------
let viztype='radar';
let starChart_func, radarChart_func, roseChart_func, flowerChart_func;
if (typeof RadarChart!== 'undefined') {
    starChart_func = _.bind(RadarChart, {smooth: 1});
    radarChart_func = _.bind(RadarChart, {smooth: 0.5});
    roseChart_func = _.bind(RoseChart, {shape: 'rose'});
    flowerChart_func = _.bind(RoseChart, {shape: 'flower'});
    RadarChart = radarChart_func;
}

// radar draw
function createRadar_func(datapoint, bg, data, customopt,className,radaropt,colorscale) {
    className = className||"compute linkLineg ";
    let size_w = customopt?(customopt.size?customopt.size:radaropt.w):radaropt.w;
    let size_h = customopt?(customopt.size?customopt.size:radaropt.h):radaropt.h;
    let colorfill = (customopt&&customopt.colorfill)?(customopt.colorfill===true?0.5:customopt.colorfill):false;
    let radar_opt = {
        w: size_w,
        h: size_h,
        schema: serviceFullList,
        margin: {left:0,right:0,top:0,bottom:0},
        levels: 6,
        mini:true,
        radiuschange: false,
        isNormalize: true,
        maxValue: 0.5,
        fillin: colorfill,
    };


    if (datapoint.empty()) {
        datapoint = bg
            .append("g")
            .datum(data)
            .attr("class", d => className+" " + fixName2Class(d.name));

    }

    // replace thumnail with radar mini
    if(data)
        datapoint.data([data])
    datapoint.each(function(d){
        d3.select(this).attr('transform',`translate(${-radar_opt.w/2},${-radar_opt.h/2})`)
        if (colorfill)
            radar_opt.color = function(){return d.color||colorscale(d.name)};
        RadarChart(this, [d], radar_opt,"");
    });
    return datapoint;
}
function ordinal_suffix_of(i,sep) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return sep?'st':(i + "st");
    }
    if (j == 2 && k != 12) {
        return sep?'nd': (i + "nd");
    }
    if (j == 3 && k != 13) {
        return sep?'rd': (i + "rd");
    }
    return sep?'th': (i + "th");
}
function axisHistogram(text,range,d){
    d = d.filter(e=>e)
    if (d.length) {
        outlierMultiply = 3
        var scale = d3.scaleLinear().domain(range);
        var histogram = d3.histogram()
            .domain(scale.domain())
            // .thresholds(d3.range(0,20).map(d=>scale(d)))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
            .thresholds(scale.ticks(100))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
            .value(d => d);
        let hisdata = histogram(d);

        let start=-1,startcheck=true,end= hisdata.length-1;
        let sumstat = hisdata.map((d, i) => {
            let temp = [d.x0 + (d.x1 - d.x0) / 2, (d || []).length];
            if (startcheck && temp[1]===0)
                start = i;
            else {
                startcheck = false;
                if (temp[1]!==0)
                    end = i;
            }
            return temp});
        if (start===end)
            sumstat = [];
        else
            sumstat = sumstat.filter((d,i)=>i>start&&i<=end);
        r = {
            axis: text,
            q1: ss.quantile(d, 0.25),
            q3: ss.quantile(d, 0.75),
            median: ss.median(d),
            // outlier: ,
            arr: sumstat
        };
        // if (d.length>4)
        // {
        //     const iqr = r.q3-r.q1;
        //     console.log('Outliers: ',d.filter(e=>e>(r.q3+outlierMultiply*iqr)||e<(r.q1-outlierMultiply*iqr)).length);
        //     r.outlier = _.unique(d.filter(e=>e>(r.q3+outlierMultiply*iqr)||e<(r.q1-outlierMultiply*iqr)));
        //     console.log('Unquie points: ',r.outlier.length);
        // }else{
        //     r.outlier =  _.unique(d);
        // }
        r.outlier = []
        return r;
    }else{
        return  {
            axis: text,
            q1: null,
            q3: null,
            median: null,
            // outlier: ,
            arr: []
        };
    }
}