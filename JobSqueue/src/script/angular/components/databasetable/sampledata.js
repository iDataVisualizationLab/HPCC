'use strict';

angular.module('hpccApp').constant('SampleData', [
    {
        id:"sample",
        name:"Sample Data",
        url:"src/data/squeue.json",
        description:"",
        group:"sample",
        formatType:'json',
        type:'json',
        customSetting: {definedType:{"JOBID":"text","TIME":"duration","TIME_LEFT":"duration","START_TIME":"time"},
        preprocess:{"STATE":(s)=>s.map(e=>e.split(" (")[0])},
        disableAxis: {"NODELIST":true,"JOBID":true},
        initAxis: "STATE",
        // "TIME":s=>moment.duration(s.replace('-',' '))._milliseconds,
        // "TIME_LEFT":s=>moment.duration(s.replace('-',' '))._milliseconds,
        },
    }
]);
