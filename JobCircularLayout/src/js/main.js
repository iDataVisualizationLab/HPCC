//parametter
const COMPUTE = 'nodes_info';
const JOB = 'jobs_info';
const USER = 'user_name';

const timeFormat = d3.timeFormat('%Y-%m-%dT%H:%M:%S-05:00');
// layout
let Layout = {
    data:{},
}

let serviceSelected = 0;

let request = new Simulation('src/data/742020.json');
let timelineControl = new Timeline('#timelineControl');
timelineControl.play = request.start.bind(request);
timelineControl.pause = request.pause.bind(request);
timelineControl.stop = request.stop.bind(request);

$(document).ready(function(){

    request.onDataChange.push(timelineControl.domain.bind(timelineControl));
    request.onUpdateTime.push(timelineControl.update.bind(timelineControl));
    request.onFinishQuery.push(queryData);
    queryLayout().then(()=>request.start.bind(request)(1000));
    // queryLayout().then(()=>request.request());
});
//
// let queue = [queryLayout,queryData];
// queue.forEach((q,i)=>{
//     if (queue[i+1])
//         q().then(queue[i+1]);
//
// });
