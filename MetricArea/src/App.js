// import logo from './logo.svg';
import './App.css';
import AreaStack from "./component/AreaStack_user"
import React, {useState, useEffect, useCallback, useMemo, useLayoutEffect, useRef} from "react";
import {Grid, Backdrop, CircularProgress, createTheme,FormControl,InputLabel,Select,MenuItem,Typography} from "@mui/material";
import CssBaseline from '@mui/material/CssBaseline';
import {ThemeProvider} from '@mui/material/styles';
import * as d3 from "d3"

import _layout from "./data/layout";
// import _data from "./data/2182022";
// import _data from "./data/nocona_24h";
// import _data from "./data/nocona-jieoyao";
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
import Dataset from "./component/Dataset";

const ColorModeContext = React.createContext({
    toggleColorMode: () => {
    }
});
const coreLimit = 128;
const colorByMetric = d3.scaleSequential()
    .interpolator(d3.interpolateTurbo).domain([0,1]);
const colorByName = d3.scaleOrdinal(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#bcbd22", "#17becf", "#aec7e8", "#ffbb78", "#98df8a", "#ff9896", "#c5b0d5", "#c49c94", "#f7b6d2", "#dbdb8d", "#9edae5"])
const colorByVal = d3.scaleSequential(d3.interpolateGreys).domain([1,-0.25]);
let color= colorByName;
const userEncoded = false;
function App() {
    const [scheme, setScheme] = useState({data:{},users:{},time_stamp:[], timerange: [new Date(), new Date()]});
    const [selectedTime, setSelectedTime] = useState({min:0,max:0,value:[0,0]});
    const [dimensions, setDimensions] = useState([]);
    const [layout, setLayout] = useState(_layout);
    const [sankeyData, setSankeyData] = useState([]);
    const [_draw3DData, set_draw3DData] = useState([]);
    const [draw3DData, setDraw3DData] = useState([]);
    const [drawUserData, setDrawUserData] = useState([]);
    const [line3D, setLine3D] = useState([]);
    const [alertMess, setAlertMess] = useState();
    const [isBusy, setIsBusy] = useState("Load data");
    const [mode, setMode] = React.useState('light');
    // const [selectedUser, setSelectedUser] = React.useState(null);
    const [selectedComputeMap, setSelectedComputeMap] = React.useState(undefined);
    const [clusterInfo, setClusterInfo] = React.useState({cluster:[],outlyingBins:[],clusterDescription:[],colorCluster:d3.scaleOrdinal(),clusterInfo:{}});

    // const [selectedSer, setSelectedSer] = React.useState(0);

    const onChangeData = useCallback((_data)=>{
        const {scheme, draw3DData, drawUserData, dimensions, layout,sankeyData} = handleData(_data);
        setDimensions(dimensions);
        setScheme(scheme);
        setSankeyData(sankeyData);
        updateColor(draw3DData, scheme);
        set_draw3DData(draw3DData);
        setDrawUserData(drawUserData);
        // getSelectedDraw3Data({selectedUser},draw3DData,scheme);
        setLayout(layout);
        setIsBusy(false);
        const timerange = [+scheme.time_stamp[0],+scheme.time_stamp[scheme.time_stamp.length-1]];
        setSelectedTime({min:timerange[0],max:timerange[1],value:timerange,arr:scheme.time_stamp.slice()})
    },[]);
    const optionsColor = useMemo(()=>{
        const option = dimensions.reduce((a, v) => ({ ...a, [v.text]: v.index}), {});
        // option["Dataset cluster"] = "cluster"
        return option;
    },[dimensions]);
    const optionsUser = useMemo(()=>{
        const option = {'':undefined};
        Object.keys(scheme.users).forEach(d=>option[d]=d);
        // option["Dataset cluster"] = "cluster"
        return option;
    },[scheme.users]);
    const optionsView = useMemo(()=>{
        const option = dimensions.reduce((a, v) => ({ ...a, [v.text]: v.index}), {'':undefined});
        return option;
    },[dimensions]);
    const [selectedUser,setSelectedUser] = useState();//useControls("Setting",()=>({"selectedUser":{label:'User',value:undefined,options:optionsUser}}),[optionsUser]);
    const [{selectedSer,selectedSer2},setSelectedSer] = useControls("Setting",()=>({selectedSer:{options:optionsColor,label:"Metric",value:0,
            onChange:(val)=>{
                updateColor(_draw3DData,scheme,val);
                set_draw3DData([..._draw3DData]);
                draw3DData.forEach(d=>d.possArr=[...d.possArr]);
                setDraw3DData([...draw3DData]);
                // debugger
                // if (dimensions[val])
                //     setConfig({metricFilter: dimensions[val].range[0]})
            },transient:false},
        // selectedSer2:{options:optionsView,label:"View 2",value:undefined}
    }),[dimensions,_draw3DData,draw3DData,scheme]);
    // useControls("Setting",()=>{
    //     console.log(dimensions,selectedSer,dimensions[selectedSer])
    //     if (dimensions[selectedSer])
    //         return {minMax:{label:'',transient:false,editable:false,value:dimensions[selectedSer]?`Min: ${dimensions[selectedSer].min} Max: ${dimensions[selectedSer].max}`:`Min:_ Max:_`}}
    //     else
    //         return {}
    // },[dimensions,selectedSer])
    const [{metricRangeMinMax},setMetricRangeMinMax] = useControls("Setting",()=>(
        {metricRangeMinMax:{value:false, label:'Min-Max scale', onChange:(metricRangeMinMax)=>{
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
                    setDimensions(dimensions)
        },transient:false
        }}),[dimensions,scheme.computers]);
    // useEffect(()=>{
    //     debugger
    //     if (metricRangeMinMax){
    //         dimensions.forEach(dim=>{
    //             dim.range = [dim.min,dim.max];
    //             dim.scale.domain(dim.range)
    //         })
    //     }else{
    //         dimensions.forEach(dim=>{
    //             dim.range = dim.possibleUnit.range.slice();
    //             dim.scale.domain(dim.range)
    //         })
    //     }
    //
    //     // setDimensions(dimensions);
    //     if (scheme.computers) {
    //         Object.keys(scheme.computers).forEach(d => {
    //             scheme.time_stamp.forEach((t, ti) => {
    //                 dimensions.forEach((dim, ki) => {
    //                     scheme.tsnedata[d][ti][ki] = dimensions[ki].scale(scheme.computers[d][dim.text][ti] ?? undefined) ?? null;
    //                 })
    //             })
    //         });
    //         // setScheme({...scheme});
    //         if (selectedSer==='cluster'){
    //             console.log('selectedSer changed')
    //             recalCluster(scheme, dimensions,({clusterInfo,scheme})=>{
    //                 if (selectedSer==='cluster') {
    //                     setScheme(scheme);
    //                     updateColor(_draw3DData, scheme,undefined,clusterInfo);
    //                     set_draw3DData([..._draw3DData]);
    //                     draw3DData.forEach(d=>d.possArr=[...d.possArr]);
    //                     setDraw3DData([...draw3DData]);
    //                 }
    //             })
    //         }else{
    //             updateColor(_draw3DData, scheme);
    //             set_draw3DData([..._draw3DData]);
    //             draw3DData.forEach(d => d.possArr = [...d.possArr]);
    //             setDraw3DData([...draw3DData]);
    //         }
    //     }
    // },[metricRangeMinMax]);

    const metricSetting= useMemo(()=>{
        if (dimensions[selectedSer]){
            const range = (dimensions[selectedSer]??{range:[0,1]}).range;
            return {
                // legend:colorLegend({label:'Legend',
                // value:(dimensions[selectedSer]??{range:[0,1]}).range,range:(dimensions[selectedSer]??{range:[0,1]}).range,scale:colorByMetric}),

        filterLarger:{value:true,label:'Greater than'},
        metricFilter:{value:range[0],label:'',min:(dimensions[selectedSer]??{range:[0,1]}).range[0],max:(dimensions[selectedSer]??{range:[0,1]}).range[1],step:0.1}
        ,suddenThreshold:{value:0,min:0,max:(dimensions[selectedSer]??{max:1}).max,step:0.1, label:"Sudden Change"}}
        }else{
            return {filterLarger:{value:true,label:'Greater than'}}
        }
    },[dimensions,selectedSer,metricRangeMinMax]);

    const [config,setConfig] = useControls("Filter",()=>(metricSetting),[dimensions,selectedSer,metricRangeMinMax]);

    useEffect(()=>{
        if (dimensions[selectedSer])
        {
            setConfig({metricFilter: dimensions[selectedSer].range[0]})
        }
    },[selectedSer,metricRangeMinMax])
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
        "Missing Dimension":viz({label:clusterInfo.outlyingBins&&<>Missing Dimension: {(clusterInfo.outlyingBins.missingData)?Object.keys(clusterInfo.outlyingBins.missingData).length:0} temporal instances</>,value:0,
            com:<div style={{width:'100%',display:'flex',flexWrap: "wrap",justifyContent: "space-between"}}></div>
                })
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
    const changeSankeyData = (choice,opts={}) =>{
        const {computers,jobs,time_stamp} = opts.scheme??scheme;
        if(choice==='core'){
            return handleDataComputeByUser_core({computers,jobs,timespan:time_stamp})
        }else{
            // console.log('compute')
            return handleDataComputeByUser_compute({computers,jobs,timespan:time_stamp})
        }
    }

    const handleData = useCallback((_data) => {
        if (userEncoded){
            let userCodecount = 1;
            const userEncode = {};
            const user_names = d3.groups(Object.values(_data.jobs_info),d=>d.user_name)
            user_names.forEach((g)=>{
                const name = g[0];
                userEncode[name] = 'user'+userCodecount;
                userCodecount++;
                g[1].forEach(d=>d.user_name = userEncode[name])
            })
        }
        if (_data.time_stamp[0] > 999999999999999999)
            _data.time_stamp = _data.time_stamp.map(d => new Date(d / 1000000));
        else if (_data.time_stamp[0] < 9999999999){
            _data.time_stamp = _data.time_stamp.map(d => new Date(d * 1000));
        }
        const timerange = d3.extent(_data.time_stamp);
        const compute = Object.entries(_data.nodes_info);
        const allDim = {};
        compute.forEach(d=>{
            Object.keys(d[1]).forEach(k=>{
                if (!allDim[k]){
                    allDim[k] = d[1][k].find(d=>_.isNumber(d))!==undefined?'number':'other';
                }
            })
        });
        // const dimensionKeys = Object.keys(compute[0][1]).filter(s=>compute[0][1][s].find(d=>_.isNumber(d)));
        const dimensionKeys = Object.keys(allDim).filter(k=>allDim[k]==='number');
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
                    if (d ==='') {
                        computers[comp][k][ti] = null;
                        d = null;
                    }
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


        const jobs = {};
        const job_ref = undefined;
        // need update core info to job_ref
        Object.keys(_data.jobs_info).forEach(job_id=>{
            // remove job not belong to this cluster
            if (jobonnode&&(!jobonnode[job_id])){
                delete _data.jobs_info[job_id]
                return;
            }
            _data.jobs_info[job_id].finish_time = _data.jobs_info[job_id].finish_time??_data.jobs_info[job_id].end_time;
            const user_name = _data.jobs_info[job_id].user_name;
            const job_name = _data.jobs_info[job_id].job_name??_data.jobs_info[job_id].name;
            const start_time = adjustTime(_data.jobs_info[job_id].start_time);
            const end_time = adjustTime(_data.jobs_info[job_id].finish_time);
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



        const {users} = handleCUJ({computers,jobs},_data.time_stamp);
        // add new DIm
        handleWorkload(computers,dimensions,dimensionKeys,metricRangeMinMax);
        const tsnedata ={};
        Object.keys(computers).forEach(d=>{
            tsnedata[d] = _data.time_stamp.map((t,ti)=>{
                const item = dimensionKeys.map((k,ki)=>{
                    return dimensions[ki].scale(computers[d][k][ti]??undefined)??null;
                });
                item.key = d;
                item.timestep = ti;
                item.name = d;
                return item
            })
        });

        const result = handleDataComputeByUser(computers,jobs,_data.time_stamp);
        const jobCompTimeline = result.data;
        const noJobMap = result.noJobMap;

        const {jobTimeline, jobarrdata,userarrdata,_userarrdata,minMaxDataCompJob,minMaxDataUser} = handleDataComputeByJob({tsnedata,computers,jobs,users,timespan:_data.time_stamp});


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

        const drawUserData =[];
        drawUserData.links=[];



        // setDataset({dataInfo:`from ${timerange[0].toLocaleString()}\nto ${timerange[1].toLocaleString()}`});

        const scheme = {data: _data,users,computers,jobs,tsnedata,time_stamp:_data.time_stamp, timerange};
        scheme.emptyMap=noJobMap;
        scheme.jobArr=jobarrdata;
        scheme.userArr=userarrdata;
        scheme._userarrdata=_userarrdata;
        // const sankeyData = changeSankeyData('compute_num',{scheme});
        debugger
        return {scheme, draw3DData, drawUserData,dimensions,layout}
    }, [layout]);
    function handleWorkload(computers,dimensions,dimensionKeys,metricRangeMinMax) {
        const k = 'compute utilization';
        dimensionKeys.push(k)
        const i = dimensions.length;
        const dimT = {text:k,
            index:i,
            range:[Infinity,-Infinity],
            scale:d3.scaleLinear(),
            order:i,
            possibleUnit:{type:null,unit:null,range:[0,100]},
            enable:true};
        dimensions.push(dimT)
        dimensions.forEach((d,i)=>{
            d.angle = (i/dimensions.length)*2*Math.PI;
        });
        function getdata(d){
            // return (Math.min(1,d3.sum(Object.values(d))/coreLimit)) *100;
            return d3.sum(Object.values(d))/coreLimit *100;
        }
        Object.keys(computers).forEach((comp)=> {
            computers[comp][k]=[];
            computers[comp][k].sudden = [];
            computers[comp][k][0] = getdata(computers[comp]['cpus'][0]);
            let current = computers[comp][k][0];
            computers[comp]['cpus'].forEach((_d, ti) => {
                const d = getdata(_d??{});
                computers[comp][k][ti] = d;
                if (_d !== null) {
                    if (d < dimT.range[0])
                        dimT.range[0] = d;
                    if (d > dimT.range[1])
                        dimT.range[1] = d;
                }
                computers[comp][k].sudden[ti] = (+d) - current;
                current = +d;
            })
        });

        dimT.min = dimT.range[0];
        dimT.max = dimT.range[1];
        dimT.range = metricRangeMinMax?[dimT.min,dimT.max]:[0,100];
        dimT.scale.domain(dimT.range)

    }
    function handleDataComputeByJob(input){
        const tsnedata = input.tsnedata??{};
        const computers=input.computers??{};
        const _jobs=input.jobs??{};
        const _users = input.users??{};
        const jobs = {};
        const users = {};
        const jobarrdata = {};
        const _jobarrdata = {};
        const userarrdata = {};
        const _userarrdata = {};
        const minMaxDataCompJob = {};
        const minMaxDataUser = {};
        const timespan = input.timespan??[];
        Object.keys(_jobs).forEach(k=>{
            // if (_jobs[k].total_nodes>1){
            jobs[k] = _jobs[k];
            _jobarrdata[k] = [];
            jobarrdata[k] = [];
            minMaxDataCompJob[k] = [];

            if (!jobs[k].isJobarray){
                if (!_userarrdata[_jobs[k].user_name]) {
                    users[_jobs[k].user_name] = _users[_jobs[k].user_name];
                    userarrdata[_jobs[k].user_name] = [];
                    _userarrdata[_jobs[k].user_name] = [];
                    _userarrdata[_jobs[k].user_name].jobs = {};
                    minMaxDataUser[_jobs[k].user_name] = [];
                }
                _userarrdata[_jobs[k].user_name].jobs[k]=[];
            }else{
                jobs[k].comp = {};
            }
            // }
        });

        let data = [];
        for (let comp in computers){
            let item = {key:comp,values:[] ,range:[Infinity,-Infinity],data:computers[comp]};
            let job = {};
            computers[comp].job_id.forEach((jIDs,i)=>{
                let jobArr = jIDs.map(j=>jobs[j]).filter(d=>{
                    if (d){
                        if (!_jobarrdata[d.job_id][i]){
                            const empty = [];
                            empty.name='';
                            empty.timestep=i;
                            _jobarrdata[d.job_id][i]=(empty);
                        }
                        const tsne_comp = tsnedata[comp];
                        if(tsne_comp)
                            _jobarrdata[d.job_id][i].push(tsne_comp[i]);
                        if (!_userarrdata[d.user_name][i]){
                            const empty = [];
                            empty.name='';
                            empty.timestep=i;
                            empty.cpus=0;
                            _userarrdata[d.user_name][i] =(empty);
                        }
                        if(tsne_comp) {
                            if (!_userarrdata[d.user_name].jobs[d.job_id][i]){
                                const empty = [];
                                empty.name=d.job_id;
                                empty.timestep=i;
                                empty.cpus=0;
                                _userarrdata[d.user_name].jobs[d.job_id][i] =(empty);
                            }
                            _userarrdata[d.user_name][i].push(tsne_comp[i]);
                            _userarrdata[d.user_name].jobs[d.job_id][i].push(tsne_comp[i]);
                        }

                        if(d.job_array_id){
                            if (!_jobarrdata[d.job_array_id][i]){
                                const empty = [];
                                empty.name='';
                                empty.timestep=i;
                                _jobarrdata[d.job_array_id][i]=(empty);
                            }
                            if (!jobs[d.job_array_id].comp[i])
                                jobs[d.job_array_id].comp[i] = {};
                            if (!jobs[d.job_array_id].comp[i][comp]){
                                jobs[d.job_array_id].comp[i][comp] = 1;
                                _jobarrdata[d.job_array_id][i].push(tsnedata[comp][i]);
                            }
                        }
                        return true;
                    }
                    return false
                });
                const key = jobArr.map(d=>d.job_id).toString();
                if (!job[key])
                    job[key]=true;
                else
                    jobArr=[];

                if (jobArr.length){
                    let username = d3.groups(jobArr,d=>d.job_id)
                        .map(d=>({key:d[0],value:d3.sum(d[1],(e)=>e.node_list_obj[comp])}));

                    username.sort((a,b)=>d3.ascending(a.key,b.key))
                    item.values.push(username);
                }else
                    item.values.push(null);
                item[''+timespan[i]] = item.values[i];
            });
            data.push(item);
        }
        Object.keys(_jobarrdata).forEach(k=>{
            _jobarrdata[k].forEach((d,i)=>{
                const timestep = _jobarrdata[k][i][0].timestep;
                let valueMin= [];
                let valueMax= [];
                let value = _jobarrdata[k][i][0].map((d,si)=>{
                    const vals = _jobarrdata[k][i].map(d=>d[si]);
                    valueMin.push(d3.min(vals));
                    valueMax.push(d3.max(vals));
                    let sum = 0;
                    let total = 0;
                    _jobarrdata[k][i].forEach(d=>{
                        if(d[si]!==undefined) {
                            const val = computers[d.name].cpus[i][k];
                            sum += d[si] * val;
                            total += val;
                        }
                    });
                    // if(total&& _.isNaN(sum/total))
                    //     debugger
                    if(!total)
                        return undefined;
                    else
                        return sum/total;
                    // return  d3.mean(vals);
                });
                value.name = k;
                valueMin.name = k;
                valueMax.name = k;
                value.timestep = timestep;
                valueMin.timestep = timestep;
                valueMax.timestep = timestep;
                minMaxDataCompJob[k][i] = [valueMin,valueMax]
                jobarrdata[k][i] = (value);
            })
        })

        Object.keys(_userarrdata).forEach(k=>{
            _userarrdata[k].forEach((d,i)=>{
                const timestep = _userarrdata[k][i][0].timestep;
                let valueMin = [];
                let valueMax = [];
                let value = _userarrdata[k][i][0].map((d,si)=>{
                    const vals = _userarrdata[k][i].map(d=>d[si]);
                    valueMin.push(d3.min(vals));
                    valueMax.push(d3.max(vals));
                    return  d3.mean(vals);
                });
                value.name = k;
                valueMin.name = k;
                valueMax.name = k;
                value.timestep = timestep;
                valueMin.timestep = timestep;
                valueMax.timestep = timestep;
                minMaxDataUser[k][i] = [valueMin,valueMax]
                userarrdata[k][i] = (value);
            })
        })
        data.sort((a,b)=>+a.range[0]-b.range[0])
        return {jobTimeline:data, jobarrdata,userarrdata,_userarrdata,minMaxDataCompJob,minMaxDataUser};
    }
    function handleDataComputeByUser(computers,jobs,timeStamp){
        //start
        let data = [];

        let obj = {};
        let noJobMap = {};
        for (let j in jobs){
            obj[j] = {key:j,values:timeStamp.map(t=>null),range:[Infinity,-Infinity],data:jobs[j],arr:[]};
            data.push(obj[j]);
        }
        for (let comp in computers){
            let jonj = {};
            noJobMap[comp] = [];
            computers[comp].job_id.forEach((jIDs,i)=>{
                if (jIDs.length){
                    jIDs.forEach(j=>{
                        if (!jonj[j]){
                            let item = obj[j];
                            if (!item.values[i]) {
                                item.values[i] = [];
                                item.values[i].total = 0;
                            }
                            const compData = {key:comp,type:'compute',value:1};
                            const userData = {key:jobs[j].user_name,type:'user',value:1};
                            const current = item.values[i];
                            if(current!==null && current.length){
                                current.push(compData);
                                // item.values[i].push(userData);
                                current.total = (current.total??0) + jobs[j].node_list_obj[comp];
                                // item.arr.push({time:Layout.timespan[i],value:[compData,{key:j,type:'job',value:1},userData]});
                                item.arr.push({time:timeStamp[i],value:[{key:j,type:'job',value:1},userData]});
                                item.arr.push({time:timeStamp[i],value:[compData,{key:j,type:'job',value:1}]});
                                if(jobs[j].job_array_id){
                                    // item.arr.push({time:Layout.timespan[i],value:[compData,{key:jobs[j].job_array_id,type:'job',value:1},userData]});
                                    item.arr.push({time:timeStamp[i],value:[compData,{key:jobs[j].job_array_id,type:'job',value:1}]});
                                    item.arr.push({time:timeStamp[i],value:[{key:jobs[j].job_array_id,type:'job',value:1},userData]});
                                }
                            }
                            jonj[j]=true;
                        }
                    });
                }else{
                    noJobMap[comp][i] = 1;
                }
            });
        }
        // data.sort((a,b)=>+a.range[0]-b.range[0])
        return {data,noJobMap};
    }
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
    function handleDataComputeByUser_compute({computers,jobs,timespan}){
        let data = [];
        for (let comp in computers){
            let item = {key:comp,data:computers[comp]};
            computers[comp].job_id.forEach((jIDs,i)=>{
                if (jIDs.length){
                    let jobArr = jIDs.map(j=>jobs[j]);
                    let username = d3.groups(jobArr,d=>d.user_name).map(d=>({key:d[0],value:1}));
                    username.total = d3.sum(username,e=>e.value);
                    username.jobs = [jIDs,jobArr];
                    item[''+timespan[i]] = username.sort((a,b)=>d3.ascending(a.key,b.key));
                }else
                    item[''+timespan[i]] = null;
            });
            data.push(item);
        }
        return data;
    }
    function handleDataComputeByUser_core({computers,jobs,timespan}){
        let data = [];
        for (let comp in computers){
            let item = {key:comp,data:computers[comp]};
            computers[comp].job_id.forEach((jIDs,i)=>{
                if (jIDs.length){
                    let jobArr = jIDs.map(j=>jobs[j]);
                    let username = d3.groups(jobArr,d=>d.user_name).map(d=>({key:d[0],value:d3.sum(d[1],(e)=>e.node_list_obj[comp]??0)}));
                    username.total = d3.sum(username,e=>e.value);
                    username.jobs = [jIDs,jobArr];
                    item[''+timespan[i]] = username.sort((a,b)=>d3.ascending(a.key,b.key));
                }else
                    item[''+timespan[i]] = null;
            });
            data.push(item);
        }
        return data;
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

    const onColorModeChange = (val) =>{
        const opt = {}
        if(val==='name'){
            color = colorByName;
        }else{
            color = colorByVal;
            opt.selectedService = +val;
            // if(this.state.pieDataHighlight)
            //     opt.LineData = this.changeLineData({selectedService:+val},this.state.pieDataHighlight.data._source.map((e)=>e.key));
            // else
            //     opt.LineData = this.changeLineData({selectedService:+val});
        }
        // opt.colorBy = val;
        // this.setState(opt as NonNullable<States>)
    }
    const getMetric= useCallback((v)=>{
        const colorBy ='name';
        return colorBy!=='name'?((colorBy!=='cluster')?`${dimensions[selectedSer].text}: ${+d3.format('.2f')(dimensions[selectedSer].scale.invert(v))}`:(clusterInfo.clusterDescription?(clusterInfo.clusterDescription[v]??'mixed'):'')):''
    },[dimensions,selectedSer,clusterInfo]);
    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                    <Dataset onChange={onChangeData.bind(this)} onLoad={(m)=>setIsBusy(m)} onError={(e)=>setAlertMess(e)}/>

                    <Grid container style={{height: "100vh",width:'100wh',overflow:'hidden'}}>
                        <Container maxWidth="lg">
                            <Grid container>
                                <Grid item xs={12}>
                                    <h3>Nocona <Typography variant="subtitle1" style={{display:'inline-block'}}>from {scheme.timerange[0].toLocaleString()} to {scheme.timerange[1].toLocaleString()}</Typography></h3>
                                </Grid>
                                {/*<Grid item xs={6} container spacing={1}>*/}
                                    {/*<Grid item xs={12}>*/}
                                        {/*<FormControl fullWidth>*/}
                                            {/*<InputLabel >Filter Time</InputLabel>*/}
                                            {/*<Slider*/}
                                                {/*min={selectedTime.min}*/}
                                                {/*max={selectedTime.max}*/}
                                                {/*value={selectedTime.value}*/}
                                                {/*size={"small"}*/}
                                                {/*onChange={(e,v)=>setSelectedTime({...selectedTime,value:v,arr:scheme.time_stamp.filter(t=>((+t>=v[0]) && (+t<=v[1])))})}*/}
                                            {/*/>*/}
                                        {/*</FormControl>*/}
                                    {/*</Grid>*/}
                                    {/*/!*{dimensions[selectedSer]&&<Grid item xs={7} style={{textAlign:"center"}}>*!/*/}
                                    {/*/!*    {dimensions[selectedSer].text} Min: {dimensions[selectedSer].min} Max: {dimensions[selectedSer].max}*!/*/}
                                    {/*/!*    <div style={{position:'relative'}}><ColorLegend colorScale={colorByMetric} range={dimensions[selectedSer].range}/></div>*!/*/}
                                    {/*/!*</Grid>}*!/*/}
                                {/*</Grid>*/}
                                {/*<Grid item xs={2}>*/}
                                {/*    <Autocomplete*/}
                                {/*        fullWidth*/}
                                {/*        size="small"*/}
                                {/*        disablePortal*/}
                                {/*        options={Object.keys(scheme.users)}*/}
                                {/*        value={selectedUser}*/}
                                {/*        onChange={(event, newValue) => {*/}
                                {/*            // getSelectedDraw3Data({selectedUser:newValue});*/}
                                {/*            setSelectedUser(newValue);*/}
                                {/*        }}*/}
                                {/*        renderInput={(params) => <TextField {...params} label="Users" />}*/}
                                {/*    />*/}
                                {/*</Grid>*/}
                                <Grid item xs={2}>
                                {
                                    selectedUser&&<>
                                        #Jobs: {scheme.users[selectedUser].job.length} #Nodes: {scheme.users[selectedUser].node.length}</>

                                }</Grid>
                            </Grid>
                        </Container>
                        <div style={{height: "100vh",width:'100vw',overflow:'hidden'}}>
                            <AreaStack metricRangeMinMax={metricRangeMinMax}
                                       time_stamp={scheme.time_stamp}
                                       objects ={scheme._userarrdata}
                                       onLoad={(m)=>setIsBusy(m)}

                                       users={drawUserData}

                                       selectedSer={selectedSer}
                                       selectedSer2={selectedSer2}
                                       getKey={(d)=>d.data.key+' '+d.data.timestep}


                                       color={color}
                                       colorByName={colorByName}
                                       colorCluster={clusterInfo.colorCluster}
                                // colorBy={colorBy}
                                       colorBy={'name'}
                                       getMetric={getMetric}
                                       metrics = {scheme.tsnedata}
                                       theme={theme}
                                       dimensions={dimensions}
                                       selectedTime = {selectedTime.arr}
                                // mouseOver = {this.onMouseOverSankey.bind(this)}
                                // mouseLeave = {this.onMouseLeaveSankey.bind(this)}
                                // sankeyComputeSelected = {sankeyComputeSelected}
                                       config={config}
                                       selectedComputeMap={selectedComputeMap}
                                       setSelectedComputeMap={(d)=>setSelectedComputeMap(d)}
                                       selectedUser={selectedUser}
                                       scheme={scheme}

                            />
                        </div>
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
function adjustTime(d){
    if (d > 999999999999999999)
        return d / 1000000;
    else if (d < 9999999999){
        return d * 1000;
    }
    return d;
}