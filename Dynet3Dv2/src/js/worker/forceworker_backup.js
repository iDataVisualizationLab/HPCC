let window = self
importScripts("../../../../HiperView/js/d3.v4.js");
importScripts("../../../../HiperView/js/umap-js.js");
importScripts("../../../../HiperView/js/underscore-min.js");
// importScripts("https://unpkg.com/simple-statistics@2.2.0/dist/simple-statistics.min.js");
let canSend = false;
let minAlpha = 1;
let canvasopt, totalTime_marker, dataIn, count, timeCalculation;
addEventListener('message', function ({data}) {
    switch (data.action) {
        case "initDataRaw":
            postMessage({action: 'message', value: {'percentage': 20, 'message': 'Data received. Process data...'}});
            totalTime_marker = performance.now();

            const net = data.value;
            const root_nodes = {};
            const links=[];
            if (net.length) {
                net.forEach(function (n, ni) {
                    const nodes = n.nodes;
                    n.links.forEach(l=>links.push(l));
                    if (ni) {
                        nodes.forEach(n => {
                            root_nodes[n.id] = n.parent;
                            // delete n.parent.x;
                            // delete n.parent.y;
                        })
                    } else {
                        nodes.forEach(n => {
                            root_nodes[n.id] = n.parent;
                        });
                    }
                    if (n.deletedLinks) {
                        n.deletedLinks = n.deletedLinks.map(l => {
                            return {
                                source: root_nodes[l.source],
                                target: root_nodes[l.target],
                                value: l.value,
                                color: 'rgb(255,0,0)',
                                isDelete: true
                            };
                        });
                    }
                });



                const nodes = Object.values(root_nodes);
                const force = d3.forceSimulation()
                    .force("charge", d3.forceManyBody().strength(-10))
                    .force("link", d3.forceLink().id(d => d.id))
                    .on('tick',function(){
                        minAlpha = force.alpha();
                        // if (minAlpha<0.001)
                        //     postMessage({
                        //         action: 'stable',
                        //         value: {totalTime: performance.now() - totalTime_marker, alpha: minAlpha},
                        //         status: "done",
                        //         sol: net
                        //     });
                    }).on('end',function(){
                        postMessage({
                            action: 'stable',
                            value: {totalTime: performance.now() - totalTime_marker, alpha: minAlpha},
                            status: "done",
                            sol: net
                        });
                    });

                force.nodes(nodes);
                force.force("link").links(links);
                postMessage({action: 'updateHighlight', sol: net});


                break;
            } else {
                postMessage({
                    action: 'stable',
                    value: {totalTime: performance.now() - totalTime_marker},
                    status: "done",
                    sol: undefined
                });
            }
    }
});
