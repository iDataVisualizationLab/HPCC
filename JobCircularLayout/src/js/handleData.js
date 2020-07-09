
function queryLayout() {
    return d3.json('src/data/layout.json').then(layout => {
        Layout.data = layout;
        let {tree,compute_layoutLink} = data2tree(d3.entries(layout));
        Layout.tree = tree;
        Layout.compute_layout = compute_layoutLink;
    });
}

function handleData(data){
    const computers = data[COMPUTE];
    const jobs = data[JOB]; // object
    const rack = Layout.data;
    // console.log('totaljob: ',d3.keys(jobs).length);
    // Object.keys(jobs).forEach(j=>{
    //     const d = jobs[j];
    //     if (!d.finish_time) {
    //         delete jobs[j]
    //     }
    // }); // lastest job
    const user_job = d3.nest()
        .key(d=>d.value[USER]) //user
        .key(d=>d.key.split('.')[0]) //job array
        .object(d3.entries(jobs));
    const users = _.mapObject(user_job,(d,i)=>{
        const job = [];
        const node = _.uniq(_.flatten(_.values(d).map(d=>d.map(d=>(job.push(d.key),d.value.node_list)))));
        const jobMain = _.uniq(job.map(j=>j.split('.')[0]));
        return {node,job,jobMain}
    });
    return {computers,jobs,users}
}
function adjustTree(sampleS){
    let layout = Layout.data;
    let {tree,compute_layoutLink} = data2tree(d3.entries(layout),sampleS);
    Layout.tree = tree;
}

function data2tree(data,sampleS){
    const compute_layoutLink = {};
    const tree =  {name:"__main__",children:data.map(d=>(
            {
                name:d.key,
                children:_.flatten(d.value)
                    .filter(e=>e!==null)
                    .map(c=>{
                        const item = {
                            name:c,
                            value:1,
                            metrics:{}
                        };
                        if (sampleS)
                            serviceFullList.forEach(s=>item.metrics[s.text]=_.last(sampleS[c][serviceListattr[s.idroot]])[s.id]);
                        compute_layoutLink[c] = d.key;
                        return item;
                    })
            }))
    };
    return {tree,compute_layoutLink};
}

function queryData(data) {
        let  sampleS = handleDataUrl(data).sampleS;
        adjustTree(sampleS);
        let {computers,jobs,users} = handleData(data);
        const currentTime = data.currentTime;
        draw({computers,jobs,users,sampleS,serviceSelected,currentTime});
}

// read data
// function queryData() {
//     timeFormat = d3.timeFormat('%Y-%m-%dT%H:%M:%S-05:00');
//     _end = new Date(); //'2020-02-14T12:00:00-05:00'
//     _start = new Date(_end.getTime()); //'2020-02-14T18:00:00-05:
//     _start.setMinutes(_start.getMinutes() - 5);
//     start = timeFormat(_start)
//     end = timeFormat(_end)
//     interval = '5m';
//     value = 'max';
//     compress = false;
//     console.time('requestdata')
//     url = `https://influx.ttu.edu:8080/v1/metrics?start=${start}&end=${end}&interval=${interval}&value=${value}&compress=${compress}`;
//     console.log(url)
//     // return d3.json(url).then(function(data){
//     return d3.json('src/data/742020.json').then(function (data) {
//         console.timeEnd('requestdata')
//         let  sampleS = handleDataUrl(data).sampleS;
//         adjustTree(sampleS);
//         let {computers,jobs,users} = handleData(data);
//         draw({computers,jobs,users,sampleS,serviceSelected});
//     })
// }
