// 2/13/2020
let timeQuery = ['2020-02-17T13:00:00Z','2020-02-18T13:00:00Z'];
fetch(`http://129.118.104.141:5000/api/v1/?starttime=${timeQuery[0]}&endtime=${timeQuery[1]}&interval=5m`).then(handleDataJie)
//jobdata
// let filename = "2019-09-20_2019-09_5m";
// let filename = "2019-04-20_5m";
let filename = "2020-02-12_2020-02-13_5m";

function handleDataJie(dataRaw) {
    // DEBUGING
    // console.log(dataRaw)
    // console.log(dataRaw.nodesInfo['10.101.7.49'])
    // console.log(dataRaw.jobsInfo['1128764'])
    // DEBUGING

    temp = dataRaw
    hosts.forEach(d=>d.ip = `10.101.${d.hpcc_rack}.${d.hpcc_node}`);
    let jobjson = dataRaw.jobsInfo;
    let jobo = {};
    let jobd = [];
    for (let jobID in jobjson) {
        let d = jobjson[jobID]
        let temp = {
            "nodes": [],
            "nodes_temp": [],
            "jobID": jobID,
            "user": d.user,
            "startTime": d.startTime.replace('CST', 'CDT'),
            "submitTime": d.submitTime.replace('CST', 'CDT')
        };
        if (d.endTime)
            temp.endTime = d.endTime;
        jobo[jobID] = temp;
        jobd.push(jobo[jobID]);
    }


    // var alternative_service = ["CPU1_Temp", "CPU2_Temp", "Inlet_Temp", "Memory_Usage", "Fan_1_Speed", "Fan_2_Speed", "Fan_3_Speed", "Fan_4_Speed", "Power_Usage"];
    var alternative_service = ["CPU1_temp", "CPU2_temp", "inlet_temp", "memoryusage", "fan1_speed", "fan2_speed", "fan3_speed", "fan4_speed", "powerusage_watts"];

    var sampleh = {};
    var ser = serviceListattr.slice();
    ser.pop();

    let data = dataRaw.nodesInfo;
    sampleh.timespan = dataRaw.timeStamp;
    hosts.forEach(h => {
        sampleh[h.name] = {};
        ser.forEach(s => sampleh[h.name][s] = []);
        alternative_service.forEach((sa, si) => {
            var s = serviceFullList[si];
            var arrID = serviceListattr[s.idroot];
            var scale = 1;
            if (s.text === "Memory usage" || s.text === "Power consumption")
                scale = 0.5;
            sampleh.timespan.forEach((dt, ti) => {
                let value = data[h.ip][sa][ti];
                if (value === "")
                    value = null;
                else
                    value = (+value) * scale;

                if (!sampleh[h.name][arrID][ti])
                    sampleh[h.name][arrID][ti] = [];
                sampleh[h.name][arrID][ti][s.id] = value;

                if (si===0) {

                    if (data[h.ip]['jobID'][ti].replace)
                        data[h.ip]['jobID'][ti] = JSON.parse(data[h.ip]['jobID'][ti].replace(/'|'/g, '"'));
                    data[h.ip]['jobID'][ti].forEach(jID => {
                        if (!jobo[jID].nodes_temp.find(m => m === h.name)) {
                            jobo[jID].nodes_temp.push(h.name);
                            jobo[jID].nodes.push(h.name);
                        }
                    });
                    if (ti)
                    // console.log(_.difference(data[h.ip]['jobID'][ti - 1], data[h.ip]['jobID'][ti]))
                        _.difference(data[h.ip]['jobID'][ti - 1], data[h.ip]['jobID'][ti]) // job has been end
                            .forEach(jID => {
                                if (jID=="1126680")
                                    console.log(h.name+' '+sampleh.timespan[ti]);

                                    _.pull(jobo[jID].nodes, h.name);
                                    jobo[jID].endTime = d3.timeFormat('%a %b %d %X CDT %Y')(new Date(sampleh.timespan[ti].replace('Z', '')));
                            });
                }
            })
        })
    });
    jobd.forEach(j=>{
        if (j.nodes.length===0){
            j.nodes = j.nodes_temp.slice();
            delete j.nodes_temp;
        }else{
            delete j.nodes_temp;
            delete j.endTime;
        }
    })
    // DEBUGING
    // console.log(dataRaw.nodesInfo['10.101.7.59']);
    // console.log(jobd.filter(j=>j['jobID']==='1126680'));
    // DEBUGING
    console.log(JSON.stringify(sampleh));
    console.log(JSON.stringify(jobd));
}

d3.json(`../HiperView/data/data_with_job_csv/Detail_2020-02-16_2020-02-17_5m.json`, function (error, dataRaw){
    handleDataJie(dataRaw);

});