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


let request;

$(document).ready(function(){
    // request = new LoadShap('src/data/9214_9215_2020.csv');
    // request = new LoadShap('src/data/9214_9314_2020_v2.csv_1000_fast.csv');
    // request = new LoadShap('src/data/9214_9314_2020_v3.csv_2000_fast.csv');
    // request = new LoadShap('src/data/9214_9314_2020_v2.csv_5000_fast.csv');
    // request = new LoadShap('src/data/shap_username.csv');

    handleDatabyUser('../HiperView/data/814_821_2020.json',(data)=>{
    // handleDatabyUser('src/data/nocona_2023-05-01-2023-05-03.json',(data)=>{
        request = new LoadShap(new Promise((resolutionFunc)=>resolutionFunc(data)));
        initMenu();
        initClusterUI();
        initdraw();
        request.onFinishQuery.push(queryData);
        request.onDataChange.push(request.request.bind(request))
    })

    // initMenu();
    // initClusterUI();
    // initdraw();
    // request.onFinishQuery.push(queryData);
    // request.onDataChange.push(request.request.bind(request))
});
