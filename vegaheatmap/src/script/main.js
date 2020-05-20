

let serviceFullList= [{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]},{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]},{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]},{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]
let serviceLists =[{"text":"Temperature","id":0,"enable":true,"sub":[{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]}]},{"text":"Memory_usage","id":1,"enable":true,"sub":[{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]}]},{"text":"Fans_speed","id":2,"enable":true,"sub":[{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]}]},{"text":"Power_consum","id":3,"enable":true,"sub":[{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]}];
let serviceListattr = ["arrTemperature","arrMemory_usage","arrFans_health","arrPower_usage","arrJob_scheduling"];
let selectedService = "Memory usage";

let container="#vis";
$(document).ready(function(){
    // canvasContainer.addEventListener('measure', ({ detail }) => {
        if (worker == null) {
            // worker = new Worker(`src/worker/canvas.js#${Number(location.search.substring(1))}`);
            worker = new Worker(`src/script/worker/chart.js`);
            worker.addEventListener('message', ({ data }) => {
                if (_.isArray(data)) {
                    d3.select('#variableChoice').data(data).join('option').attr('value',d=>d.text).text(d=>d.text)
                }else if (!_.isObject(data)) {
                    // document.querySelector('#loading>p').innerText = data;
                } else {

                    view = new vega.View(data.spec, {
                        renderer:  'canvas',  // renderer (canvas or svg)
                        container: container,   // parent DOM container
                        hover:     true       // enable hover processing
                    });
                    // document.querySelector('#loading').style.display = 'none';
                    worker.terminate();
                    view.runAsync();
                }
            });
        }
        // const { width, height } = detail;
        // worker.postMessage({ width, height });
    // });
});