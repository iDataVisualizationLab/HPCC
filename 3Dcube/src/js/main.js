
let colorUserScale = d3.scaleOrdinal(d3.schemePaired);

let url = 'src/data/aggregated_metrics_05_12.json';

serviceListattr = ["power","mem_power","mem_usage"];
serviceLists = [{
    "text": "power",
    "id": 0,
    "enable": true,
    "sub": [{"text": "power", "id": 0, "enable": true, "idroot": 0, "angle": 0, "range": [0, 800]}]
},{
    "text": "mem_power",
    "id": 1,
    "enable": true,
    "sub": [{"text": "mem_power", "id": 0, "enable": true, "idroot": 1, "angle": 0, "range": [0, 300]}]
},{
    "text": "mem_usage",
    "id": 2,
    "enable": true,
    "sub": [{"text": "mem_usage", "id": 0, "enable": true, "idroot": 2, "angle": 0, "range": [0, 100]}]
}];
serviceFullList = [];
serviceLists.forEach(s=>s.sub.forEach(ss=>serviceFullList.push(ss)));

serviceList_selected = [{"text": "power", "index": 0},{"text": "mem_power", "index": 1},{"text": "mem_usage", "index": 2}];
alternative_service = ["power","mem_power","mem_usage"];
alternative_scale = [1,1,1];

d3.json(url).then(d => {
    // d=d.slice(0,1920)
    const data = d;
    data.time_stamp = data.time_stamp.map(d => d * 1000000000);
    const jobObjArr = {};
    Object.values(data.jobs_info).forEach(d => {
        d["submit_time"] = d["submit_time"] * 1000000000;
        d["start_time"] = d["start_time"] * 1000000000;
        d["end_time"] = d["end_time"] * 1000000000;
        d.node_list = d.nodes.slice();
        d.job_name = d.name;
        if (d.array_task_id!==null){
            d.job_array_id = 'array'+d.array_job_id;
            if(!jobObjArr[d.job_array_id]){
                jobObjArr[d.job_array_id] = {
                    isJobarray: true,
                    job_id: d.job_array_id,
                    job_ids:{},
                    "finish_time": null,
                    "job_name": d.name,
                    "node_list": [],
                    "node_list_obj": {},
                    "total_nodes": 0,
                    "user_name": d.user_name,
                    start_time:d.start_time,
                    submit_time:d.submit_time
                }
                jobObjArr[d.job_array_id].job_ids[d.job_id] = d;
            }else{
                jobObjArr[d.job_array_id].job_ids[d.job_id] = d;
                if(d.start_time<jobObjArr[d.job_array_id].start_time)
                    jobObjArr[d.job_array_id].start_time = d.start_time;
                if(d.submit_time<jobObjArr[d.job_array_id].submit_time)
                    jobObjArr[d.job_array_id].submit_time = d.submit_time;
            }
        }
    });
    Object.keys(jobObjArr).forEach(j=>{
        data.jobs_info[j] = jobObjArr[j];
    })
    const jobs_info = {};
    Object.keys(data.nodes_info).forEach(comp => {
        const d = data.nodes_info[comp]
        d.job_id = d.jobs;
        delete d.jobs;
        d.job_id.forEach((js, ti) => {
            js.forEach((j, i) => {
                if (data.jobs_info[j] && (!jobs_info[j])){
                    jobs_info[j] = data.jobs_info[j];
                    jobs_info[j].node_list_obj = {};
                    jobs_info[j].node_list = [];
                    jobs_info[j].total_nodes = 0;
                }else if (!jobs_info[j]) {
                    jobs_info[j] = {
                        "job_id": j,
                        "cpu_cores": d.cpus[ti][i],
                        "finish_time": null,
                        "job_name": '' + j,
                        "node_list": [],
                        "node_list_obj": {},
                        "start_time": data.time_stamp[i],
                        "submit_time": data.time_stamp[i],
                        "total_nodes": 0,
                        "user_name": "unknown"
                    }
                }
                const job_array_id = jobs_info[j].job_array_id;
                if (job_array_id && (!jobs_info[job_array_id])){
                    jobs_info[job_array_id] = data.jobs_info[job_array_id];
                    jobs_info[job_array_id].node_list_obj = {};
                    jobs_info[job_array_id].node_list = [];
                    jobs_info[job_array_id].total_nodes = 0;
                }
                if (!jobs_info[j].node_list_obj[comp]) {
                    jobs_info[j].node_list_obj[comp] = d.cpus[ti][i];
                    jobs_info[j].node_list.push(comp);
                    jobs_info[j].total_nodes++;
                }

                jobs_info[j].finish_time = data.time_stamp[i];
                if(job_array_id){
                    if (!jobs_info[job_array_id].node_list_obj[comp]) {
                        jobs_info[job_array_id].node_list_obj[comp] = d.cpus[ti][i];
                        jobs_info[job_array_id].node_list.push(comp);
                        jobs_info[job_array_id].total_nodes++;
                    }
                    jobs_info[job_array_id].finish_time = data.time_stamp[i];
                }
            })
        })
    });
    console.log(Object.keys(data.jobs_info).length,Object.keys(jobs_info).length);
    data.jobs_info = jobs_info;

    const {dataViz,lineViz,listSearch} = handleData(data);
    draw(dataViz,lineViz,listSearch);
});

function handleData(data){
    let r = handleSmalldata(data);
    let sampleS = r.sampleh;
    let tsnedata = r.tsnedata;

    const dataViz = [];
    const lineViz = {};
    Object.keys(tsnedata).forEach(k=>{lineViz[k] = {key:k, values: []}});
    const numTime = data.time_stamp.length-1;
    const userMap = {};
    data.time_stamp.forEach((t,ti)=>{
        Object.keys(tsnedata).forEach(k=>{
            const item = {x:tsnedata[k][ti][1]??-0.5,y:tsnedata[k][ti][2]??-0.5,z:ti/numTime,
                data:{'-1':ti/numTime,...tsnedata[k][ti],time:new Date(t/1000000)},
                user:{},
                _data:data.nodes_info[k]};
            const userList = [];
            let color = 'gray';
            data.nodes_info[k].job_id[ti].forEach(j=>{
                if ( data.jobs_info[j]){
                    if (!data.jobs_info[j].user_id)
                        debugger
                    userList.push('user '+data.jobs_info[j].user_id);
                    item.user['user '+data.jobs_info[j].user_id] = 1;
                    userMap['user '+data.jobs_info[j].user_id] = data.jobs_info[j].user_name
                }else
                    userList.push('unknown');
            });
            if(!data.nodes_info[k].user_id)
                data.nodes_info[k].user_id = [];
            data.nodes_info[k].user_id[ti] = userList;
            if(userList.length>1){
                color='white'
            }else if(userList.length===1){
                color = colorUserScale(userList[0]);
            }
            item.color = color;
            // if (userList.find(u=>u==='user 98858'))
            dataViz.push(item);
            lineViz[k].values.push(item);
        })
    });
    return {dataViz,lineViz,listSearch:Object.keys(userMap)};
}
