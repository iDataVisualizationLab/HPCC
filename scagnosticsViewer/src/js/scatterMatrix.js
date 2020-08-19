// Ngan Nguyen -IDVL 8/18/2020
d3.scatterMatrix = function(){
    let master = {};
    let canvasContainer,canvas,worker;
    // function
    let onMessageCalback =()=>{};
    master.init = function(){
        if (!worker) {
            worker = new Worker('src/js/worker/scatterplot.js');
            canvas = canvasContainer
                .querySelector('canvas');
            if (canvas.transferControlToOffscreen == null) {
                alert(`It looks like OffscreenCanvas isn't supported by your browser`);
            }
            const offscreenCanvas = canvas.transferControlToOffscreen();
            worker.postMessage({ offscreenCanvas }, [offscreenCanvas]);
            worker.addEventListener('message', ({ data }) => { // message
                if (data !== 'frame') { // receive message
                    onMessageCalback( data);
                } else { //render done
                    onMessageCalback('');
                }
            });
        }
        // canvasContainer.addEventListener('measure', ({ detail }) => {
        //     master.update_size(detail);
        // });
        return master;
    };
    master.update_size = function (detail){
        const { width, height ,transform} = detail;
        d3.select(canvas).style('width',width+'px').style('height',height+'px')
        worker.postMessage({ width, height, transform });
    };
    master.draw = function(data){
        worker.postMessage({data});
        canvasContainer.requestRedraw();
    };
    master.canvasContainer = function(_){
        return arguments.length?(canvasContainer=_,master):canvasContainer;
    }
    master.onProcess = function(_){
        return arguments.length?(onMessageCalback=_,master):onMessageCalback;
    }

    return master;
}
