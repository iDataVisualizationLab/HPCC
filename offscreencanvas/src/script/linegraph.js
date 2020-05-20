let worker = null;
// if (!location.search) {
//     location.search = 10000;
// }
$(document).ready(function(){
    const canvasContainer = document.querySelector('d3fc-canvas');
    canvasContainer.addEventListener('measure', ({ detail }) => {
        if (worker == null) {
            // worker = new Worker(`src/worker/canvas.js#${Number(location.search.substring(1))}`);
            worker = new Worker(`src/worker/canvas.js`);
            const canvas = canvasContainer
                .querySelector('canvas');
            if (canvas.transferControlToOffscreen == null) {
                alert(`It looks like OffscreenCanvas isn't supported by your browser`);
            }
            const offscreenCanvas = canvas.transferControlToOffscreen();
            console.log(offscreenCanvas)
            worker.postMessage({ offscreenCanvas }, [offscreenCanvas]);
            worker.addEventListener('message', ({ data }) => {
                if (_.isArray(data)) {
                    d3.select('#variableChoice').data(data).join('option').attr('value',d=>d.text).text(d=>d.text)
                }else if (data !== 'frame') {
                    document.querySelector('#loading>p').innerText = data;
                } else {
                    document.querySelector('#loading').style.display = 'none';
                }
            });
        }
        const { width, height } = detail;
        worker.postMessage({ width, height });
    });
    canvasContainer.requestRedraw();
})
