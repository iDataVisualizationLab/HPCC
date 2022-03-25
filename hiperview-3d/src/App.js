// import logo from './logo.svg';
import './App.css';
import Layout3D from "./component/Layout3D"
import React, {useState, useEffect, useCallback, useMemo, useLayoutEffect} from "react";
import {Grid, Backdrop, CircularProgress, createTheme,FormControl,InputLabel,Select,MenuItem,Typography} from "@mui/material";
import CssBaseline from '@mui/material/CssBaseline';
import {ThemeProvider} from '@mui/material/styles';
import * as d3 from "d3"
import _layout from "./data/layout";
import _data from "./data/2182022";
import * as _ from "lodash";
import {getRefRange, getUrl} from "./component/ulti"
import ColorLegend from "./component/ColorLegend";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Slider from "@mui/material/Slider";
import Container from "@mui/material/Container";
import { useControls, folder, button } from 'leva';
import {outlier} from './component/outlier'
import {calculateCluster} from './component/cluster'
import {colorLegend} from "./component/leva/ColorLegend";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import {viz} from "./component/leva/Viz";
import {Radar} from "./component/radar";

const ColorModeContext = React.createContext({
    toggleColorMode: () => {
    }
});

const colorByMetric = d3.scaleSequential()
    .interpolator(d3.interpolateTurbo).domain([0,1]);
function App() {
    const [scheme, setScheme] = useState({data:{},users:{},time_stamp:[], timerange: [new Date(), new Date()]});
    const [dimensions, setDimensions] = useState([]);
    const [layout, setLayout] = useState(_layout);
    const [_draw3DData, set_draw3DData] = useState([]);
    const [draw3DData, setDraw3DData] = useState([]);
    const [drawUserData, setDrawUserData] = useState([]);
    const [line3D, setLine3D] = useState([]);
    const [alertMess, setAlertMess] = useState();
    const [isBusy, setIsBusy] = useState("Load data");
    const [mode, setMode] = React.useState('dark');
    const [selectedUser, setSelectedUser] = React.useState(null);
    const [selectedComputeMap, setSelectedComputeMap] = React.useState(undefined);
    const [clusterInfo, setClusterInfo] = React.useState({cluster:[],outlyingBins:[],clusterDescription:[],colorCluster:d3.scaleOrdinal(),clusterInfo:{}});
    // const [selectedSer, setSelectedSer] = React.useState(0);

    const [dataset,setDataset] = useControls("Dataset",()=>({
        isRealtime:{label:"Realtime",value:false,onChange:(val)=>{
                if (val){
                    setIsBusy('Load real time data');
                    const _end = new Date(); //'2020-02-14T12:00:00-05:00'
                    let _start = new Date(_end - dataset.duration); //'2020-02-14T18:00:00-05:
                    const interval = '1m';
                    const value = 'max';
                    const compress = false;
                    const url = getUrl({_start,_end,interval,value,compress});

                    d3.text(url).then(s=>{
                        setAlertMess({level:"success",message:"Successfully load"})
                        setIsBusy('Process data');
                        const _data = JSON.parse(s.replaceAll("NaN",'null'));
                        const {scheme, draw3DData, drawUserData, dimensions, layout} = handleData(_data);
                        setDimensions(dimensions);
                        setScheme(scheme);
                        updateColor(draw3DData, scheme);
                        set_draw3DData(draw3DData);
                        setDrawUserData(drawUserData);
                        // getSelectedDraw3Data({selectedUser},draw3DData,scheme);
                        setLayout(layout);
                        setIsBusy(false);
                        recalCluster(scheme, dimensions);
                    }).catch(e=>{
                        setAlertMess({level:"error",message:"Can't load realtime data"})
                        setIsBusy(false);
                    })
                }else {
                    setIsBusy('Load simulation data');
                    setTimeout(() => {
                        setIsBusy('Process data');
                        const {scheme, draw3DData,drawUserData, dimensions, layout} = handleData(_data);
                        setDimensions(dimensions);
                        setScheme(scheme);
                        updateColor(draw3DData, scheme);
                        set_draw3DData(draw3DData);
                        setDrawUserData(drawUserData);
                        // getSelectedDraw3Data({selectedUser},draw3DData,scheme);
                        setLayout(layout);
                        setIsBusy(false);
                        console.log('Init data')
                        recalCluster(scheme, dimensions);

                    }, 1);
                }
            }},
        duration:{label:"Duration",value:3600000, options:[['1 hour', 3600000],['2 hours',7200000],['3 hours',9600000]].reduce((a,v)=>({...a,[v[0]]:v[1]}),{})},
        dataInfo:{label:"",value:"",rows:2,editable:false}
    }))
    const optionsColor = useMemo(()=>{
        const option = dimensions.reduce((a, v) => ({ ...a, [v.text]: v.index}), {});
        option["Dataset cluster"] = "cluster"
        return option;
    },[dimensions])
    const [{selectedSer},setSelectedSer] = useControls("Setting",()=>({selectedSer:{options:optionsColor,label:"Color by",value:0,
            onChange:(val)=>{
                updateColor(_draw3DData,scheme,val);
                set_draw3DData([..._draw3DData]);
                draw3DData.forEach(d=>d.possArr=[...d.possArr]);
                setDraw3DData([...draw3DData]);
            },transient:false}
    }),[dimensions,_draw3DData,draw3DData,scheme]);
    const [{metricRangeMinMax},setMetricRangeMinMax] = useControls("Setting",()=>(
        {metricRangeMinMax:{value:false, label:'Show min-max',onChange:(val)=>{
            if (val){
                dimensions.forEach(dim=>{
                    dim.range = [dim.min,dim.max];
                    dim.scale.domain(dim.range)
                })
            }else{
                dimensions.forEach(dim=>{
                    dim.range = dim.possibleUnit.range.slice();
                    dim.scale.domain(dim.range)
                })
            }

            // setDimensions(dimensions);
            if (scheme.computers) {
                Object.keys(scheme.computers).forEach(d => {
                    scheme.time_stamp.forEach((t, ti) => {
                        dimensions.forEach((dim, ki) => {
                            scheme.tsnedata[d][ti][ki] = dimensions[ki].scale(scheme.computers[d][dim.text][ti] ?? undefined) ?? null;
                        })
                    })
                });
                // setScheme({...scheme});
                if (selectedSer==='cluster'){
                    console.log('selectedSer changed')
                    recalCluster(scheme, dimensions,({clusterInfo,scheme})=>{
                        if (selectedSer==='cluster') {
                            setScheme(scheme);
                            updateColor(_draw3DData, scheme,undefined,clusterInfo);
                            set_draw3DData([..._draw3DData]);
                            draw3DData.forEach(d=>d.possArr=[...d.possArr]);
                            setDraw3DData([...draw3DData]);
                        }
                    })
                }else{
                    updateColor(_draw3DData, scheme);
                    set_draw3DData([..._draw3DData]);
                    draw3DData.forEach(d => d.possArr = [...d.possArr]);
                    setDraw3DData([...draw3DData]);
                }
            }
        }}}));
    useEffect(()=>{
        if (metricRangeMinMax){
            dimensions.forEach(dim=>{
                dim.range = [dim.min,dim.max];
                dim.scale.domain(dim.range)
            })
        }else{
            dimensions.forEach(dim=>{
                dim.range = dim.possibleUnit.range.slice();
                dim.scale.domain(dim.range)
            })
        }

        // setDimensions(dimensions);
        if (scheme.computers) {
            Object.keys(scheme.computers).forEach(d => {
                scheme.time_stamp.forEach((t, ti) => {
                    dimensions.forEach((dim, ki) => {
                        scheme.tsnedata[d][ti][ki] = dimensions[ki].scale(scheme.computers[d][dim.text][ti] ?? undefined) ?? null;
                    })
                })
            });
            // setScheme({...scheme});
            if (selectedSer==='cluster'){
                console.log('selectedSer changed')
                recalCluster(scheme, dimensions,({clusterInfo,scheme})=>{
                    if (selectedSer==='cluster') {
                        setScheme(scheme);
                        updateColor(_draw3DData, scheme,undefined,clusterInfo);
                        set_draw3DData([..._draw3DData]);
                        draw3DData.forEach(d=>d.possArr=[...d.possArr]);
                        setDraw3DData([...draw3DData]);
                    }
                })
            }else{
                updateColor(_draw3DData, scheme);
                set_draw3DData([..._draw3DData]);
                draw3DData.forEach(d => d.possArr = [...d.possArr]);
                setDraw3DData([...draw3DData]);
            }
        }
    },[metricRangeMinMax])
    const metricSetting= useMemo(()=>{
        if (dimensions[selectedSer]){
            return {minMax:{label:'',transient:false,editable:false,value:dimensions[selectedSer]?`Min: ${dimensions[selectedSer].min} Max: ${dimensions[selectedSer].max}`:`Min:_ Max:_`},
                legend:colorLegend({label:'Legend',
                value:(dimensions[selectedSer]??{range:[0,1]}).range,range:(dimensions[selectedSer]??{range:[0,1]}).range,scale:colorByMetric}),

            metricTrigger:{value:false, label:'Filter'}
        ,metricFilter:{render:(get)=>get("Setting.metricTrigger"),value:(dimensions[selectedSer]??{range:[0,1]}).range[0],min:(dimensions[selectedSer]??{range:[0,1]}).range[0],max:(dimensions[selectedSer]??{range:[0,1]}).range[1],step:0.1, label:""}
        ,stackOption:{render:(get)=>get("Setting.metricTrigger"),value:false,label:"Stack?"}
        ,suddenThreshold:{value:0,min:0,max:(dimensions[selectedSer]??{max:1}).max,step:0.1, label:"Sudden Change"}}
        }else{
            return {}
        }
    },[dimensions,selectedUser,selectedSer,draw3DData,scheme,metricRangeMinMax]);
    const [config,setConfig] = useControls("Setting",()=>(metricSetting),[dimensions,selectedUser,selectedSer,draw3DData,scheme,metricRangeMinMax]);
    const binopt = useControls("DatasetCluster",{clusterMethod:{label:'Method',value:'leaderbin',options:['leaderbin','kmean']},
        normMethod:{value:'l2',options:['l1','l2']},
        bin:folder({startBinGridSize:{value:10,render:()=>false},range:{value:[8,9], min:1,step:1, max:20}},{label:'parameter',render:(get)=>get("DatasetCluster.clusterMethod")==="leaderbin"}),
        kmean:folder({k:{value:8, step:1, min:2},iterations:{value:10,min:1, step:1}},{label:'parameter',render:(get)=>get("DatasetCluster.clusterMethod")==="kmean"}),
        // Apply:button((get)=>{console.log(get("Cluster"));recalCluster(scheme, dimensions)}),
        "iqr":{min:1.5, max:4,step:0.1,value:1.5},
    },{
        label:"Dataset Cluster",
        collapsed : true
    });

    const [allplycluster] = useControls("DatasetCluster",()=>({Apply:button((get)=>{
        console.log('clicked apply')
        recalCluster(scheme, dimensions,({clusterInfo,scheme})=>{
            if (selectedSer==='cluster') {
                setScheme(scheme);
                updateColor(_draw3DData, scheme,undefined,clusterInfo);
                set_draw3DData([..._draw3DData]);
                draw3DData.forEach(d=>d.possArr=[...d.possArr]);
                setDraw3DData([...draw3DData]);
            }
        })
    })}),[scheme.tsnedata,dimensions,binopt,selectedSer,_draw3DData]);

    const showRadar = useControls("DatasetCluster",{Clusters:viz({value:0,
            label:clusterInfo.clusterInfo&&<> DatasetCluster inputdata: {clusterInfo.clusterInfo.input} ({d3.format(",.1%")(clusterInfo.clusterInfo.input/clusterInfo.clusterInfo.total)})<br/>
                Cluster calculation time: {Math.round(clusterInfo.clusterInfo.clusterCalTime??0)} ms <br/>
                Total MSE: {d3.format('.2f')(clusterInfo.clusterInfo.totalMSE??0)}</>,
            com:<div style={{width:'100%',display:'flex',flexWrap: "wrap",justifyContent: "space-between"}}>{
            clusterInfo&&clusterInfo.cluster.map((c,i)=><div key={c.labels} style={{display:'inline-block'}}>
                <div style={{position:'relative'}}
                     onMouseLeave={()=>setSelectedComputeMap(undefined)}
                     onMouseEnter={()=>{
                        const selectedComputeMap = {};
                        c.arr.forEach(d=>{
                            if (!selectedComputeMap[d.key])
                                selectedComputeMap[d.key]={};
                            selectedComputeMap[d.key][d.timestep] = true
                        });
                        setSelectedComputeMap(selectedComputeMap);
                }}>
                    <Radar width={100} height={100} data={[c.__metrics]} area={true} mean={true} meanColor={"rgba(0,0,0,0.52)"}
                           fill={clusterInfo.colorCluster?clusterInfo.colorCluster(c.name):'#fff'} stroke={'match'}
                    />
                    <div style={{position:'absolute',top:0,left:0}}>
                        <Radar width={100} height={100} data={[c.__metrics]} compact={true}
                               fill={'none'} stroke={"black"} strokeWidth={2}/>
                    </div>
                    <p style={{position:'absolute',top:10,left:0, width:'100%',textAlign:'center',color:'black', fontSize:12}}>{c.arr.length}<br/>{i?'':' temporal instances'}</p>
                </div> </div>)
        }
        {
            (clusterInfo&&clusterInfo.cluster)?<div style={{backgroundColor:'rgba(255,255,255,0.12)',padding:5, borderRadius:10, border:'1px dashed gray',width:'100%'}}>
                <span>Other color for cluster:</span>
                <div style={{display:'flex',alignItems:'center',padding:3}}><div style={{marginRight:5,width:20,height:20, borderRadius:10, backgroundColor:clusterInfo.colorCluster?clusterInfo.colorCluster('outlier'):'#fff'}}/> Outlier</div>
                <div style={{display:'flex',alignItems:'center',padding:3}}><div style={{marginRight:5,width:20,height:20, borderRadius:10, backgroundColor:clusterInfo.colorCluster?clusterInfo.colorCluster('missing'):'#fff'}}/> Missing dimension data</div>
                <div style={{display:'flex',alignItems:'center',padding:3}}><div style={{marginRight:5,width:20,height:20, borderRadius:10, backgroundColor:'white'}}/> Multiple Clusters</div>
            </div>:''
        }
    </div>}),
            "Outliers":viz({label:clusterInfo.outlyingBins&&<>Outliers: {(clusterInfo.outlyingBins.pointObject)?Object.keys(clusterInfo.outlyingBins.pointObject).length:0} temporal instances</>,value:0,
                com:<div style={{width:'100%',display:'flex',flexWrap: "wrap",justifyContent: "space-between"}}>
                    {
                        clusterInfo.outlyingBins&&clusterInfo.outlyingBins.map((c,i)=><div key={c.labels} style={{display:'inline-block'}}>
                            <div style={{position:'relative'}}>
                                <Radar width={100} height={100} data={c.arr.map(d=>clusterInfo.outlyingBins.pointObject[d.key])}
                                       fill={'none'} stroke={clusterInfo.colorCluster?clusterInfo.colorCluster('outlier'):'#fff'}
                                       // onMouseOver={(data:any)=>this.onComputeSelected(data,c.labels)}
                                       // onMouseLeave={this.onComputeSelected.bind(this)}
                                />
                                <p style={{position:'absolute',top:10,left:0, width:'100%',textAlign:'center',color:'black', fontSize:12}}>{c.arr.length}<br/>
                                    {shortArray(Object.keys(c.compObject))}
                                </p>
                            </div> </div>)
                    }
                </div>}),
    },[clusterInfo,scheme,_draw3DData]);

    const colorMode = React.useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
            },
        }),
        [],
    );
    
    const recalCluster = useCallback((_scheme=scheme,_dimensions=dimensions,callback=()=>{})=>{
        setIsBusy("Calculate cluster")
        setTimeout(()=>{
            const flat = _.flatten(Object.values(_scheme.tsnedata),1);
            console.log('iqr',binopt.iqr)
            let outlyingBins = outlier({data:flat,dimensions:_dimensions,outlyingCoefficient:binopt.iqr});
            console.log(flat.filter(d => !d.outlier).length)
            let {cluster,clusterDescription,colorCluster,clusterInfo} = calculateCluster ({data:flat,dimensions:_dimensions,binopt})
            const _clusterInfo = {cluster,outlyingBins,clusterDescription,colorCluster,clusterInfo};
            console.log(clusterInfo)
            setClusterInfo(_clusterInfo)
            callback({clusterInfo:_clusterInfo,scheme:_scheme})
            setIsBusy(false)
        },1);
    },[scheme.tsnedata,dimensions,binopt,showRadar.iqr]);
    const theme = React.useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                },
            }),
        [mode],
    );
    const handleData = useCallback((_data) => {
        if (_data.time_stamp[0] > 999999999999999999)
            _data.time_stamp = _data.time_stamp.map(d => new Date(d / 1000000));
        else if (_data.time_stamp[0] < 9999999999){
            _data.time_stamp = _data.time_stamp.map(d => new Date(d * 1000));
        }
        const timerange = d3.extent(_data.time_stamp);
        const compute = Object.entries(_data.nodes_info);
        const dimensionKeys = Object.keys(compute[0][1]).filter(s=>compute[0][1][s].find(d=>_.isNumber(d)));
        const dimensions = dimensionKeys.map((s,i)=>({text:s,
            index:i,range:[Infinity,-Infinity],scale:d3.scaleLinear(),
            order:i,
            angle:(i/dimensionKeys.length)*2*Math.PI,
            enable:true}));
        const computers ={};

        let jobonnode = undefined;
        compute.forEach(d=>{
            if (_data.nodes_info[d[0]].job_id){
                jobonnode = jobonnode??{};
                _data.nodes_info[d[0]].job_id.forEach(d=>{
                    d.forEach(j=>jobonnode[j]=true);
                })
            }
            computers[d[0]]={
                job_id: [],
                key: d[0],
                user: [],
                drawData:[]
            };
            dimensionKeys.forEach((k,ki)=>{
                const comp = d[0];
                d[1][k] = d[1][k]??(_data.time_stamp.map(()=>null));
                computers[comp][k]=(d[1][k]??[]);
                computers[comp][k].sudden = [];
                let current = +computers[comp][k][0];
                computers[comp][k].forEach((d,ti)=>{
                    if (d!==null) {
                        if (d < dimensions[ki].range[0])
                            dimensions[ki].range[0] = d;
                        if (d > dimensions[ki].range[1])
                            dimensions[ki].range[1] = d;
                    }
                    computers[comp][k].sudden[ti] = (+d) - current;
                    current = +d;
                })
            })
        });
        // update scale
        dimensions.forEach(d=>{
            const recomend = getRefRange(d.text,d.range);
            d.min = d.range[0];
            d.max = d.range[1];
            d.possibleUnit = recomend;
            // d.range = [recomend];
            d.range = metricRangeMinMax?[d.min,d.max]:recomend.range.slice();
            d.scale.domain(d.range)
        });
        const tsnedata ={};
        Object.keys(computers).forEach(d=>{
            tsnedata[d] = _data.time_stamp.map((t,ti)=>{
                const item = dimensionKeys.map((k,ki)=>{
                    return dimensions[ki].scale(computers[d][k][ti]??undefined)??null;
                });
                item.key = d;
                item.timestep = ti;
                return item
            })
        });

        const jobs = {};
        const job_ref = undefined;
        // need update core info to job_ref
        Object.keys(_data.jobs_info).forEach(job_id=>{

            // remove job not belong to this cluster
            if (jobonnode&&(!jobonnode[job_id])){
                delete _data.jobs_info[job_id]
                return;
            }
            const user_name = _data.jobs_info[job_id].user_name;
            const job_name = _data.jobs_info[job_id].job_name;
            const start_time = _data.jobs_info[job_id].start_time> 999999999999999999?(_data.jobs_info[job_id].start_time/1000000) :_data.jobs_info[job_id].start_time;
            const end_time = _data.jobs_info[job_id].finish_time> 999999999999999999?(_data.jobs_info[job_id].finish_time/1000000) :_data.jobs_info[job_id].finish_time;
            const node_list = _data.jobs_info[job_id].node_list??_data.jobs_info[job_id].nodes;
            const cpus_ = _data.jobs_info[job_id].cpus??(_data.jobs_info[job_id].cpu_cores);
            const cores = cpus_/node_list.length;
            let node_list_obj = {};
            if(job_ref&&job_ref[job_id]){
                node_list_obj = job_ref[job_id].node_list_obj;
            }else
                node_list.forEach((n)=>node_list_obj[n]=cores);
            if(node_list.length)
                jobs[job_id] = {
                    job_id,
                    user_name,
                    job_name,
                    node_list,
                    node_list_obj,
                    _node_list:node_list.slice(),
                    _node_list_obj:{...node_list_obj},
                    cpus:cpus_,
                    cpu_cores:cores,
                    summary: [],
                    start_time,
                    finish_time:end_time
                }
        });



        const {users} = handleCUJ({computers,jobs},_data.time_stamp)

        // 3D
        const reverseLayout = {};
        let gconfig={size:[0.6, 0.15, 0.1],padding:0.25, gap:0.5};
        let wA = gconfig.size[0]+gconfig.padding;
        let hA = gconfig.size[1]+gconfig.padding;
        let sumupX = 0;
        Object.keys(layout).forEach((k,ki)=>{
            const width = gconfig.padding+wA*layout[k][0].length;
            const height = gconfig.padding+(gconfig.size[1]+gconfig.padding)*layout[k].length;
            layout[k].position=[sumupX,height,0];
            sumupX += width+gconfig.gap;
            layout[k].size=[width,height];
            layout[k].positions=[];
            layout[k].forEach((row,ri)=>{
                row.forEach((col,ci)=>{
                    if (col){
                        const item = {text:col,position:[(gconfig.padding+ci*wA +layout[k].position[0])+gconfig.size[0]/2,-(gconfig.padding+ri*hA+gconfig.size[1]/2) + layout[k].position[1],0 +layout[k].position[2]]}
                        layout[k].positions.push(item);
                        reverseLayout[col] = item;
                    }
                })
            })
        });


        const draw3DData = [{key:'all', possArr:[],position: [0,0,0]}];
        compute.forEach(d=>{
            computers[d[0]].position = reverseLayout[d[0]].position;
            computers[d[0]].drawData = _data.time_stamp.map((t,i)=>{
                    const poss = [computers[d[0]].position[0],computers[d[0]].position[1],computers[d[0]].position[2]+i];
                    poss.offset = computers[d[0]].position;
                    poss.data = {key:d[0],timestep:i,toolTip:<table>
                            <tbody>
                            <tr><td colSpan={2}>{t.toLocaleString()}</td></tr>
                            <tr><td>Name</td><td>{d[0]}</td></tr>
                            {dimensions.map(s=><tr key={s.text}><td>{s.text}</td><td>{d[1][s.text][i]}</td></tr>)}
                            {computers[d[0]].job_id[i]?<><tr><td>#Jobs</td><td>{computers[d[0]].job_id[i].length}</td></tr>
                            <tr><td>Job Id</td><td>{computers[d[0]].job_id[i].join(',')}</td></tr>
                            <tr><td>Users</td><td>{computers[d[0]].users[i].join(',')}</td></tr></>:
                            <tr><td colSpan={2}>No job</td></tr>}
                            </tbody>
                        </table>,
                    values:tsnedata[d[0]][i]};
                    draw3DData[0].possArr.push(poss);
                    return poss;
                });
        });
        const drawUserData =[];
        drawUserData.links=[];

        Object.keys(users).forEach(selectedUser=>{
            const user = [0,-2,0];
            user.links = [];
            console.log(users[selectedUser])
            user.toolTip=<table>
                <tbody>
                <tr><td>Name</td><td>{selectedUser}</td></tr>
                {users[selectedUser].job?<><tr><td>#Jobs</td><td>{users[selectedUser].job.length}</td></tr>
                        <tr><td>Job Id</td><td>{users[selectedUser].job.join(',')}</td></tr>
                        <tr><td>#Nodes</td><td>{users[selectedUser].node.length}</td></tr>
                        <tr><td>Nodes</td><td>{users[selectedUser].node.join(',')}</td></tr></>:
                    <tr><td colSpan={2}>No job</td></tr>}
                </tbody>
            </table>;
            const comtract = {};
            users[selectedUser].node.forEach(com=>{
                if (computers[com]) {
                    computers[com].users.forEach((u, i) => {
                        if (u.find(d => d === selectedUser)){
                            const compP = computers[com].position;
                            user.links.push(compP);
                            if(!comtract[com]) {
                                drawUserData.links.push([user, compP]);
                                comtract[com] = true;
                            }
                        }
                    });
                }
            });
            user[0] = d3.mean(user.links,d=>d[0]);
            user.x = user[0];
            user.y = user[1];
            drawUserData.push(user);
        });
        console.log('#links ',drawUserData.links.length)
        const userSize = d3.scaleSqrt().domain(d3.extent(drawUserData,d=>d.links.length)).range([0.5,1]);
        drawUserData.forEach(d=>d.scale=userSize(d.links.length));

        setDataset({dataInfo:`from ${timerange[0].toLocaleString()}\nto ${timerange[1].toLocaleString()}`})
        return {scheme: {data: _data,users,computers,jobs,tsnedata,time_stamp:_data.time_stamp, timerange}, draw3DData, drawUserData,dimensions,layout}
    }, [layout]);

    function handleCUJ({computers,jobs},timestamp){
        const compute_user= {};
        const jobm = {}
        Object.keys(computers).forEach((k)=>{
            jobm[k] = timestamp.map(()=>({}));
            const d = computers[k];
            d.user=[];
            d.jobName=timestamp.map(()=>[]);
            d.job_id=timestamp.map(()=>[]);
            d.users=timestamp.map(()=>[]);
            d.cpus=timestamp.map(()=>({}));
            compute_user[k] = timestamp.map(()=>({}));
        });

        const jobData = Object.entries(jobs);
        jobData.forEach(jj=>{
            const j = {key:jj[0],value:jj[1]}
            j.value.start_Index = timestamp.findIndex((t)=>t>j.value.start_time);
            if (j.value.start_Index>0)
                j.value.start_Index --;
            else if(j.value.start_Index ===-1)
                j.value.start_Index = timestamp.length-1;
            j.value.finish_Index = j.value.finish_time?timestamp.findIndex((t)=>t>j.value.finish_time):-1;
            if (j.value.finish_Index>0)
                j.value.finish_Index --;
            else if(j.value.finish_Index ===-1)
                j.value.finish_Index = timestamp.length-1;
            j.value.node_list.forEach(comp=>{
                if(computers[comp]){
                    for (let t=j.value.start_Index;t<=j.value.finish_Index;t++){
                        if(!jobm[comp][t][j.key]) {
                            computers[comp].job_id[t].push(j.key);
                            jobm[comp][t][j.key] = false;
                        }
                        computers[comp].cpus[t][j.key] = (j.value.node_list_obj[comp]);
                        if(!compute_user[comp][t][j.value.user_name]){
                            compute_user[comp][t][j.value.user_name]=true;
                            computers[comp].users[t].push(j.value.user_name);
                        }
                    }
                }
            })
        });
        const users = getUsers(jobs,computers,timestamp.length);
        Object.keys(users).forEach((k,i)=>{
            users[k].node.forEach((c)=> computers[c]?computers[c].user.push(k):'');
        });
        return {users}
    }
    function getUsers(jobs,computers,timestep=1){
        const user_job = d3.groups(Object.entries(jobs),(d)=>(d[1])['user_name'],(d)=>(d[0]).split('.')[0].trim());
        const users = {};
        user_job.forEach((u,i)=>{
            const k = u[0];
            // const  u =user_job[k];
            const job = [];
            let totalCore = 0;
            let totalCore_share = 0;
            let totalCore_notShare = 0;

            const node = _.uniq(_.flattenDeep(u[1].map(e=>e[1].map(d=>{
                job.push(d[0]);
                const core = d[1].cpus*(d[1].finish_Index-d[1].start_Index+1);
                totalCore += core;
                if (d[1].finish_Index===d[1].start_Index){
                    d[1].node_list.forEach((comp)=>{
                        if(computers[comp].users[d[1].start_Index].length===1){
                            totalCore_notShare += d[1].node_list_obj[comp];
                        }else{
                            totalCore_share += d[1].node_list_obj[comp];
                        }
                    })
                }
                return d[1].node_list;
            }))));
            totalCore = totalCore/timestep;
            totalCore_notShare = totalCore_notShare/timestep;
            totalCore_share = totalCore_share/timestep;
            // const node = _.uniq(_.flattenDeep(_.values(u).map(d=>d.map(d=>(job.push(d.key),totalCore+=d3.sum(Object.values(d.value.node_list_obj)),d.value.node_list)))));
            users[k]={node,job,totalCore,totalCore_notShare,totalCore_share}
        });
        return users;
    }


    // function onDimensionChange (val){
    //     updateColor(_draw3DData,scheme,val);
    //     set_draw3DData(_draw3DData);
    //     draw3DData.forEach(d=>d.possArr=[...d.possArr]);
    //     setDraw3DData(draw3DData);
    // }


    const updateColor = useCallback((__draw3DData=_draw3DData,_scheme=scheme,_selectedSer=selectedSer,_clusterInfo=clusterInfo)=>{
        if (_selectedSer!=="cluster") {
            __draw3DData.forEach(d => {
                d.possArr.forEach((p, ti) => {
                    p.color = (_scheme.tsnedata[p.data.key][p.data.timestep][_selectedSer] !== null) ? colorByMetric(_scheme.tsnedata[p.data.key][p.data.timestep][_selectedSer]) : undefined
                })
            });
        }else{
            __draw3DData.forEach(d => {
                d.possArr.forEach((p, ti) => {
                    const cluster = _scheme.tsnedata[p.data.key][p.data.timestep].cluster;
                    p.color = _clusterInfo.colorCluster(cluster)
                })
            });
        }
        try {
            setConfig({minMax: dimensions[selectedSer] ? `Min: ${dimensions[selectedSer].min} Max: ${dimensions[selectedSer].max}` : `Min:_ Max:_`})
        }catch(e){}
    },[dimensions,scheme,_draw3DData,selectedSer,clusterInfo]);
    useEffect(()=>{
        getSelectedDraw3Data({selectedUser,selectedComputeMap},_draw3DData,scheme,config.stackOption)
    },[_draw3DData,selectedComputeMap,selectedUser,scheme,config.suddenThreshold,config.metricTrigger,config.metricFilter,config.stackOption])
    function getSelectedDraw3Data({selectedUser,selectedComputeMap},__draw3DData=_draw3DData,_scheme=scheme,isStack = config.stackOption){
        let isFilter = (!!selectedComputeMap || selectedUser || (!!config.suddenThreshold) || config.metricTrigger);
        // selectedComputeMap=selectedComputeMap??{};
        console.log('isstack',isStack)
        let flatmap =selectedComputeMap?ob2arr(selectedComputeMap):undefined;
        function ob2arr(selectedComputeMap){
            let flatmap =[];
            Object.keys(selectedComputeMap).forEach(comp=>Object.keys(selectedComputeMap[comp]).forEach(timestep=>flatmap.push({key:`${comp}|${timestep}`,comp,timestep})));
            return flatmap;
        }
        if (config.metricTrigger) {
            let sudenCompMap={};
            Object.keys(_scheme.computers).forEach(comp=>{
                const arr = _scheme.computers[comp][dimensions[selectedSer].text];
                const isEmpty = !sudenCompMap[comp];
                if (isEmpty)
                    sudenCompMap[comp] = {};
                arr.forEach((d,ti)=>{
                    if (d>=config.metricFilter){
                        sudenCompMap[comp][ti] =true;
                    }
                });
                if (isEmpty && (!Object.keys(sudenCompMap[comp]).length))
                    delete  sudenCompMap[comp]
            });
            let suddenMap = ob2arr(sudenCompMap);
            if(flatmap)
                flatmap = _.intersectionBy(flatmap,suddenMap,'key');
            else
                flatmap = suddenMap;
        }
        if (config.suddenThreshold){
            let sudenCompMap={}
            Object.keys(_scheme.computers).forEach(comp=>{
                const arr = _scheme.computers[comp][dimensions[selectedSer].text];
                const isEmpty = !sudenCompMap[comp];
                if (isEmpty)
                    sudenCompMap[comp] = {};
                arr.sudden.forEach((d,ti)=>{
                    if (Math.abs(d)>=config.suddenThreshold){
                        sudenCompMap[comp][ti] =true;
                        sudenCompMap[comp][ti-1] = true;
                    }
                });
                if (isEmpty && (!Object.keys(sudenCompMap[comp]).length))
                    delete  sudenCompMap[comp]
            });
            let suddenMap = ob2arr(sudenCompMap);
            if(flatmap)
                flatmap = _.intersectionBy(flatmap,suddenMap,'key');
            else
                flatmap = suddenMap;
        }
        if (selectedUser) {
            let selectedUsereMap = {}
            _scheme.users[selectedUser].node.forEach(com=>{
                if (_scheme.computers[com]) {
                    selectedUsereMap[com] = {};
                    _scheme.computers[com].users.forEach((u, i) => {
                        if (u.find(d => d === selectedUser)) selectedUsereMap[com][i] = true;
                    });
                }
            });
            let usereMap = ob2arr(selectedUsereMap);
            if (flatmap)
                flatmap = _.intersectionBy(flatmap,usereMap,'key');
            else
                flatmap = usereMap;
        }else if (!isFilter){
            setDraw3DData(__draw3DData);
            setLine3D([])
            return
        }else if (!flatmap || (flatmap.length===0)){
            setDraw3DData([]);
            setLine3D([])
            return
        }
        selectedComputeMap={};
        flatmap.forEach(({comp,timestep})=>{
            if (!selectedComputeMap[comp])
                selectedComputeMap[comp] = {};
            selectedComputeMap[comp][timestep] = true;
        })
        const newdata = getData();
        setDraw3DData(newdata.draw3DData);
        setLine3D(newdata.line3D)
        function getData(){
            const data = [{...__draw3DData[0],possArr:[]}];
            const lines=[];
            Object.keys(selectedComputeMap).forEach(comp=>{
                if (_scheme.computers[comp]){
                    let poss = [];
                    let count=0;
                    _scheme.computers[comp].drawData.forEach(d=>{
                        if (selectedComputeMap[comp][d.data.timestep]){
                            if (isStack)
                                d[2] = d.offset[2]+count;
                            else
                                d[2] = d.offset[2]+d.data.timestep;
                            data[0].possArr.push(d);
                            count++;
                        }

                        // add line data
                        poss.push(d)
                    });
                    if (count)
                        lines.push(poss)
                }
            })
            return {draw3DData:data,line3D:lines};
        }
    }

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                    <div style={{height: "100vh",width:'100wh',overflow:'hidden'}}>
                        <Layout3D layout={layout} time_stamp={scheme.time_stamp} data={draw3DData} users={drawUserData} line3D={line3D} selectService={selectedSer} stackOption={config.stackOption}/>
                    </div>
                    <Grid container style={{position:'absolute',top:0,left:0}}>
                        <Container maxWidth="lg">
                            <Grid container>
                                <Grid item xs={12}>
                                    <h3>Quanah <Typography variant="subtitle1" style={{display:'inline-block'}}>from {scheme.timerange[0].toLocaleString()} to {scheme.timerange[1].toLocaleString()}</Typography></h3>
                                </Grid>
                                <Grid item xs={6} container spacing={1}>
                                    {/*<Grid item xs={3}>*/}
                                    {/*    <FormControl fullWidth>*/}
                                    {/*        <InputLabel >Metrics</InputLabel>*/}
                                    {/*        <Select*/}
                                    {/*            labelId="demo-simple-select-label"*/}
                                    {/*            id="demo-simple-select"*/}
                                    {/*            value={selectedSer}*/}
                                    {/*            label="Age"*/}
                                    {/*            size={"small"}*/}
                                    {/*            onChange={onDimensionChange}*/}
                                    {/*        >*/}
                                    {/*            {dimensions.map((d,i)=><MenuItem key={d.index} value={i}>{d.text}</MenuItem>)}*/}
                                    {/*        </Select>*/}
                                    {/*    </FormControl>*/}
                                    {/*</Grid>*/}
                                    {/*{dimensions[selectedSer]&&<Grid item xs={7} style={{textAlign:"center"}}>*/}
                                    {/*    {dimensions[selectedSer].text} Min: {dimensions[selectedSer].min} Max: {dimensions[selectedSer].max}*/}
                                    {/*    <div style={{position:'relative'}}><ColorLegend colorScale={colorByMetric} range={dimensions[selectedSer].range}/></div>*/}
                                    {/*</Grid>}*/}
                                </Grid>
                                <Grid item xs={2}>
                                    <Autocomplete
                                        fullWidth
                                        size="small"
                                        disablePortal
                                        options={Object.keys(scheme.users)}
                                        value={selectedUser}
                                        onChange={(event, newValue) => {
                                            // getSelectedDraw3Data({selectedUser:newValue});
                                            setSelectedUser(newValue);
                                        }}
                                        renderInput={(params) => <TextField {...params} label="Users" />}
                                    />
                                </Grid>
                                <Grid item xs={2}>
                                {
                                    selectedUser&&<>
                                        #Jobs: {scheme.users[selectedUser].job.length} #Nodes: {scheme.users[selectedUser].node.length}</>

                                }</Grid>
                            </Grid>
                        </Container>
                    </Grid>
                    <Backdrop
                        sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}
                        open={!!isBusy}
                    >
                        <h1>{isBusy}</h1>
                        <CircularProgress color="inherit"/>
                    </Backdrop>
                <Snackbar anchorOrigin={{vertical:"top",horizontal:"right"}} open={!!alertMess} autoHideDuration={4000} onClose={()=>setAlertMess(undefined)}>
                    <Alert severity={alertMess&&alertMess.level} sx={{ width: '100%' }}>
                        {alertMess&&alertMess.message}
                    </Alert>
                </Snackbar>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

export default App;

function shortArray(arr=[],limit=2){
    return arr.length>limit?(arr.slice(0,limit).join(',')+`, +${arr.length-limit} more`): arr.join(',')
}
