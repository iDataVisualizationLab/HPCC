// import logo from './logo.svg';
import './App.css';
import Layout3D from "./component/Layout3D"
import React, {useState, useEffect, useCallback,useMemo} from "react";
import {Grid, Backdrop, CircularProgress, createTheme,FormControl,InputLabel,Select,MenuItem,Typography} from "@mui/material";
import CssBaseline from '@mui/material/CssBaseline';
import {ThemeProvider} from '@mui/material/styles';
import * as d3 from "d3"
import _layout from "./data/layout";
import _data from "./data/2182022";
import * as _ from "lodash";
import {getRefRange} from "./component/ulti"
import ColorLegend from "./component/ColorLegend";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Slider from "@mui/material/Slider";
import Container from "@mui/material/Container";
import { useControls } from 'leva';

const ColorModeContext = React.createContext({
    toggleColorMode: () => {
    }
});

const colorByMetric = d3.scaleSequential()
    .interpolator(d3.interpolateSpectral).domain([1,0]);
function App() {
    const [scheme, setScheme] = useState({data:{},users:{}, timerange: [new Date(), new Date()]});
    const [dimensions, setDimensions] = useState([]);
    const [layout, setLayout] = useState(_layout);
    const [timeSlice, setTimeSlice] = useState([0, 100]);
    const [_draw3DData, set_Draw3DData] = useState([]);
    const [draw3DData, setDraw3DData] = useState([]);
    const [line3D, setLine3D] = useState([]);
    const [annotation, setAnnotation] = useState([]);
    const [isBusy, setIsBusy] = useState(true);
    const [mode, setMode] = React.useState('dark');
    const [selectedUser, setSelectedUser] = React.useState(null);
    const [selectedSer, setSelectedSer] = React.useState(0);
    const config = useControls("Setting",{selectedSer:{options:dimensions.reduce((a, v) => ({ ...a, [v.text]: v.index}), {}),label:"Metric",value:0,
            onChange:val=>{
                setSelectedSer(val)
                updateColor(_draw3DData,scheme,val);
                set_Draw3DData(_draw3DData);
                draw3DData.forEach(d=>d.possArr=[...d.possArr]);
                setDraw3DData(draw3DData);
            }},suddenThreshold:{value:0,min:0,max:(dimensions[selectedSer]??{max:1}).max,step:0.1, label:"Sudden Change"}
            },[dimensions,selectedUser,selectedSer,draw3DData]);
    const colorMode = React.useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
            },
        }),
        [],
    );
    const theme = React.useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                },
            }),
        [mode],
    );

    useEffect(() => {
        setIsBusy(true);
        const {scheme, draw3DData,dimensions,layout} = (handleData(_data));
        setDimensions(dimensions);
        setScheme(scheme);
        updateColor(draw3DData,scheme);
        set_Draw3DData(draw3DData);
        // getSelectedDraw3Data({selectedUser},draw3DData,scheme);
        setLayout(layout)
        setIsBusy(false);
    }, []);
    const handleData = useCallback((_data) => {
        if (_data.time_stamp[0] > 999999999999999999)
            _data.time_stamp = _data.time_stamp.map(d => new Date(d / 1000000));
        const timerange = d3.extent(_data.time_stamp);
        const compute = Object.entries(_data.nodes_info);
        const dimensionKeys = Object.keys(compute[0][1]).filter(s=>_.isNumber(compute[0][1][s][0]));
        const dimensions = dimensionKeys.map((s,i)=>({text:s,index:i,range:[Infinity,-Infinity],scale:d3.scaleLinear()}));
        const computers ={};
        compute.forEach(d=>{
            computers[d[0]]={
                job_id: [],
                key: d[0],
                user: [],
                drawData:[]
            };
            dimensionKeys.forEach((k,ki)=>{
                const comp = d[0];
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
            d.range = recomend.range;
            d.scale.domain(d.range)
        });
        const tsnedata ={};
        compute.forEach(d=>{
            // sudden
            let current = dimensionKeys.map((k,ki)=>computers[d[0]][k][0]);
            tsnedata[d[0]] = _data.time_stamp.map((t,ti)=>{
                return dimensionKeys.map((k,ki)=>{
                    return dimensions[ki].scale(computers[d[0]][k][ti]??undefined)??null;
                })
            })
        });
        const jobs = {};
        const job_ref = undefined;
        // need update core info to job_ref
        Object.keys(_data.jobs_info).forEach(job_id=>{
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
        let config={size:[0.6, 0.15, 0.1],padding:0.25, gap:0.5};
        let wA = config.size[0]+config.padding;
        let hA = config.size[1]+config.padding;
        let sumupX = 0;
        Object.keys(layout).forEach((k,ki)=>{
            const width = config.padding+wA*layout[k][0].length;
            const height = config.padding+(config.size[1]+config.padding)*layout[k].length;
            layout[k].position=[sumupX,height,0];
            sumupX += width+config.gap;
            layout[k].size=[width,height];
            layout[k].positions=[];
            layout[k].forEach((row,ri)=>{
                row.forEach((col,ci)=>{
                    if (col){
                        const item = {text:col,position:[(config.padding+ci*wA +layout[k].position[0])+config.size[0]/2,-(config.padding+ri*hA+config.size[1]/2) + layout[k].position[1],0 +layout[k].position[2]]}
                        layout[k].positions.push(item);
                        reverseLayout[col] = item;
                    }
                })
            })
        });

        // const draw3DData = compute.map(d=>{
        //     const item =  { key:d[0], value:d[1], possArr:_data.time_stamp.map((t,i)=>{
        //         const poss = [0,0,i];
        //         debugger
        //         poss.data = {full:d,timeStep:i,toolTip:<table>
        //                 <tbody>
        //                     <tr><td colSpan={2}>{t.toLocaleString()}</td></tr>
        //                     <tr><td>Name</td><td>{d[0]}</td></tr>
        //                     {dimensions.map(s=><tr key={s.text}><td>{s.text}</td><td>{d[1][s.text][i]}</td></tr>)}
        //                 </tbody>
        //             </table>};
        //         return poss;
        //     }),
        //         position: reverseLayout[d[0]].position}
        //     return item;
        // });
        const draw3DData = [{key:'all', possArr:[],position: [0,0,0]}];
        compute.forEach(d=>{
            computers[d[0]].position = reverseLayout[d[0]].position;
            computers[d[0]].drawData = _data.time_stamp.map((t,i)=>{
                    const poss = [computers[d[0]].position[0],computers[d[0]].position[1],computers[d[0]].position[2]+i];
                    poss.data = {key:d[0],timeStep:i,toolTip:<table>
                            <tbody>
                            <tr><td colSpan={2}>{t.toLocaleString()}</td></tr>
                            <tr><td>Name</td><td>{d[0]}</td></tr>
                            {dimensions.map(s=><tr key={s.text}><td>{s.text}</td><td>{d[1][s.text][i]}</td></tr>)}
                            </tbody>
                        </table>,
                    values:tsnedata[d[0]][i]};
                    draw3DData[0].possArr.push(poss);
                    return poss;
                });
        });
        return {scheme: {data: _data,users,computers,jobs,tsnedata, timerange}, draw3DData,dimensions,layout}
    }, [layout]);
    function handleCUJ({computers,jobs},timestamp){
        const compute_user= {}
        Object.keys(computers).forEach((k)=>{
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
                        // computers[comp].job_id[t].push(j.key);
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
    function getUsers(jobs,computers,timeStep=1){
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
            totalCore = totalCore/timeStep;
            totalCore_notShare = totalCore_notShare/timeStep;
            totalCore_share = totalCore_share/timeStep;
            // const node = _.uniq(_.flattenDeep(_.values(u).map(d=>d.map(d=>(job.push(d.key),totalCore+=d3.sum(Object.values(d.value.node_list_obj)),d.value.node_list)))));
            users[k]={node,job,totalCore,totalCore_notShare,totalCore_share}
        });
        return users;
    }
    // function onDimensionChange (val){
    //     updateColor(_draw3DData,scheme,val);
    //     set_Draw3DData(_draw3DData);
    //     draw3DData.forEach(d=>d.possArr=[...d.possArr]);
    //     setDraw3DData(draw3DData);
    // }

    const updateColor = useCallback((_draw3DData=draw3DData,_scheme=scheme,_selectedSer=config.selectedSer)=>{
        // _draw3DData.forEach(d=>{
        //     d.possArr.forEach((p,ti)=>{
        //         p.color = (_scheme.tsnedata[d.key][ti][_selectedSer]!==null)?colorByMetric(_scheme.tsnedata[d.key][ti][_selectedSer]):undefined
        //     })
        // });
        _draw3DData.forEach(d=>{
            d.possArr.forEach((p,ti)=>{
                p.color = (_scheme.tsnedata[p.data.key][p.data.timeStep][_selectedSer]!==null)?colorByMetric(_scheme.tsnedata[p.data.key][p.data.timeStep][_selectedSer]):undefined
            })
        });
    },[selectedSer,dimensions,scheme]);
    useEffect(()=>{
        getSelectedDraw3Data({selectedUser})
    },[_draw3DData,selectedUser,scheme,config.suddenThreshold])
    function getSelectedDraw3Data({selectedUser,selectedComputeMap},__draw3DData=_draw3DData,_scheme=scheme){
        let isFilter = (!!selectedComputeMap || selectedUser || (!!config.suddenThreshold));
        selectedComputeMap=selectedComputeMap??{};

        if (config.suddenThreshold){
            Object.keys(_scheme.computers).forEach(comp=>{
                const arr = _scheme.computers[comp][dimensions[selectedSer].text];
                const isEmpty = !selectedComputeMap[comp];
                if (isEmpty)
                    selectedComputeMap[comp] = {};
                arr.sudden.forEach((d,ti)=>{
                    if (Math.abs(d)>=config.suddenThreshold){
                        selectedComputeMap[comp][ti] = true;
                        selectedComputeMap[comp][ti-1] = true;
                    }
                });
                if (isEmpty && (!Object.keys(selectedComputeMap[comp]).length))
                    delete  selectedComputeMap[comp]
            })
        }
        if (selectedUser) {
            // _scheme.users[selectedUser].node_list
            _scheme.users[selectedUser].node.forEach(com=>{
                selectedComputeMap[com]={};
                _scheme.computers[com].users.forEach((u,i)=>{if (u.find(d=>d===selectedUser)) selectedComputeMap[com][i]=true; });
            });
        }else if (!isFilter){
            setDraw3DData(__draw3DData);
            setLine3D([])
            return
        }else if (!Object.keys(selectedComputeMap).length){
            setDraw3DData([]);
            setLine3D([])
            return
        }
        const newdata = getData();
        setDraw3DData(newdata.draw3DData);
        setLine3D(newdata.line3D)
        function getData(){
            const data = [{...__draw3DData[0],possArr:[]}];
            const lines=[];
            Object.keys(selectedComputeMap).forEach(comp=>{
                if (_scheme.computers[comp]){
                    let poss = [];
                    _scheme.computers[comp].drawData.forEach(d=>{
                        if (selectedComputeMap[comp][d.data.timeStep])
                            data[0].possArr.push(d);

                        // add line data
                        poss.push(d)
                    })
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
                <Container maxWidth="lg">
                    <Grid container>
                        <Grid item xs={12}>
                            <h3>Quanah <Typography variant="subtitle1" style={{display:'inline-block'}}>from {scheme.timerange[0].toLocaleString()} to {scheme.timerange[0].toLocaleString()}</Typography></h3>
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
                            {dimensions[selectedSer]&&<Grid item xs={7} style={{textAlign:"center"}}>
                                {dimensions[selectedSer].text} Min: {dimensions[selectedSer].min} Max: {dimensions[selectedSer].max}
                                <div style={{position:'relative'}}><ColorLegend colorScale={colorByMetric} range={dimensions[selectedSer].range}/></div>
                            </Grid>}
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
                        <Grid item xs={12} style={{height: "80vh"}}>
                            <Layout3D layout={layout} data={draw3DData} line3D={line3D} selectService={selectedSer}/>
                        </Grid>
                    </Grid>
                    <Backdrop
                        sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}
                        open={isBusy}
                    >
                        <CircularProgress color="inherit"/>
                    </Backdrop>
                </Container>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

export default App;
