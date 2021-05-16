//parametter
const COMPUTE = 'nodes_info';
const JOB = 'jobs_info';
const JOBNAME = 'job_name';
const USER = 'user_name';

const timeFormat = d3.timeFormat('%Y-%m-%dT%H:%M:%S-05:00');
// layout
let Layout = {
    data: {},
}

let serviceSelected = 0;

// let request = new Simulation('../HiperView/data/742020.json');
let request, timelineControl;

$(document).ready(function () {
    try {
        // let mode = window.location.search.substring(1).split("mode=")[1].split('&')[0].replace(/%20/g,' '); // get data name after app=
        let command = window.location.search.substring(1).split("&").map(d => d.split('=')); // get data name after app=
        command = _.object(command.map(d => d[0]), command.map(d => d[1])); // get data name after app=

        if (command.service !== undefined && _.isNumber(+command.service))
            serviceSelected = +command.service;
        if (command.metric !== undefined && _.isNumber(+command.metric))
            serviceSelected = +command.metric;
        if (command.mode === 'realTime') {
            // set up ui
            d3.select('#navMode').selectAll('li a').classed('active', false);
            d3.select('#navMode').select('li.realtime a').classed('active', true);
            //---------
            request = new Simulation();
        } else {
            // set up ui
            d3.select('#navMode').selectAll('li').classed('active', false);
            d3.select('#navMode').select('li.demo a').classed('active', true);
            // let url = '../HiperView/data/814_821_2020.json';
            // let url = '../jobviewer/src/data/922020-932020-145000.json';
            // let url = 'src/data/nocona_aggregated.csv';
            // let url = 'src/data/aggregated_metrics_6h.json';
            // let url = 'src/data/aggregated_metrics_04_28.json';
            let url = 'src/data/aggregated_metrics_05_12.json';
            // let url = 'src/data/aggregated_metrics_05_12_L.json';
            //---------
            // request = new Simulation('../HiperView/data/7222020.json');
            // request = new Simulation('../HiperView/data/Tue Aug 04 2020 16_00_00 GMT-0500 (Central Daylight Time) Thu Aug 06 2020 16_00_00 GMT-0500 (Central Daylight Time).json');
            // request = new Simulation('../HiperView/data/8122020.json');
            // request = new Simulation('../HiperView/data/814_821_2020.json');

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
            request = new Simulation(d3.json(url).then(d => {
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
                console.log(Object.keys(data.jobs_info).length,Object.keys(jobs_info).length)
                data.jobs_info = jobs_info;
                debugger
                return data;
            }));
            // request = new Simulation(d3.csv(url).then(d=>{
            //     // d=d.slice(0,1920)
            //     const data = {jobs_info:{},nodes_info:{},time_stamp:[]};
            //     Object.keys(d[0]).filter(k=>k!=='time').forEach(e=>{
            //         data.nodes_info[e.split('_')[0]] = {"power_usage":[],"job_id":[]};
            //     });
            //     d.forEach(e=>{
            //         data.time_stamp.push(+e.time*1000000000);
            //         Object.keys(data.nodes_info).forEach(comp=>{
            //             let cpus = JSON.parse(e[comp+'_cpus']);
            //             let jobs = JSON.parse(e[comp+'_jobs']);
            //             data.nodes_info[comp].job_id.push(jobs);
            //             data.nodes_info[comp].power_usage.push(e[comp+'_power']!==''?(+e[comp+'_power']):undefined);
            //             jobs.forEach((j,ji)=>{
            //                 if (!data.jobs_info[j])
            //                     data.jobs_info[j] = {
            //                             "cpu_cores": cpus[ji],
            //                             "finish_time": null,
            //                             "job_name": ''+j,
            //                             "node_list": [],
            //                             "node_list_obj": {},
            //                         "start_time": +e.time*1000000000,
            //                         "submit_time": +e.time*1000000000,
            //                         "total_nodes": 0,
            //                         "user_name": "unknown"
            //                     }
            //                 if (!data.jobs_info[j].node_list_obj[comp]){
            //                     data.jobs_info[j].node_list_obj[comp] = cpus[ji];
            //                     data.jobs_info[j].node_list.push(comp);
            //                     data.jobs_info[j].total_nodes ++;
            //                 }
            //                 data.jobs_info[j].finish_time = +e.time*1000000000;
            //             })
            //         })
            //     })
            //     debugger
            //     return data;
            // }));
        }
    } catch (e) {
        // request = new Simulation('../HiperView/data/8122020.json');
        // request = new Simulation('../HiperView/data/814_821_2020.json');
        // request = new Simulation('../HiperView/data/9214_9215_2020.json');
        request = new Simulation('src/data/922020-932020-145000.json');
        // request = new Simulation('../HiperView/data/Tue Aug 04 2020 16_00_00 GMT-0500 (Central Daylight Time) Thu Aug 06 2020 16_00_00 GMT-0500 (Central Daylight Time).json');
        // request = new Simulation('../HiperView/data/Tue Aug 04 2020 15_45_00 GMT-0500 (Central Daylight Time) Thu Aug 06 2020 16_00_00 GMT-0500 (Central Daylight Time).json');
    }
    updateProcess({percentage: 5, text: 'Load UI...'})
    initMenu();
    updateProcess({percentage: 15, text: 'Preprocess data...'});
    initdraw();
    initTimeElement();
    // queryLayout().then(()=>request.request());
});

function initTimeElement() {

    // request.onFinishQuery.push(queryData);
    request.onDataChange.push((data) => {
        updateProcess({percentage: 50, text: 'Preprocess data'})
        setTimeout(() => {
            handleRankingData(data);
            updateProcess({percentage: 80, text: 'Preprocess data'})
            drawJobList();
            initdrawGantt();
            drawGantt();
            // timelineControl.play.bind(timelineControl)();
            drawUserList();
            drawComputeList();
            updateProcess();
        }, 0);
    });
}
