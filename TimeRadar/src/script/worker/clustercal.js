window =self;
importScripts("../../../../HiperView/js/d3.v4.js","../../../../HiperView/myscripts/setting.js","../../../../HiperView/js/lodash.min.js","../setting.js","../../../../HiperView/js/kmean.js","../../../../HiperView/js/binnerN.min.js","../../../../HiperView/js/simple-statistics.min.js");

addEventListener('message',function ({data}) {
    let binopt = data.binopt, sampleS = data.sampleS,hosts = data.hosts;
    serviceFullList = data.serviceFullList;
    serviceLists=data.serviceLists;
    serviceList_selected = data.serviceList_selected;
    serviceListattr= data.serviceListattr;
    let bin;
    var arr = [];
    dataSpider3 = [];
    dataCalculate = [];
    for (var i = 0; i < sampleS.timespan.length; i++) {
        for (var h = 0; h < hosts.length; h++) {
            var name = hosts[h].name;
            arrServices = getDataByName_withLabel(sampleS, name, i, i, 0);
            arrServices.name = name;
            arrServices.indexSamp = i;
            arrServices.id = h;
            arr.push(arrServices);
        }
    }
    dataSpider3 = arr;
    dataCalculate = arr;

    if (binopt.clusterMethod === 'leaderbin') {
        let estimateSize = Math.pow(binopt.bin.range[1], 1 / dataSpider3[0].length);
        bin = binnerN().startBinGridSize(estimateSize).isNormalized(true).minNumOfBins(binopt.bin.range[0]).maxNumOfBins(binopt.bin.range[1]).coefficient({
            reduce_coefficient: 0.3,
            reduce_offset: 0,
            increase_coefficient: 2,
            increase_offset: 0
        }).data([]);
    } else {
        bin = kmeanCluster;
        bin.k(binopt.bin.k);
        bin.iterations(binopt.bin.iterations);
    }
    let process = 50;
    let w = 25;
    bin.callback(function (iteration){
        process = process + w;
        w = w/2;
        postMessage({action: 'returnData',
        result: {iteration:iteration,process:process}
    })});
    // bin.data([]).minNumOfBins(8).maxNumOfBins(11);
    bin.data(dataSpider3.map((d, i) => {
        var dd = d.map(k => k.value);
        dd.data = {name: d.name, id: d.id, indexSamp: d.indexSamp};
        return dd;
    }))
        .calculate();

    postMessage({action: 'returnData',
        result: {iteration:bin.loopcount,process:99}
    });

    var keys = dataSpider3[0].map(d => d.axis);
    dataSpider3.length = 0;
    console.log("numBins: " + bin.bins.length);
    dataSpider3 = bin.bins.map(d => {
        var temp;
        if (bin.normalizedFun)
            temp = bin.normalizedFun.scaleBackPoint(d.val).map((e, i) => {
                let temparr = d.map(e=>e[i]);
                return {axis: keys[i], value: e,
                    minval: ss.min(temparr),
                    maxval: ss.max(temparr),
                    // mean: ss.mean(temparr),
                }
            });
        else
            temp = d.val.map((e, i) => {
                let temparr = d.map(e=>e[i]);
                return {axis: keys[i], value: e,
                    minval: ss.min(temparr),
                    maxval: ss.max(temparr),
                    mean: ss.mean(temparr),
                }
            });
        let distanceArr = d.map(function (p) {
            return distance(d.val, p)
        });
        temp.bin = {
            name: d.map(f => f.data.name),
            id: d.map(f => f.data.id),
            nameob: d.map(f => {
                return {name: f.data.name, timestep: f.data.indexSamp}
            }),
            scaledval: d,
            distancefunc: (e) => d3.max(e.map(function (p) {
                return distance(e[0], p)
            })),
            distance: d3.max(distanceArr),
            // meand: ss.mean(distanceArr)
        };
        temp.bin.mse = ss.sum(temp.map(e=>(e.maxval-e.minval)*(e.maxval-e.minval)));
        if (bin.normalizedFun)
            temp.bin.val = bin.normalizedFun.scaleBackPoints(d);
        else
            temp.bin.val = d.slice();
        return temp;
    });
    // csv_header = ['labels'];
    serviceFullList.forEach(d => {
        d.scale = d3.scaleLinear().range(d.range);
        // csv_header.push('10.10.1.1-' + d.text);
    });
    // if (binopt.clusterMethod === 'leaderbin')
    //     csv_header.push('radius');


    let cluster = dataSpider3.map((d, i) => {
        let temp = {labels: i};
        d.forEach((s, i) => temp[serviceFullList[i].text] = serviceFullList[i].scale(s.value));
        temp.radius = d.bin.distance;
        temp.mse = d.bin.mse;
        temp.index = i;
        temp.__metrics = d.slice();
        temp.__metrics.normalize = temp.__metrics.map((e, i) => e.value);
        const temp_arr = _.groupBy(d.bin.nameob, e => e.timestep);
        temp.arr = d3.range(0, sampleS.timespan.length).map(e => temp_arr[e] ? temp_arr[e].map(f => f.name) : undefined);
        temp.total = d.bin.id.length;
        return temp;
    });

    hosts.forEach(h => sampleS[h.name].arrcluster = sampleS.timespan.map((t, i) => {
        return cluster.findIndex(c => c.arr[i] ? c.arr[i].find(e => e === h.name) : undefined);
    }));

    // cluster.forEach(c => c.arr = c.arr.slice(0, currentindex))

    // callback(cluster);


    postMessage({action: 'done',
        result: cluster
    });
})