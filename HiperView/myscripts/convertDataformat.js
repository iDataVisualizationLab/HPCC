hosts.forEach(d=>d.ip = `10.101.${d.hpcc_rack}.${d.hpcc_node}`);
dataN ={};
jobN = [];
d3.json(srcpath+'data/influxdb20Apr_v2.json',data=>{
    let datalength = data.hostDetail[hosts[0].ip].arrTemperature.length;
    hosts.forEach(h=>{
        dataN[h.name] = data.hostDetail[h.ip];
        for (let key in dataN[h.name])
            if (!_.isArray(dataN[h.name][key][0]))
                dataN[h.name][key] = dataN[h.name][key].map(d=>[d]);
    });
    let times = d3.scaleTime().domain([0,datalength-1]).range(data.timeRange.map(d=>new Date(d)))
    dataN.timespan = d3.range(0,datalength).map(d=>times(d).toISOString());
    for (let user in data.userJob){
        for (let keyu in data.userJob[user]){
            let j = data.userJob[user][keyu];
            j.submitTime = j.time[0];
            j.startTime = j.time[1];
            j.endTime = j.time[2];
            j.jobID = keyu;
            delete j.time;
            j.nodes = j.nodes.map(hip=>hosts.find(h=>h.ip===hip).name);
            j.user = user;
            jobN.push(j);
        }
    }
});

hosts.forEach(h=>{
    dataN[h.name].arrFans_health = dataN[h.name].arrFan_speed;
    delete dataN[h.name].arrFan_speed;
    delete dataN[h.name].arrCPU_load;
    dataN[h.name].arrPower_usage = [];
});