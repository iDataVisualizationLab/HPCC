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
            //---------
            // request = new Simulation('../HiperView/data/7222020.json');
            // request = new Simulation('../HiperView/data/Tue Aug 04 2020 16_00_00 GMT-0500 (Central Daylight Time) Thu Aug 06 2020 16_00_00 GMT-0500 (Central Daylight Time).json');
            // request = new Simulation('../HiperView/data/8122020.json');
            // request = new Simulation('../HiperView/data/814_821_2020.json');
            request = new Simulation('src/data/922020-932020-145000.json');
        }
    }catch(e){
        // request = new Simulation('../HiperView/data/8122020.json');
        // request = new Simulation('../HiperView/data/814_821_2020.json');
        // request = new Simulation('../HiperView/data/9214_9215_2020.json');
        request = new Simulation('src/data/922020-932020-145000.json');
        // request = new Simulation('../HiperView/data/Tue Aug 04 2020 16_00_00 GMT-0500 (Central Daylight Time) Thu Aug 06 2020 16_00_00 GMT-0500 (Central Daylight Time).json');
        // request = new Simulation('../HiperView/data/Tue Aug 04 2020 15_45_00 GMT-0500 (Central Daylight Time) Thu Aug 06 2020 16_00_00 GMT-0500 (Central Daylight Time).json');
    }
    initMenu();
    initClusterUI();
    initdraw();
    initTimeElement();
    // queryLayout().then(()=>request.request());
});

function initTimeElement(){
    timelineControl = new Timeline('#timelineControl');
    timelineControl.callbackPlay = request.start.bind(request);
    timelineControl.callbackPause = request.pause.bind(request);
    timelineControl.step = _.partial(request.request.bind(request),0);
    request.callbackStop = timelineControl.pause.bind(timelineControl);

    request.onTimeChange.push(timelineControl.domain.bind(timelineControl));
    // request.onDataChange.push(handleRankingData);
    request.onUpdateTime.push(timelineControl.update.bind(timelineControl));

    if (request.isRealTime) {
        timelineControl.disableHandle(true);
        request.onStartQuery=()=>timelineControl.meassageHolder.setMessage('query data....');
        request.onFinishQuery.push((d)=>(timelineControl.meassageHolder.setMessage(''),d));
        request.setInterval(120000);
    }else
        request.setInterval(1000);

    request.onFinishQuery.push(queryData);
    request.onDataChange.push((data)=> queryLayout().then(()=>handleRankingData(data)).then(drawUserList).then(()=>timelineControl.play.bind(timelineControl)()));
}
