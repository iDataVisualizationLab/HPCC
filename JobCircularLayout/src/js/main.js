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

// let request = new Simulation('src/data/742020.json');
let request, timelineControl;

$(document).ready(function(){
    try {
        let mode = window.location.search.substring(1).split("mode=")[1].split('&')[0].replace(/%20/g,' '); // get data name after app=
        if (mode==='realTime')
            request = new Simulation();
        else
            request = new Simulation('src/data/742020.json');
    }catch(e){
        request = new Simulation('src/data/742020.json');
    }
    initTimeElement();
    queryLayout().then(()=>timelineControl.play.bind(timelineControl)());
    // queryLayout().then(()=>request.request());
});

function initTimeElement(){
    timelineControl = new Timeline('#timelineControl');
    timelineControl.callbackPlay = request.start.bind(request);
    timelineControl.callbackPause = request.pause.bind(request);
    request.callbackStop = timelineControl.pause.bind(timelineControl);

    request.onDataChange.push(timelineControl.domain.bind(timelineControl));
    request.onUpdateTime.push(timelineControl.update.bind(timelineControl));

    if (request.isRealTime) {
        request.onStartQuery=()=>timelineControl.meassage.text('query data....');
        request.onFinishQuery.push((d)=>(timelineControl.meassage.text(''),d));
        request.setInterval(60000);
    }else
        request.setInterval(1000);

    request.onFinishQuery.push(queryData);
}
