window =self;
importScripts("../../../../HiperView/js/d3.v4.js");
addEventListener('message',function ({data}) {
    let maxTimestep = data.maxTimestep, clusterdata_timeline = data.clusterdata_timeline,bundle_cluster_ob = data.bundle_cluster_ob;
    const fullScaleB =  d3.scaleLinear().range(data.range).domain(data.domain);
    let scaleNode_y_midle = function(clustername,ti,computeID){
        const masteb = bundle_cluster_ob[clustername];
        return fullScaleB(masteb.orderscale[computeID]+masteb.offset);
        // return fullScaleB(masteb.arr[ti][computeID]+masteb.offset);
    };
    let totalintersect = 0;
    for (let t = 0; t < maxTimestep - 1; t++) {
        for (let i = 0; i < clusterdata_timeline.length - 1; i++) {
            for (let j = i + 1; j < clusterdata_timeline.length; j++) {
                if (path_line_intersections({
                    x1: 0,
                    x2: 100,
                    y1: scaleNode_y_midle(clusterdata_timeline[i].arr[t], t, clusterdata_timeline[i].name),
                    y2: scaleNode_y_midle(clusterdata_timeline[i].arr[t + 1], t, clusterdata_timeline[i].name),
                }, {
                    x1: 0,
                    x2: 100,
                    y1: scaleNode_y_midle(clusterdata_timeline[j].arr[t], t, clusterdata_timeline[j].name),
                    y2: scaleNode_y_midle(clusterdata_timeline[j].arr[t + 1], t, clusterdata_timeline[j].name),
                }))
                    totalintersect++;
            }
            postMessage({action: 'returnData',
                result: {iteration:i,process:(i+1)/(clusterdata_timeline.length-1)*100}});
        }
    }
    postMessage({action: 'done',
        result: totalintersect
    });
});

function path_line_intersections(line1, line2) {
    return (((line1.y1>line2.y1)&&(line1.y2<line2.y2))||((line1.y1<line2.y1)&&(line1.y2>line2.y2)));
}