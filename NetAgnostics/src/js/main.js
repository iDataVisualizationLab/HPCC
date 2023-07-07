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
            let url = 'src/data/nocona_2023-06-14T12-00-00.00Z-2023-06-21T12-00-00.00Z.json';
            // let url = '../HiperView/data/814_821_2020.json';
            // let url = '../jobviewer/src/data/922020-932020-145000.json';
            if (command.timeStart!==undefined&&command.timeEnd!==undefined){// `2020-02-14T12:00:00-05:00`
                _start = new Date(command.timeStart);
                _end = new Date(command.timeEnd);
                const interval = '5m';
                const value = 'max';
                const compress = false;
                debugger
                if (!(_.isNaN(_start.getDate())||_.isNaN(_end.getDate()))){
                    url= d3.json(getUrl({_start,_end,interval,value,compress}));
                }
            }
            //---------
            // request = new Simulation('../HiperView/data/7222020.json');
            // request = new Simulation('../HiperView/data/Tue Aug 04 2020 16_00_00 GMT-0500 (Central Daylight Time) Thu Aug 06 2020 16_00_00 GMT-0500 (Central Daylight Time).json');
            // request = new Simulation('../HiperView/data/8122020.json');
            // request = new Simulation('../HiperView/data/814_821_2020.json');
            request = new Simulation(url);
        }
    }catch(e){
        // request = new Simulation('../HiperView/data/8122020.json');
        // request = new Simulation('../HiperView/data/814_821_2020.json');
        // request = new Simulation('../HiperView/data/9214_9215_2020.json');
        // request = new Simulation('src/data/922020-932020-145000.json');
        // request = new Simulation('../HiperView/data/Tue Aug 04 2020 16_00_00 GMT-0500 (Central Daylight Time) Thu Aug 06 2020 16_00_00 GMT-0500 (Central Daylight Time).json');
        // request = new Simulation('../HiperView/data/Tue Aug 04 2020 15_45_00 GMT-0500 (Central Daylight Time) Thu Aug 06 2020 16_00_00 GMT-0500 (Central Daylight Time).json');
    }
    updateProcess({percentage:5,text:'Load UI...'})
    initMenu();
    // initClusterUI();
    updateProcess({percentage:15,text:'Preprocess data...'});
    initdraw();
    initTimeElement();
});

function initTimeElement(){
    if (request.isRealTime) {
        request.onFinishQuery.push((d)=>(updateProcess(),d));
        request.setInterval(120000);
        request.onFinishQuery.push((data)=> {handleRankingData(data);queryData(data);drawUserList();});
        //queryLayout().then(()=>timelineControl.play.bind(timelineControl)());
    }else{
       // request.setInterval(1000);
        request.onFinishQuery.push((data)=>{queryData(data);
            debugger
            serviceControl();});
        request.onDataChange.push((data)=> queryLayout().then(()=>{
            updateProcess({percentage:50,text:'Preprocess data'})
            setTimeout(()=>{
                handleRankingData(data);
                serviceControl();
                updateProcess({percentage:80,text:'Preprocess data'})
                drawUserList();
                // drawPara();
                // initdrawGantt();
                drawGantt();
                currentDraw();
                // timelineControl.play.bind(timelineControl)();
                updateProcess();
            },0);
        }));
    }
    // request.onDataChange.push((data)=> queryLayout().then(()=>handleRankingData(data)).then(drawUserList).then(()=>timelineControl.play.bind(timelineControl)()));
}
