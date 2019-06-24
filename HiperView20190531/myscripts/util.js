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
            var maxIncrease = 0;
            var preTemp1 = 0;
            var preTemp2 = 0;
            for (var i = 0; i < r.arr.length; i++) {
                var a = processData(r.arr[i].data.service.plugin_output,selectedService);
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
                svg.selectAll("."+name).attr("fill-opacity",0);
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
        .range([x, x+250]); // output
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
    var filename = "service"+d3.timeFormat("%a%d%b_%H%M")(new Date())+".json";
    var type = "json";
    var str = JSON.stringify(hostResults);

    
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

    /*
    // Save results for Project 1
    var filename = "HPCC_Project1.json";
    var type = "json";
    var data = {};
   for (var att in sampleS){
        data[att]={};
        data[att].arrTemperatureCPU1=[];
        data[att].arrTemperatureCPU2=[];
        data[att].arrCPU_load=[];
        data[att].arrFans_speed1=[];
        data[att].arrFans_speed2=[];
        data[att].arrMemory_usage=[];

        var item = sampleS[att];
        for(var i=0;i<item.arr.length;i++){
            var str = item.arr[i].data.service.plugin_output;
            if (str=="UNKNOWN-Plugin was unable to determine the status for the host CPU temperatures! HTTP_STATUS Code:000"){
                data[att].arrTemperatureCPU1.push(null);
                data[att].arrTemperatureCPU2.push(null);
            }
            else{
                var a = processData(str, serviceList[0]);
                data[att].arrTemperatureCPU1.push(a[0]);
                data[att].arrTemperatureCPU2.push(a[1]);
            }
            
            var str2 = item.arrCPU_load[i].data.service.plugin_output;
            var b2 =  +str2.split("CPU Load: ")[1];
            data[att].arrCPU_load.push(b2);
                       
            var str3 = item.arrMemory_usage[i].data.service.plugin_output;
            //console.log(att+" "+str3);
            if (str3.indexOf("syntax error")>=0 ){
                data[att].arrMemory_usage.push(null);
            }
            else{
                var b3 =  str3.split("Usage Percentage = ")[1];
                var c3 =  +b3.split(" :: Total Memory")[0];
                data[att].arrMemory_usage.push(c3);
            }

            var str4 = item.arrFans_health[i].data.service.plugin_output;
            if (str4.indexOf("UNKNOWN")>=0 || str4.indexOf("No output on stdout) stderr")>=0 
                || str4.indexOf("Service check timed out")>=0){
                data[att].arrFans_speed1.push(null);
                data[att].arrFans_speed2.push(null);  
            }  
            else{  
                var arr4 =  str4.split(" RPM ");
                var fan1 = +arr4[0].split("FAN_1 ")[1];
                var fan2 = +arr4[1].split("FAN_2 ")[1];
                data[att].arrFans_speed1.push(fan1);
                data[att].arrFans_speed2.push(fan2);  
            }
        }
    }

    var str = JSON.stringify(data);
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
    }*/


    // Save results for Outliagnostics ***************************
    var filename = "HPCC_scagnostics.json";
    var type = "json";

    var numnerOfYear = 100000;
    for (var att in sampleS){
        var item = sampleS[att];
        if (item.arrTemperature.length<numnerOfYear){
            numnerOfYear = item.arrTemperature.length;
        }
    }   

    var dataS = {};
    dataS.Scagnostics= ["Outlying", "Skewed", "Clumpy", "Sparse", "Striated", "Convex", "Skinny", "Stringy", "Monotonic"];
    dataS.Variables = ["var1", "var2"];
    dataS.Countries = [];
    for (var att in sampleS){
        dataS.Countries.push(att);
    }    
    dataS.CountriesData ={};
    for (var att in sampleS){
        dataS.CountriesData[att]=[];
       
        var item = sampleS[att];
        for(var i=0;i<numnerOfYear;i++){
            var str = item.arrTemperature[i].data.service.plugin_output;
            var obj = {};
            if (str=="UNKNOWN-Plugin was unable to determine the status for the host CPU temperatures! HTTP_STATUS Code:000"){
                obj.v0=null;
            }
            else{
                var a = processData(str,serviceList[0]);
                if (a[1]<0)
                    obj.v0 = null;
                obj.v0 = a[1];
            }
                         
            var str4 = item.arrFans_health[i].data.service.plugin_output;
            if (str4.indexOf("(No output on stdout)")>=0 
                || str4.indexOf("UNKNOWN")>=0  
                || str4.indexOf("syntax error")>=0 ){
                obj.v1=null;
            }
            else{
                var c3 =  processData(str4,serviceList[3]);
                if (c3[1]<0)
                     obj.v1 = null;
                obj.v1=c3[1];
            }
            obj.Outlying = 0;
            obj.year = i;
            dataS.CountriesData[att].push(obj);
        }
    }
    // Standardize data ***************************************************************
    var minV0 = 100000;
    var minV1 = 100000;
    var maxV0 = 0;
    var maxV1 = 0;
    for (var att in  dataS.CountriesData){
        var hostArray = dataS.CountriesData[att];
        for(var i=0;i<hostArray.length;i++){
            var v0 = hostArray[i].v0;
            var v1 = hostArray[i].v1;
            if (v0 != null){
                if (v0<minV0)
                    minV0 = v0;
                if (v0>maxV0)
                    maxV0 = v0;
            }
            if (v1 != null){
                if (v1<minV1)
                    minV1 = v1;
                if (v1>maxV1)
                    maxV1 = v1;
            }
        }    
    }
    for (var att in  dataS.CountriesData){
        var hostArray = dataS.CountriesData[att];
        for(var i=0;i<hostArray.length;i++){
            var v0 = hostArray[i].v0;
            var v1 = hostArray[i].v1;
            if (v0 != null){
                hostArray[i].s0 = (hostArray[i].v0-minV0)/(maxV0-minV0)
            }
            else{
                hostArray[i].s0=null;
            }
            if (v1 != null){
                hostArray[i].s1= (hostArray[i].v1-minV1)/(maxV1-minV1);
            }
            else{
                hostArray[i].s1=null;
            }
        }    
    }

    dataS.YearsData = [];
    for (var y=0; y<numnerOfYear; y++){
        var obj = {};
        obj.s0 = [];
        obj.s1 = [];
        obj.Scagnostics0 = [0, 0, 0, 0, 0, 0, 0, 0, 0]; 
        for (var att in  dataS.CountriesData){
            var hostArray = dataS.CountriesData[att];
            var v0 = hostArray[y].s0;
            var v1 = hostArray[y].s1;
            obj.s0.push(v0);
            obj.s1.push(v1);
        }
        dataS.YearsData.push(obj);
    }
    

    var str = JSON.stringify(dataS);
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


