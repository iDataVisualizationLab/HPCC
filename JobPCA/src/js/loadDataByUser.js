const summaryInTime = function () {
    if (summaryInTime.mode === 'user') {
        summaryInTime.changed = false;
        return summaryByUser(summaryInTime.data);
    } else {
        summaryInTime.changed = false;
        return summaryByJob(summaryInTime.data);
    }
};
summaryInTime.mode = 'job';
summaryInTime.changed = true;
summaryInTime.data = {};
let user_job;
let job_node;
let node_jobs;
let sampleS;
function handleDatabyUser(url,callBack){
    const userDict={};
    const userReverseDict={};
    d3.json(url).then(_data=>{
        if (_data.jobs_info && _data.jobs_info["base64(zip(o))"]){
            Object.keys(_data).forEach(k=>{
                if (_data[k]["base64(zip(o))"]){
                    _data[k] = JSON.parse(pako.inflate(base64ToBuffer(_data[k]['base64(zip(o))']), { to: 'string' }));
                }
            })
        }
        else if (_data["base64(zip(o))"]){
            _data = JSON.parse(pako.inflate(base64ToBuffer(_data['base64(zip(o))']), { to: 'string' }));
        }
        // fill in
        Object.keys(_data[COMPUTE]).forEach(comp=>{
            if (!_data[COMPUTE][comp].job_id)
                _data[COMPUTE][comp].job_id = [];
            else
                _data[COMPUTE][comp].job_id = _data[COMPUTE][comp].job_id.map(j=>(j??[]).map(jid=>''+jid));
        })

        d3.keys(_data.jobs_info).forEach(jID=>{
            _data.jobs_info[jID].finish_time = _data.jobs_info[jID].finish_time??_data.jobs_info[jID].end_time;
            _data.jobs_info[jID].job_name = ''+(_data.jobs_info[jID].job_name??_data.jobs_info[jID].name);
            if (!userDict[_data.jobs_info[jID].user_name] && !userReverseDict[_data.jobs_info[jID].user_name]){
                const encoded =  'user'+d3.keys(userDict).length;
                userDict[_data.jobs_info[jID].user_name] = encoded;
                userReverseDict[encoded] = _data.jobs_info[jID].user_name;
                _data.jobs_info[jID].user_name = userDict[_data.jobs_info[jID].user_name];
            }else if (!userReverseDict[_data.jobs_info[jID].user_name]){
                _data.jobs_info[jID].user_name = userDict[_data.jobs_info[jID].user_name];
            }if (!userDict[_data.jobs_info[jID].user_name])
                userDict[_data.jobs_info[jID].user_name] = 'user'+d3.keys(userDict).length;
                _data.jobs_info[jID].user_name = userDict[_data.jobs_info[jID].user_name];
                // _data.jobs_info[jID].node_list = (_data.jobs_info[jID].node_list??_data.jobs_info[jID].nodes??[]).map(c=>c.split('-')[0]); //slip old
                _data.jobs_info[jID].node_list = (_data.jobs_info[jID].node_list??[]).slice();
            }
        );


        const dataurl = handleDataUrl(_data);
        tsnedata = dataurl.tsnedata;
        sampleS = dataurl.sampleS;
        Layout.jobs = _data[JOB];
        Layout.timespan = _data.time_stamp.map(d=>d/1000000);
        summaryInTime.data=_data;
        summaryInTime.mode = 'job';
        const jobResult = summaryInTime();
        const jobData = jobResult.data;
        job_node = jobResult.job_node;
        node_jobs = jobResult.node_jobs;
        user_job = jobResult.net;
        summaryInTime.mode = 'user';
        const userResult = summaryInTime();
        debugger
        const userData = userResult.data;
        userData.forEach(u=>{
            if (user_job[u.id])
                jobData.push(u)
        });
        callBack(revertData(jobData))
    })
}
function revertData(data){
    const dataOut = [];
    dataOut.columns = ["feature_name",...data.map(d=>d.id)];
    serviceFullList.forEach(s=>{
        // if (s.text!=='Inlet Temp'){
        const item = {feature_name:s.text};
        data.forEach(d=>{
            item[d.id]=d[s.text];
        })
        dataOut.push(item)
        // }
    })
    return dataOut
}
function summaryByUser(data) {
    const users = {};
    Object.keys(data[COMPUTE]).forEach(comp => {
        data.time_stamp.forEach((t, ti) => {
            (data[COMPUTE][comp].job_id[ti]??[]).forEach(jid => {
                try {
                    if (data[JOB][jid].finish_time && (data[JOB][jid].start_time >= (data.time_stamp[0] / 1000000))) {
                        const user_name = data[JOB][jid].user_name;
                        if (!users[user_name]) {
                            users[user_name] = {id: user_name, comps: {}, time: {}, value: {job: {}}, values: []}
                        }
                        users[user_name].value.job[jid] = data[JOB][jid];
                        if (!users[user_name].comps[comp]) {
                            users[user_name].comps[comp] = [];
                        }
                        if (!users[user_name].comps[comp][ti]) {
                            users[user_name].values.push(tsnedata[comp][ti])
                            users[user_name].comps[comp][ti] = tsnedata[comp][ti];
                            users[user_name].time[ti] = true;
                        }
                    }
                }catch (e){
                    // missing job info
                }
            });
        });
    });
    const dataViz = [];
    Object.values(users).forEach(u => {
        const el = {id: u.id};
        u.mean = serviceFullList.map((s, si) => {
            el[s.text] = d3.mean(u.values, v => v[si] < 0 ? undefined : v[si]);
            return {key: s.text, value: el[s.text]};
        });
        u.totalTime = Object.keys(u.time).length * 5 * 60 * 1000;
        u.totalNode = Object.keys(u.comps).length;
        el['Duration'] = u.totalTime;
        el['#Computes'] = u.totalNode;
        dataViz.push(el)
    });
    return {data:dataViz,raw:users};
}
function summaryByJob(data) {
    const jobs = {};
    const nodes = {};
    const user = {};
    const node_jobs = {};
    const missingJoblist = {};
    Object.keys(data[COMPUTE]).forEach(comp => {
        data.time_stamp.forEach((t, ti) => {
            (data[COMPUTE][comp].job_id[ti]??[]).forEach(jid => {
                try {
                    if (data[JOB][jid].finish_time && (data[JOB][jid].start_time >= (data.time_stamp[0] / 1000000))) {
                        // const jobID_Main = jid.split('.')[0];
                        const jobID_Main = data[JOB][jid].job_name.split('batch')[0] + '||' + data[JOB][jid].user_name;
                        if (!user[data[JOB][jid].user_name])
                            user[data[JOB][jid].user_name] = {};
                        if (!user[data[JOB][jid].user_name][jobID_Main])
                            user[data[JOB][jid].user_name][jobID_Main] = {job: {}};
                        user[data[JOB][jid].user_name][jobID_Main].job[jid] = data[JOB][jid];
                        if (!jobs[jobID_Main]) {
                            jobs[jobID_Main] = {id: jobID_Main, comps: {}, time: {}, values: []}
                        }
                        if (!jobs[jobID_Main].comps[comp]) {
                            jobs[jobID_Main].comps[comp] = [];
                            nodes[comp + '||' + jobID_Main] = {
                                id: comp + '||' + jobID_Main,
                                job: jobID_Main,
                                time: {},
                                values: []
                            };
                            node_jobs[comp + '||' + jobID_Main] = {};
                        }
                        node_jobs[comp + '||' + jobID_Main][jid.split('.')[0]] = 1;
                        if (!jobs[jobID_Main].comps[comp][ti]) {
                            jobs[jobID_Main].values.push(tsnedata[comp][ti]);
                            jobs[jobID_Main].comps[comp][ti] = tsnedata[comp][ti];
                            jobs[jobID_Main].time[ti] = true;

                            nodes[comp + '||' + jobID_Main].values.push(tsnedata[comp][ti]);
                            nodes[comp + '||' + jobID_Main].time[ti] = true;
                        }
                    }
                }catch (e){
                    missingJoblist[jid] = [comp,ti]
                }
            });
        });
    });
    let blackList = {};
    let topUser = Object.keys(user).map(k=>({user:k,jobs:Object.keys(user[k]).length})).sort((a,b)=>b.jobs-a.jobs).slice(0,5);
    topUser
        .forEach(d=>{
            Object.keys(user[d.user]).forEach(k=>blackList[k]=1);
            delete user[d.user];
        });

    const dataViz = [];

    function getEl(u) {
        const el = {id: u.id};
        u.mean = serviceFullList.map((s, si) => {
            // if(tsnedata[comp][ti]==undefined || tsnedata[comp][ti]==null)
            //     debugger
            el[s.text] = d3.mean(u.values, v => v[si] < 0 ? undefined : v[si]);
            if (_.isNaN(el[s.text]))
                debugger
            return {key: s.text, value: el[s.text]};
        });
        u.totalTime = Object.keys(u.time).length * 5 * 60 * 1000;
        // u.totalNode = Object.keys(u.comps).length;
        // el['Duration'] = u.totalTime;
        // el['#Computes'] = u.totalNode;
        return el;
    }

// const nodeViz = [];
    const job_node = {};
    Object.values(jobs).forEach(u => {
        if (!blackList[u.id]){
            const el = getEl(u);
            dataViz.push(el);
            job_node[u.id] = {};

            Object.keys(u.comps).forEach(comp=>{
                const el = getEl(nodes[comp+'||'+u.id]);
                dataViz.push(el);
                job_node[u.id][comp+'||'+u.id] = true;
            })

        }
    });
    return {data:dataViz,net:user,job_node,node_jobs,raw:jobs};
}
