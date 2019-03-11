importScripts("../js/d3.v4.js");
importScripts("../js/tsne.js");
importScripts("../js/underscore-min.js");

let tsne,
    stepnumber = 2,
    cost,
    store_step;
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
                initStore(data.value,tsne.getSolution());
                postMessage({action:data.action, status:"done" });
                break;
            case "updateData":
                tsne.updateData(data.value);
                for (let  i =0; i<10;i++) {
                    cost = tsne.step();
                    const sol =tsne.getSolution();
                    postMessage({action:'step', result: {cost: cost, solution: sol}});
                }
                postMessage({action:data.action, status:"done" });
                break;
            case "updateTracker":
                updateStore(tsne.getSolution());
                postMessage({action:data.action,  status:"done", value: getTop10 () });
                break;
            case "option":
                stepnumber = data.value;
                break;
            case "step":
                for (let i = 0; i < stepnumber; i++) {
                    cost = tsne.step();
                }
                const sol =tsne.getSolution();
                postMessage({action: 'step', result: {cost: cost, solution: sol}, status:"done"});
                break;
        }
});
function initStore(initdata,sol){
    store_step = initdata.map((d,i)=>{
        let temp = [sol[i].slice()];
        temp.name = d.name;
        temp.dis = 0;
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

function distance (a,b) {
    let dsum = 0;
    a.forEach((d, i) => {
        dsum += (d - b[i]) * (d - b[i])
    });
    return Math.sqrt(dsum);
}

function getTop10 () {
    return _(store_step).sortBy(d=>d.dis).reverse().slice(0,10);
}