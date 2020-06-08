'use strict';

angular.module('hpccApp').constant('SampleData', [
    {
        id:"serviceWed26Sep_removedmetric",
        name:"HPC data - 26 Sep 2018",
        url:"../HiperView/data/serviceWed26Sep_removedmetric.json",
        description:"",
        category:'hpcc',
        date:"26 Apr 2019",
        group:"sample",
        formatType:'json'
    },
    {
        id:"influxdbThus21Mar_1400_1630",
        name:"HPC data - 21 Mar 2019 (Chill water)",
        url:"../HiperView/data/influxdbThus21Mar_1400_1630.json",
        description:"",
        category:'hpcc',
        date:"21 Mar 2019",
        group:"sample",
        formatType:'json'
    },
    {
        id:"influxdbSun23June2019",
        name:"HPC data - 23 Jun 2019 (overheat compute-6-2)",
        url:"../HiperView/data/influxdbSun23June2019.json",
        description:"",
        category:'hpcc',
        date:"23 Jun 2019",
        group:"sample",
        formatType:'json'
    },
    {
        id:"influxdbSat27Apr_removemetric",
        name:"HPC data - 26 Apr 2019 (with job data)",
        url:"../HiperView/data/influxdbSat27Apr_removemetric.json",
        description:"",
        category:'hpcc',
        date:"26 Apr 2019",
        group:"sample",
        formatType:'json'
    },
    {
        id:"influxdb20Apr_withoutJobLoad",
        name:"HPC data - 20 Apr 2019 (with job data)",
        url:"../HiperView/data/influxdb20Apr_withoutJobLoad.json",
        description:"",
        category:'hpcc',
        date:"20 Apr 2019",
        group:"sample",
        formatType:'json'
    },
    {
        id:"influxdb20Sep_2019_withoutJobLoad",
        name:"HPC data - 20 Sep 2019 (with job data)",
        url:"../HiperView/data/influxdb20Sep_2019_withoutJobLoad.json",
        description:"",
        category:'hpcc',
        date:"20 Sep 2019",
        group:"sample",
        formatType:'json'
    },
    {
        id:"influxdb16Feb_2020_withoutJobLoad",
        name:"HPC data - 16 Feb 2020 (with job data)",
        url:"../HiperView/data/influxdb16Feb_2020_withoutJobLoad.json",
        description:"",
        category:'hpcc',
        date:"16 Feb 2020",
        group:"sample",
        formatType:'json'
    },
    {
        id:"influxdb17Feb_2020_withoutJobLoad",
        name:"HPC data - 17 Feb 2020 (with job data)",
        url:"../HiperView/data/influxdb17Feb_2020_withoutJobLoad.json",
        description:"",
        category:'hpcc',
        date:"17 Feb 2020",
        group:"sample",
        formatType:'json'
    },{
        id:"influxdb0413-0418",
        name:"HPC data - 13-18 Apr 2020 (with job data)",
        url:"../HiperView/data/influxdb0413-0418.json",
        description:"",
        category:'hpcc',
        date:"13 Apr 2020",
        group:"sample",
        formatType:'json'
    },{
        id:"influxdb0426_2am-0426_10pm",
        name:"HPC data - 26 Apr 2020 (with job data)",
        url:"../HiperView/data/influxdb0426_2am-0426_10pm.json",
        description:"",
        category:'hpcc',
        date:"26 Apr 2020",
        group:"sample",
        formatType:'json'
    },{
        id:"influxdb0424-0427",
        name:"HPC data - 24-27 Apr 2020 (with job data)",
        url:"../HiperView/data/influxdb0424-0427.json",
        description:"",
        category:'hpcc',
        date:"24 Apr 2020",
        group:"sample",
        formatType:'json'
    },{
        id:"influxdb0424-0427-filtered",
        name:"HPC data - 24-27 Apr 2020 filtered",
        url:"../HiperView/data/influxdb0424-0427_filtered.json",
        description:"",
        category:'hpcc',
        date:"24 Apr 2020",
        group:"sample",
        formatType:'json'
    },
    {
        id:"zenith_idrac_3.1_through_3.5",
        name:"zenith idrac 3.1 to 3.5",
        url:"../HiperView/data/zenith_idrac_3.1_through_3.5.csv",
        description:"",
        date:"18 Feb 2020",
        group:"sample",
        formatType:'csv'
    },{
        id:"csvEmployment",
        name:"US employment data - people",
        url:"../HiperView/data/csvEmployment.csv",
        description:"",
        date:"1 Jan 1999",
        group:"sample",
        separate:'-',
        formatType:'csv'
    },
    {
        id:"csvEmploymentRate",
        name:"US employment rate data - percentage",
        url:"../HiperView/data/csvEmploymentRate.csv",
        description:"",
        date:"1 Jan 1999",
        group:"sample",
        separate:'-',
        formatType:'csv'
    },
    {
        id:"csvEmploymentNetchange_drop",
        name:"US employment rate data - %nets change",
        url:"../HiperView/data/csvEmploymentNetchange_drop.csv",
        description:"",
        date:"1 Jan 1999",
        group:"sample",
        separate:'-',
        formatType:'csv'
    },
    // {
    //     id:"RUL_F004s",
    //     name:"Rest Useful Life data F004",
    //     url:"../HiperView/data/RUL_F004.csv",
    //     description:"",
    //     date:"28 Feb 2020",
    //     group:"sample",
    //     formatType:'csv'
    // },
    {
        id:"RUL_F001s",
        name:"Rest Useful Life data F001",
        url:"../HiperView/data/RUL_F001.csv",
        description:"",
        date:"28 Feb 2020",
        group:"sample",
        formatType:'csv'
    }
]);
