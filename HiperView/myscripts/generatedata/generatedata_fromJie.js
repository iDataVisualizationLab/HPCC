// 2/13/2020

hosts.forEach(d=>d.ip = `10.101.${d.hpcc_rack}.${d.hpcc_node}`);
//jobdata
// let filename = "2019-09-20_2019-09_5m";
// let filename = "2019-04-20_5m";
let filename = "2020-02-12_2020-02-13_5m";
d3.csv(`../HiperView/data/data_with_job_csv/JobDetail_${filename}.csv`, function (error, data){
    let jobo = {}
    let jobd = data.map(d=>{
        let temp = {"nodes":[],
            "jobID":d.JobID,
            "user":d.user,
            "startTime":d.startTime.replace('CST','CDT'),
            "submitTime":d.submitTime.replace('CST','CDT')};
        if (d.endTime)
            temp.endTime = d.endTime;
        jobo[d.JobID] = temp;
        return jobo[d.JobID];
    });

    // var alternative_service = ["CPU1_Temp", "CPU2_Temp", "Inlet_Temp", "Memory_Usage", "Fan_1_Speed", "Fan_2_Speed", "Fan_3_Speed", "Fan_4_Speed", "Power_Usage"];
    var alternative_service = ["CPU1_temp", "CPU2_temp", "inlet_temp", "memoryusage", "fan1_speed", "fan2_speed", "fan3_speed", "fan4_speed", "powerusage_watts"];

    var sampleh = {};
    var ser = serviceListattr.slice();
    ser.pop();
    d3.csv(`../HiperView/data/data_with_job_csv/HostDetail_${filename}.csv`, function (error, data){
        sampleh.timespan = data.map(d=>d['TimeStamp']);
        hosts.forEach(h=>{
            sampleh[h.name]={};
            ser.forEach(s=>sampleh[h.name][s]=[]);
            alternative_service.forEach((sa,si)=>{
                var s =  serviceFullList[si];
                var arrID = serviceListattr[s.idroot];
                var scale = 1;
                if (s.text==="Memory usage"||s.text==="Power consumption")
                    scale = 0.5;
                data.forEach((dt,ti)=>{
                    let value = dt[`${h.ip}-${sa}`];
                    if (value==="")
                        value=null;
                    else
                        value = (+value)*scale;

                    if(!sampleh[h.name][arrID][ti])
                        sampleh[h.name][arrID][ti]=[];
                    sampleh[h.name][arrID][ti][s.id] = value;

                    if (dt[`${h.ip}-jobID`].replace)
                        dt[`${h.ip}-jobID`] = JSON.parse(dt[`${h.ip}-jobID`].replace(/'|'/g,'"'));
                    dt[`${h.ip}-jobID`].forEach(jID=>{
                        if (!jobo[jID].nodes.find(m=>m===h.name))
                            jobo[jID].nodes.push(h.name);
                    });
                    if (ti)
                        _.difference(data[ti-1][`${h.ip}-jobID`],dt[`${h.ip}-jobID`]) // job has been end
                            .forEach(jID=>{
                                jobo[jID].endTime = d3.timeFormat('%a %b %d %X CDT %Y')(new Date(sampleh.timespan[ti].replace('Z','')));
                            });
                })
            })});
        console.log(JSON.stringify(sampleh));
        console.log(JSON.stringify(jobd));
    })
});