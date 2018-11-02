// Ngan - Oct 31 2018


var radarsize  = 190;
function drawRadarsum (svg,arr, index,xx){
    console.log(index);
    var radarchart = svg.select(".radar"+index);
    if (radarchart.empty()) {
        svg.append("g")
            .attr("class","radar"+index)
            .attr("transform", function (d) {
                return "translate(" + xx + "," + 20 + ")";
            });
    }

    var undefinededa = [undefinedValue,undefinedValue,undefinedValue];
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
    var bin = binnerN(dataSpider3.map(d=>d.map(k=>k.value)),'leader',100,false,5,30);
    var keys = dataSpider3[0].map(d=>d.axis);
    dataSpider3.length = 0;
    console.log(bin.bins.length);
    // var scale = d3.scaleLinear()
    //     .domain([0,1])
    //     .range([thresholds[0][0],thresholds[0][1]]);
    // dataSpider3 = bin.bins.map(d=>d.val.map((e,i)=>{return {axis:keys[i],value:scale(e)}}));
    dataSpider3 = bin.bins.map(d=>bin.normalizedFun.scaleBackPoint(d.val).map((e,i)=>{return {axis:keys[i],value:e,bin:bin.normalizedFun.scaleBackPoints(d)}}));
    var radarChartsumopt  = {
        w: radarsize -5,
        h: radarsize +20,
        radiuschange: false,
        dotRadius:2,
        maxValue: 0.5,
        levels: levelsR,
        roundStrokes: true,
        color: color2,
        showText: false,
        bin :   true,
        legend: [{},
            {},
            {},
            {5: Math.floor((thresholds[1][1]-thresholds[1][0])/levelsR*5+thresholds[1][0])},
            {5: Math.floor((thresholds[2][1]-thresholds[2][0])/levelsR*5+thresholds[2][0])},
            {5: Math.floor((thresholds[3][1]-thresholds[3][0])/levelsR*5+thresholds[3][0])},
            {5: Math.floor((thresholds[3][1]-thresholds[3][0])/levelsR*5+thresholds[3][0])},
            {5: Math.floor((thresholds[3][1]-thresholds[3][0])/levelsR*5+thresholds[3][0])},
            {5: Math.floor((thresholds[3][1]-thresholds[3][0])/levelsR*5+thresholds[3][0])},
            {5: Math.floor((thresholds[4][1]-thresholds[4][0])/levelsR*5+thresholds[4][0])}]
    };

    RadarChart(".radar"+index, dataSpider3, radarChartsumopt,"");

}