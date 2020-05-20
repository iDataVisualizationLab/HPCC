let spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "description": "HPCC heatmap",
    "width": 800,
    "height": 500,
    "padding": 5,

    "title": {
        "text": "HPCC heatmap",
        "anchor": "middle",
        "fontSize": 16,
        "frame": "group",
        "offset": 4
    },
    "selection": {
        "grid": {
            "type": "interval", "bind": "scales"
        },
    },
    "data":
        {
        }
    ,
    "mark":"rect",
    "encoding": {
        "y": {"field": "compute", "type": "nominal"},
        "x": {"field": "timestep", "type": "temporal","timeUnit": "hours"},
        "color": {"field": "Memory usage", "type": "quantitative",
            "zero": false, "nice": true}
    },

    // "axes": [
    //     {"orient": "bottom", "scale": "x", "domain": false, "title": "Time"},
    //     {
    //         "orient": "left", "scale": "y", "domain": false, "title": "Compute"
    //     }
    // ],
    //
    // "legends": [
    //     {
    //         "fill": "color",
    //         "type": "gradient",
    //         "title": "Avg. Temp (°F)",
    //         "titleFontSize": 12,
    //         "titlePadding": 4,
    //         "gradientLength": {"signal": "height - 16"}
    //     }
    // ],
    //
    // "marks": [
    //     {
    //         "type": "rect",
    //         "from": {"data": "hpcc"},
    //         "encode": {
    //             "enter": {
    //                 "x": {"scale": "x", "field": "timestep"},
    //                 "y": {"scale": "y", "field": "compute"},
    //                 "width": {"value": 5},
    //                 "height": {"scale": "y", "band": 1},
    //                 "tooltip": {"signal": "timeFormat(datum.timestep, '%b %d %I:00 %p') + ': ' + datum.compute"}
    //             },
    //             "update": {
    //                 "fill": {"scale": "color", "field": {"signal":"selectedService"}}
    //             }
    //         }
    //     }
    // ]
}

let serviceFullList= [{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]},{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]},{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]},{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]
let serviceLists =[{"text":"Temperature","id":0,"enable":true,"sub":[{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]}]},{"text":"Memory_usage","id":1,"enable":true,"sub":[{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]}]},{"text":"Fans_speed","id":2,"enable":true,"sub":[{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]}]},{"text":"Power_consum","id":3,"enable":true,"sub":[{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]}];
let serviceListattr = ["arrTemperature","arrMemory_usage","arrFans_health","arrPower_usage","arrJob_scheduling"];
let selectedService = "Memory usage"
d3.json("../HiperView/data/influxdb0424-0427.json").then(dataRaw=> {
// d3.json("../../../HiperView/data/influxdbThus21Mar_1400_1630.json").then(dataRaw=>{
    let hosts = _.without(d3.keys(dataRaw), 'timespan');
    dataRaw.timespan = dataRaw.timespan.map(d => new Date(d));
    let timeScale = d3.scaleTime().domain(d3.extent(dataRaw.timespan));
    let data = [];
    hosts.forEach((hname, hi) => {
        let hostdata = dataRaw[hname]
        dataRaw.timespan.forEach((t, ti) => {
            let values = {}
            serviceLists.forEach((s, si) => {
                s.sub.forEach((sub, subi) => {
                    values[sub.text] = hostdata[serviceListattr[si]][ti][subi];
                })
            });
            values.timestep = dataRaw.timespan[ti];
            values.compute = hname;
            data.push(values)
        })
    });
    spec.data.values = data;
    // spec.selection.selectedService.bind.options = serviceFullList.map(s=>s.text)
    console.log(spec)
    render(spec);
})
function render(spec) {
    // view = new vega.View(vega.parse(spec), {
    //     renderer:  'canvas',  // renderer (canvas or svg)
    //     container: '#vis',   // parent DOM container
    //     hover:     true       // enable hover processing
    // });
    vegaEmbed('#vis',spec, {
        renderer:  'canvas',  // renderer (canvas or svg)
        // container: ,   // parent DOM container
        hover:     true       // enable hover processing
    });
    // return view.runAsync();
}