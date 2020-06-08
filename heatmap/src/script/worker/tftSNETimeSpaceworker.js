let window = self;
importScripts("../../../../HiperView/js/d3.v4.js");
importScripts("../../../../HiperView/js/tfjs.js");
importScripts("../../../../HiperView/js/tfjs-tsne.js");
importScripts("../../../../HiperView/js/underscore-min.js");
importScripts("https://unpkg.com/simple-statistics@2.2.0/dist/simple-statistics.min.js");
// importScripts("../../../../HiperView/js/jLouvain.js");
// importScripts("../../../../HiperView/js/scagnosticsnd.min.js");
// importScripts("../../../../HiperView/js/jDBSCAN.js");
let tsne,sol,
    stepnumber = 5,
    countstack =0,
    stack = 200,
    count,
    cost,
    costa =[],
    stop = false,
    store_step,
    store_step_temp,
    hostname,
    stopCondition =1e-4,
    groups,
    groupmethod = "outlier",
    currentMaxIndex =-1,
    requestIndex = 0
    currentLastIndex = -1;
let geTopComand = _.once(stepstable);
let average;
let maxstack = 10;
// render
let canvas, gl,colorarr;
let canvasopt ;
let dataIn;
let solution;
let initpos;
let epsilon,totalTime_marker;
let timeCalculation=0;
function stepstable (cost , solution,status){
    render (solution);
    // postMessage({action: 'cluster', result: community});
    postMessage({action:'step', result: {cost: cost, solution: solution}, maxloop: countstack, status: status||"running"});
}
addEventListener('message',function ({data}){
        switch (data.action) {
            case "initcanvas":
                // canvas = data.canvas;
                canvasopt = data.canvasopt;
                // gl = canvas.getContext("2d");
                break;
            case "inittsne":
                tsne = self.tsne.tsne;
                // stopCondition = +('1e'+data.value.stopCondition )||stopCondition;
                // currentMaxIndex = -1;
                // currentLastIndex = -1;
                stop = false;
                break;
            case "maxstack":
                maxstack = (data.value);
                break;
            case "initDataRaw":
                async function iterativeTsne() {
                    // Get the suggested number of iterations to perform.
                    const knnIterations = tsne.knnIterations();
                    // Do the KNN computation. This needs to complete before we run tsne
                    for(let i = 0; i < knnIterations; ++i){
                        await tsne.iterateKnn();
                        // You can update knn progress in your ui here.
                    }
                    console.log('finish init Data in ', performance.now()-t0);

                    const tsneIterations = 1000;
                    for(let i = 0; i < tsneIterations; ++i){
                        t0 = performance.now();
                        await tsne.iterate();
                        // Draw the embedding here...
                        const coordinates = tsne.coordinates();
                        timeCalculation = performance.now()-t0;
                        render (coordinates);
                        count++;
                    }
                    postMessage({action:'stable', status:"done"});
                }
                totalTime_marker = performance.now();
                dataIn = window.tf.tensor(data.value);
                count = 1;
                // tsne - init datta
                t0 = performance.now();
                console.log('initDataRaw');
                tsne = tsne(dataIn);
                iterativeTsne();
                break;

            case "colorscale":
                colorarr = data.value;
                break;

                break;
        }
});

// animation ();

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
    postMessage({action:'render',value:{iteration: count,cost: cost,deltacost: epsilon,time: timeCalculation, totalTime:performance.now()-totalTime_marker},xscale:{domain:xscale.domain()}, yscale:{domain:yscale.domain()}, sol:sol});
    solution = sol;
}
