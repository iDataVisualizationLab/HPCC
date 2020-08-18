// Ngan Nguyen -IDVL 8/18/2020
d3.scatterMatrix = function(){
    let master = {};
    let canvas;
    master.init = function(){
        const offscreenCanvas = canvas.transferControlToOffscreen();
        const worker = new Worker('worker/scatterplot.js'); // worker location
        worker.postMessage({ offscreenCanvas }, [offscreenCanvas]);
        canvasContainer.addEventListener('measure', ({ detail }) => {
            const { width, height } = detail;
            worker.postMessage({ width, height });
        });
        return master;
    };
    master.draw = function(){
        canvasContainer.requestRedraw();
    };
    master.canvas = function(_){
        return arguments.length?(canvas=_,master):canvas;
    }
}
