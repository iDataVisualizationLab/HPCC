let window = self
importScripts("../../../../HiperView/js/d3.v4.js");
importScripts("../../../../HiperView/js/umap-js.js");
importScripts("../../../../HiperView/js/underscore-min.js");
importScripts("https://unpkg.com/simple-statistics@2.2.0/dist/simple-statistics.min.js");

let canvasopt,totalTime_marker,dataIn,count,timeCalculation;
addEventListener('message',function ({data}){
    switch (data.action) {
        case "initcanvas":
            // canvas = data.canvas;
            canvasopt = data.canvasopt;
            // gl = canvas.getContext("2d");
            break;

        case "initDataRaw":
            let mask = data.mask;
            totalTime_marker = performance.now();
            dataIn = data.value.map(d=>d.filter((e,i)=>mask[i]));
            labels = data.labels;
            count = 0;
            data.opt.nComponents = data.opt.dim;
            const umap = new UMAP(data.opt);
            if (data.opt.supervisor)
                umap.setSupervisedProjection(labels);
            console.log('---init data UMAP-----')
            const nEpochs = umap.initializeFit(dataIn);
            console.log(nEpochs)
            for (let i = 0; i < (1000|| nEpochs); i++) {
            // for (let i = 0; i < (data.opt.nEpochs|| nEpochs); i++) {
                count++;
                let t0 = performance.now();
                umap.step();
                timeCalculation = performance.now()-t0;
                if (i % 5 === 0)render(umap.getEmbedding());
            }
            render(umap.getEmbedding());
            postMessage({action:'stable', status:"done"});
            break;
    }
});

function render(sol){
    let xrange = d3.extent(sol, d => d[0]);
    let yrange = d3.extent(sol, d => d[1]);
    let xscale = d3.scaleLinear().range([0, canvasopt.width]);
    let yscale = d3.scaleLinear().range([0, canvasopt.height]);
    const ratio = canvasopt.height / canvasopt.width;
    if ((yrange[1] - yrange[0]) / (xrange[1] - xrange[0]) > canvasopt.height / canvasopt.width) {
        yscale.domain(yrange);
        let delta = ((yrange[1] - yrange[0]) / ratio - (xrange[1] - xrange[0])) / 2;
        xscale.domain([xrange[0] - delta, xrange[1] + delta])
    } else {
        xscale.domain(xrange);
        let delta = ((xrange[1] - xrange[0]) * ratio - (yrange[1] - yrange[0])) / 2;
        yscale.domain([yrange[0] - delta, yrange[1] + delta])
    }
    postMessage({action:'render',value:{iteration: count,time: timeCalculation,totalTime:performance.now()-totalTime_marker},xscale:{domain:xscale.domain()}, yscale:{domain:yscale.domain()}, sol:sol});
    solution = sol;
}