
hosts.forEach(h=>serviceListattr.forEach(s=>{if (hostResults[h.name][s].length>60) hostResults[h.name][s].pop();}))
var arr = [];
dataSpider3 = [];
dataCalculate = [];

for (var lastIndex = 0; lastIndex < 60; lastIndex++) {
    for (var h = 0; h < hosts.length; h++) {
        var name = hosts[h].name;
        arrServices = getDataByName_withLabel(hostResults, name, lastIndex, lastIndex,0);
        arrServices.name = name;
        arrServices.indexSamp = lastIndex;
        arrServices.id = h;
        arr.push(arrServices);
    }
}
dataSpider3= arr;
dataCalculate = arr;

bin.data([]).minNumOfBins(8).maxNumOfBins(11);
bin.data(dataSpider3.map((d,i) => {
    var dd = d.map(k => k.value);
    dd.data = {name: d.name,id: d.id};
    return dd;
}))
    .calculate();
var keys = dataSpider3[0].map(d => d.axis);
dataSpider3.length = 0;
console.log("numBins: " + bin.bins.length);
dataSpider3 = bin.bins.map(d => {
    var temp;
    if (bin.normalizedFun)
        temp = bin.normalizedFun.scaleBackPoint(d.val).map((e, i) => {
            return {axis: keys[i], value: e}
        });
    else
        temp = d.val.map((e, i) => {
            return {axis: keys[i], value: e}
        });
    temp.bin = {
        name: d.map(f => f.data.name),
        id: d.map(f => f.data.id),
        scaledval: d,
        distancefunc: (e) => d3.max(e.map(function (p) {
            return distance(e[0], p)
        })),
        distance: d3.max(d.map(function (p) {
            return distance(d.val, p)
        }))
    };
    if (bin.normalizedFun)
        temp.bin.val =  bin.normalizedFun.scaleBackPoints(d);
    else
        temp.bin.val = d.slice();
    return temp;
});
csv_header=['labels'];
serviceFullList.forEach(d=>
{d.scale = d3.scaleLinear().range(d.range);
    csv_header.push('10.10.1.1-'+d.text);
})
csv_header.push('radius');
dataout = []

dataSpider3.forEach((d,i)=>{
    let temp = [i];
    d.forEach((s,i)=>temp.push(serviceFullList[i].scale(s.value)));
    temp.push(d.bin.distance);
    dataout.push(temp);
})
download_csv();
function download_csv() {
    var csv = csv_header.join(',')+'\n';
    dataout.forEach(function(row) {
        csv += row.join(',');
        csv += "\n";
    });

    console.log(csv);
    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    hiddenElement.target = '_blank';
    hiddenElement.download = 'cluster_27sep2018.csv';
    hiddenElement.click();
}