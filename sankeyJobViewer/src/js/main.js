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

        // set up ui
        d3.select('#navMode').selectAll('li').classed('active',false);
        d3.select('#navMode').select('li.demo a').classed('active',true);
        // let url = '../HiperView/data/814_821_2020.json';
        let url = '../jobviewer/src/data/922020-932020-145000.json';
        if (command.file)
            url = '../jobviewer/src/data/'+command.file+'.json';
        if (command.timeStart!==undefined&&command.timeEnd!==undefined){ `2020-02-14T12:00:00-05:00`
            _start = new Date(command.timeStart);
            _end = new Date(command.timeEnd);
            const interval = '5m';
            const value = 'max';
            const compress = false;
            if (!(_.isNaN(_start.getDate())||_.isNaN(_end.getDate()))){
                url= d3.json(getUrl({_start,_end,interval,value,compress}));
            }
        }
        Layout.userSelected = {};
        command.user.split(',').forEach(k=>Layout.userSelected[k]=true)
        //---------
        // request = new Simulation('../HiperView/data/7222020.json');
        // request = new Simulation('../HiperView/data/Tue Aug 04 2020 16_00_00 GMT-0500 (Central Daylight Time) Thu Aug 06 2020 16_00_00 GMT-0500 (Central Daylight Time).json');
        // request = new Simulation('../HiperView/data/8122020.json');
        // request = new Simulation('../HiperView/data/814_821_2020.json');
        request = new Simulation(url);
        updateProcess({percentage:5,text:'Load UI...'})
        initMenu();
        updateProcess({percentage:10,text:'Load Cluster UI...'})
        updateProcess({percentage:15,text:'Init Graph...'});
        initdraw();
        initTimeElement();
    }catch(e){
        // request = new Simulation('../HiperView/data/8122020.json');
        // request = new Simulation('../HiperView/data/814_821_2020.json');
        // request = new Simulation('../HiperView/data/9214_9215_2020.json');
        // request = new Simulation('src/data/922020-932020-145000.json');
        // request = new Simulation('../HiperView/data/Tue Aug 04 2020 16_00_00 GMT-0500 (Central Daylight Time) Thu Aug 06 2020 16_00_00 GMT-0500 (Central Daylight Time).json');
        // request = new Simulation('../HiperView/data/Tue Aug 04 2020 15_45_00 GMT-0500 (Central Daylight Time) Thu Aug 06 2020 16_00_00 GMT-0500 (Central Daylight Time).json');
        alert('invalid query')
    }
    // updateProcess({percentage:5,text:'Load UI...'})
    // initMenu();
    // updateProcess({percentage:10,text:'Load Cluster UI...'})
    // updateProcess({percentage:15,text:'Init Graph...'});
    // initdraw();
    // initTimeElement();
    // queryLayout().then(()=>request.request());
});

function initTimeElement(){
    if (request.isRealTime) {
        request.onFinishQuery.push((d)=>(updateProcess(),d));
        request.setInterval(120000);
        request.onFinishQuery.push((data)=> {handleRankingData(data);queryData(data);drawUserList();});
        //queryLayout().then(()=>timelineControl.play.bind(timelineControl)());
    }else{
        // request.setInterval(1000);
        request.onFinishQuery.push(queryData);
        request.onDataChange.push((data)=> queryLayout().then(()=>{
            updateProcess({percentage:50,text:'Preprocess data'})
            setTimeout(()=>{
                handleRankingData(data);
                updateProcess({percentage:80,text:'Preprocess data'})
                drawUserList();
                initdrawGantt();
                drawGantt();
                // timelineControl.play.bind(timelineControl)();
                updateProcess();
            },0);
        }));
    }
    // request.onDataChange.push((data)=> queryLayout().then(()=>handleRankingData(data)).then(drawUserList).then(()=>timelineControl.play.bind(timelineControl)()));
}
