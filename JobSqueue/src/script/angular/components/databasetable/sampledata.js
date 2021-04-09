'use strict';

angular.module('hpccApp').constant('SampleData', [
    {
        id:"realtime",
        name:"Real time squeue",
        url:"http://hugo.hpcc.ttu.edu:5000/queue_status",
        description:"",
        group:"sample",
        formatType:'json',
        type:'json',
        customSetting: {definedType:{"JOBID":"text","TIME":"duration","TIME_LEFT":"duration","START_TIME":"time"},
        preprocess:{"MIN_MEMORY":(s)=>{const v = s.split(" ")[0].trim(); if(v[v.length-1]==='M')
            return +v.slice(0,v.length-1)/1000
                else
                return +v.slice(0,v.length-1)
        }},
        disableAxis: {"NODELIST":true,"JOBID":true,"USER":true},
        initAxis: "STATE",
        // "TIME":s=>moment.duration(s.replace('-',' '))._milliseconds,
        // "TIME_LEFT":s=>moment.duration(s.replace('-',' '))._milliseconds,
        },
        repeat: 60*2*1000,
    },
    {
        id:"sample",
        name:"Sample Data",
        url:"src/data/squeue.json",
        description:"",
        group:"sample",
        formatType:'json',
        type:'json',
        customSetting: {definedType:{"JOBID":"text","TIME":"duration","TIME_LEFT":"duration","START_TIME":"time"},
        preprocess:{"STATE":(s)=>s.map(e=>e.split(" (")[0]),"MIN_MEMORY":(s)=>{const v = s.split(" ")[0].trim(); if(v[v.length-1]==='M')
            return +v.slice(0,v.length-1)/1000
                else
                return +v.slice(0,v.length-1)
        }},
        disableAxis: {"NODELIST":true,"JOBID":true,"USER":true},
        initAxis: "STATE",
        // "TIME":s=>moment.duration(s.replace('-',' '))._milliseconds,
        // "TIME_LEFT":s=>moment.duration(s.replace('-',' '))._milliseconds,
        },
    }
]);
