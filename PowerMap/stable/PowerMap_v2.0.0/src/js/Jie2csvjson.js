function convertFulljson(data){
    let csv = 'timestamp';
    let s = Object.keys(data.nodes_info[Object.keys(data.nodes_info)[0]]).filter(d=>d!=='jobs');
    let comp = Object.keys(data.nodes_info);
    comp.forEach(c=>s.forEach(e=>csv+=`,${c}|${e}`));
    data.time_stamp.forEach((t,ti)=>{
        const time = new Date(t /1000000).toISOString();
        csv+=`\n${time}`;
        d3.entries(data.nodes_info).forEach(d=>{
            s.forEach(e=>{
                csv+=`,${d.value[e][ti]}`
            })
        })
    });
    console.log(csv)
    // Object.keys(data.jobs_info).forEach(jid=>{
    //     data.jobs_info[jid].end_time
    // })
}
