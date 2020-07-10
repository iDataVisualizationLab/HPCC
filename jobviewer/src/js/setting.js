serviceFullList = [{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]},{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]},{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]},{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]
serviceListattr = ["arrTemperature", "arrMemory_usage", "arrFans_health", "arrPower_usage", "arrJob_scheduling"];
var alternative_service = ["cpu_inl_temp", "memory_usage", "fan_speed", "power_usage"];
var alternative_scale = [1,0.5,1,0.5];


function handleDataUrl(dataRaw) {
    let hosts = d3.keys(dataRaw.nodes_info).map(ip=>{
        return {
            ip: ip,
            name: ip,
        }
    })


    // var alternative_service = ["CPU1_Temp", "CPU2_Temp", "Inlet_Temp", "Memory_Usage", "Fan_1_Speed", "Fan_2_Speed", "Fan_3_Speed", "Fan_4_Speed", "Power_Usage"];
    // var alternative_service = ["cpu_inl_temp","cpu_usage", "memory_usage", "fan_speed", "power_usage"];
    var alternative_service = ["cpu_inl_temp", "memory_usage", "fan_speed", "power_usage"];
    var alternative_scale = [1,0.5,1,0.5];

    var sampleh = {};
    var ser = serviceListattr.slice();
    ser.pop();

    let data = dataRaw.nodes_info;
    sampleh.timespan = dataRaw.time_stamp.map(d=>d*1000);
    hosts.forEach(h => {
        sampleh[h.name] = {};
        ser.forEach(s => sampleh[h.name][s] = []);
        alternative_service.forEach((sa, si) => {
            var scale = alternative_scale[si];
            sampleh.timespan.forEach((dt, ti) => {
                let value = _.isArray(data[h.ip][sa][ti])?data[h.ip][sa][ti].map(d=>d===""?null:((+d) * scale)):[(data[h.ip][sa][ti]===""?null:((+data[h.ip][sa][ti]) * scale))];
                let arrID = serviceListattr[si];
                sampleh[h.name][arrID][ti] = value;
            })
        })
    });

    return{sampleS:sampleh};
}
