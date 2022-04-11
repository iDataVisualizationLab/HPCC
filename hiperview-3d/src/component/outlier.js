import * as d3 from "d3"
import * as _ from "lodash"
// eslint-disable-next-line no-restricted-globals
import scagnosticsnd from "./scagnosticsnd.min"

export function outlier({data=[],dimensions=[],outlyingCoefficient=1.5}){
    let dataSpider3 = [];
    const missingData = {};
    const indexs = d3.range(0,dimensions.length-1);
    data.forEach(d=>{
        const indexMissing = indexs.filter(i=>!_.isNumber(d[i]));
        if (indexMissing.length){
            d.outlier = 2; //missing
            d.cluster = 'missing';
            d.indexMissing = indexMissing;
            missingData[d.key+'_'+d.timestep] = (d);
        }else{
            delete d.outlier;
            delete d.cluster;
            delete d.indexMissing;
            dataSpider3.push(d);
        }
    });
    // let estimateSize = Math.max(1, Math.pow(500, 1 / dataSpider3[0].length));
    // console.log('estimateSize:', estimateSize);
    let scagOptions ={
        isNormalized: true,
        // isBinned:false,
        // startBinGridSize: estimateSize,
        outlyingCoefficient,
    };


    let outlyingBins = [];
    outlyingBins.pointObject = {};
    outlyingBins.missingData = missingData;

    let scag = window.scagnosticsnd(dataSpider3.map((d, i) => {
        var dd = d.filter((d,i)=>dimensions[i].enable);
        dd.data = d;
        return dd;
    }), scagOptions);
    console.timeEnd('outline:');
    // console.log('Total bin=' + scag.bins.length);
    console.log('Outlying bin=' +scag.outlyingBins.length);



    scag.outlyingBins.map((ob,i)=>{
        let temp2 = {labels: -i-1,compObject:{}};

        let arr = ob.map((o)=>{
            let d = o.data;
            d.outlier = 1;
            d.cluster = 'outlier';
            d.clusterIndex = -i-1;
            let temp  = dimensions.map((s,si)=>({axis:s.text, value: d[si],angle: s.angle}));
            temp.key = d.key+'_'+d.timestep;
            temp.nodeName = d.key;
            temp.timestep = d.timestep;
            temp.cluster =  'outlier';
            temp.clusterIndex =  -i-1;
            outlyingBins.pointObject[temp.key] = temp;
            if (!temp2.compObject[d.key]){
                temp2.compObject[d.key] = []
            }
            temp2.compObject[d.key].push(d);
            return outlyingBins.pointObject[temp.key];
        });

        ob.site.forEach((s, i) => temp2[dimensions[i].text] = dimensions[i].scale.invert(s));
        temp2.index = -i-1;

        temp2.__metrics = dimensions.map((s,si)=>({axis:s.text, value: ob.site[si], angle: s.angle}));
        temp2.__metrics.normalize = ob.site.slice();
        temp2.arr = arr;
        outlyingBins.push(temp2);
    });
    console.log('#Outlier: ',Object.values(outlyingBins.pointObject).length)
    console.log(outlyingBins)
    return outlyingBins;
}
