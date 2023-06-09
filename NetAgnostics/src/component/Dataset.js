import {useState} from "react";
import {useControls} from "leva";
import * as d3 from "d3";
import {getUrl} from "./ulti";
import {inflate} from "pako";
import {isArray} from "lodash";

export default function Dataset({onChange,onLoad,onError}) {
    const [datalist,setDatalist] = useState({
        'Jan 12-19 2023':'./data/nocona_2023-01-12T12-00-00.00Z-2023-01-19T12-00-00.00Z.json',
        // 'Feb 11-Mar 04 2023':'./data/nocona_2023-02-11-2023-03-04T.json',
        'Feb 11-Mar 04 2023':'./data/nocona_2023-02-11_updated.json',
        // 'Jan 2023':['./data/nocona-1-2023/nocona_2023-01.json',
        //     './data/nocona-1-2023/nocona_2023-02.json',
        //     './data/nocona-1-2023/nocona_2023-03.json',
        //     './data/nocona-1-2023/nocona_2023-04.json'],
        'Jan 2023':'./data/nocona_2023-01-01.json',
        'Mar 16-30 2023':'./data/nocona_2023-03-16-2023-03-30.json',
        'Apr 13 2023':'./data/nocona_2023-04-13-2023-04-14.json',
        'Apr 15-18 2023':'./data/nocona_2023-04-15T08-2023-04-18T08.json',
        // 'Apr 18 2023':'./data/nocona_2023-04-17T08-2023-04-18T08.json',
        'Apr 21 2023 (Monsterapi bug)':'./data/nocona_2023-04-21T00-2023-04-21T08.json',
        'Apr 27 2023':'./data/nocona_2023-04-27T12Z-2023-04-28T12Z.json',
        'May 01-07 2023':'./data/nocona_2023-05-01-2023-05-07.json',
        'Real-time':'realtime',
    });
    const [past,setPast] = useState('');
    const [{currentDataset},setCurrentDataset] = useControls("Dataset",()=>({currentDataset:{
        value: datalist['May 01-07 2023'], options: datalist, onChange:(val)=>{
            if (val==='realtime'){
                onLoad('Query realtime data');
                const _end = new Date(); //'2020-02-14T12:00:00-05:00'
                let _start = new Date(_end - 86400000); //'2020-02-14T18:00:00-05:
                const interval = '1m';
                const value = 'max';
                const compress = true;
                const url = getUrl({_start,_end,interval,value,compress});
                d3.json(url).then(_data=>{
                    onError({level:"success",message:"Successfully load"})
                    onLoad('Process data');
                    // const _data = JSON.parse(s.replaceAll("NaN",'null'));
                    // onChange(_data);
                    // check compress
                    preadjustdata(_data);
                    adjustdata(_data,false);
                    // setPast(val);
                }).catch(e=>{
                    onError({level:"error",message:"Couldn't load realtime data"});
                    onLoad(false);
                    setCurrentDataset({currentDataset:past})
                })
            }else{
                if (past!==val) {
                    onLoad('Load historical data');
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

                            onError({level: "error", message: "Couldn't load data"})
                            onLoad(false);
                            setCurrentDataset({currentDataset: past})

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

                            onError({level: "error", message: "Couldn't load data"})
                            onLoad(false);
                            setCurrentDataset({currentDataset: past})

                        });
                    }

                    // d3.json(val).then(_data => {
                    //
                    //     onChange(_data);
                    //     setPast(val);
                    // }).catch(e => {
                    //
                    //         onError({level: "error", message: "Couldn't load data"})
                    //         onLoad(false);
                    //         setCurrentDataset({currentDataset:past})
                    //
                    // })
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
                        onChange(_data);
                        setPast(val);
                    }else if(loadNode_state){
                        // try load node_state
                        d3.csv(val.replace('.json', '_nodes_state.csv'))
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
                                onChange(_data);
                                setPast(val);
                            })
                    }else {
                        _data.node_state = [];
                        onChange(_data);
                        setPast(val);
                    }
                }
        }, label:"Current"
    }
    }),[datalist,past]);

    return '';
}

function base64ToBuffer(str){
    str = window.atob(str); // creates a ASCII string
    let buffer = new ArrayBuffer(str.length),
        view = new Uint8Array(buffer);
    for(let i = 0; i < str.length; i++){
        view[i] = str.charCodeAt(i);
    }
    return buffer;
}