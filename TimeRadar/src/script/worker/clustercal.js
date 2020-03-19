window =self;
importScripts("../../../../HiperView/js/d3.v4.js",
    "../../../../HiperView/myscripts/setting.js",
    "../../../../HiperView/js/lodash.min.js",
    "../setting.js","../../../../HiperView/js/kmean.js",
    "../../../../HiperView/js/binnerN.min.js",
    "../../../../HiperView/js/binarybin.min.js",
    "../../../../HiperView/js/simple-statistics.min.js");


addEventListener('message',function ({data}) {
    let binopt = data.binopt, sampleS = data.sampleS, hosts = data.hosts, timeMax = data.timeMax;
    serviceFullList = data.serviceFullList;
    serviceLists = data.serviceLists;
    serviceList_selected = data.serviceList_selected;
    serviceListattr = data.serviceListattr;
    distance = binopt.normMethod === 'l1' ? distanceL1 : distanceL2;
    customCluster = data.customCluster;

    serviceFullList.forEach(d => {
        d.scale = d3.scaleLinear().range(d.range);
        // csv_header.push('10.10.1.1-' + d.text);
    });
    let bin;
    var arr = [];
    var dataSpider3 = [];
    let cluster;
    if (!customCluster) {
        postMessage({
            action: 'returnData',
            result: {message: `Normalize data`, process: 10}
        });
        for (var i = 0; i < timeMax; i++) {
            for (var h = 0; h < hosts.length; h++) {
                var name = hosts[h].name;
                if (sampleS[name]) {
                    arrServices = sampleS[name][i].map((d,i)=>serviceFullList[i].enable?d:0);
                    arrServices.name = name;
                    arrServices.indexSamp = i;
                    arrServices.id = h;
                    dataSpider3.push(arrServices);
                }
            }
        }

        // remove outlying
        dataSpider3 = dataSpider3.filter(d => !d.outlier);
        console.log(dataSpider3.length)
        postMessage({
            action: 'returnData',
            result: {message: `Binning process`, process: 40}
        });
        switch (binopt.clusterMethod) {
            case 'leaderbin':
                let estimateSize = Math.max(2, Math.pow(binopt.bin.range[1], 1 / dataSpider3[0].length));
                console.log('estimateSize: ' + estimateSize);
                bin = binnerN().startBinGridSize(estimateSize).isNormalized(true).minNumOfBins(binopt.bin.range[0]).maxNumOfBins(binopt.bin.range[1]).distanceMethod(binopt.normMethod).coefficient({
                    reduce_coefficient: 0.3,
                    reduce_offset: 0,
                    increase_coefficient: 2,
                    increase_offset: 0
                }).data([]);
                break;
            case 'binarybin':
                bin = binarybin([],{isNormalized:true});
                break;
            default:
                bin = kmeanCluster;
                bin.k(binopt.bin.k);
                bin.distanceMethod(binopt.normMethod);
                bin.iterations(binopt.bin.iterations);
                break;
        }
        let process = 50;
        let w = 25;
        bin.callback(function (iteration) {
            process = process + w;
            w = w / 2;
            postMessage({
                action: 'returnData',
                result: {message: `# iterations: ${iteration}`, process: process}
            })
        });
        // bin.data([]).minNumOfBins(8).maxNumOfBins(11);
        bin.data(dataSpider3.map((d, i) => {
            var dd = d.slice();
            dd.data = {name: d.name, id: d.id, indexSamp: d.indexSamp};
            return dd;
        }))
            .calculate();

        // postMessage({
        //     action: 'returnData',
        //     result: {message: `# iterations: ${bin.loopcount}`, process: 99}
        // });

        var keys = serviceFullList.map(d=>d.text);
        dataSpider3.length = 0;
        console.log("numBins: " + bin.bins.length);
        const binRadius = bin.binRadius;
        dataSpider3 = bin.bins.map(d => {
            var temp;
            if (bin.normalizedFun)
                temp = bin.normalizedFun.scaleBackPoint(d.val).map((e, i) => {
                    let temparr = d.map(e => e[i]);
                    return {
                        axis: keys[i], value: e,
                        minval: ss.min(temparr),
                        maxval: ss.max(temparr),
                        // mean: ss.mean(temparr),
                    }
                });
            else
                temp = d.val.map((e, i) => {
                    let temparr = d.map(e => e[i]);
                    return {
                        axis: keys[i], value: e,
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
            temp.bin.mse = ss.sum(temp.map(e => (e.maxval - e.minval) * (e.maxval - e.minval)));
            if (bin.normalizedFun)
                temp.bin.val = bin.normalizedFun.scaleBackPoints(d);
            else
                temp.bin.val = d.slice();
            return temp;
        });
        cluster = dataSpider3.map((d, i) => {
            let temp = {labels: i};
            d.forEach((s, i) => temp[serviceFullList[i].text] = serviceFullList[i].scale(s.value));
            temp.radius = binRadius||d.bin.distance;
            temp.mse = d.bin.mse;
            temp.index = i;
            temp.__metrics = d.slice();
            temp.__metrics.normalize = temp.__metrics.map((e, i) => e.value);
            const temp_arr = _.groupBy(d.bin.nameob, e => e.timestep);
            temp.arr = d3.range(0, timeMax).map(e => temp_arr[e] ? temp_arr[e].map(f => f.name) : undefined);
            temp.total = d.bin.id.length;
            return temp;
        });

    }else{
        customCluster.forEach(d=>d.arr = []);
        // re-assign cluster
        cluster = customCluster;
        let temp_collection = d3.range(0,cluster.length).map(()=>[]);
        for (var i = 0; i < timeMax; i++) {
            for (var h = 0; h < hosts.length; h++) {
                var name = hosts[h].name;
                arrServices = getDataByName(sampleS, name, i, i, 0,0);
                arrServices.name = name;
                arrServices.indexSamp = i;
                arrServices.id = h;
                let min = Infinity;
                let ci =0;
                cluster.forEach((c,i)=>{
                    let dis = distance(arrServices,c.__metrics.normalize);
                    if (dis<min) {
                        min = dis;
                        ci = i;
                    }
                });
                temp_collection[ci].push(arrServices);
                arr.push(arrServices);
            }
        }
        // ----recalculate centroid - kmean

        temp_collection.forEach((d,i)=>{
            if (d.length!==0) {
                serviceFullList.forEach((s, si) => {
                    let current = d3.mean(d.map(e => e[si]));
                    cluster[i].__metrics.normalize[si] = current;
                    cluster[i].__metrics[si] = {
                        axis: s.text, value: current,
                        mean: current,
                    };
                    cluster[i][s.text] = s.scale(current);
                });
            }else{
                cluster[i].__isEmpty = true
            }
        });
        cluster = cluster.filter(c=>!c.__isEmpty);
        // check member 2nd time
        for (var i = 0; i < sampleS.timespan.length; i++) {
            for (var h = 0; h < hosts.length; h++) {
                let arrServices = arr[i*hosts.length + h];
                let min = Infinity;
                let ci =0;
                cluster.forEach((c,i)=>{
                    let dis = distance(arrServices,c.__metrics.normalize);
                    if (dis<min) {
                        min = dis;
                        ci = i;
                    }
                });
                if (!cluster[ci].arr[i])
                    cluster[ci].arr[i] = [];
                cluster[ci].arr[i].push(arrServices.name);
                // serviceFullList.forEach((s,si)=>{
                //     if (arrServices[si]!==undefined && arrServices[si]<d.__metrics[si].minval) {
                //         d.__metrics[si].minval = Math.min(d.__metrics[si].minval, arrServices[si]);
                //     }
                //     if (arrServices[si]!==undefined && arrServices[si]>d.__metrics[si].maxval) {
                //         d.__metrics[si].maxval = Math.max(d.__metrics[si].minval, arrServices[si]);
                //     }
                // });
            }
        }
    }
    // csv_header = ['labels'];
    // if (binopt.clusterMethod === 'leaderbin')
    //     csv_header.push('radius');


    // hosts.forEach(h => sampleS[h.name].arrcluster = sampleS.timespan.map((t, i) => {
    //     return cluster.findIndex(c => c.arr[i] ? c.arr[i].find(e => e === h.name) : undefined);
    // }));

    // cluster.forEach(c => c.arr = c.arr.slice(0, currentindex))

    // callback(cluster);


    postMessage({action: 'done',
        result: cluster
    });
})