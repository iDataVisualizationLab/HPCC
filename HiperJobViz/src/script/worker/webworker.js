const maxWorkers = (navigator.hardwareConcurrency || 4) -1;
// const maxWorkers = 1;
let workers = new Array(maxWorkers);
function resetWorkers(){
    //Reset all the workers
    workers.forEach(w => {
        if(w!==undefined){
            w.terminate();
        }
    });
    workers = new Array(maxWorkers);
}
function startWorker(fileName, data, onResult, index) {
    if (typeof (Worker) !== 'undefined') {
        const workerIndex = index%maxWorkers;
        let w = workers[workerIndex];
        if(w===undefined){
            w =workers[workerIndex] = new Worker(fileName);
            w.onmessage = function (e) {
                onResult(e.data);
            };
        }
        w.postMessage(data);
    } else {
        throw "The browser doesn't support web worker";
    }
}
