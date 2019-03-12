importScripts("../js/d3.v4.js");
importScripts("../js/tsne.js");
importScripts("../js/underscore-min.js");

let tsne,sol,
    stepnumber = 2,
    countstack =0,
    stack = 20,
    cost,
    stop = false,
    store_step,
    store_step_temp,
    hostname;
addEventListener('message',function ({data}){
        switch (data.action) {
            case "inittsne":
                tsne = new tsnejs.tSNE(data.value);
                break;
            case "initDataRaw":
                tsne.initDataRaw(data.value);

                for (let  i =0; i<5;i++) {
                    cost = tsne.step();
                    postMessage({action:'step', result: {cost: cost, solution: tsne.getSolution()}});
                }
                hostname = data.value.map(d=>d.name);
                store_step = initStore(hostname,tsne.getSolution());
                store_step_temp = copyStore(store_step);
                postMessage({action:data.action, status:"done" });
                countstack = 0;
                break;
            case "updateData":
                tsne.updateData(data.value);
                stop = false;
                for (let  i =0; i<10 &&(!stop);i++) {
                    const cost_old = tsne.step();
                    stop = Math.abs(cost_old - cost) <0.0001;
                    cost = cost_old;
                    countstack++;
                    // const sol =tsne.getSolution();
                    // postMessage({action:'step', result: {cost: cost, solution: sol}});
                }
                sol =tsne.getSolution();
                updateTempStore(sol);
                if (countstack>stack){
                    postMessage({action:'updateTracker', top10: getTop10 (store_step_temp)});
                    countstack =0;
                }
                postMessage({action:'step', result: {cost: cost, solution: sol}});
                postMessage({action:data.action, status:"done" });
                break;
            case "updateTracker":
                updateStore(tsne.getSolution());
                postMessage({action:data.action,  status:"done", top10: getTop10 (store_step) });
                store_step_temp = copyStore(store_step);
                break;
            case "option":
                stepnumber = data.value;
                break;
            case "step":
                if (!stop)
                for (let i = 0; (i < stepnumber)&&(!stop); i++) {
                    const cost_old = tsne.step();
                    stop = Math.abs(cost_old - cost) <0.00001;
                    cost = cost_old;
                    countstack++;
                }
                sol =tsne.getSolution();
                updateTempStore(sol);
                if (countstack>stack){
                    postMessage({action:'updateTracker', top10: getTop10 (store_step_temp)});
                    countstack =0;
                }
                postMessage({action: 'step', result: {cost: cost, solution: sol}, status:"done"});
                break;
        }
});
function initStore(host,sol){
    return  host.map((d,i)=>{
        let temp = [sol[i].slice()];
        temp.name = d;
        temp.dis = 0;
        return temp;});
}
function copyStore(store){
    return  store.map((d,i)=>{
        let temp = d.slice();
        temp.name = d.name;
        temp.dis = d.dis;
        return temp;});
}
function updateStore(sol){
    sol.forEach((s,i)=>{
        const ss = s.slice();
        store_step[i].push(ss);
        const currentLastIndex = store_step[i].length-2;
        store_step[i].dis += distance(store_step[i][currentLastIndex],ss);
        });
}

function updateTempStore(sol){ // store data point in a step
    return sol.map((s,i)=>{
        const ss = s.slice();
        store_step_temp[i].push(ss);
        const currentLastIndex = store_step_temp[i].length-2;
        store_step_temp[i].dis += distance(store_step_temp[i][currentLastIndex],ss);
    });
}

function distance (a,b) {
    let dsum = 0;
    a.forEach((d, i) => {
        dsum += (d - b[i]) * (d - b[i])
    });
    return Math.sqrt(dsum);
}

function getTop10 (store) {
    return _(store).sortBy(d=>d.dis).reverse().slice(0,20);
}