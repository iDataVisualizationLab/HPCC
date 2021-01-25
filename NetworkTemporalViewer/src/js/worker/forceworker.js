let window = self
importScripts("../../../../HiperView/js/d3.v4.js");
importScripts("../../../../HiperView/js/umap-js.js");
importScripts("../../../../HiperView/js/underscore-min.js");
importScripts("https://unpkg.com/simple-statistics@2.2.0/dist/simple-statistics.min.js");

let canvasopt,totalTime_marker,dataIn,count,timeCalculation;
addEventListener('message',function ({data}){
    switch (data.action) {
        case "initDataRaw":
            postMessage({action:'message', value:{'percentage':20,'message':'Data received. Process data...'}});
            totalTime_marker = performance.now();

            const net = data.value;
            net.forEach(function(n){
                const nodes = n.nodes;
                const links = n.links;
                const force = d3.forceSimulation()
                    .force("charge", d3.forceManyBody().strength(-10))
                    .force("link", d3.forceLink().id(d => d.id))
                    .force("x", d3.forceX())
                    .force("y", d3.forceY())
                    .on("tick", ticked);
                force.stop();

                function ticked() {
                    const alpha = force.alpha();
                    n.nodes.forEach(d=>{
                        d.x += (d3.mean(d.parent.timeArr,e=>e.x)-d.x)*alpha*0.8;
                        d.y += (d3.mean(d.parent.timeArr,e=>e.y)-d.y)*alpha*0.8;
                    });
                    postMessage({action:'render',value:{time: timeCalculation,totalTime:performance.now()-totalTime_marker}, sol:net});
                }
                force.nodes(nodes);
                force.force("link").links(links);
                force.alphaTarget(0.02).restart();
                force.on('end',()=>postMessage({action:'stable', status:"done"}));
            });
            break;
    }
});
