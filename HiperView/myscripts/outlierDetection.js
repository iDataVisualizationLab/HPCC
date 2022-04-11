function outlier(){
    console.time('outline:');
    let dataSpider3 = [];
    scaleService = serviceFullList.map(d=>d3.scaleLinear().domain(d.range));
    for (var i = 0; i < sampleS.timespan.length; i++) {
        for (var h = 0; h < hosts.length; h++) {
            var name = hosts[h].name;
            arrServices = tsnedata[name][i];
            arrServices.nameid = h;
            if (arrServices.__valwithNull.findIndex(d=>!_.isNumber(d)|| isNaN(d))===-1)
                dataSpider3.push(arrServices);
            else
                arrServices.outlier=2;
        }
    }
    let estimateSize = Math.max(1, Math.pow(500, 1 / dataSpider3[0].length));
    console.log('estimateSize:',estimateSize);
    let scagOptions ={
        isNormalized: true,
        startBinGridSize: estimateSize,
        // minBins: 20,
        // maxBins: Math.sqrt(dataSpider3.length),
        outlyingCoefficient: 1.5,
        // incrementA:2,
        // incrementB:0,
        // decrementA:1 / 3,
        // decrementB:0,
    };
    // scag = scagnosticsnd(handledata(index), scagOptions);
    let outlyingBins = [];
    outlyingBins.pointObject = {};
    // outlyingBins.compObject = {};
    // remove outlying
    let scag = scagnosticsnd(dataSpider3.map((d, i) => {
        var dd = d.slice();
        dd.data = d;
        return dd;
    }), scagOptions);
    console.timeEnd('outline:');
    console.log('Total bin=' + scag.bins.length);
    console.log('Outlying bin=' +scag.outlyingBins.length);

    dataSpider3.forEach(d => {
        delete d.outlier;
        delete d.cluster;});

    scag.outlyingBins.map((ob,i)=>{
        let arr = ob.map(o=>{
            let d = o.data;
            d.outlier = 1;
            d.cluster = -i-1;
            let temp = serviceFullList.map((s,si)=>({axis:s.text, value: d[si]}));
            temp.name = d.name+'_'+d.timestep;
            temp.timestep = d.timestep;
            temp.cluster =  -i-1;
            outlyingBins.pointObject[temp.name] = temp;
            // if (!outlyingBins.compObject[d.name]){
            //     outlyingBins.compObject[d.name] = []
            // }
            // outlyingBins.compObject[d.name].push(d);
            return outlyingBins.pointObject[temp.name];
        });
        let temp = {labels: -i-1};
        ob.site.forEach((s, i) => temp[serviceFullList[i].text] = scaleService[i](s));
        temp.index = -i-1;
        temp.__metrics = serviceFullList.map((s,si)=>({axis:s.text, value: ob.site[si]}));
        temp.__metrics.normalize = ob.site.slice();
        temp.arr = arr;
        temp.name='outlier'
        outlyingBins.push(temp);
    });

    return outlyingBins;
}
