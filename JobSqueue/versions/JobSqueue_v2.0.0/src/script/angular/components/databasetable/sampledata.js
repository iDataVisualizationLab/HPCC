'use strict';

const squeue = {
    definedType: {
        "JOBID": "text",
        "ARRAY_JOB_ID": "text",
        "TIME": "duration",
        "TIME_LEFT": "duration",
        "START_TIME": "time",
        "SUBMIT_TIME": "time",
        "WAITING_TIME": "duration",
        "EXECUTION_TIME": "duration",
    },
    preprocess: {
        "START_TIME": (s) => s*1000,
        "SUBMIT_TIME": (s) => s*1000,
        "MIN_MEMORY": (s) => {
            const v = s.split(" ")[0].trim();
            if (v[v.length - 1] === 'M')
                return +v.slice(0, v.length - 1) / 1000
            else
                return +v.slice(0, v.length - 1)
        }
    },
    customAxis: {
        "WAITING_TIME": (d,currentTimestamp) => {
            try {
                let start = +new Date(d["START_TIME"]*1000);
                let delta = (_.isNaN(start)?(+(currentTimestamp)):(start/1000)) - d["SUBMIT_TIME"];
                if(_.isNaN(delta))
                    debugger
                let string = '';
                const day = Math.floor(delta  / 24 / 3600);
                if (day) {
                    string += '' + day + '-';
                }
                delta -= day * 3600 * 24;
                const h = Math.floor(delta / 3600);
                if (h > 9)
                    string += '' + h;
                else
                    string += '0' + h;
                delta -= h * 3600;
                const m = Math.floor(delta / 60);
                if (m > 9)
                    string += ':' + m;
                else
                    string += ':0' + m;
                delta = Math.round(delta - m * 60);
                if (delta > 9)
                    string += ':' + delta;
                else
                    string += ':0' + delta;
                return string;
            }catch(e){
                debugger
                return 'N/A'
            }
        },
        // "EXECUTION_TIME": d => {
        //     let delta = (durationstring2Milisecond(d["TIME"]) +durationstring2Milisecond(d["TIME_LEFT"]))/1000;
        //     let string = '';
        //     const day = Math.floor(delta  / 24 / 3600);
        //     if (day) {
        //         string += '' + day + '-';
        //     }
        //     delta -= day * 3600 * 24;
        //     const h = Math.floor(delta / 3600);
        //     if (h > 9)
        //         string += '' + h;
        //     else
        //         string += '0' + h;
        //     delta -= h * 3600;
        //     const m = Math.floor(delta / 60);
        //     if (m > 9)
        //         string += ':' + m;
        //     else
        //         string += ':0' + m;
        //     delta = Math.round(delta - m * 60);
        //     if (delta > 9)
        //         string += ':' + delta;
        //     else
        //         string += ':0' + delta;
        //     return string;
        // }
    },
    // color:{
    //     "STATE": d3.scaleOrdinal().domain(["RUNNING","PENDING","COMPLETING"]).range(["#2ca02c","#ff7f0e","#d62728"])
    // },
        color: {
        STATE: d3.scaleOrdinal()
            .domain([
                "PENDING",
                "RUNNING",
                "COMPLETED",
                "COMPLETING",
                "FAILED",
                "OUT_OF_MEMORY",
                "CANCELLED",
                "TIMEOUT"
            ])
            .range([
                "#7f7f7f", // PENDING - gray
                "#468ae3", // RUNNING - blue
                "#2ca02c", // COMPLETED - green
                "#2ca02c", // COMPLETING - light blue
                "#d62728", // FAILED - red
                "#ff7f0e", // OUT_OF_MEMORY - orange
                "#000000", // CANCELLED - black
                "#59332b" // TIMEOUT - pink
            ])
    },
    disableAxis: {"NODELIST": true, "JOBID": true, "ARRAY_JOB_ID": true, "USER": true,
        "SUBMIT_TIME": true,
        "TIME_LEFT": true,
        "START_TIME": true},
    axisOrder: {
        "NAME": 0,
        "WAITING_TIME": 1,
        "EXECUTION_TIME":2,
        "TIME": 3,
        // "TIME_LEFT": 4,
        "CPUS": 4,
        "MIN_MEMORY": 5,
        "PARTITION": 6
    },
    initAxis: "STATE",
    // "TIME":s=>moment.duration(s.replace('-',' '))._milliseconds,
    // "TIME_LEFT":s=>moment.duration(s.replace('-',' '))._milliseconds,
}
const h100 = {
    definedType: {
        "JOBID": "text",
        "ARRAY_JOB_ID": "text",
        "TIME": "duration",
        "TIME_LEFT": "duration",
        "START_TIME": "time",
        "SUBMIT_TIME": "time",
        "WAITING_TIME": "duration",
        "EXECUTION_TIME": "duration",
    },
    preprocess: {
        "START_TIME": (s) => s*1000,
        "SUBMIT_TIME": (s) => s*1000,
        "MIN_MEMORY": (s) => {
            const v = s.split(" ")[0].trim();
            if (v[v.length - 1] === 'M')
                return +v.slice(0, v.length - 1) / 1000
            else
                return +v.slice(0, v.length - 1)
        }
    },
    customAxis: {
        "WAITING_TIME": (d,currentTimestamp) => {
            try {
                let start = +new Date(d["START_TIME"]*1000);
                let delta = (_.isNaN(start)?(+(currentTimestamp)):(start/1000)) - d["SUBMIT_TIME"];
                if(_.isNaN(delta))
                    debugger
                let string = '';
                const day = Math.floor(delta  / 24 / 3600);
                if (day) {
                    string += '' + day + '-';
                }
                delta -= day * 3600 * 24;
                const h = Math.floor(delta / 3600);
                if (h > 9)
                    string += '' + h;
                else
                    string += '0' + h;
                delta -= h * 3600;
                const m = Math.floor(delta / 60);
                if (m > 9)
                    string += ':' + m;
                else
                    string += ':0' + m;
                delta = Math.round(delta - m * 60);
                if (delta > 9)
                    string += ':' + delta;
                else
                    string += ':0' + delta;
                return string;
            }catch(e){
                debugger
                return 'N/A'
            }
        },
        // "EXECUTION_TIME": d => {
        //     let delta = (durationstring2Milisecond(d["TIME"]) +durationstring2Milisecond(d["TIME_LEFT"]))/1000;
        //     let string = '';
        //     const day = Math.floor(delta  / 24 / 3600);
        //     if (day) {
        //         string += '' + day + '-';
        //     }
        //     delta -= day * 3600 * 24;
        //     const h = Math.floor(delta / 3600);
        //     if (h > 9)
        //         string += '' + h;
        //     else
        //         string += '0' + h;
        //     delta -= h * 3600;
        //     const m = Math.floor(delta / 60);
        //     if (m > 9)
        //         string += ':' + m;
        //     else
        //         string += ':0' + m;
        //     delta = Math.round(delta - m * 60);
        //     if (delta > 9)
        //         string += ':' + delta;
        //     else
        //         string += ':0' + delta;
        //     return string;
        // }
    },
    // color:{
    //     "STATE": d3.scaleOrdinal().domain(["RUNNING","PENDING","COMPLETING"]).range(["#2ca02c","#ff7f0e","#d62728"])
    // },
        color: {
        STATE: d3.scaleOrdinal()
            .domain([
                "PENDING",
                "RUNNING",
                "COMPLETED",
                "FAILED",
                "OUT_OF_MEMORY",
                "CANCELLED",
                "TIMEOUT"
            ])
            .range([
                "#7f7f7f", // PENDING - gray
                "#468ae3", // RUNNING - blue
                "#2ca02c", // COMPLETED - green
                "#d62728", // FAILED - red
                "#ff7f0e", // OUT_OF_MEMORY - orange
                "#000000", // CANCELLED - black
                "#59332b" // TIMEOUT - pink
            ])
    },
    disableAxis: {"NODELIST": true, "JOBID": true, "ARRAY_JOB_ID": true, "USER": true,
        "SUBMIT_TIME": true,
        "TIME_LEFT": true,
        "START_TIME": true},
    axisOrder: {
        "NAME": 0,
        "WAITING_TIME": 1,
        "EXECUTION_TIME":2,
        "TIME": 3,
        // "TIME_LEFT": 4,
        "CPUS": 4,
        "MIN_MEMORY": 5,
        "PARTITION": 6
    },
    initAxis: "STATE",
    // "TIME":s=>moment.duration(s.replace('-',' '))._milliseconds,
    // "TIME_LEFT":s=>moment.duration(s.replace('-',' '))._milliseconds,
}
angular.module('hpccApp').constant('SampleData', [
    {
        id: "history",
        name: "Sample Data",
        url: "src/data/response_1753356572139.json",
        description: "",
        group: "sample",
        formatType: 'json',
        type: 'json_new',
        customSetting: h100,
    },
    {
        id: "history_old",
        name: "Sample Data (Old)",
        url: "src/data/squeue.json",
        description: "",
        group: "sample",
        formatType: 'json',
        type: 'json',
        customSetting: squeue,
    },
    // {
    //     id: "realtime",
    //     name: "Real time squeue (Old)",
    //     url: "https://hugo.hpcc.ttu.edu:5002/queue",
    //     description: "",
    //     group: "sample",
    //     formatType: 'json',
    //     type: 'json',
    //     customSetting: squeue,
    //     repeat: 60 * 2 * 1000,
    // },
    {
        id: "h100_api",
        name: "Real time H100",
        url: "http://narumuu.ttu.edu/api/h100/",
        description: "",
        group: "sample",
        formatType: 'json',
        type: '',
        customSetting: h100,
        repeat: 60 * 2 * 1000,
    }
]);

function durationstring2Milisecond(s){
    let miliseconds = 0;
    const _days = s.split('-');
    let _time = '';
    if (_days.length>1){
        miliseconds+= (+_days[0])*24*3600*1000;
        _time = _days[1].split(':').reverse();
        }else{
        _time = _days[0].split(':').reverse();
    }
    miliseconds+= (_time[0]??0)*1000;
    miliseconds+= (_time[1]??0)*60*1000;
    miliseconds+= (_time[2]??0)*3600*1000;
    return miliseconds
}

