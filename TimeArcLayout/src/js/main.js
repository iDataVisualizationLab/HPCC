//parametter
const COMPUTE = 'nodes_info';
const JOB = 'jobs_info';
const JOBNAME = 'job_name';
const USER = 'user_name';

const timeFormat = d3.timeFormat('%Y-%m-%dT%H:%M:%S-05:00');
// layout
let Layout = {
    data:{},
}

let serviceSelected = 0;

// let request = new Simulation('../HiperView/data/742020.json');
let request, timelineControl;

$(document).ready(function(){
    try {
        // let mode = window.location.search.substring(1).split("mode=")[1].split('&')[0].replace(/%20/g,' '); // get data name after app=
        let command = window.location.search.substring(1).split("&").map(d=>d.split('=')); // get data name after app=
        command = _.object(command.map(d=>d[0]),command.map(d=>d[1])); // get data name after app=

        if(command.service!==undefined && _.isNumber(+command.service))
            serviceSelected = +command.service;
        if(command.metric!==undefined && _.isNumber(+command.metric))
            serviceSelected = +command.metric;
        if (command.mode==='realTime')
        {
            // set up ui
            d3.select('#navMode').selectAll('li a').classed('active',false);
            d3.select('#navMode').select('li.realtime a').classed('active',true);
            //---------
            request = new Simulation();
        }
        else {
            // set up ui
            d3.select('#navMode').selectAll('li').classed('active',false);
            d3.select('#navMode').select('li.demo a').classed('active',true);
            // let url = '../HiperView/data/814_821_2020.json';
            // let url = '../jobviewer/src/data/922020-932020-145000.json';
            let url = 'src/data/nocona_aggregated.csv';
            //---------
            // request = new Simulation('../HiperView/data/7222020.json');
            // request = new Simulation('../HiperView/data/Tue Aug 04 2020 16_00_00 GMT-0500 (Central Daylight Time) Thu Aug 06 2020 16_00_00 GMT-0500 (Central Daylight Time).json');
            // request = new Simulation('../HiperView/data/8122020.json');
            // request = new Simulation('../HiperView/data/814_821_2020.json');
            request = new Simulation(d3.csv(url).then(d=>{
                d=d.slice(0,1920)
                const data = {jobs_info:{},nodes_info:{},time_stamp:[]};
                Object.keys(d[0]).filter(k=>k!=='time').forEach(e=>{
                    data.nodes_info[e.split('_')[0]] = {"power_usage":[],"job_id":[]};
                });
                serviceFullList = [{"text":"Power","id":0,"enable":true,"idroot":0,"angle":0,"range":[0,800]}]
                serviceListattr = ["Power"];
                serviceLists = [{"text":"Power","id":0,"enable":true,"sub":[{"text":"Power","id":0,"enable":true,"idroot":0,"angle":0,"range":[0,800]}]}];
                serviceList_selected = [{"text":"Power","index":0}];
                alternative_service = ["power_usage"];
                alternative_scale = [1];
                debugger
                d.forEach(e=>{
                    data.time_stamp.push(+e.time*1000000000);
                    Object.keys(data.nodes_info).forEach(comp=>{
                        let cpus = JSON.parse(e[comp+'_cpus']);
                        let jobs = JSON.parse(e[comp+'_jobs']);
                        data.nodes_info[comp].job_id.push(jobs);
                        data.nodes_info[comp].power_usage.push(+e[comp+'_power']);
                        jobs.forEach((j,ji)=>{
                            if (!data.jobs_info[j])
                                data.jobs_info[j] = {
                                        "cpu_cores": cpus[ji],
                                        "finish_time": null,
                                        "job_name": ''+j,
                                        "node_list": [],
                                        "node_list_obj": {},
                                    "start_time": +e.time*1000000000,
                                    "submit_time": +e.time*1000000000,
                                    "total_nodes": 0,
                                    "user_name": "unknown"
                                }
                            if (!data.jobs_info[j].node_list_obj[comp]){
                                data.jobs_info[j].node_list_obj[comp] = cpus[ji];
                                data.jobs_info[j].node_list.push(comp);
                                data.jobs_info[j].total_nodes ++;
                            }
                            data.jobs_info[j].finish_time = +e.time*1000000000;
                        })
                    })
                })
                debugger
                return data;
            }));
        }
    }catch(e){
        // request = new Simulation('../HiperView/data/8122020.json');
        // request = new Simulation('../HiperView/data/814_821_2020.json');
        // request = new Simulation('../HiperView/data/9214_9215_2020.json');
        request = new Simulation('src/data/922020-932020-145000.json');
        // request = new Simulation('../HiperView/data/Tue Aug 04 2020 16_00_00 GMT-0500 (Central Daylight Time) Thu Aug 06 2020 16_00_00 GMT-0500 (Central Daylight Time).json');
        // request = new Simulation('../HiperView/data/Tue Aug 04 2020 15_45_00 GMT-0500 (Central Daylight Time) Thu Aug 06 2020 16_00_00 GMT-0500 (Central Daylight Time).json');
    }
    updateProcess({percentage:5,text:'Load UI...'})
    initMenu();
    updateProcess({percentage:15,text:'Preprocess data...'});
    initdraw();
    initTimeElement();
    // queryLayout().then(()=>request.request());
});

function initTimeElement(){

        // request.onFinishQuery.push(queryData);
        request.onDataChange.push((data)=> {
            updateProcess({percentage:50,text:'Preprocess data'})
            setTimeout(()=>{
                handleRankingData(data);
                updateProcess({percentage:80,text:'Preprocess data'})
                drawUserList();
                drawJobList();
                // initdrawGantt();
                // drawGantt();
                // timelineControl.play.bind(timelineControl)();
                updateProcess();
            },0);
        });
}
