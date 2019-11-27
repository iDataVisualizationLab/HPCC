function clustercal(binopt,currentindex,callback){
    let bin
    // binopt = {clusterMethod:'kmean'}
    var arr = [];
    dataSpider3 = [];
    dataCalculate = [];

    for (var i = 0; i < sampleS.timespan.length; i++) {
        for (var h = 0; h < hosts.length; h++) {
            var name = hosts[h].name;
            arrServices = getDataByName_withLabel(sampleS, name, i, i,0);
            arrServices.name = name;
            arrServices.indexSamp = i;
            arrServices.id = h;
            arr.push(arrServices);
        }
    }
    dataSpider3= arr;
    dataCalculate = arr;

    if (binopt.clusterMethod ==='leaderbin') {
        let estimateSize = Math.pow(binopt.bin.range[1] , 1/dataSpider3[0].length);
        // bin = binnerN().startBinGridSize(binopt.bin.startBinGridSize).isNormalized(true).minNumOfBins(binopt.bin.range[0]).maxNumOfBins(binopt.bin.range[1]).coefficient({
        bin = binnerN().startBinGridSize(estimateSize).isNormalized(true).minNumOfBins(binopt.bin.range[0]).maxNumOfBins(binopt.bin.range[1]).coefficient({
            reduce_coefficient: 0.3,
            reduce_offset: 0,
            increase_coefficient: 2,
            increase_offset: 0
        }).data([]);
    }else {
        bin = kmeanCluster;
        bin.k(binopt.bin.k);
        bin.iterations(binopt.bin.iterations);
    }
    // bin.data([]).minNumOfBins(8).maxNumOfBins(11);
    bin.data(dataSpider3.map((d,i) => {
        var dd = d.map(k => k.value);
        dd.data = {name: d.name,id: d.id,indexSamp:d.indexSamp};
        return dd;
    }))
        .calculate();
    console.log('Iterations: '+bin.loopcount)
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
            nameob: d.map(f => {return {name: f.data.name,timestep: f.data.indexSamp}}),
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
    if (binopt.clusterMethod ==='leaderbin')
        csv_header.push('radius');

        // dataout = []
        //
        // dataSpider3.forEach((d,i)=>{
        //     let temp = [i];
        //     d.forEach((s,i)=>temp.push(serviceFullList[i].scale(s.value)));
        //     if (binopt.clusterMethod ==='leaderbin')
        //         temp.push(d.bin.distance);
        //     dataout.push(temp);
        // });

        let cluster = dataSpider3.map((d,i)=>{
            let temp = {labels:i};
            d.forEach((s,i)=>temp[serviceFullList[i].text] = serviceFullList[i].scale(s.value));
            temp.radius = d.bin.distance;
            temp.index = i;
            temp.__metrics = d.slice();
            temp.__metrics.normalize = temp.__metrics.map((e,i)=>e.value) ;
            const temp_arr = _.groupBy(d.bin.nameob,e=>e.timestep);
            temp.arr = d3.range(0,sampleS.timespan.length).map(e=>temp_arr[e]?temp_arr[e].map(f=>f.name):undefined);
            temp.total = d.bin.id.length;
            return temp;
        });

    hosts.forEach(h=>sampleS[h.name].arrcluster = sampleS.timespan.map((t,i)=>{
        return cluster.findIndex(c=>c.arr[i]?c.arr[i].find(e=>e===h.name):undefined);
    }));

    cluster.forEach(c=>c.arr = c.arr.slice(0,currentindex))

    callback(cluster);
    // download_csv();
    // function download_csv() {
    //     var csv = csv_header.join(',')+'\n';
    //     dataout.forEach(function(row) {
    //         csv += row.join(',');
    //         csv += "\n";
    //     });
    //
    //     console.log(csv);
    //     var hiddenElement = document.createElement('a');
    //     hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    //     hiddenElement.target = '_blank';
    //     hiddenElement.download = 'cluster_27sep2018.csv';
    //     hiddenElement.click();
    // }

    // Object.keys(sampleS).forEach(h=>{
    //     delete sampleS[h].arrJob_scheduling;
    //     sampleS[h].arrcluster = [];
    // });
    // sampleS_cluster = {};
    // dataSpider3.forEach((d,i)=>{
    //     d.bin.nameob.forEach(o=>{
    //         if(!sampleS_cluster[o.name])
    //             sampleS_cluster[o.name] = [];
    //         sampleS_cluster[o.name].push({cluster:i,timestep:o.timestep});
    //     });
    // });
    // Object.keys(sampleS_cluster).forEach(h=>{
    //     sampleS_cluster[h].sort((a,b)=>a.timestep-b.timestep);
    //     sampleS_cluster[h] = sampleS_cluster[h].map(d=>d.cluster);
    // });
    //
    // sampleS_cluster = {};
    // hosts.forEach(h=>{
    //     sampleS_cluster[h.name] = sampleS[h.name].arrcluster;
// });
}


function download_cluster(){
    csv_header=['labels'];
    serviceFullList.forEach(d => {
        csv_header.push(d.text);
        csv_header.push(d.text+'_min');
        csv_header.push(d.text+'_max');
    });
    csv_header.push('mse');

    dataout = [];
    serviceFullList.forEach(d=> {d.scale = d3.scaleLinear().range(d.range);})
    cluster_info.forEach((d,i)=>{
        let temp = [i];
        d.__metrics.forEach((s,i)=>{
            temp.push(serviceFullList[i].scale(s.value));
            temp.push(serviceFullList[i].scale(s.minval));
            temp.push(serviceFullList[i].scale(s.maxval));
        });
        // if (binopt.clusterMethod ==='leaderbin')
        //     temp.push(d.bin.distance);
        temp.push(d.mse);
        dataout.push(temp);
    });

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

}
