import React, {startTransition, useCallback, useEffect, useReducer} from 'react'
import Context from './Context'
import {getRefRange, getUrl, JOB_STATE} from "../../component/ulti";
import {
    csv as d3csv,
    json as d3json,
    groups as d3groups,
    extent as d3extent,
    ascending as d3ascending,
    sum as d3sum,
    mean as d3mean,
    scaleLinear
} from "d3";
import {inflate} from "pako";
import {isArray} from "lodash";
import * as _ from "lodash";

function reducer(state, action) {
    const { type, path, isLoading=false,error = false, hasError = false, value } = action;
    switch (type) {
        case "LOADING_CHANGED":
            return { ...state, [path]: { ...state[path], isLoading } };
        case "VALUE_CHANGE":
            return {
                ...state,
                [path]: { ...state[path], value, isLoading, error, hasError },
            };
        case "ERROR":
            return {
                ...state,
                [path]: { ...state[path], value, isLoading, error, hasError },
            };
        case "INIT":
            return {...state,isInit:value}
        // default:
        //     throw new Error()
    }
}

const Provider = ({  children, name }) => {
    const [state, dispatch] = useReducer(reducer, {loading:false, error:false,
        data:{},
        dimensions:{},
        scheme:{},
        nodeFilter:{},
        loadData:{},
        coreLimit:128,
        metricRangeMinMax:false,
    });
    useEffect(()=>{

    },[]);

    const isLoading = useCallback(
        (path) => {
            return state[path] ? state[path].isLoading : false;
        },
        [state]
    );

    const queryData = useCallback((val)=>{
        if (val==='realtime'){
            dispatch({type: 'LOADING_CHANGED', path: 'loadData', isLoading: 'Query realtime data'});
            dispatch({type: 'LOADING_CHANGED', path: 'data', isLoading: 'Query realtime data'});
            const _end = new Date(); //'2020-02-14T12:00:00-05:00'
            let _start = new Date(_end - 86400000); //'2020-02-14T18:00:00-05:
            const interval = '1m';
            const value = 'max';
            const compress = true;
            const url = getUrl({_start,_end,interval,value,compress});
            d3json(url).then(_data=>{
                dispatch({type: 'LOADING_CHANGED', path: 'loadData', isLoading: 'Process data'});
                dispatch({type: 'LOADING_CHANGED', path: 'data', isLoading: 'Process data'});
                preadjustdata(_data);
                adjustdata(_data,false);
            }).catch(e=>{
                dispatch({
                    type: "ERROR",
                    path: 'loadData',
                    isLoading: false,
                    error:"Couldn't load realtime data",
                    hasError: true
                });
                dispatch({type: 'LOADING_CHANGED', path: 'data', isLoading: false});
            })
        }else{
                dispatch({type: 'LOADING_CHANGED', path: 'loadData', isLoading: 'Load historical data'});
                dispatch({type: 'LOADING_CHANGED', path: 'data', isLoading: 'Load historical data'});
                if (!isArray(val)) {
                    fetch(val, {
                        method: 'GET', // *GET, POST, PUT, DELETE, etc.
                        mode: 'cors', // no-cors, *cors, same-origin
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(response => response.json()).then(_data => preadjustdata(_data)).then(_data=>{
                        adjustdata(_data, true);
                    }).catch(e => {
                        dispatch({
                            type: "ERROR",
                            path: 'loadData',
                            isLoading: false,
                            error:"Couldn't load realtime data",
                            hasError: true
                        });
                        dispatch({
                            type: "LOADING_CHANGED",
                            path: 'data',
                            isLoading: false
                        });
                    });
                }else {
                    console.time('loadData')
                    const q = [];
                    val.forEach(val=>q.push(fetch(val, {
                        method: 'GET', // *GET, POST, PUT, DELETE, etc.
                        mode: 'cors', // no-cors, *cors, same-origin
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(response => response.json()).then(_data => preadjustdata(_data))))
                    Promise.all(q).then(_datas=>{
                        console.timeEnd('loadData')
                        console.time('join data')
                        const _data = {};
                        // remove time overlap
                        const TIMEKEY = "time_stamp";
                        _datas.sort((a,b)=>a[TIMEKEY][0]-b[TIMEKEY][0]);
                        const timerange = [];
                        timerange[_datas.length-1] = [0,_datas[_datas.length-1][TIMEKEY].length];
                        let lastTime = _datas[_datas.length-1][TIMEKEY][0];
                        for (let i=_datas.length-2;i>-1;i--){
                            if (lastTime>_datas[i][TIMEKEY][0]){
                                for (let t= _datas[i][TIMEKEY].length-1;t>-1;t--) {
                                    if (_datas[i][TIMEKEY][t]<lastTime){
                                        timerange[i] = [0,t+1];
                                        break;
                                    }
                                }
                                lastTime = _datas[i][TIMEKEY][0];
                            }else{
                                timerange[i] = [0,0];
                            }
                        }
                        let sumn = 0;
                        timerange.forEach((t,ti)=>{
                            timerange[ti][0] = sumn;
                            sumn += timerange[ti][1];
                        })
                        Object.keys(_datas[0]).forEach(k=>{
                            if (k==='nodes_info'){
                                _data[k] = {};
                                _datas.forEach((d,di) => {
                                    Object.keys(d[k]).forEach(comp=>{
                                        if (!_data[k][comp]){
                                            _data[k][comp] = {}
                                        }
                                        Object.keys(d[k][comp]).forEach(me=>{
                                            if (!_data[k][comp][me]){
                                                _data[k][comp][me] = [];
                                            }
                                            let len = Math.min(d[k][comp][me].length,timerange[di][1]);
                                            for (let i=0;i<len;i++){
                                                _data[k][comp][me][i+timerange[di][0]] = d[k][comp][me][i];
                                            }
                                        })
                                    })
                                })
                            }else {
                                const isarray = isArray(_datas[0][k]);
                                if (isarray) {
                                    _data[k] = [];
                                    _datas.forEach((d,di) => {
                                        for (let i=0;i<timerange[di][1];i++){
                                            _data[k].push(d[k][i]);
                                        }
                                    })
                                } else {
                                    _data[k] = {};
                                    _datas.forEach(d => Object.keys(d[k]).forEach(kk => {
                                        _data[k][kk] = d[k][kk]
                                    }))
                                }
                            }
                        })
                        console.timeEnd('join data');
                        adjustdata(_data, true);
                    }).catch(e => {
                        dispatch({
                            type: "ERROR",
                            path: 'loadData',
                            isLoading: false,
                            error:"Couldn't load realtime data",
                            hasError: true
                        });
                        dispatch({type: 'LOADING_CHANGED', path: 'data', isLoading: 'Process data'});
                    });
                }
        }
        function preadjustdata(_data){
            if (_data.jobs_info && _data.jobs_info["base64(zip(o))"]){
                Object.keys(_data).forEach(k=>{
                    if (_data[k]["base64(zip(o))"]){
                        _data[k] = JSON.parse(inflate(base64ToBuffer(_data[k]['base64(zip(o))']), { to: 'string' }));
                    }
                })
            }
            else if (_data["base64(zip(o))"]){
                _data = JSON.parse(inflate(base64ToBuffer(_data['base64(zip(o))']), { to: 'string' }));
            }
            debugger
            return _data;
        }
        function adjustdata(_data,loadNode_state){
            let isHasState = !!_data.nodes_state;
            _data.nodes_state = _data.nodes_state??{};
            _data.nodes_alloc = _data.nodes_alloc??{};

            if (isHasState){
                console.time('adjustdata');
                // remove unused data
                let mapState = {}; // active state
                let state = [];
                // last state node_alloc
                let mapNodeAlloc = {}; // active state
                let nodeAlloc = [];

                // change for calculate reason duration, track for each time step
                const time_step = _data.time_stamp[1]?(+_data.time_stamp[1] - (+_data.time_stamp[0]))*1000:(60000);
                _data.time_stamp.forEach(t=>{
                    // nodes_state
                    if (_data.nodes_state[t]){
                        _data.nodes_state[t].forEach(s=>{
                            // stack reasons
                            let reason_end_at = new Date(t*1000+time_step);
                            for (let i = s.reason.length-1;i>-1;i--){
                                // for (let i = 0;i<s.reason.length;i++){
                                let key = `${s.nodeid} ${s.reason[i]} ${s.reason_changed_at[i]}`;
                                if (!mapState[key]) // new reason
                                {
                                    const reason_changed_at = new Date(s.reason_changed_at[i]*1000);
                                    mapState[key] = {reason: s.reason[i],
                                        reason_changed_at,
                                        reason_set_by_user:s.reason_set_by_user[i],
                                        reason_end_at,
                                        hostname:s.nodeid};
                                    state.push(mapState[key])
                                }else // existed reason, update duration
                                {
                                    mapState[key].reason_end_at = reason_end_at;

                                }
                                reason_end_at = new Date(s.reason_changed_at[i]*1000);
                            }
                        });
                    }
                    // nodes_alloc
                    // debugger
                    // "cpu-24-29" 313

                    if (_data.nodes_alloc[t]){
                        _data.nodes_alloc[t].forEach(s=>{
                            // stack nodes_alloc
                            // let gap = time_step/s.value.length;/// equally divide
                            let gap = time_step;/// equally divide
                            let i = 0;//s.value.length-1;
                            // for (let i = 0;i<s.value.length;i++){
                            let value_end_at = new Date(t*1000+gap);
                            let key = `${s.nodeid}`;
                            if (!mapNodeAlloc[key] || mapNodeAlloc[key].value!==s.value[i]) // new reason
                            {
                                const value_changed_at = new Date(t*1000 );
                                mapNodeAlloc[key] = {value: s.value[i],
                                    value_changed_at,
                                    value_end_at,
                                    hostname:s.nodeid};
                                nodeAlloc.push(mapNodeAlloc[key])
                            }else // existed reason, update duration
                            {
                                mapNodeAlloc[key].value_end_at = value_end_at;

                            }
                            // }
                        });
                    }
                })
                // make sure status not change until the end
                let value_end_at = new Date(_data.time_stamp[_data.time_stamp.length-1]*1000+time_step);
                Object.keys(mapNodeAlloc).forEach(key=>{
                    mapNodeAlloc[key].value_end_at = value_end_at;
                })
                _data.node_state = state;
                delete _data.nodes_state;
                // node_alloc
                _data.nodes_alloc = nodeAlloc;
                console.timeEnd('adjustdata');
                dispatch({type: 'VALUE_CHANGE', path: `data`, value: _data, isLoading: false});
                dispatch({type: 'LOADING_CHANGED', path: 'loadData', isLoading: false});
            }else if(loadNode_state){
                // try load node_state
                d3csv(val.replace('.json', '_nodes_state.csv'))
                    .then(state => {
                        // have state
                        state.forEach(d => {
                            d.reason_changed_at = new Date((+d.reason_changed_at) * 1000);
                        });
                        _data.node_state = state;
                    })
                    .catch(e => {
                        // don't have state
                    })
                    .then(() => {
                        dispatch({type: 'VALUE_CHANGE', path: `data`, value: _data, isLoading: false});
                        dispatch({type: 'LOADING_CHANGED', path: 'loadData', isLoading: false});
                    })
            }else {
                _data.node_state = [];
                dispatch({type: 'VALUE_CHANGE', path: `data`, value: _data, isLoading: false});
                dispatch({type: 'LOADING_CHANGED', path: 'loadData', isLoading: false});
            }
        }
    },[state]);

    useEffect(() => {
        if (state['data'].value) {
            const _data = state['data'].value;
            dispatch({type: 'LOADING_CHANGED', path: 'scheme', isLoading: true});
            dispatch({type: 'LOADING_CHANGED', path: 'dimensions', isLoading: true});
            const {scheme, dimensions} = handleData(_data,{state});
            dispatch({type: 'VALUE_CHANGE', path: `scheme`, value: scheme, isLoading: false});
            dispatch({type: 'VALUE_CHANGE', path: 'dimensions',value:dimensions, isLoading: true});
        }
    }, [state['data'].value,state['metricRangeMinMax'],state['userEncoded']]);

    function handleData(_data, {metricRangeMinMax,userEncoded}) {
        if (userEncoded) {
            let userCodecount = 1;
            const userEncode = {};
            const user_names = d3groups(Object.values(_data.jobs_info), d => d.user_name)
            user_names.forEach((g) => {
                const name = g[0];
                userEncode[name] = 'user' + userCodecount;
                userCodecount++;
                g[1].forEach(d => d.user_name = userEncode[name])
            })
        }

        if (_data.time_stamp[0] > 999999999999999999)
            _data.time_stamp = _data.time_stamp.map(d => new Date(d / 1000000));
        else if (_data.time_stamp[0] < 9999999999) {
            _data.time_stamp = _data.time_stamp.map(d => new Date(d * 1000));
        }
        const timerange = d3extent(_data.time_stamp);
        const compute = Object.entries(_data.nodes_info);
        const allDim = {};
        compute.forEach(d => {
            Object.keys(d[1]).forEach(k => {
                if (!allDim[k]) {
                    allDim[k] = d[1][k].find(d => _.isNumber(d)) !== undefined ? 'number' : 'other';
                }
            })
        });
        // const dimensionKeys = Object.keys(compute[0][1]).filter(s=>compute[0][1][s].find(d=>_.isNumber(d)));
        let dimensionKeys = Object.keys(allDim).filter(k => allDim[k] === 'number');
        const indexMem = dimensionKeys.findIndex(d => d.match(/memory/i));
        if (indexMem !== -1)
            dimensionKeys = [dimensionKeys[indexMem], ...dimensionKeys.slice(0, indexMem), ...dimensionKeys.slice(indexMem + 1)];

        const dimensions = dimensionKeys.map((s, i) => ({
            text: s,
            index: i, range: [Infinity, -Infinity], scale: scaleLinear(),
            order: i,
            angle: (i / dimensionKeys.length) * 2 * Math.PI,
            enable: true,
            suddenRange: [Infinity, -Infinity]
        }));
        const computers = {};

        let jobonnode = undefined;
        compute.forEach(d => {
            if (_data.nodes_info[d[0]].job_id) {
                jobonnode = jobonnode ?? {};
                _data.nodes_info[d[0]].job_id.forEach(d => {
                    d.forEach(j => jobonnode[j] = true);
                })
            }
            computers[d[0]] = {
                job_id: [],
                key: d[0],
                user: [],
                drawData: []
            };
            dimensionKeys.forEach((k, ki) => {
                const comp = d[0];
                d[1][k] = d[1][k] ?? (_data.time_stamp.map(() => null));
                computers[comp][k] = (d[1][k] ?? []);
                computers[comp][k].sudden = [];
                let current = +computers[comp][k][0];
                computers[comp][k].forEach((d, ti) => {
                    if (d === '') {
                        computers[comp][k][ti] = null;
                        d = null;
                    }
                    if (d !== null) {
                        if (d < dimensions[ki].range[0])
                            dimensions[ki].range[0] = d;
                        if (d > dimensions[ki].range[1])
                            dimensions[ki].range[1] = d;
                    }
                    const sudden = (+d) - current;
                    computers[comp][k].sudden[ti] = sudden;
                    current = +d;

                    if (sudden <  dimensions[ki].suddenRange[0])
                        dimensions[ki].suddenRange[0] = sudden;
                    if (sudden >  dimensions[ki].suddenRange[1])
                        dimensions[ki].suddenRange[1] = sudden;
                })
            })
        });
        // update scale
        dimensions.forEach(d => {
            const recomend = getRefRange(d.text, d.range);
            d.min = d.range[0];
            d.max = d.range[1];
            d.possibleUnit = recomend;
            // d.range = [recomend];
            d.range = metricRangeMinMax ? [d.min, d.max] : recomend.range.slice();
            d.scale.domain(d.range)
        });
        const jobs = {};
        const job_ref = undefined;
        // need update core info to job_ref
        // improve speed in delete property
        const _jobs_info = {};
        const jobWarning = {jobs_info:Object.keys(_data.jobs_info).length,jobs_onNode: Object.keys(jobonnode).length}
        Object.keys(_data.jobs_info).forEach(job_id => {
            // remove job not belong to this cluster
            if (jobonnode && (!jobonnode[job_id])) {
                // delete _data.jobs_info[job_id]
                return;
            }
            _jobs_info[job_id] = _data.jobs_info[job_id];
            _data.jobs_info[job_id].finish_time = _data.jobs_info[job_id].finish_time ?? _data.jobs_info[job_id].end_time;
            const user_name = _data.jobs_info[job_id].user_name;
            const job_name = _data.jobs_info[job_id].job_name ?? _data.jobs_info[job_id].name;
            const start_time = adjustTime(_data.jobs_info[job_id].start_time);
            const end_time = adjustTime(_data.jobs_info[job_id].finish_time);
            const node_list = _data.jobs_info[job_id].node_list ?? _data.jobs_info[job_id].nodes;
            // debugger
            const cpus_ = _data.jobs_info[job_id].cpus ?? (_data.jobs_info[job_id].cpu_cores);
            const cores = cpus_ / node_list.length;
            let node_list_obj = {};
            if (job_ref && job_ref[job_id]) {
                node_list_obj = job_ref[job_id].node_list_obj;
            } else
                node_list.forEach((n) => node_list_obj[n] = cores);
            if (node_list.length)
                jobs[job_id] = {
                    job_id,
                    user_name,
                    job_name,
                    node_list,
                    node_list_obj,
                    _node_list: node_list.slice(),
                    _node_list_obj: {...node_list_obj},
                    cpus: cpus_,
                    cpu_cores: cores,
                    summary: [],
                    start_time,
                    finish_time: end_time,
                    [JOB_STATE]:_data.jobs_info[job_id][JOB_STATE], // Dec 16, 2022
                    _data: _data.jobs_info[job_id]
                }
        });
        jobWarning.overlap = Object.keys(_jobs_info).length;
        _data.jobs_info = _jobs_info;
        console.log(jobWarning)

        const {users} = handleCUJ({computers, jobs}, _data.time_stamp);
        // add new DIm
        handleWorkload(computers, dimensions, dimensionKeys, metricRangeMinMax);

        const tsnedata = {};
        Object.keys(computers).forEach(d => {
            tsnedata[d] = _data.time_stamp.map((t, ti) => {
                const item = dimensionKeys.map((k, ki) => {
                    return dimensions[ki].scale(computers[d][k][ti] ?? undefined) ?? null;
                });
                item.key = d;
                item.timestep = ti;
                item.name = d;
                return item
            })
        });

        // const result = handleDataComputeByUser(computers, jobs, _data.time_stamp);
        // const jobCompTimeline = result.data;
        // const noJobMap = result.noJobMap;

        const powerIndex = dimensions.findIndex(d=>d.possibleUnit.type==='power' && d.text.match(/cpu/i));

        // const coreUsageIndex = dimensions.length-1;
        // const {jobTimeline, jobarrdata, userarrdata, _userarrdata, minMaxDataCompJob, minMaxDataUser} = handleDataComputeByJob({
        //     tsnedata,
        //     computers,
        //     jobs,
        //     users,
        //     timespan: _data.time_stamp,
        //     powerIndex,
        //     coreUsageIndex
        // });


        const scheme = {data: _data, users, computers, jobs, tsnedata, time_stamp: _data.time_stamp, timerange};
        // scheme.emptyMap = noJobMap;
        // scheme.jobArr = jobarrdata;
        // scheme.userArr = userarrdata;
        // scheme._userarrdata = _userarrdata;
        scheme.powerIndex = powerIndex;
        scheme.node_state = _data.node_state??[];
        scheme.nodes_alloc = _data.nodes_alloc??[];

        return {scheme, dimensions}
    }

    function handleWorkload(computers, dimensions, dimensionKeys, metricRangeMinMax, coreLimit=state.coreLimit) {
        const k = 'core usage';
        dimensionKeys.push(k)
        const i = dimensions.length;
        const dimT = {
            text: k,
            index: i,
            range: [Infinity, -Infinity],
            suddenRange: [Infinity, -Infinity],
            scale: scaleLinear(),
            order: i,
            possibleUnit: {type: null, unit: null, range: [0, 100]},
            enable: true
        };
        dimensions.push(dimT)
        dimensions.forEach((d, i) => {
            d.angle = (i / dimensions.length) * 2 * Math.PI;
        });

        function getdata(d) {
            return d3sum(Object.values(d)) / coreLimit * 100;
        }

        Object.keys(computers).forEach((comp) => {
            computers[comp][k] = [];
            computers[comp][k].sudden = [];
            computers[comp][k][0] = getdata(computers[comp]['cpus'][0]);
            let current = computers[comp][k][0];
            computers[comp]['cpus'].forEach((_d, ti) => {
                const d = getdata(_d ?? {});
                computers[comp][k][ti] = d;
                if (_d !== null) {
                    if (d < dimT.range[0])
                        dimT.range[0] = d;
                    if (d > dimT.range[1])
                        dimT.range[1] = d;
                }
                const sudden = (+d) - current;
                computers[comp][k].sudden[ti] = sudden;
                if (sudden < dimT.suddenRange[0])
                    dimT.suddenRange[0] = sudden;
                if (sudden > dimT.suddenRange[1])
                    dimT.suddenRange[1] = sudden;

                current = +d;
            })
        });

        dimT.min = dimT.range[0];
        dimT.max = dimT.range[1];
        dimT.suddenMin = dimT.suddenRange[0];
        dimT.suddenMax = dimT.suddenRange[1];
        dimT.range = metricRangeMinMax ? [dimT.min, dimT.max] : [0, 100];
        dimT.scale.domain(dimT.range)

    }

    function handleDataComputeByJob(input, coreLimit=state.coreLimit) {
        const tsnedata = input.tsnedata ?? {};
        const computers = input.computers ?? {};
        const _jobs = input.jobs ?? {};
        const _users = input.users ?? {};
        const jobs = {};
        const users = {};
        const jobarrdata = {};
        const _jobarrdata = {};
        const userarrdata = {};
        const _userarrdata = {};
        const {powerIndex,
            coreUsageIndex} = input
        // const minMaxDataCompJob = {};
        // const minMaxDataUser = {};
        const timespan = input.timespan ?? []

        const delta = ((+timespan[1])- (+timespan[0]))/3600000;
        Object.keys(_jobs).forEach(k => {
            // if (_jobs[k].total_nodes>1){
            jobs[k] = _jobs[k];
            _jobarrdata[k] = [];
            jobarrdata[k] = [];
            // minMaxDataCompJob[k] = [];

            if (!jobs[k].isJobarray) {
                if (!_userarrdata[_jobs[k].user_name]) {
                    users[_jobs[k].user_name] = _users[_jobs[k].user_name];
                    userarrdata[_jobs[k].user_name] = [];
                    _userarrdata[_jobs[k].user_name] = [];
                    _userarrdata[_jobs[k].user_name].jobs = {};
                    _userarrdata[_jobs[k].user_name].power = 0;
                    // minMaxDataUser[_jobs[k].user_name] = [];
                }
                _userarrdata[_jobs[k].user_name].jobs[k] = [];
                _userarrdata[_jobs[k].user_name].jobs[k].power = 0;
            } else {
                jobs[k].comp = {};
            }
            // }
        });

        let data = [];
        for (let comp in computers) {
            let item = {key: comp, values: [], range: [Infinity, -Infinity], data: computers[comp]};
            let job = {};
            computers[comp].job_id.forEach((jIDs, i) => {
                let jobArr = jIDs.map(j => jobs[j]).filter(d => {
                    if (d) {
                        if (!_jobarrdata[d.job_id][i]) {
                            const empty = [];
                            empty.name = '';
                            empty.timestep = i;
                            _jobarrdata[d.job_id][i] = (empty);
                        }
                        const tsne_comp = tsnedata[comp];
                        if (tsne_comp)
                            _jobarrdata[d.job_id][i].push(tsne_comp[i]);
                        if (!_userarrdata[d.user_name][i]) {
                            const empty = [];
                            empty.name = '';
                            empty.timestep = i;
                            empty.cpus = 0;
                            empty.jobs = [];
                            empty.computes = {};
                            _userarrdata[d.user_name][i] = (empty);
                        }
                        _userarrdata[d.user_name][i].jobs.push(d.job_id);
                        if (tsne_comp) {
                            if (!_userarrdata[d.user_name].jobs[d.job_id][i]) {
                                const empty = [];
                                empty.name = d.job_id;
                                empty.timestep = i;
                                empty.cpus = 0;
                                _userarrdata[d.user_name].jobs[d.job_id][i] = (empty);
                            }
                            _userarrdata[d.user_name][i].push(tsne_comp[i]);
                            _userarrdata[d.user_name][i].computes[comp] = tsne_comp[i]
                            _userarrdata[d.user_name].jobs[d.job_id][i].push(tsne_comp[i]);
                            // power
                            const power = ((tsne_comp[i][powerIndex]??0)*(jobs[d.job_id].node_list_obj[comp]/coreLimit) / tsne_comp[i][coreUsageIndex])*delta;
                            _userarrdata[d.user_name].jobs[d.job_id].power += power;
                            _userarrdata[d.user_name].power += power;
                        }

                        if (d.job_array_id) {
                            if (!_jobarrdata[d.job_array_id][i]) {
                                const empty = [];
                                empty.name = '';
                                empty.timestep = i;
                                _jobarrdata[d.job_array_id][i] = (empty);
                            }
                            if (!jobs[d.job_array_id].comp[i])
                                jobs[d.job_array_id].comp[i] = {};
                            if (!jobs[d.job_array_id].comp[i][comp]) {
                                jobs[d.job_array_id].comp[i][comp] = 1;
                                _jobarrdata[d.job_array_id][i].push(tsnedata[comp][i]);
                                _jobarrdata[d.job_array_id][i].computes[comp] = (tsnedata[comp][i]);
                            }
                        }
                        return true;
                    }
                    return false
                });
                const key = jobArr.map(d => d.job_id).toString();
                if (!job[key])
                    job[key] = true;
                else
                    jobArr = [];

                if (jobArr.length) {
                    let username = d3groups(jobArr, d => d.job_id)
                        .map(d => ({key: d[0], value: d3sum(d[1], (e) => e.node_list_obj[comp])}));

                    username.sort((a, b) => d3ascending(a.key, b.key))
                    item.values.push(username);
                } else
                    item.values.push(null);
                item['' + timespan[i]] = item.values[i];
            });
            data.push(item);
        }
        Object.keys(_userarrdata).forEach(k => {
            _userarrdata[k].forEach((d, i) => {
                const timestep = _userarrdata[k][i][0].timestep;
                // debugger
                let value = _userarrdata[k][i][0].map((d, si) => {
                    const vals = _userarrdata[k][i].map(d => d[si]);
                    return d3mean(vals);
                });
                value.name = k;
                value.timestep = timestep;
                // debugger
                userarrdata[k][i] = (value);
            })
        })
        data.sort((a, b) => +a.range[0] - b.range[0])
        return {jobTimeline: data, jobarrdata, userarrdata, _userarrdata};//, minMaxDataCompJob, minMaxDataUser};
    }

    function handleDataComputeByUser(computers, jobs, timeStamp) {
        //start
        let data = [];

        let obj = {};
        let noJobMap = {};
        for (let j in jobs) {
            obj[j] = {key: j, values: timeStamp.map(t => null), range: [Infinity, -Infinity], data: jobs[j], arr: []};
            data.push(obj[j]);
        }
        for (let comp in computers) {
            let jonj = {};
            noJobMap[comp] = [];
            computers[comp].job_id.forEach((jIDs, i) => {
                if (jIDs.length) {
                    jIDs.forEach(j => {
                        if (!jonj[j]) {
                            let item = obj[j];
                            if (!item.values[i]) {
                                item.values[i] = [];
                                item.values[i].total = 0;
                            }
                            const compData = {key: comp, type: 'compute', value: 1};
                            const userData = {key: jobs[j].user_name, type: 'user', value: 1};
                            const current = item.values[i];
                            if (current !== null && current.length) {
                                current.push(compData);
                                // item.values[i].push(userData);
                                current.total = (current.total ?? 0) + jobs[j].node_list_obj[comp];
                                item.arr.push({time: timeStamp[i], value: [{key: j, type: 'job', value: 1}, userData]});
                                item.arr.push({time: timeStamp[i], value: [compData, {key: j, type: 'job', value: 1}]});
                                if (jobs[j].job_array_id) {
                                    item.arr.push({
                                        time: timeStamp[i],
                                        value: [compData, {key: jobs[j].job_array_id, type: 'job', value: 1}]
                                    });
                                    item.arr.push({
                                        time: timeStamp[i],
                                        value: [{key: jobs[j].job_array_id, type: 'job', value: 1}, userData]
                                    });
                                }
                            }
                            jonj[j] = true;
                        }
                    });
                } else {
                    noJobMap[comp][i] = 1;
                }
            });
        }
        // data.sort((a,b)=>+a.range[0]-b.range[0])
        return {data, noJobMap};
    }

    function handleCUJ({computers, jobs}, timestamp) {
        const compute_user = {};
        const jobm = {}
        Object.keys(computers).forEach((k) => {
            jobm[k] = timestamp.map(() => ({}));
            const d = computers[k];
            d.user = [];
            d.jobName = timestamp.map(() => []);
            d.job_id = timestamp.map(() => []);
            d.users = timestamp.map(() => []);
            d.cpus = timestamp.map(() => ({}));
            compute_user[k] = timestamp.map(() => ({}));
        });

        const jobData = Object.entries(jobs);
        jobData.forEach(jj => {
            const j = {key: jj[0], value: jj[1]}
            j.value.start_Index = timestamp.findIndex((t) => t > j.value.start_time);
            if (j.value.start_Index > 0)
                j.value.start_Index--;
            else if (j.value.start_Index === -1)
                j.value.start_Index = timestamp.length - 1;
            j.value.finish_Index = j.value.finish_time ? timestamp.findIndex((t) => t > j.value.finish_time) : -1;
            if (j.value.finish_Index > 0)
                j.value.finish_Index--;
            else if (j.value.finish_Index === -1)
                j.value.finish_Index = timestamp.length - 1;
            j.value.node_list.forEach(comp => {
                if (computers[comp]) {
                    for (let t = j.value.start_Index; t <= j.value.finish_Index; t++) {
                        if (!jobm[comp][t][j.key]) {
                            computers[comp].job_id[t].push(j.key);
                            jobm[comp][t][j.key] = false;
                        }
                        computers[comp].cpus[t][j.key] = (j.value.node_list_obj[comp]);
                        if (!compute_user[comp][t][j.value.user_name]) {
                            compute_user[comp][t][j.value.user_name] = true;
                            computers[comp].users[t].push(j.value.user_name);
                        }
                    }
                }
            })
        });
        const users = getUsers(jobs, computers, timestamp.length);
        Object.keys(users).forEach((k, i) => {
            users[k].node.forEach((c) => computers[c] ? computers[c].user.push(k) : '');
        });
        return {users}
    }

    function handleDataComputeByUser_compute({computers, jobs, timespan}) {
        let data = [];
        for (let comp in computers) {
            let item = {key: comp, data: computers[comp]};
            computers[comp].job_id.forEach((jIDs, i) => {
                if (jIDs.length) {
                    let jobArr = jIDs.map(j => jobs[j]);
                    let username = d3groups(jobArr, d => d.user_name).map(d => ({key: d[0], value: 1}));
                    username.total = d3sum(username, e => e.value);
                    username.jobs = [jIDs, jobArr];
                    item['' + timespan[i]] = username.sort((a, b) => d3ascending(a.key, b.key));
                } else
                    item['' + timespan[i]] = null;
            });
            data.push(item);
        }
        return data;
    }

    function handleDataComputeByUser_core({computers, jobs, timespan}) {
        let data = [];
        for (let comp in computers) {
            let item = {key: comp, data: computers[comp]};
            computers[comp].job_id.forEach((jIDs, i) => {
                if (jIDs.length) {
                    let jobArr = jIDs.map(j => jobs[j]);
                    let username = d3groups(jobArr, d => d.user_name).map(d => ({
                        key: d[0],
                        value: d3sum(d[1], (e) => e.node_list_obj[comp] ?? 0)
                    }));
                    username.total = d3sum(username, e => e.value);
                    username.jobs = [jIDs, jobArr];
                    item['' + timespan[i]] = username.sort((a, b) => d3ascending(a.key, b.key));
                } else
                    item['' + timespan[i]] = null;
            });
            data.push(item);
        }
        return data;
    }

    function getUsers(jobs, computers, timestep = 1) {
        const user_job = d3groups(Object.entries(jobs), (d) => (d[1])['user_name'], (d) => (d[0]).split('.')[0].trim());
        const users = {};
        user_job.forEach((u, i) => {
            const k = u[0];
            // const  u =user_job[k];
            const job = [];
            let totalCore = 0;
            let totalCore_share = 0;
            let totalCore_notShare = 0;
            const nodeObj = {};
            u[1].map(e => e[1].map(d => {
                job.push(d[0]);
                const core = d[1].cpus * (d[1].finish_Index - d[1].start_Index + 1);
                totalCore += core;
                if (d[1].finish_Index === d[1].start_Index) {
                    d[1].node_list.forEach((comp) => {
                        if (computers[comp].users[d[1].start_Index].length === 1) {
                            totalCore_notShare += d[1].node_list_obj[comp];
                        } else {
                            totalCore_share += d[1].node_list_obj[comp];
                        }
                    })
                }
                d[1].node_list.forEach(n=>nodeObj[n]=true);
            }));
            const node = Object.keys(nodeObj);
            totalCore = totalCore / timestep;
            totalCore_notShare = totalCore_notShare / timestep;
            totalCore_share = totalCore_share / timestep;
            users[k] = {node, job, totalCore, totalCore_notShare, totalCore_share}
        });
        return users;
    }

    const getQuery = useCallback((query)=>{
        startTransition(()=>{
            const scheme = state.scheme.value;
            const dimensions = state.dimensions.value;
            if(scheme&&dimensions) {
                dispatch({type: 'LOADING_CHANGED', path: 'nodeFilter', isLoading: 'Filtering data'});
                debugger
                if (!query || !Object.values(query).find(d => Object.keys(d).length)) {
                    dispatch({type: 'VALUE_CHANGE', path: 'nodeFilter', value: scheme.computers, isLoading: false});
                } else {
                    const byUser = query.byUser;
                    const nodes = {}
                    Object.keys(byUser).forEach(u=>{
                        debugger
                        scheme.users[u].node.forEach(n=>{
                            nodes[n] = {};
                            dimensions.forEach(d=>{
                                if (scheme.computers[n][d.text]){
                                    nodes[n][d.text] = scheme.computers[n][d.text].map(()=>null);
                                    nodes[n][d.text].sudden = scheme.computers[n][d.text].sudden;
                                }
                            })
                            scheme.computers[n].users.forEach((t,i)=>{
                                if (t.indexOf(u)){
                                    dimensions.forEach(d=>{
                                        if (scheme.computers[n][d.text]){
                                            nodes[n][d.text][i] = scheme.computers[n][d.text][i];
                                        }
                                    })
                                }
                            })
                        })
                    })
                    dispatch({type: 'VALUE_CHANGE', path: 'nodeFilter', value: nodes, isLoading: false});
                }
            }
        })
    },[state.scheme,state.dimensions])

    const getList = useCallback(
        (path) => {
            return state[path] && state[path].value ? state[path].value : undefined;
        },
        [state]
    );
    return (
        <Context.Provider value={{
            isLoading,
            getList,
            queryData,
            getQuery
        }}>
            {children}
        </Context.Provider>
    )
}

export default Provider;

function base64ToBuffer(str){
    str = window.atob(str); // creates a ASCII string
    let buffer = new ArrayBuffer(str.length),
        view = new Uint8Array(buffer);
    for(let i = 0; i < str.length; i++){
        view[i] = str.charCodeAt(i);
    }
    return buffer;
}

function shortArray(arr = [], limit = 2) {
    return arr.length > limit ? (arr.slice(0, limit).join(',') + `, +${arr.length - limit} more`) : arr.join(',')
}

function adjustTime(d) {
    if (d > 999999999999999999)
        return d / 1000000;
    else if (d < 9999999999) {
        return d * 1000;
    }
    return d;
}