// Ngan - Oct 31 2018


var radarsize  = 300;
var bin = binnerN().startBinGridSize(30).isNormalized(false).minNumOfBins(4).maxNumOfBins(22).data([]);
var radarChartsumopt  = {
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
        BinRange = [4,25],
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
        bin.data(dataSpider3.map(d=>{
            var dd = d.map(k=>k.value);
            dd.data = d.name;
            return dd;}))
            .calculate();
        var keys = dataSpider3[0].map(d=>d.axis);
        dataSpider3.length = 0;
        console.log(bin.bins.length);
        dataSpider3 = bin.bins.map(d=>
        {   var temp = bin.normalizedFun.scaleBackPoint(d.val).map((e,i)=>{return {axis:keys[i],value:e}});
            temp.bin ={val: bin.normalizedFun.scaleBackPoints(d),
                name:d.map(f=>f.data),
                scaledval: d,
                distancefunc: (e)=>d3.max(e.map(function(p){return distance(e[0], p)})),
                distance: d3.max(d.map(function(p){return distance(d.val, p)}))};
            return temp;});
        radarChartsumopt.levels = levelsR;
        radarChartsumopt.color = color2;
        RadarChart(".radar"+index, dataSpider3, radarChartsumopt,"");
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
        radarChartsumopt.color = color2;
        RadarChart(".radar"+index, dataSpider3, radarChartsumopt,"");
        //if (index >= maxstack) radarTimeline.shift();

    };
    radarTimeline.shift = function (){
        var radarchart = svg.selectAll(".graphsum").transition().duration(500)
            .attr("transform", function (d) {
                d3.select(this).datum(d=>d-1).attr("class",d=>("radar"+d+" box"+d+" graphsum"));
                return "translate(" + xscale(d-1) + "," + -30 + ")";
            }).on("end", function(d) {
                if (d===-1)
                    d3.select(this).remove();
            });
    };

    function handledata(index){
        // Summarynode

        dataSpider3 = [];

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
                dataSpider3.push(arr1);

                // Standardize data for Radar chart
                for (var j=0; j<dataSpider3[i].length;j++){
                    if (dataSpider3[i][j].value == undefinedValue || isNaN(dataSpider3[i][j].value))
                        dataSpider3[i][j].value = -15;
                    else if (j==3){   ////  Job load ***********************
                        var scale = d3.scaleLinear()
                            .domain([thresholds[1][0],thresholds[1][1]])
                            .range([thresholds[0][0],thresholds[0][1]]);

                        dataSpider3[i][j].value =  scale(dataSpider3[i][j].value);
                    }
                    else if (j==5 || j==6 || j==7 || j==8){   ////  Fans SPEED ***********************
                        var scale = d3.scaleLinear()
                            .domain([thresholds[3][0],thresholds[3][1]])
                            .range([thresholds[0][0],thresholds[0][1]]); //interpolateHsl interpolateHcl interpolateRgb

                        dataSpider3[i][j].value =  scale(dataSpider3[i][j].value);
                    }
                    else if (j==9){   ////  Power Consumption ***********************
                        var scale = d3.scaleLinear()
                            .domain([thresholds[4][0],thresholds[4][1]])
                            .range([thresholds[0][0],thresholds[0][1]]); //interpolateHsl interpolateHcl interpolateRgb
                        dataSpider3[i][j].value =  scale(dataSpider3[i][j].value);
                    }
                }
            }
        }
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
            node.parentNode.removeChild(node);
        });
        d3.select(".summaryGroup").selectAll(".radarWrapper")
            .transition().duration(200)
            .style("visibility", 'visible');
        hosts.forEach(l=> {
                d3.selectAll("." + l.name)
                    .transition().duration(500)
                    .style("visibility", 'visible');
        });
}