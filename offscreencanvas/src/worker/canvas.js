postMessage('Worker initialised. Importing scripts...');

importScripts(
    '../../node_modules/d3-array/dist/d3-array.js',
    '../lib/d3.v5.min.js',
    '../../../HiperView/js/lodash.min.js',
    '../../node_modules/d3-collection/dist/d3-collection.js',
    '../../node_modules/d3-color/dist/d3-color.js',
    '../../node_modules/d3-format/dist/d3-format.js',
    '../../node_modules/d3-interpolate/dist/d3-interpolate.js',
    '../../node_modules/d3-scale-chromatic/dist/d3-scale-chromatic.js',
    '../../node_modules/d3-random/dist/d3-random.js',
    '../../node_modules/d3-scale/dist/d3-scale.js',
    '../../node_modules/d3-shape/dist/d3-shape.js',
    '../../node_modules/d3-time-format/dist/d3-time-format.js',
    '../../node_modules/@d3fc/d3fc-extent/build/d3fc-extent.js',
    '../../node_modules/@d3fc/d3fc-random-data/build/d3fc-random-data.js',
    '../../node_modules/@d3fc/d3fc-rebind/build/d3fc-rebind.js',
    '../../node_modules/@d3fc/d3fc-series/build/d3fc-series.js',
    '../../node_modules/@d3fc/d3fc-webgl/build/d3fc-webgl.js'
);

postMessage('Scripts imported. Generating data...');

let series = fc
    .seriesWebglPoint()
    .crossValue(d => d.x)
    .mainValue(d => d.y)
    .size(d => d.size)
    .equals((previousData, data) => previousData.length > 0);
let render = ()=>{};
let onChangVariable = function(){};
const randomNormal = d3.randomNormal(0, 1);
const randomLogNormal = d3.randomLogNormal();
let serviceFullList= [{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]},{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]},{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]},{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]
let serviceLists =[{"text":"Temperature","id":0,"enable":true,"sub":[{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]}]},{"text":"Memory_usage","id":1,"enable":true,"sub":[{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]}]},{"text":"Fans_speed","id":2,"enable":true,"sub":[{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]}]},{"text":"Power_consum","id":3,"enable":true,"sub":[{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]}];
let serviceListattr = ["arrTemperature","arrMemory_usage","arrFans_health","arrPower_usage","arrJob_scheduling"];
let selectedService = "Memory usage"
d3.json("../../../HiperView/data/influxdb0424-0427.json").then(dataRaw=>{
// d3.json("../../../HiperView/data/influxdbThus21Mar_1400_1630.json").then(dataRaw=>{
    let hosts= _.without(d3.keys(dataRaw),'timespan');
    dataRaw.timespan = dataRaw.timespan.map(d=>new Date(d));
    let timeScale = d3.scaleTime().domain(d3.extent(dataRaw.timespan));
    let data = [];
    hosts.forEach((hname,hi)=>{
        let hostdata = dataRaw[hname]
        dataRaw.timespan.forEach((t,ti)=>{
            let values = {}
            serviceLists.forEach((s,si)=>{
                s.sub.forEach((sub,subi)=>{
                    values[sub.text] = hostdata[serviceListattr[si]][ti][subi];
                })
            })
            data.push({
                x: ti,
                y: hi,
                values: values
            })
        })
    });
    postMessage(serviceFullList)
    postMessage('Data generated. Configuring rendering...');

    const xScale = d3.scaleLinear().domain([0, dataRaw.timespan.length]);

    const yScale = d3.scaleLinear().domain([0, hosts.length]);

    series = fc
        .seriesWebglPoint()
        .xScale(xScale)
        .yScale(yScale)
        .crossValue(d => d.x)
        .mainValue(d => d.y)
        .equals((previousData, data) => previousData.length > 0);

    let colorScale = d3.scaleSequential()
        .interpolator(d3.interpolateTurbo).domain([3,98]);

    const webglColor = color => {
        const { r, g, b, opacity } = d3.color(color).rgb();
        return [r / 255, g / 255, b / 255, opacity];
    };

    let fillColor = fc
        .webglFillColor();
    onChangVariable = function (){
        fillColor.value((d, i) => webglColor(colorScale(d.values[selectedService])))
            .data(data);

        series.decorate(program => {
            fillColor(program);
        });
    }
    onChangVariable()

    postMessage('Rendering configured. Awaiting canvas...');

    render = function () {
        series(data);
        // requestAnimationFrame(render);
        postMessage('frame');
    }
    if (offscreenCanvas_control != null) {
        postMessage('Canvas received. Rendering...');
        const gl = offscreenCanvas_control.getContext('webgl');
        series.context(gl);
        render();
    }
});
let offscreenCanvas_control;
addEventListener('message', ({ data: { offscreenCanvas, width, height,variable } }) => {
    if (offscreenCanvas != null) {
        offscreenCanvas_control = offscreenCanvas;
        postMessage('Canvas received. Rendering...');
        const gl = offscreenCanvas.getContext('webgl');
        series.context(gl);
        render();
    }

    if (width != null && height != null  && series.context()) {
        const gl = series.context();
        gl.canvas.width = width;
        gl.canvas.height = height;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        requestAnimationFrame(render)
    }

    if(variable!=null){
        onChangVariable();
        requestAnimationFrame(render)
    }
});