const scagMetrics = [{"text":"Outlying score","id":0,"enable":true,"idroot":0,"angle":0,"range":[0,1],"attr":"outlyingScore"},{"text":"Skewed score","id":1,"enable":true,"idroot":1,"angle":0.3490658503988659,"range":[0,1],"attr":"skewedScore"},{"text":"Sparse score","id":2,"enable":true,"idroot":2,"angle":0.6981317007977318,"range":[0,1],"arr":"sparseScore","attr":"sparseScore"},{"text":"Clumpy score","id":3,"enable":true,"idroot":3,"angle":1.0471975511965976,"range":[0,1],"attr":"clumpyScore"},{"text":"Striated score","id":4,"enable":true,"idroot":4,"angle":1.3962634015954636,"range":[0,1],"attr":"striatedScore"},{"text":"Convex score","id":5,"enable":true,"idroot":5,"angle":1.7453292519943295,"range":[0,1],"attr":"convexScore"},{"text":"Skinny score","id":6,"enable":true,"idroot":6,"angle":2.0943951023931953,"range":[0,1],"attr":"skinnyScore"},{"text":"Stringy score","id":7,"enable":true,"idroot":7,"angle":2.443460952792061,"range":[0,1],"attr":"stringyScore"},{"text":"Monotonic score","id":8,"enable":true,"idroot":8,"angle":2.792526803190927,"range":[0,1],"attr":"monotonicScore"}];
let scagOpt = {
    binType: 'leader',
    startBinGridSize: 20,
    isNormalized: true,
    isBinned: false,
    minBins: 10,
    maxBins: 250,
    outlyingUpperBound:3
};
function scag2string(scag){
    let temp = {};
    // temp['normalizedPoints']=scag.normalizedPoints;
    scagMetrics.forEach(s=>temp[s.attr] = scag[s.attr])
    return _.clone(temp)
}
