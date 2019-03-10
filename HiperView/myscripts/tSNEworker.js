importScripts("../js/d3.v4.js");
importScripts("../js/tsne.js");

let tsne;
let stepnumber = 2;
let cost;
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
                postMessage({action:data.action, status:"done" });
                break;
            case "updateData":
                tsne.updateData(data.value);
                for (let  i =0; i<10;i++) {
                    cost = tsne.step();
                    postMessage({action:'step', result: {cost: cost, solution: tsne.getSolution()}});
                }
                postMessage({action:data.action, status:"done" });
                break;
            case "option":
                stepnumber = data.value;
                break;
            case "step":
                for (let i = 0; i < stepnumber; i++)
                    cost = tsne.step();
                postMessage({action: 'step', result: {cost: cost, solution: tsne.getSolution()}, status:"done"});
                break;
        }
});