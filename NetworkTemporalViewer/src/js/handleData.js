let maxCore = 36;
function queryLayout() {
    return d3.json('../jobviewer/src/data/layout.json').then(layout => {
        Layout.data = layout;
        Layout.data_flat = d3.entries(layout).map(d=>(d.value=_.flatten(d.value).filter(e=>e!==null),d));
        let {tree,compute_layoutLink} = data2tree(Layout.data_flat);
        Layout.tree = tree;
        Layout.compute_layout = compute_layoutLink;
        // userPie.maxValue(d3.keys(Layout.compute_layout).length*maxCore);
    });
}

function handleData(data){
    const computers = data[COMPUTE];
    _.mapObject(computers,(d,i)=>(d.user=[],d.jobName=[]))
    const jobs = data[JOB]; // object
    const rack = Layout.data;
    const user_job = d3.nest()
        .key(d=>d.value[USER]) //user
        .key(d=>d.key.split('.')[0]) //job array
        .object(d3.entries(jobs));
    const users = _.mapObject(user_job,(u,i)=>{
        const job = [];
        let totalCore = 0;
        const node = _.uniq(_.flatten(_.values(u).map(d=>d.map(d=>(job.push(d.key),totalCore+=d.value.cpu_cores,d.value.node_list)))));
        node.forEach(c=> computers[c].user.push(i))
        const jobMain = _.uniq(job.map(j=>j.split('.')[0]));
        return {node,job,jobMain,totalCore}
    });
    const jobName_job = d3.nest()
        .key(d=>d.value[JOBNAME].slice(0,3)) //user
        .key(d=>d.key.split('.')[0]) //job array
        .entries(d3.entries(jobs));
    return {computers,jobs,users}
}
function adjustTree(sampleS,computers){
    let {tree,compute_layoutLink} = data2tree(Layout.data_flat,sampleS,computers);
    Layout.tree = tree;
}

// Setup the positions of outer nodes
function getData(d){
    if ( vizservice[serviceSelected].text==='User')
        return d.user;//?userIndex[d.user[0]]:-1;
    if ( vizservice[serviceSelected].text==='Radar'&&d.cluster){
        return d.cluster.length?d.cluster[0].name:d.cluster.name;
    }
    return d.metrics[vizservice[serviceSelected].text]
}

function getData_delta(d){
    if ( vizservice[serviceSelected].text!=='User' && vizservice[serviceSelected].text!=='Radar')
        return d.metrics_delta[vizservice[serviceSelected].text];
    return 0;
}

function data2tree(data,sampleS,computers){
    let serviceName = null;
    if (cluster_info&&vizservice[serviceSelected].text==='Radar'){
        cluster_info.forEach(d=>d.arr=[])
        serviceName = vizservice[serviceSelected].text;
    }
    const compute_layoutLink = {};
    const tree =  {name:"__main__",children:data.map(d=>{
            const el = {
                name:d.key,
                children:d.value.map(c=>{
                        const item = {
                            name:c,
                            value:1,
                            metrics:{},
                            metrics_delta:{},
                            user: computers?computers[c].user:[],
                            jobName: computers?computers[c].jobName:[]
                        };
                        if (sampleS){
                            serviceFullList.forEach(s=>item.metrics[s.text]=_.last(sampleS[c][serviceListattr[s.idroot]])[s.id]);
                            if (computers)
                                computers[c].metric = item.metrics;
                            if (Layout.computers_old){
                                serviceFullList.forEach(s=>item.metrics_delta[s.text] = item.metrics[s.text]-Layout.computers_old[c].metric[s.text]);
                            }
                        }
                        if (serviceName==='Radar'&&cluster_info)
                        {
                            getCluster(item)
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
    if (cluster_info&&vizservice[serviceSelected].text==='Radar') {
        cluster_info.forEach(d => (d.total = d.arr.length));
        cluster_map(cluster_info)
    }
    return {tree,compute_layoutLink};
}
let currentDraw=()=>{};
let tsnedata = {};
function queryData(data) {
    debugger
    const data_ = handleDataUrl(data);
    let  sampleS = data_.sampleS;
    tsnedata = data_.tsnedata;
    let {computers,jobs,users,jobByNames} = handleData(data);
    adjustTree(sampleS,computers);
    Layout.currentTime = data.currentTime;
    Layout.users = users;
    Layout.jobs = jobs;
    Layout.jobByNames = jobByNames;
    Layout.computers_old = computers;
    if (vizservice.length&&vizservice[serviceSelected].text==='Radar' && group_opt.recall){
        group_opt.recall()
        cluster_map(cluster_info);
        handle_clusterinfo();
        Layout.tree.children.forEach(d=>{
            d.children.forEach(e=>{
                getCluster(e);
            })
        });
    }
    currentDraw = ()=>{
        // drawObject.draw();
        // userPie.data(Layout.users).draw();
        d3.select('#RankingList tbody').selectAll('tr')
            .data(Layout.snapshot.filter(d=>d.highlight).sort((a,b)=>Math.abs(_.last(b.stackdelta))-Math.abs(_.last(a.stackdelta))).map(d=>[d.key,d.value,d.stackdelta.map(e=>`<span class="${e>0?'upsymbol':(e===0?'equalsymbol':'downsymbol')}"></span>`).join(''),`${_.last(d.stackdelta)>0?'+':''}${_.last(d.stackdelta)}`]),d=>d[0])
            .join('tr').selectAll('td')
            .data(d=>d).join('td').html(d=>d);

    };
    createdata({tree:Layout.tree.children,computers,jobs,users,jobByNames,sampleS});
    // _.partial(draw,{computers,jobs,users,jobByNames,sampleS},currentTime);
    currentDraw();
    // currentDraw = _.partial(draw,{computers,jobs,users,jobByNames,sampleS},currentTime);
    // currentDraw(serviceSelected);
}
function createdata({tree,computers,jobs,users,jobByNames,sampleS}){
    debugger
    if (!Layout.order){ // init order
        Layout.order = _.flatten(Layout.data_flat.map(d=>d.value));
        Layout.order.object = {};
        Layout.order.forEach((c,i)=>Layout.order.object[c]=i);
    }
    serviceName = vizservice[serviceSelected];
    let dataviz = [];
    Layout.tree.children.forEach(r=>r.children.forEach(c=>{
        let data = {data:c,value:getData(c),key:c.name};
        data.drawData  = getDrawData(data);
        dataviz.push(data);
    }));
    Layout.snapshot = dataviz
    // dataviz.sort((a,b)=>-Layout.order.object[b.key]+Layout.order.object[a.key]);
    // dataviz.forEach((d,i)=>d.id=i);
    // drawObject.data(dataviz);
}
 let handleDataComputeByUser = function(data){
     if (handleDataComputeByUser.mode==='core')
         return handleDataComputeByUser_core(data);
     else
         return handleDataComputeByUser_compute(data);
 };
handleDataComputeByUser.mode = 'core';

function handleDataComputeByUser_core(_data){
    _data.time_stamp = _data.time_stamp.slice(0,288)
    let dataIn = {root_nodes:[],net:_data.time_stamp.map((d,ti)=>({nodes:[],links:[],time:d,ti})),datamap:tsnedata,time_stamp:_data.time_stamp};
    // let data = [];
    const computers = _data[COMPUTE];
    const jobs = _data[JOB];
    const users = {};
    for (let comp in computers){
        let item = {id:comp,type:'compute',data:computers[comp],tooltip:comp.replace('10.101.',''),timeArr:[]};
        item.drawData  = getDrawData(item);
        _data.time_stamp.forEach((t,i)=>{
            const jIDs = computers[comp].job_id[i];
            if (jIDs.length){
                let jobArr = [];
                let jobMain = {};
                jIDs.forEach(j=>{
                    const job = j.split('.')[0];
                    if (!jobMain[job]){
                        jobArr.push(jobs[j]);
                        jobMain[job] = jobs[j];
                    }
                });
                // user
                let username = d3.nest().key(d=>d.user_name)
                    // .rollup(d=>d3.sum(d,e=>e.node_list_obj[comp]))
                    .rollup(d=>d.length)
                    .entries(jobArr);
                username.total = d3.sum(username,e=>e.value);
                username.jobs = [jIDs,jobArr];
                username.forEach(u=>{
                    let userObj = {};
                    if (!users[u.key]){
                        userObj = {id: u.key,type:'user',data:{},timeArr:[],drawData:[{
                                invalid: undefined,
                                scale:1,
                                offset:-8,
                                color: '#007',
                                d:'M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'}],
                                _index:dataIn.root_nodes.length}
                        users[u.key] = userObj;
                        dataIn.root_nodes.push(users[u.key]);
                    }
                    userObj = users[u.key];
                    if (!userObj.timeArr[i]){
                        userObj.timeArr[i] = {drawData:userObj.drawData,id: u.key,type:'user',data:{name:u.key,isNew:[]},parent:userObj,ti:i};
                        userObj.timeArr[i]._index = dataIn.net[i].nodes.length;
                        dataIn.net[i].nodes.push(userObj.timeArr[i]);
                    }
                    // link
                    dataIn.net[i].links.push({source:comp,target:u.key,value:u.value,_index:dataIn.net[i].links.length})
                })

                // compute
                item[Layout.timespan[i]] = username.sort((a,b)=>d3.ascending(a.key,b.key));
                item.timeArr[i] = {drawData:item.drawData,id:comp,type:'compute',data:{name:comp,isNew:[]},parent:item,ti:i};
            }else
                item.timeArr[i] = {drawData:item.drawData,id:comp,type:'compute',data:{name:comp,isNew:[]},isolate:true,parent:item,ti:i};
            item.timeArr[i]._index = dataIn.net[i].nodes.length;
            dataIn.net[i].nodes.push(item.timeArr[i])
        });
        item._index = dataIn.root_nodes.length;
        dataIn.root_nodes.push(item);
    }
    debugger
    return dataIn;
}
function handleDataComputeByUser_compute(_data){
    let data = [];
    const computers = _data[COMPUTE];
    const jobs = _data[JOB];
    for (let comp in computers){
        let item = {key:comp,data:computers[comp]};
        computers[comp].job_id.forEach((jIDs,i)=>{
            if (jIDs.length){
                let jobArr = jIDs.map(j=>jobs[j]);
                let username = d3.nest().key(d=>d.user_name)
                    .rollup(d=>1).entries(jobArr);
                username.total = d3.sum(username,e=>e.value);
                username.jobs = [jIDs,jobArr];
                item[Layout.timespan[i]] = username.sort((a,b)=>d3.ascending(a.key,b.key));
            }else
                item[Layout.timespan[i]] = null;
        });
        data.push(item);
    }
    return data;
}
function getUsers(_data){
    const jobs = _data[JOB]; // object
    const user_job = d3.nest()
        .key(d=>d.value[USER]) //user
        .key(d=>d.key.split('.')[0]) //job array
        .object(d3.entries(jobs));
    const users = _.mapObject(user_job,(u,i)=>{
        const job = [];
        let totalCore = 0;
        const node = _.uniq(_.flatten(_.values(u).map(d=>d.map(d=>(job.push(d.key),totalCore+=d.value.cpu_cores,d.value.node_list)))));
        const jobMain = _.uniq(job.map(j=>j.split('.')[0]));

        return {node,job,jobMain,totalCore,text: 'User '+i.replace('user','')}
    });
    return users;
}
function filterData(nodeList,nets){
    debugger
    let fileterObject = {};
    nodeList.forEach(n=>fileterObject[n] = {...nets.root_nodes.find(e=>e.id===n),timeArr:[]});

    let currentNets = {net:nets.net};
    let filteredNets = {net:nets.time_stamp.map(t=>({nodes:[],links:[]})),"root_nodes":[],time_stamp:nets.time_stamp,datamap:nets.datamap};
    let filterNodeList  = nets.time_stamp.map((t,ti)=>({...fileterObject})); // dict of each timestep
    debugger
    // runDeep(runDeep(runDeep({currentNets,filterNodeList})))
    runDeep({currentNets,filterNodeList})
    function runDeep({currentNets,filterNodeList}) {
        let nextNets = {net: []};
        let nextFilter  = nets.time_stamp.map((t,ti)=>({})); // dict of each timestep
        currentNets.net.map((n, ni) => {
            nextNets.net[ni] = {nodes: [], links: []};
            n.links.forEach(l => {
                if (filterNodeList[ni][l.source]) {
                    filteredNets.net[ni].links.push({...l,_index:filteredNets.net[ni].links.length});
                    nextFilter[ni][l.target] = true; // add node to next find
                } else if (filterNodeList[ni][l.target]) {
                    filteredNets.net[ni].links.push({...l,_index:filteredNets.net[ni].links.length});
                    nextFilter[ni][l.source] = true; // add node to next find
                } else {
                    nextNets.net[ni].links.push(l);
                }
            });
            n.nodes.forEach(n => {
                if (filterNodeList[ni][n.id]||nextFilter[ni][n.id]) {
                    if (!fileterObject[n.id])
                        fileterObject[n.id] = {...n.parent};
                    const node = {...n,_index:filteredNets.net[ni].nodes.length,parent:fileterObject[n.id]};
                    fileterObject[n.id].timeArr[ni] = node;
                    filteredNets.net[ni].nodes.push(node);
                } else {
                    nextNets.net[ni].nodes.push(n)
                }
            })
        });
        return {currentNets:nextNets,filterNodeList:nextFilter};
    }
    nets.root_nodes.forEach(n=>{
        if (fileterObject[n.id]){
            const node = fileterObject[n.id];
            node._index = filteredNets.root_nodes.length;
            filteredNets.root_nodes.push(node);
        }
    })
    return filteredNets;
}
function getMostChange(data){
    const nodeMap = {};
    data.root_nodes.forEach(n=>{
        nodeMap[n.id]=n;
        n.ChangeCount = 0;
    });
    for (let i = 1; i < data.net.length; i++) {
        data.net[i - 1].filtered_links = [];
        const linkMap = new Map();
        data.net[i - 1].links.forEach(l => {
            linkMap.set(l.source + '|||' + l.target, l);
        });
        data.net[i].links.forEach(l => {
            const key = l.source + '|||' + l.target;
            if (!linkMap.has(key)) // new link
            {
                l.isNew = true;
                l.color = "green";
                data.net[i - 1].filtered_links.push(l);
                nodeMap[l.source].ChangeCount++;
                nodeMap[l.target].ChangeCount++;
            } else {
                linkMap.delete(key);
            }
        });
        data.net[i].delectedLinks = [];
        linkMap.forEach((value, key) => {
            data.net[i].delectedLinks.push(value);
            nodeMap[value.source].ChangeCount++;
            nodeMap[value.target].ChangeCount++;
        });
    }

    let maxChange=0;
    let maxNode={};
    data.root_nodes.forEach(n=>{
        if (n.ChangeCount>maxChange){
            maxChange = n.ChangeCount;
            maxNode = n
        }
    })
    return maxNode.id;
}
function handleRankingData(data){
    console.time('handleRankingData');
    Layout.usersStatic = getUsers(data);
    Layout.timespan = data.time_stamp;

    handleDataComputeByUser.data = data;
    // userPie.data(Layout.usersStatic).draw();
    Layout.userTimeline = handleDataComputeByUser(handleDataComputeByUser.data);
    const maxChange = getMostChange(Layout.userTimeline);
    // Layout.userTimeline = filterData(['user13'],Layout.userTimeline)
    // console.log(Layout.userTimeline)
    debugger
    // Layout.userTimeline = filterData(['user13'],Layout.userTimeline)
    // console.log(Layout.userTimeline)
    console.timeEnd('handleRankingData');
}
