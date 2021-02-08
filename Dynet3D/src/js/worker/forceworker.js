let window = self
importScripts("../../../../HiperView/js/d3.v4.js");
importScripts("../../../../HiperView/js/umap-js.js");
importScripts("../../../../HiperView/js/underscore-min.js");
// importScripts("https://unpkg.com/simple-statistics@2.2.0/dist/simple-statistics.min.js");
let canSend=false;
let minAlpha = 1;
let canvasopt,totalTime_marker,dataIn,count,timeCalculation;
addEventListener('message',function ({data}){
    switch (data.action) {
        case "initDataRaw":
            postMessage({action:'message', value:{'percentage':20,'message':'Data received. Process data...'}});
            totalTime_marker = performance.now();

            const net = data.value;
            const forces = [];
            const root_nodes = {};
            if (net.length){
            net.forEach(function(n,ni){
                const nodes = n.nodes;
                const links = n.links;
                const force = d3.forceSimulation()
                    .force("charge", d3.forceManyBody().strength(-10))
                    .force("link", d3.forceLink().id(d => d.id))
                    // .force("x", d3.forceX())
                    // .force("y", d3.forceY())
                    // .on("tick", ticked);
                force.stop();
                function ticked() {
                    const alpha = force.alpha();
                    minAlpha = Math.min(minAlpha,alpha);
                    if(minAlpha<0.001) {
                        force.stop();
                            postMessage({action: 'stable',value:{totalTime:performance.now()-totalTime_marker,alpha:minAlpha}, status: "done", sol: net});
                    }
                    n.filtered_nodes.forEach(d=>{
                        d.parent.x = d3.mean(d.parent.timeArr,e=>e?e.x:undefined)||0;
                        d.parent.y = d3.mean(d.parent.timeArr,e=>e?e.y:undefined)||0;
                        d.x += (d.parent.x-d.x)*0.4;
                        d.y += (d.parent.y-d.y)*0.4;
                    });
                    if (canSend){
                        postMessage({action:'render',value:{totalTime:performance.now()-totalTime_marker,alpha:minAlpha},source:ni, sol:[]});
                        canSend = false;
                    }
                }
                force.nodes(nodes);
                force.force("link").links(n.links);
                force.stop();
                if (ni) {
                    const filtered_nodes = {};
                    n.filtered_links = [];
                    links.forEach(l => {
                        if (l.isNew) {
                            n.filtered_links.push(l);
                            filtered_nodes[l.source.id] = l.source;
                            filtered_nodes[l.target.id] = l.target;
                        }
                        }
                    );
                    n.filtered_nodes = Object.values(filtered_nodes);
                    nodes.forEach(n=>{
                        if (!filtered_nodes[n.id]){
                            n.x=undefined;
                            n.y=undefined;
                        }
                        root_nodes[n.id] = n.parent;
                    })
                }else{
                    n.filtered_nodes = nodes;
                    n.filtered_links = links;
                    nodes.forEach(n=> {
                        root_nodes[n.id] = n.parent;
                    });
                }
                if (n.delectedLinks) {
                    n.delectedLinks = n.delectedLinks.map(l => {
                        return {
                            source: l.source.parent.timeArr[n.ti] ?? l.source,
                            target: l.target.parent.timeArr[n.ti] ?? l.target,
                            value: l.value,
                            color: 'rgb(255,0,0)',
                            isDelete: true
                        };
                    });
                }
                if (n.filtered_nodes.length) {
                    console.log('Net t=',ni);
                    console.log('#nodes :',n.filtered_nodes.length);
                    console.log('#links :',n.filtered_links.length);
                    force.nodes(n.filtered_nodes);
                    force.force("link").links(n.filtered_links);
                    force.stop();
                    // force.on("tick", ticked)
                    forces.push(force);
                }else{
                    console.log('skip t=',ni);
                }
            });
            console.log('#skip: ',net.length-forces.length);
            postMessage({action:'updateHighlight', sol:net,totalForces:forces.length});
            setInterval(function(){ canSend = true; }, 1000/24);

            while (minAlpha>0.001) {
                forces.forEach(function (force) {
                    force.tick();
                    minAlpha = Math.min(minAlpha, force.alpha());
                });
                Object.values(root_nodes).forEach(n => {
                    n.x = d3.mean(n.timeArr, e => e ? e.x : undefined);
                    n.y = d3.mean(n.timeArr, e => e ? e.y : undefined);
                });
                forces.forEach(function (force) {
                    force.nodes().forEach(d => {
                        d.x += (d.parent.x - d.x) * 0.4;
                        d.y += (d.parent.y - d.y) * 0.4;
                    });
                });
            }
                postMessage({action: 'stable',value:{totalTime:performance.now()-totalTime_marker,alpha:minAlpha}, status: "done", sol: net});
            break;
            }else {
                postMessage({action: 'stable',value:{totalTime:performance.now()-totalTime_marker}, status: "done", sol: undefined});
            }
    }
});
