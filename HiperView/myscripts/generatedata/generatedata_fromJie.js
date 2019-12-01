hosts.forEach(d=>d.ip = `10.101.${d.hpcc_rack}.${d.hpcc_node}`);
//jobdata
d3.csv("../HiperView/data/data_with_job_csv/JobDetail_2019-09-20_2019-09_5m.csv", function (error, data){
    let jobd = data.map(d=>{
        let temp = {"nodes":JSON.parse(d.nodesAddr.replace(/'|'/g,'"')).map(c=>hosts.find(h=>h.ip==c).name),
            "jobID":d.JobID,
            "user":d.user,
            "startTime":d.startTime,
            "submitTime":d.submitTime};
        if (d.endTime)
            temp.endTime = d.endTime;
        return temp;
    })
    console.log(JSON.stringify(jobd))
})
alternative_service = ["CPU1_Temp", "CPU2_Temp", "Inlet_Temp", "Memory_Usage", "Fan_1_Speed", "Fan_2_Speed", "Fan_3_Speed", "Fan_4_Speed", "Power_Usage"];

var sampleh = {};
let ser = serviceListattr.slice();
ser.pop();
d3.csv("../HiperView/data/data_with_job_csv/HostDetail_2019-09-20_2019-09_5m.csv", function (error, data){
    sampleh.timespan = data.map(d=>d['TimeStamp']);
    hosts.forEach(h=>{
       sampleh[h.name]={};
       ser.forEach(s=>sampleh[h.name][s]=[]);
       alternative_service.forEach((sa,si)=>{
           var s =  serviceFullList[si];
           var arrID = serviceListattr[s.idroot];
           data.forEach((dt,ti)=>{
               let value = dt[`${h.ip}-${sa}`];
               if (value=="")
                   value=null;
                else
                    value = +value;
               if(!sampleh[h.name][arrID][ti])
                   sampleh[h.name][arrID][ti]=[];
               sampleh[h.name][arrID][ti][s.id] = value;
           })
    })});
})