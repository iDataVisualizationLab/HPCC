importScripts("../../js/d3.v4.js");
importScripts("../../js/tsne.js");
importScripts("../../js/underscore-min.js");
importScripts("https://unpkg.com/simple-statistics@2.2.0/dist/simple-statistics.min.js");
// importScripts("../../js/jLouvain.js");
// importScripts("../../js/scagnosticsnd.min.js");
// importScripts("../../js/jDBSCAN.js");
let tsne,sol,
    stepnumber = 5,
    countstack =0,
    stack = 200,
    cost,
    costa =[],
    stop = false,
    store_step,
    store_step_temp,
    hostname,
    stopCondition =1e-4,
    community = jLouvain(),
    dbscan = jDBSCAN(),
    groups,
    groupmethod = "outlier",
    currentMaxIndex =-1,
    requestIndex = 0
    currentLastIndex = -1;
let geTopComand = _.once(stepstable);
let average;
let maxstack = 10;
function stepstable (cost , solution,community,status){
    postMessage({action: 'cluster', result: community});
    postMessage({action:'step', result: {cost: cost, solution: solution}, maxloop: countstack, status: status||"running"});
}
addEventListener('message',function ({data}){
        switch (data.action) {
            case "inittsne":
                tsne = new tsnejs.tSNE(data.value);
                currentMaxIndex = -1;
                currentLastIndex = -1;
                stop = false;
                break;
            case "maxstack":
                maxstack = (data.value);
                break;
            case "initDataRaw":
                let mask = data.mask;
                let dataIn = data.value.map(d=>d.filter((e,i)=>mask[i]));
                console.log('initDataRaw')
                countstack = 0;
                tsne.initDataRaw(dataIn);
                if (data.index===undefined) {
                    currentMaxIndex = -1;
                    currentLastIndex = -1;
                }else{
                    currentMaxIndex = data.index-1;
                    currentLastIndex = data.index-1;
                }
                requestIndex = 0;
                stop = false;
                let cost_first = tsne.step();
                for (let  i =0; i<4;i++) {
                    cost = tsne.step();
                    countstack++;
                }
                stop = ((cost - cost_first) <stopCondition)&&(cost - cost_first) >0;
                hostname = data.value.map(d=>d.name);
                //jLouvain-------
                // community.nodes(hostname).edges(convertLink(tsne.getProbability(),hostname));
                // var result  = community();
                var result = findGroups(data.value,'outlier');
                groups = result;
                // postMessage({action:'cluster', result: result});
                //---------------
                store_step = initStore(hostname,tsne.getSolution());
                store_step_temp = copyStore(store_step);

                stepstable(cost,tsne.getSolution(),result);
                // postMessage({action:'step', result: {cost: cost, solution: tsne.getSolution()}});
                postMessage({action:data.action, status:"done", maxloop: countstack});
                break;
            case "updateData":
                // tsne.updateData(data.value);
                // stop = false;
                // for (let  i =0; i<10 &&(!stop);i++) {
                //     const cost_old = tsne.step();
                //     stop = Math.abs(cost_old - cost) <0.0001;
                //     cost = cost_old;
                //     countstack++;
                //     // const sol =tsne.getSolution();
                //     // postMessage({action:'step', result: {cost: cost, solution: sol}});
                // }
                // sol =tsne.getSolution();
                // updateTempStore(sol);
                // if (countstack>stack){
                //     postMessage({action:'updateTracker', top10: getTop10 (store_step_temp)});
                //     countstack =0;
                // }
                countstack = 0;
                requestIndex = data.index;
                // average = calAverage (data.value);
                // postMessage({action: 'mean', val: average});
                stop = false;
                if (requestIndex > currentMaxIndex ) {
                    // UPDATE
                    tsne.updateData(data.value);
                    for (let i = 0; i < 2 && (!stop); i++) {
                        const cost_old = tsne.step();
                        stop = ((cost_old - cost) < stopCondition) && (cost_old - cost) > 0;
                        cost = cost_old;
                        countstack++;
                        //postMessage({action:'step', result: {cost: cost, solution: tsne.getSolution()}});
                    }
                    //jLouvain-------
                    // community.edges(convertLink(tsne.getProbability(), hostname));
                    // var result = community();
                    var result = findGroups(data.value,'outlier')
                    postMessage({action: 'clusterCircle', result: getdbscan()});
                    groups = result;
                    // postMessage({action: 'cluster', result: result});
                    //---------------
                    stepstable(cost,tsne.getSolution(),result);
                    // if (stop)
                    //     stepstable(cost,tsne.getSolution(),result);
                }else{
                    stop = true;
                    groups = {};
                    store_step.forEach((d,i)=>groups[d.name] = d.cluster[requestIndex])
                    stepstable(costa[requestIndex], store_step.map((d,i)=>d[requestIndex]),groups)
                }
                // postMessage({action:'step', result: {cost: cost, solution: sol}});
                postMessage({action:data.action, status:"done", maxloop: countstack});
                break;
            case "updateTracker":
                // updateStore(tsne.getSolution());
                if (requestIndex > currentMaxIndex ||currentMaxIndex===0 ) {
                    currentMaxIndex = requestIndex;
                    currentLastIndex = currentMaxIndex-1;
                    updateStore(tsne.getSolution(), groups,cost);
                    currentLastIndex = currentMaxIndex;
                    // store_step_temp = copyStore(store_step);
                }
                postMessage({action:data.action,  status:"done", top10: getTop10 (store_step,requestIndex) });
                // store_step_temp = copyStore(store_step);
                break;
            case "option":
                stepnumber = data.value;
                break;
            case "step":
                if (!stop){
                    for (let i = 0; (i < stepnumber)&&(!stop); i++) {
                        const cost_old = tsne.step();
                        stop = ((cost_old - cost) <stopCondition)&&(cost_old - cost) >0;
                        cost = cost_old;
                        countstack++;
                        sol =tsne.getSolution();
                    }
                    //jLouvain-------
                    // community.edges(convertLink(tsne.getProbability(), hostname));
                    // var result = findGroups(data.value)
                    // postMessage({action: 'imform',status: stop?"stable":"done"});
                    //---------------
                    // sol =tsne.getSolution();
                    // updateTempStore(sol);
                    // if (countstack>stack || stop){
                    //     postMessage({action:'updateTracker', top10: getTop10 (store_step_temp)});
                    //     countstack =0;
                    // }
                    if (countstack>stack) {
                        countstack =0;
                    }
                    // postMessage({action: 'clusterCircle', result: getdbscan()});
                    stepstable(cost, tsne.getSolution(), groups,"done");
                    // postMessage({action:'stable', status:"done"});
                    // postMessage({action: 'step', result: {cost: cost, solution: sol}, status:"done"});
                }
                postMessage({action:'stable', status:"done"});
                break;
        }
});
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
    var datasort = _(store).sortBy(d=>d.dis[requestIndex||currentMaxIndex]);
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
        var temp = d;
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
    //     var distances = d.parts.map(function(p){return distance([d.x, d.y], data[p])});
    //     d.radius = d3.max(distances);
    //     d.members = d.parts.map(e=>ids[e])
    // })
    return clusters.map(d=>d.parts.map(e=>ids[e]));
}

function distance(a, b){
    var dx = a[0] - b[0],
        dy = a[1] - b[1];
    return Math.sqrt((dx * dx) + (dy * dy));
}