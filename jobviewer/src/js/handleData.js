
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
    _.mapObject(computers,(d,i)=>d.user=[])
    const jobs = data[JOB]; // object
    const rack = Layout.data;
    // console.log('totaljob: ',d3.keys(jobs).length);
    // Object.keys(jobs).forEach(j=>{
    //     const d = jobs[j];
    //     if (!d.finish_time) {
    //         delete jobs[j]
    //     }tree
    // }); // lastest job
    const user_job = d3.nest()
        .key(d=>d.value[USER]) //user
        .key(d=>d.key.split('.')[0]) //job array
        .object(d3.entries(jobs));
    const users = _.mapObject(user_job,(d,i)=>{
        const job = [];
        const node = _.uniq(_.flatten(_.values(d).map(d=>d.map(d=>(job.push(d.key),d.value.node_list)))));

        node.forEach(c=> computers[c].user.push(i))
        const jobMain = _.uniq(job.map(j=>j.split('.')[0]));
        return {node,job,jobMain}
    });
    return {computers,jobs,users}
}
function adjustTree(sampleS,computers){
    let layout = Layout.data;
    let {tree,compute_layoutLink} = data2tree(d3.entries(layout),sampleS,computers);
    Layout.tree = tree;
}

function data2tree(data,sampleS,computers){
    const compute_layoutLink = {};
    const tree =  {name:"__main__",children:data.map(d=>{
            const el = {
                name:d.key,
                children:_.flatten(d.value)
                    .filter(e=>e!==null)
                    .map(c=>{
                        const item = {
                            name:c,
                            value:1,
                            metrics:{},
                            user: computers?computers[c].user:[]
                        };
                        if (sampleS){
                            serviceFullList.forEach(s=>item.metrics[s.text]=_.last(sampleS[c][serviceListattr[s.idroot]])[s.id]);
                            if (computers)
                                computers[c].metric = item.metrics
                        }
                        compute_layoutLink[c] = d.key;
                        return item;
                    })
            };
            el.summary={};
            if (sampleS)
                serviceFullList.forEach(s=>{
                    const dataarr = el.children.map(d=>d.metrics[s.text]);
                    el.summary[s.text] = {
                        min: d3.min(dataarr),
                        max:d3.max(dataarr),
                        // q1:d3.min(dataarr),
                        // q3:d3.min(dataarr),
                        // median:d3.min(dataarr),
                        mean: d3.mean(dataarr),
                        // std:d3.min(dataarr),
                    };
                });
            return el;
    })
    };
    return {tree,compute_layoutLink};
}
let currentDraw=()=>{};
let tsnedata = {};
function queryData(data) {
    const data_ = handleDataUrl(data);
    let  sampleS = data_.sampleS;
    tsnedata = data_.tsnedata;
    let {computers,jobs,users} = handleData(data);
    adjustTree(sampleS,computers);
    const currentTime = data.currentTime;
    currentDraw = _.partial(draw,computers,jobs,users,sampleS,currentTime);
    currentDraw(serviceSelected);
}
