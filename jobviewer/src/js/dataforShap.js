d3.json('https://influx.ttu.edu:8080/v1/metrics?start=2020-09-02T14:50:00-05:00&end=2020-09-03T14:50:00-05:00&interval=5m&value=max&compress=false').then(function(data){
    data.time_stamp=data.time_stamp.map(e=>new Date(e/1000000));
    d3.keys(data.jobs_info).forEach(jID=>{
        data.jobs_info[jID].node_list = data.jobs_info[jID].node_list.map(c=>c.split('-')[0]);
        if(data.jobs_info[jID].start_time>9999999999999)
        {data.jobs_info[jID].start_time = data.jobs_info[jID].start_time/1000000
            data.jobs_info[jID].submit_time = data.jobs_info[jID].submit_time/1000000
            if (data.jobs_info[jID].finish_time)
                data.jobs_info[jID].finish_time = data.jobs_info[jID].finish_time/1000000}
    });

    var datashap= 'user,node,time,'+serviceFullList.map(d=>d.text).join(',')+'\n';
    var serviceattr = serviceListattr.slice();
    serviceattr.pop();
    data.time_stamp.forEach((t,index)=>{
        const currentTime = data.time_stamp[index];
        const jobs_info = _.omit(data.jobs_info, function (val, key, object) {
            return (val.start_time > currentTime) || ((val.finish_time!==null)&&(val.finish_time < currentTime));
        });

        const nodes_info = {};
        d3.keys(data.nodes_info).forEach(c => {
            nodes_info[c] = {};
            d3.keys(data.nodes_info[c]).forEach(s => {
                nodes_info[c][s] = [data.nodes_info[c][s][index]];
            })
        });
        const time_stamp = [currentTime];

        const data_ = handleDataUrl({jobs_info, nodes_info, time_stamp,currentTime});
        let  sampleS = data_.sampleS;
        tsnedata = data_.tsnedata;
        let {computers,jobs,users,jobByNames} = handleData(data);

        d3.entries(users).forEach(d=>{
            d.value.node.forEach(comp=>{
                let temp=[];
                serviceattr.forEach(attr=>{
                    sampleS[comp][attr][0].forEach(v=>temp.push(v));
                });
                datashap+= d.key+','+comp+','+t+','+temp.join(',')+'\n';
            })
        })
    });
    console.log(datashap)

});

var datashap= 'user,'+serviceFullList.map(d=>d.text).join(',')+'\n';
var serviceattr = serviceListattr.slice();
serviceattr.pop();
data.time_stamp.forEach((t,index)=>{
    const currentTime = data.time_stamp[index];
    const jobs_info = _.omit(data.jobs_info, function (val, key, object) {
        return (val.start_time > currentTime) || ((val.finish_time!==null)&&(val.finish_time < currentTime));
    });

    const nodes_info = {};
    d3.keys(data.nodes_info).forEach(c => {
        nodes_info[c] = {};
        d3.keys(data.nodes_info[c]).forEach(s => {
            nodes_info[c][s] = [data.nodes_info[c][s][index]];
        })
    });
    const time_stamp = [currentTime];

    const data_ = handleDataUrl({jobs_info, nodes_info, time_stamp,currentTime});
    let  sampleS = data_.sampleS;
    tsnedata = data_.tsnedata;
    let {computers,jobs,users,jobByNames} = handleData(data);

    d3.entries(users).forEach(d=>{
        d.value.node.forEach(comp=>{
            let temp=[];
            serviceattr.forEach(attr=>{
                sampleS[comp][attr][0].forEach(v=>temp.push(v));
            });
            datashap+= d.key+','+temp.join(',')+'\n';
        })
    })
});
