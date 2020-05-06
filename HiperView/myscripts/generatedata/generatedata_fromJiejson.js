function handleDataJie(dataRaw) {
    // DEBUGING
    // console.log(dataRaw)
    // console.log(dataRaw.nodesInfo['10.101.7.49'])
    // console.log(dataRaw.jobsInfo['1128764'])
    // DEBUGING

    temp = dataRaw;
    hosts.forEach(d=>d.ip = `10.101.${d.hpcc_rack}.${d.hpcc_node}`);
    let jobjson = dataRaw.jobs_info;
    let jobo = {};
    let jobd = [];
    for (let jobID in jobjson) {
        let d = jobjson[jobID];
        d.node_list = JSON.parse(d.node_list.replace(/'/g,'"'));
        let temp = {
            "nodes": d.node_list.map(ip=>hosts.find(d=>d.ip===ip).name),
            "jobID": ""+jobID,
            "user": d.user_name,
            "startTime": d.start_time*1000,
            "submitTime": d.submit_time*1000
        };
        if (d['finish_time'])
            temp.endTime = d['finish_time']*1000;
        jobo[jobID] = temp;
        jobd.push(jobo[jobID]);
    }


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
                // if (si===0) {
                //     if (data[h.ip]['job_id'][ti].replace)
                //         data[h.ip]['job_id'][ti] = JSON.parse(data[h.ip]['job_id'][ti].replace(/'|'/g, '"'));
                //     data[h.ip]['job_id'][ti].forEach(jID => {
                //         if (!jobo[jID].nodes_temp.find(m => m === h.name)) {
                //             jobo[jID].nodes_temp.push(h.name);
                //             jobo[jID].nodes.push(h.name);
                //         }
                //     });
                //     if (ti)
                //     // console.log(_.difference(data[h.ip]['jobID'][ti - 1], data[h.ip]['jobID'][ti]))
                //         _.difference(data[h.ip]['job_id'][ti - 1], data[h.ip]['job_id'][ti]) // job has been end
                //             .forEach(jID => {
                //                 _.pull(jobo[jID].nodes, h.name);
                //                 jobo[jID].endTime = sampleh.timespan[ti];
                //             });
                // }
            })
        })
    });
    // jobd.forEach(j=>{
    //     if (j.nodes.length===0){
    //         j.nodes = j.nodes_temp.slice();
    //         delete j.nodes_temp;
    //     }else{
    //         delete j.nodes_temp;
    //         delete j.endTime;
    //     }
    // })
    jobd = jobd.filter(d=>d.nodes.length);
    // DEBUGING
    // console.log(dataRaw.nodesInfo['10.101.7.59']);
    // console.log(jobd.filter(j=>j['jobID']==='1126680'));
    // DEBUGING
    console.log(JSON.stringify(sampleh));
    console.log(JSON.stringify(jobd));
}
// // 2/13/2020
// let timeQuery = ['2020-02-17T13:00:00Z','2020-02-18T13:00:00Z'];
// fetch(`http://129.118.104.141:5000/api/v1/?starttime=${timeQuery[0]}&endtime=${timeQuery[1]}&interval=5m`).then(handleDataJie)
// //jobdata
// // let filename = "2019-09-20_2019-09_5m";
// // let filename = "2019-04-20_5m";
// let filename = "2020-02-12_2020-02-13_5m";

d3.json("../HiperView/data/data_raw/0424-0427_metrics.json",function(d){handleDataJie(d)})

let hostfilter = ["compute-1-11","compute-1-20","compute-2-21","compute-2-37","compute-3-17",
    "compute-4-8","compute-4-9","compute-4-18","compute-4-25","compute-4-42","compute-5-2","compute-6-2","compute-8-46","compute-9-23","compute-9-31","compute-10-30"]

function handleDataJie_filtering(dataRaw) {
    // DEBUGING
    // console.log(dataRaw)
    // console.log(dataRaw.nodesInfo['10.101.7.49'])
    // console.log(dataRaw.jobsInfo['1128764'])
    // DEBUGING
    let host_rand = _.sampleSize(hosts.map(h=>h.name),50);
    host_rand.forEach(h=>{
        if(!hostfilter.find(n=>h.name===n))
            hostfilter.push(h)
    });
    hosts_filtered = hosts.filter(h=>hostfilter.find(n=>h.name===n));
    temp = dataRaw;
    hosts.forEach(d=>d.ip = `10.101.${d.hpcc_rack}.${d.hpcc_node}`);
    let jobjson = dataRaw.jobs_info;
    let jobo = {};
    let jobd = [];
    for (let jobID in jobjson) {
        let d = jobjson[jobID];
        d.node_list = JSON.parse(d.node_list.replace(/'/g,'"'));
        let temp = {
            "nodes": [],
            "jobID": ""+jobID,
            "user": d.user_name,
            "startTime": d.start_time*1000,
            "submitTime": d.submit_time*1000
        };
        temp.nodes = [];
        d.node_list.forEach(ip=>{
            h = hosts_filtered.find(d=>d.ip===ip);
            if (h)
                temp.nodes.push(h.name)
        })
        if (d['finish_time'])
            temp.endTime = d['finish_time']*1000;
        jobo[jobID] = temp;
        jobd.push(jobo[jobID]);
    }
    jobd = jobd.filter(d=>d.nodes.length);

    // var alternative_service = ["CPU1_Temp", "CPU2_Temp", "Inlet_Temp", "Memory_Usage", "Fan_1_Speed", "Fan_2_Speed", "Fan_3_Speed", "Fan_4_Speed", "Power_Usage"];
    // var alternative_service = ["cpu_inl_temp","cpu_usage", "memory_usage", "fan_speed", "power_usage"];
    var alternative_service = ["cpu_inl_temp", "memory_usage", "fan_speed", "power_usage"];
    var alternative_scale = [1,0.5,1,0.5];

    var sampleh = {};
    var ser = serviceListattr.slice();
    ser.pop();

    let data = dataRaw.nodes_info;
    sampleh.timespan = dataRaw.time_stamp.map(d=>d*1000);
    hosts_filtered.forEach(h => {
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

    // DEBUGING
    // console.log(dataRaw.nodesInfo['10.101.7.59']);
    // console.log(jobd.filter(j=>j['jobID']==='1126680'));
    // DEBUGING
    console.log(sampleh)
    console.log(JSON.stringify(sampleh));
    console.log(JSON.stringify(jobd));
}

function handleDataJie_filtering(dataRaw) {
    // DEBUGING
    // console.log(dataRaw)
    // console.log(dataRaw.nodesInfo['10.101.7.49'])
    // console.log(dataRaw.jobsInfo['1128764'])
    // DEBUGING
    let host_rand = _.sampleSize(hosts.map(h=>h.name),50);
    host_rand.forEach(h=>{
        if(!hostfilter.find(n=>h.name===n))
            hostfilter.push(h)
    });
    hosts_filtered = hosts.filter(h=>hostfilter.find(n=>h.name===n));
    temp = dataRaw;
    hosts.forEach(d=>d.ip = `10.101.${d.hpcc_rack}.${d.hpcc_node}`);
    let jobjson = dataRaw.jobs_info;
    let jobo = {};
    let jobd = [];
    for (let jobID in jobjson) {
        let d = jobjson[jobID];
        d.node_list = JSON.parse(d.node_list.replace(/'/g,'"'));
        let temp = {
            "nodes": [],
            "jobID": ""+jobID,
            "user": d.user_name,
            "startTime": d.start_time*1000,
            "submitTime": d.submit_time*1000
        };
        temp.nodes = [];
        d.node_list.forEach(ip=>{
            h = hosts_filtered.find(d=>d.ip===ip);
            if (h)
                temp.nodes.push(h.name)
        });
        if (d['finish_time'])
            temp.endTime = d['finish_time']*1000;
        jobo[jobID] = temp;
        jobd.push(jobo[jobID]);
    }
    jobd = jobd.filter(d=>d.nodes.length);

    // var alternative_service = ["CPU1_Temp", "CPU2_Temp", "Inlet_Temp", "Memory_Usage", "Fan_1_Speed", "Fan_2_Speed", "Fan_3_Speed", "Fan_4_Speed", "Power_Usage"];
    // var alternative_service = ["cpu_inl_temp","cpu_usage", "memory_usage", "fan_speed", "power_usage"];
    var alternative_service = ["cpu_inl_temp", "memory_usage", "fan_speed", "power_usage"];
    var alternative_scale = [1,0.5,1,0.5];

    var sampleh = {};
    var ser = serviceListattr.slice();
    ser.pop();

    let data = dataRaw.nodes_info;
    sampleh.timespan = dataRaw.time_stamp.map(d=>d*1000);
    hosts_filtered.forEach(h => {
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

    // DEBUGING
    // console.log(dataRaw.nodesInfo['10.101.7.59']);
    // console.log(jobd.filter(j=>j['jobID']==='1126680'));
    // DEBUGING
    console.log(sampleh)
    console.log(JSON.stringify(sampleh));
    console.log(JSON.stringify(jobd));
}