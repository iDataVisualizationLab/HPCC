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
