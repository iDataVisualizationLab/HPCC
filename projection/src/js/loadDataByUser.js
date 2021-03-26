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
let sampleS;
function handleDatabyUser(url,callBack){
    d3.json(url).then(_data=>{
        debugger
        const dataurl = handleDataUrl(_data);
        tsnedata = dataurl.tsnedata;
        sampleS = dataurl.sampleS;
        Layout.jobs = _data[JOB];
        Layout.timespan = _data.time_stamp.map(d=>d/1000000);
        summaryInTime.data=_data;
        summaryInTime.mode = 'job';
        const jobResult = summaryInTime();
        const jobData = jobResult.data;
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
            data[COMPUTE][comp].job_id[ti].forEach(jid => {
                if (data[JOB][jid].finish_time && (data[JOB][jid].start_time>=(data.time_stamp[0]/1000000))){
                    const user_name = data[JOB][jid].user_name;
                    if (!users[user_name]) {
                        users[user_name] = {id: user_name, comps: {}, time: {},value:{job:{}}, values: []}
                    }
                    users[user_name].value.job[jid]=data[JOB][jid];
                    if (!users[user_name].comps[comp]) {
                        users[user_name].comps[comp] = [];
                    }
                    if (!users[user_name].comps[comp][ti]) {
                        users[user_name].values.push(tsnedata[comp][ti])
                        users[user_name].comps[comp][ti] = tsnedata[comp][ti];
                        users[user_name].time[ti] = true;
                    }
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
    const user = {};
    Object.keys(data[COMPUTE]).forEach(comp => {
        data.time_stamp.forEach((t, ti) => {
            data[COMPUTE][comp].job_id[ti].forEach(jid => {
                if (data[JOB][jid].finish_time && (data[JOB][jid].start_time>=(data.time_stamp[0]/1000000))) {
                    // const jobID_Main = jid.split('.')[0];
                    const jobID_Main = data[JOB][jid].job_name.split('batch')[0]+'||'+data[JOB][jid].user_name;
                    if (!user[data[JOB][jid].user_name])
                        user[data[JOB][jid].user_name] = {};
                    if (!user[data[JOB][jid].user_name][jobID_Main])
                        user[data[JOB][jid].user_name][jobID_Main] = {job:{}};
                    user[data[JOB][jid].user_name][jobID_Main].job[jid] = data[JOB][jid];
                    if (!jobs[jobID_Main]) {
                        jobs[jobID_Main] = {id: jobID_Main, comps: {}, time: {}, values: []}
                    }
                    if (!jobs[jobID_Main].comps[comp]) {
                        jobs[jobID_Main].comps[comp] = [];
                    }
                    if (!jobs[jobID_Main].comps[comp][ti]) {
                        jobs[jobID_Main].values.push(tsnedata[comp][ti])
                        jobs[jobID_Main].comps[comp][ti] = tsnedata[comp][ti];
                        jobs[jobID_Main].time[ti] = true;
                    }
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
    Object.values(jobs).forEach(u => {
        if (!blackList[u.id]){
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
        }
    });
    return {data:dataViz,net:user,raw:jobs};
}
