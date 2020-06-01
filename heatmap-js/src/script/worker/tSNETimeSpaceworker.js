importScripts("../../../../HiperView/js/d3.v4.js");
importScripts("../tsne.js");
// importScripts("../../../../HiperView/js/PCA.js");
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
        case "maxstack":
            maxstack = (data.value);
            break;
        case "initDataRaw":
            tsne = new tsnejs.tSNE(data.opt);
            stopCondition = +('1e'+data.value.stopCondition )||stopCondition;
            totalTime_marker = performance.now();
            dataIn = data.value;

            // // pca - compute cluster position
            // let t0 = performance.now();
            // let pca = new PCA();
            // // console.log(brand_names);
            // let matrix = pca.scale(data.clusterarr, true, true);
            //
            // let pc = pca.pca(matrix, 2);
            //
            // let A = pc[0];  // this is the U matrix from SVD
            // let B = pc[1];  // this is the dV matrix from SVD
            // let chosenPC = pc[2];   // this is the most value of PCA
            // const presetSolution = dataIn.map(d=>{
            //     const i = d.cluster;
            //     let pc1 = A[i][chosenPC[0]];
            //     let pc2 = A[i][chosenPC[1]];
            //     return [pc1,pc2];
            // });
            // console.log('finish init solution with PCA: ', performance.now()-t0)

            // tsne - init datta
            t0 = performance.now();
            console.log('initDataRaw');
            countstack = 0;
            // tsne.initDataRaw_withsolution(dataIn,presetSolution);
            tsne.initDataRaw(dataIn);

            console.log('finish init Data in ', performance.now()-t0);

            // first step
            stop = false;
            t0 = performance.now();
            cost = tsne.step();
            // console.log('cost: '+cost+' time: ',performance.now()-t0);
            timeCalculation = performance.now()-t0;
            render (tsne.getSolution());

            stepstable(cost,tsne.getSolution());

            postMessage({action:data.action, status:"done", maxloop: countstack});
            count = 2;
            if (!stop){
                // for (let i = 0; (i < stepnumber)&&(!stop); i++) {
                while (!stop) {
                    t0 = performance.now();
                    const cost_old = tsne.step();
                    epsilon = (cost - cost_old);
                    stop = (epsilon <stopCondition)&&epsilon >0&&count>100;
                    cost = cost_old;
                    countstack++;
                    sol =tsne.getSolution();
                    timeCalculation = performance.now()-t0;
                    // console.log(`iteration: ${count} cost: ${cost} epsilon: `+ epsilon+' time: ',performance.now()-t0)
                    render (sol);
                    count++;
                    // console.log(sol)
                }

                if (countstack>stack) {
                    countstack =0;
                }
                // postMessage({action: 'clusterCircle', result: getdbscan()});
                // stepstable(cost, tsne.getSolution(),"done");
                // postMessage({action:'stable', status:"done"});
                // postMessage({action: 'step', result: {cost: cost, solution: sol}, status:"done"});
            }
            // render (tsne.getSolution());
            postMessage({action:'stable', status:"done"});
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


function initStore(host,sol,clus){
    costa = [];
    return  host.map((d,i)=>{
        // let temp = [sol[i].slice()];
        let temp = [];
        temp.name = d;
        // temp.dis = 0;
        temp.dis = [0];
        // temp.cluster = [{timeStep:0,val:clus[d]}];
        temp.cluster = [];
        return temp;});
}

function copyStore(store){
    return  store.map((d,i)=>{
        let temp = d.slice();
        temp.name = d.name;
        temp.dis = d.dis;
        return temp;});
}

function updateStore(sol,clus,cost){
    costa.push(cost);
    sol.forEach((s,i)=>{
        const ss = s.slice();
        store_step[i][currentLastIndex+1] = ss;
        // const currentLastIndex = store_step[i].length-2;
        if (currentLastIndex >-1 ) {
            // if (store_step[i].dis[currentLastIndex+1]=== undefined)
            store_step[i].dis[currentLastIndex+1] = (store_step[i].dis[currentLastIndex]||0)+ distance(store_step[i][currentLastIndex], ss);
        }
        // if (store_step[i].cluster[currentLastIndex+1]=== undefined)
        store_step[i].cluster[currentLastIndex+1] = {timeStep:currentLastIndex+1,val:clus[store_step[i].name]};
    });
}

function updateTempStore(sol){ // store data point in a step
    return sol.map((s,i)=>{
        const ss = s.slice();
        store_step_temp[i].push(ss);
        // const currentLastIndex = store_step_temp[i].length-2;
        store_step_temp[i].dis += distance(store_step_temp[i][currentLastIndex],ss);
    });
}

function distance (a,b) {
    let dsum = 0;
    if (b === undefined)
        b = [0,0];
    if (a === undefined)
        a = [0,0];
    a.forEach((d, i) => {
        dsum += (d - b[i]) * (d - b[i])
    });
    return Math.sqrt(dsum);
}
// delete me later
// function getTop10 (store) {
//     return _(store).sortBy(d=>d.dis).reverse().slice(0,20);
// }

function getTop10 (store,requestIndex) {
    let datasort = _(store).sortBy(d=>d.dis[requestIndex||currentMaxIndex]);
    if (groupmethod==="outlier")
        datasort = _(datasort).sortBy(d=>d.cluster[requestIndex||currentMaxIndex].val);
    return datasort.reverse().slice(0,50).map(data=>{
        const NCluster = (requestIndex||currentMaxIndex) +1;
        //if (NCluster>maxstack-1){
        const startpos = Math.max(NCluster - maxstack,0);
        let shortdata = data.slice(startpos,NCluster).filter(d=>d); //remove empty
        shortdata.name = data.name;
        shortdata.clusterS = data.cluster.slice(startpos,NCluster).filter(d=>d);
        shortdata.dis = data.dis;
        shortdata.requested = requestIndex||currentMaxIndex;
        //}
        return shortdata;
    });
}
function calAverage (data) {
    return _(data).unzip().map(function (d){return{mean:ss.mean(d), q1: ss.quantile(d,0.25), q3: ss.quantile(d,0.75)}});
    // return _(data).unzip().map(d=>d3.mean(d));
}
function convertLink (P,ids) {
    const N = ids.length;
    let links =[];
    for (let i = 0; i < N; i++)
        for (let j = i+1; j < N; j++)
            links.push({source: ids[i], target:ids[j], weight: P[i*N+j]});
    return links;
}
let scagOptions ={
    startBinGridSize: 30,
    minBins: 20,
    maxBins: 100,
    outlyingCoefficient: 1.5,
    incrementA:2,
    incrementB:0,
    decrementA:0.5,
    decrementB:0,
};
function findGroups(data,method) {
    switch (method) {
        case 'jLouvain':
            return getComunity ();
        case 'outlier':
            return outlier (data);
        default:
            return outlier (data);
    }
}
function outlier (data) {
    let scag = scagnosticsnd(data.map(d=>{
        let temp = d;
        d.data = d.name;
        return temp;
    }), scagOptions);
    let outlyingPoints = scag.outlyingPoints.map(d=>d.data);
    let group = data.map(d=> outlyingPoints.find(e=>e===d.name)===undefined?0:1);
    return _.object(hostname,group);
}
function getComunity (){
    community.nodes(hostname).edges(convertLink(tsne.getProbability(),hostname));
    return community();
}

function getdbscan () {
    let solution = tsne.getSolution();
    dbscan.eps(0.075).minPts(1).distance('EUCLIDEAN').data(convertPosition(tsne.getSolution(),hostname));
    dbscan();
    return dbscan_cluster2data(dbscan.getClusters(),solution,hostname);

}
let scalev = d3.scaleLinear();
function convertPosition (array,ids) {
    const N = ids.length;
    scalev .domain(d3.extent(_.flatten(array)));
    let points =[];
    for (let i = 0; i < N; i++)
        points.push({x: scalev(array[i][0]), y:scalev(array[i][1])});
    return points;
}
function dbscan_cluster2data (clusters,data,ids) {
    // clusters.forEach(d=>{
    //     d.x = scalev.invert(d.x);
    //     d.y = scalev.invert(d.y);
    //     let distances = d.parts.map(function(p){return distance([d.x, d.y], data[p])});
    //     d.radius = d3.max(distances);
    //     d.members = d.parts.map(e=>ids[e])
    // })
    return clusters.map(d=>d.parts.map(e=>ids[e]));
}

function distance(a, b){
    let dx = a[0] - b[0],
        dy = a[1] - b[1];
    return Math.sqrt((dx * dx) + (dy * dy));
}