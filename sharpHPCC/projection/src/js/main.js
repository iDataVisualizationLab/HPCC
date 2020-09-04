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
    request = new LoadShap('src/data/9214_9215_2020.csv');

    initMenu();
    initClusterUI();
    initdraw();
    request.onFinishQuery.push(queryData);
    request.onDataChange.push(request.request.bind(request))
});
