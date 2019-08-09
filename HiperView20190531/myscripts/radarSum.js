// Ngan - Oct 31 2018


var radarsize  = 300;
var bin = binnerN().startBinGridSize(30).isNormalized(false).minNumOfBins(4).maxNumOfBins(10).data([]);
var radarChartsumopt  = {
    margin: {top: 5, right: 0, bottom: 0, left: 0},
    w: radarsize -5,
    h: radarsize +20,
    radiuschange: false,
    dotRadius:2,
    maxValue: 0.5,
    roundStrokes: true,
    showText: false,
    bin :   true};
d3.radar = function () {
    let startBinGridSize=30,
        isNormalized =false,
        BinRange = [3,10],
        arr = [],
        maxstack= 4,
        margin=-30;
    let radarTimeline ={};
    let indexdata =[];
    let bin = binnerN().startBinGridSize(startBinGridSize).isNormalized(isNormalized).minNumOfBins(BinRange[0]).maxNumOfBins(BinRange[1]);
    let svg;
    let xscale = d3.scaleLinear().domain([0, 7]).range([0, 1000]);
    let distance = function(a, b){
        let dsum = 0;
        a.forEach((d,i)=> {dsum +=(d-b[i])*(d-b[i])});
        return Math.round(Math.sqrt(dsum)*Math.pow(10, 10))/Math.pow(10, 10);};
    radarTimeline.init = function(){
        bin.data([]).updateRadius(true);
    };
    radarTimeline.draw = function(index){
        let radarchart = svg.selectAll(".radar"+index+".box"+index+".graphsum");
        if (radarchart.empty())
            radarchart = svg.append("g")
                .attr("class", "radar" + index + " box" + index + " graphsum")
                .datum(index)
                .attr("transform", function (d) {
                    return "translate(" + xscale(index) + "," + margin + ")";
                });

        handledata(index);
        // TESTING ZONE
        let scagOptions ={
            startBinGridSize: 30,
            minBins: 20,
            maxBins: 100,
            outlyingCoefficient: 1.5,
            incrementA:2,
            incrementB:0,
            decrementA:0.5,
            decrementB:0,
        };
        // scag = scagnosticsnd(handledata(index), scagOptions);
        scag = scagnosticsnd(dataCalculate.map(d=>{
            var dd = d.map(k=>k.value);
            dd.data = d.name;
            return dd;}), scagOptions);
        console.log('Outlying detect: bin='+scag.bins.length);
        console.log(scag.outlyingPoints.map(d=>d.data));
        console.log(scag.outlyingBins);
        let outlyingPoints = [];
        dataSpider3 = dataSpider3.filter(d=> {
            let temp2 = scag.outlyingPoints.filter(e=>e.data===d.name);
            let temp = JSON.parse(JSON.stringify(d));
            if (temp2.length) {
                let tempscaleval = [temp2[0]];
                tempscaleval.val =temp2[0];
                temp.indexSamp = d.indexSamp;
                temp.name = d.name;
                temp.bin ={val: [d.map(k=>k.value)],
                    name:[temp2[0].data],
                    scaledval: tempscaleval,
                    distancefunc: (e)=>0,
                    distance: 0};
                outlyingPoints.push(temp);
                temp.type = "outlying";
                return 0;
            }
            return 1;
        });
        //TESTING ZONE
        bin.data(dataSpider3.map(d=>{
            var dd = d.map(k=>k.value);
            dd.data = d.name;
            return dd;}))
            .calculate();
        var keys = dataSpider3[0].map(d=>d.axis);
        dataSpider3.length = 0;
        console.log("numBins: "+bin.bins.length);
        dataSpider3 = bin.bins.map(d=>
        {   var temp = bin.normalizedFun.scaleBackPoint(d.val).map((e,i)=>{return {axis:keys[i],value:e}});
            temp.bin ={val: bin.normalizedFun.scaleBackPoints(d),
                name:d.map(f=>f.data),
                scaledval: d,
                distancefunc: (e)=>d3.max(e.map(function(p){return distance(e[0], p)})),
                distance: d3.max(d.map(function(p){return distance(d.val, p)}))};
            return temp;});
        outlyingPoints.forEach(o=> dataSpider3.push(o));
        console.log('current group + outlying: '+dataSpider3.length);
        radarChartsumopt.levels = levelsR;
        radarChartsumopt.bin = true;
        radarChartsumopt.gradient = false;
        //radarChartsumopt.color = color2;
        RadarChart(".radar"+((index >= maxstack-1)?(maxstack-1):index), dataSpider3, radarChartsumopt,"");
        bin.data([]);
        if (index >= maxstack-1) radarTimeline.shift();

    };



    radarTimeline.drawpoint = function(index){
        if (index >= (maxstack-1)) index = maxstack-1;
        let radarchart = svg.selectAll(".radar"+index+".box"+index+".graphsum");
        if (radarchart.empty())
            radarchart = svg.append("g")
                .attr("class","radar"+index+" box"+index+" graphsum")
                .datum(index)
                .attr("transform", function (d) {
                    return "translate(" + xscale(index) + "," + margin + ")";
                });

        handledata(index);
        bin.updateRadius(false).calculatePoint(dataSpider3.map(d=>{
            var dd = d.map(k=>k.value);
            dd.data = d.name;
            return dd;}));
        var keys = dataSpider3[0].map(d=>d.axis);
        dataSpider3.length = 0;
        //console.log(bin.bins.length);
        dataSpider3 = bin.bins.map(d=>
        {   var temp = bin.normalizedFun.scaleBackPoint(d.val).map((e,i)=>{return {axis:keys[i],value:e}});
            temp.bin ={val: bin.normalizedFun.scaleBackPoints(d),
                name:d.map(f=>f.data),
                scaledval: d,
                distancefunc: (e)=>d3.max(e.map(function(p){return distance(e[0], p)})),
                distance: d3.max(d.map(function(p){return distance(d.val, p)}))};
            return temp;});
        radarChartsumopt.levels = levelsR;
        radarChartsumopt.gradient = false;
        //radarChartsumopt.color = color2;
        RadarChart(".radar"+index, dataSpider3, radarChartsumopt,"");
        //if (index >= maxstack) radarTimeline.shift();

    };

    radarTimeline.drawSummarypoint = function(index){

        if (index >= (maxstack-1)) index = maxstack-1;
        let radarchart = svg.selectAll(".radar"+index+".box"+index+".graphsum");
        if (radarchart.empty())
            radarchart = svg.append("g")
                .attr("class","radar"+index+" box"+index+" graphsum")
                .datum(index)
                .attr("transform", function (d) {
                    return "translate(" + xscale(index) + "," + margin + ")";
                });

        const values = [handledataRate()];
        radarChartsumopt.gradient = true;
        radarChartsumopt.bin = false;
        radarChartsumopt.levels = levelsR;
        //radarChartsumopt.color = color2;
        RadarChart(".radar"+((index >= maxstack-1)?(maxstack-1):index), values, radarChartsumopt,"");


    };
    radarTimeline.shift = function (){
        var radarchart = svg.selectAll(".graphsum").transition().duration(500)
            .attr("transform", function (d) {
                const selection = d3.select(this).datum(d=>d-1);
                selection.attr("class",d=>("radar"+d+" box"+d+" graphsum"));
                selection.select('clipPath').attr("id",d=> "sumradar"+d );
                selection.select('rect').attr("clip-path",d=> "url(#sumradar"+d+")" );

                return "translate(" + xscale(d-1) + "," + -30 + ")";
            }).on("end", function(d) {
                if (d===-1)
                    d3.select(this).remove();
            });
    };
    var scaleNormal = d3.scaleLinear()
        .domain([0,1])
        .range([thresholds[0][0],thresholds[0][1]]);
    function handledataRate (){
        return _(arr).unzip().map((d,i)=>{return {axis: axes[i], value: scaleNormal(ss.mean(d)),minval: scaleNormal(ss.quantile(d,0.25)),maxval: scaleNormal(ss.quantile(d, 0.75))}});
    }
    function handledata(index){
        // Summarynode

        dataSpider3 = [];
        dataCalculate = [];

        //dataSpider2.name = 'Summary '+d3.timeFormat('%H:%M %d %b %Y')(r.arr[0].result.query_time);
        if (arr.length>0){
            for (var i=0;i<arr.length;i++){
                var arrServices = arr[i];
                var arr1 = [];
                for (var a=0;a<axes.length;a++){
                    var obj ={};
                    obj.axis = axes[a];
                    if (a==0)
                        obj.value = arrServices[0].a[0];
                    else if (a==1)
                        obj.value = arrServices[0].a[1];
                    else if (a==2)
                        obj.value = arrServices[0].a[2];
                    else if (a==3)
                        obj.value = arrServices[1].a[0];
                    else if (a==4)
                        obj.value = arrServices[2].a[0];
                    else if (a==5)
                        obj.value = arrServices[3].a[0];
                    else if (a==6)
                        obj.value = arrServices[3].a[1];
                    else if (a==7)
                        obj.value = arrServices[3].a[2];
                    else if (a==8)
                        obj.value = arrServices[3].a[3];
                    else if (a==9)
                        obj.value = arrServices[4].a[0];
                    arr1.push(obj);
                }
                arr1.name = arr[i].name;
                arr1.indexSamp = index;

                let arr2 = arr1.map(d=>_.clone(d));
                arr2.name = arr[i].name;
                arr2.indexSamp = index;
                dataSpider3.push(arr1);
                dataCalculate.push(arr2);

            }

            // Standardize data for Radar chart
            dataSpider3.forEach((d,i)=>{
                normalizevalue(d);
            });

            dataCalculate.forEach((d,i)=>{
                normalizevalue(d,'mean');
            });
        }
        //return datawithoutNULL;
    }

    radarTimeline.data = function (_) {
        return arguments.length ? (arr = _, radarTimeline) : arr;

    };

    radarTimeline.BinRange = function (_) {
        return arguments.length ? (BinRange = _, radarTimeline) : BinRange;

    };

    radarTimeline.svg = function (_) {
        return arguments.length ? (svg = _, radarTimeline) : svg;

    };

    radarTimeline.scale = function (_) {
        return arguments.length ? (xscale = _, radarTimeline) : xscale;

    };

    radarTimeline.maxstack = function (_) {
        return arguments.length ? (maxstack = _, radarTimeline) : maxstack;

    };
    return radarTimeline;
};

function clearclone (){
        document.querySelectorAll("g[cloned='true']").forEach(node=>{
            //node.parentNode.removeChild(node);
            d3.select(node).attr('cloned',null);
        });
        var allbold = d3.select(".summaryGroup").selectAll(".radarWrapper");
        allbold//.transition().delay(50)
            .style("opacity", 1);
        allbold.selectAll(".radarStroke").style('pointer-events','auto');
    hosts.forEach(l=> {
                d3.selectAll("." +  l.name)
                    .classed("displayNone", false);
                    // .style("visibility", 'visible');
        });
    filterhost = hosts.map(d=>d.name);
}