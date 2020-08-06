let _end = new Date('8/6/2020 14:00:00 GMT-05'); //'2020-02-14T12:00:00-05:00'
let _start = new Date('8/5/2020 14:00:00 GMT-05'); //'2020-02-14T18:00:00-05:
const interval = '5m';
const value = 'max';
const compress = false;
const url = getUrl({_start,_end,interval,value,compress});
console.log(url)
console.time('request time: ')
d3.json(url).then(function(data){
    data.time_stamp=data.time_stamp.map(e=>new Date(e/1000000));
    d3.keys(data.jobs_info).forEach(jID=>{
        data.jobs_info[jID].node_list = data.jobs_info[jID].node_list.map(c=>c.split('-')[0]);
        if(data.jobs_info[jID].start_time>9999999999999)
        {data.jobs_info[jID].start_time = data.jobs_info[jID].start_time/1000000
            data.jobs_info[jID].submit_time = data.jobs_info[jID].submit_time/1000000
            if (data.jobs_info[jID].finish_time)
                data.jobs_info[jID].finish_time = data.jobs_info[jID].finish_time/1000000}
    })
    data.currentTime = _.last(data.time_stamp);
    console.timeEnd('request time: ')
    return data;
}).then(data=>{
    const data_ = handleDataUrl(data);
    let  sampleS = data_.sampleS;
    tsnedata = data_.tsnedata;
    let {computers,jobs,users} = handleData(data);
    let data_out=[];
    let color = d3.scaleOrdinal(d3.schemeCategory20)
    for (let j in  jobs){
        jobs[j].node_list.forEach(c=>{
            data_out.push([jobs[j].start_time/1000,jobs[j].user_name,'A','/'+Layout.compute_layout[c]+'/'+c,d3.color(color(jobs[j].user_name)).hex().replace('#','').toUpperCase()])
            if(jobs[j].finish_time)
                data_out.push([jobs[j].finish_time/1000,jobs[j].user_name,'D','/'+Layout.compute_layout[c]+'/'+c,''])
        })
    }
    data_out.sort((a,b)=>a[0]-b[0]);
    download(''+_start+' '+_end+'.log',data_out.map(d=>d.join('|')).join('\n'))
});


function getUrl({_start,_end,interval,value,compress}){
    const timeFormat = d3.timeFormat('%Y-%m-%dT%H:%M:%S-05:00');
    const start = timeFormat(_start)
    const end = timeFormat(_end)
    interval = interval||'5m';
    value = value||'max';
    compress = compress||false;
    const url = `https://influx.ttu.edu:8080/v1/metrics?start=${start}&end=${end}&interval=${interval}&value=${value}&compress=${compress}`;
    return url;
}
