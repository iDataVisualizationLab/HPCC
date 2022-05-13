import {Canvas} from "@react-three/fiber";
import {
    OrbitControls,
    GizmoHelper,
    GizmoViewcube,
    Center,
    OrthographicCamera,
    BakeShadows,
    Html, View, Environment
} from "@react-three/drei";
import React, {Suspense, useCallback, useEffect, useRef, useState} from "react";
import NodeLayout from "./NodeLayout";
import UserLayout from "./UserLayout";
import LineLayout from "./LineLayout";
import LayoutMap from "./LayoutMap";
import {useControls, button} from "leva";
import Effects from "./Effects";
import {Vector3} from "three";
import TimeAxis from "./TimeAxis";
import TWEEN from '@tweenjs/tween.js';
import CustomCamera from "./CustomCamera";
import Sankey, {horizontalSource, horizontalTarget} from "./Sankey";
import * as d3 from "d3";
import * as _ from "lodash";
import ValueAxis from "./ValueAxis";
import {Grid,Stack,Button} from "@mui/material";
import {PCAchart} from "./PCAchart";
import {viz} from "./leva/Viz";


const SEQUNCE = [{x: -90, y: -50, z: 200, zoom: 30}];//[{x:-40,y:10,z:100,zoom:30}];//[{x:-20,y:20,z:100,zoom:30}];

const width = 1200;
const height = 700;
const Layout3D = function ({time_stamp, sankeyData, maxPerUnit = 1, color, config, selectedTime, selectedComputeMap, setSelectedComputeMap, selectedUser, dimensions, selectedSer,selectedSer2, scheme, colorByName, colorCluster, colorBy, getMetric, metrics, theme, line3D, layout, users, selectService, getKey}) {
    const [currentSequnce, setCurrentSequnce] = useState(0);
    const pcaRef = useRef();


    const config3D = useControls("3D", {
        timeGap: {value: 5, min: 1, max: 10, step: 0.1, label: 'Bar height'},
        light: {value: 0.5, min: 0, max: 1, step: 0.01},
        resetView: button((get) => {

            cameraRef.current.pointOfView({x: -90, y: 50, z: 200, rx:0, ry:0, rz:0, zoom: 30}, 4000);
        }),
        viewcontrol:viz({value:0,
            label:'',
            com:<Grid container xs={12} spacing={1} alignItems={'center'} className={"noCap"}>
                <Grid item xs={4}><Button variant="contained" size={'small'} fullWidth onClick={()=>cameraRef.current.pointOfView({x: -200, y: 1e-14, z: 1e-14, rx:0, ry:-Math.PI/2, rz:0}, 2000)}>Left</Button></Grid>
                <Grid item xs={4}><Stack spacing={1}>
                    <Button variant="contained" size={'small'} fullWidth onClick={()=>cameraRef.current.pointOfView({x: 1e-14, y: 200, z: 1e-14, rx:-Math.PI/2, ry:0, rz:0}, 2000)}>Top</Button>
                    <Button variant="contained" size={'small'} fullWidth onClick={()=>cameraRef.current.pointOfView({x: 1e-14, y: 0, z: 200}, 2000)}>Front</Button>
                    <Button variant="contained" size={'small'} fullWidth onClick={()=>cameraRef.current.pointOfView({x: 1e-14, y: -200, z: 1e-14, rx:Math.PI/2, ry:0, rz:0}, 2000)}>Bottom</Button>
                </Stack></Grid>
                <Grid item xs={4}><Button variant="contained" size={'small'} fullWidth onClick={()=>cameraRef.current.pointOfView({x: 200, y: 0, z: 0, rx:0, ry:Math.PI/2, rz:0}, 2000)}>Right</Button></Grid>
            </Grid>}),
        // cameraAnimate: {value: false}
    });
    const cameraRef = useRef(null);
    const camera2Ref = useRef(null);
    const sankeyhtml = useRef();
    const ref = useRef(null);
    const view1 = useRef(null);
    const view2 = useRef(null);
    const [_draw3DData, set_Draw3DData] = useState([]);
    const [draw3DData, setDraw3DData] = useState([]);
    const [_userHighlight, set_UserHighlight] = useState(undefined);
    const [userHighlight, setUserHighlight] = useState(undefined);
    if (sankeyhtml.current)
        sankeyhtml.current.parentElement.style.pointerEvents = 'none';

    const pcaSelect = useControls("PCA",{PCAchart:viz({value:0,
            label:'',
            com:<div><PCAchart ref={pcaRef} dimensions={dimensions} selectedSer={selectedSer} setSelectedComputeMap={setSelectedComputeMap}/></div>}),
        Apply:button((get)=>{
            console.log('clicked apply')
            pcaRef.current.calculatePCA(_draw3DData)
        })},[_draw3DData,dimensions,selectedSer])
    useEffect(() => {
        if (config3D.cameraAnimate)
            if (cameraRef.current) {
                setCurrentSequnce(0)
                cameraRef.current.pointOfView(SEQUNCE[0], 4000);
            }
    }, [config3D.cameraAnimate])
    useEffect(() => {
        if (cameraRef.current) {
            if (currentSequnce < SEQUNCE.length) {
                const interval = setTimeout(() => {
                    cameraRef.current.pointOfView(SEQUNCE[currentSequnce], 4000)
                    setCurrentSequnce(currentSequnce + 1);
                }, 4000);
                return () => {
                    clearInterval(interval);
                };
            }
        }
    }, [currentSequnce])

    function stopPlay() {
        setCurrentSequnce(SEQUNCE.length)
    }

    function onHandleSankeyResult(result, getColorScale) {
        const data = [];
        const lineaScale = 0;
        const max = maxPerUnit;
        result.forEach(l => {
            l.values.forEach(d => {
                const source = horizontalSource(d);
                const target = horizontalTarget(d);
                const thick = d.width;
                const width = (target[0] - source[0]) / 2;
                const v = Object.keys(d.byComp).length;
                const scale = d3.scaleLinear().domain([0, v]).range([0, thick + lineaScale]);
                let offest = -thick / 2;
                const _byComp_s = {};
                const _compS = {};
                // if (d.byComp['cpu-23-19'])
                //     debugger
                Object.keys(d.byComp_t).forEach(e => {
                    [e].forEach((comp) => {
                        if (d.source.comp[comp]) {
                            _compS[comp] = Math.min(max, d.byComp_t[comp])
                            _byComp_s[comp] = (_byComp_s[comp] ?? 0) + _compS[comp];
                        }
                    });
                });
                Object.keys(d.byComp).forEach(e => {
                    const compT = {};
                    const compS = _compS;
                    let oldpos = Infinity;
                    // if (d.sources[e].data[d.source.layer - 1]) {
                    //     oldpos = d3.mean(d.sources[e].data[d.source.layer - 1], (d) => d.y) ?? Infinity;
                    // }
                    // const isEnd = d.source.layer === d.sources[e].data.finish_Index;
                    const value = 1;
                    const _thick = scale(value) ?? 0;
                    // d.sources[e].display = {compS, compT, isEnd, _thick, oldpos, data: d.sources[e].data}
                    // if (!d.sources[e].data[d.source.layer])
                    //     d.sources[e].data[d.source.layer] = [d.sources[e].display]


                    offest += _thick;
                    const y = target[1] + offest - _thick / 2;
                    const comp = {};
                    comp[e] = true;
                    // Object.keys(compS).forEach(c => comp[c] = d.sources[e].data.node_list_obj[c]);
                    const _Data = {...d.source, comp};
                    const colorS = getColorScale(l.draw[0] ?? {})//getColorScale(_Data);
                    // const thick = _thick / 2;

                    const poss = [(source[0] + width / 2) / 40, -(y + _thick / 2) / 40, 0];
                    poss.offset = [0, 0, 0];
                    poss.color = colorS;
                    poss.size = [2 * width / 40, _thick / 40, 1]
                    poss.data = {
                        key: e, timestep: d.source.layer, toolTip: <table>
                            <tbody>
                            <tr>
                                <td colSpan={2}>{time_stamp[d.source.layer].toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td>Name</td>
                                <td>{e}</td>
                            </tr>
                            {dimensions.map(s => <tr key={s.text}>
                                <td>{s.text}</td>
                                <td>{scheme.computers[e][s.text][d.source.layer]}</td>
                            </tr>)}
                            {scheme.computers[e].job_id[d.source.layer] ? <>
                                    <tr>
                                        <td>#Jobs</td>
                                        <td>{scheme.computers[e].job_id[d.source.layer].length}</td>
                                    </tr>
                                    <tr>
                                        <td>Job Id</td>
                                        <td>{scheme.computers[e].job_id[d.source.layer].join(', ')}</td>
                                    </tr>
                                    <tr>
                                        <td>Users</td>
                                        <td>{scheme.computers[e].users[d.source.layer].join(', ')}</td>
                                    </tr>
                                </> :
                                <tr>
                                    <td colSpan={2}>No job</td>
                                </tr>}
                            </tbody>
                        </table>,
                        values: metrics[e][d.source.layer], user: l.key
                    };
                    data.push(poss)

                });


                //each timestep

            })
        });
        set_Draw3DData(data)
    }

    useEffect(() => {

        getSelectedDraw3Data({selectedUser, selectedComputeMap}, _draw3DData, scheme)
    }, [_draw3DData, selectedComputeMap, selectedUser, scheme, config.suddenThreshold, config.metricFilter, config.filterLarger])

    function getSelectedDraw3Data({selectedUser, selectedComputeMap}, __draw3DData = _draw3DData, _scheme = scheme) {
        let isFilter = true//(!!selectedComputeMap || selectedUser || (!!config.suddenThreshold));
        // selectedComputeMap=selectedComputeMap??{};
        debugger
        let flatmap = selectedComputeMap ? ob2arr(selectedComputeMap) : undefined;

        function ob2arr(selectedComputeMap) {
            let flatmap = [];
            Object.keys(selectedComputeMap).forEach(comp => Object.keys(selectedComputeMap[comp]).forEach(timestep => flatmap.push({
                key: `${comp}|${timestep}`,
                comp,
                timestep
            })));
            console.log(flatmap)
            return flatmap;
        }

        if (_scheme.computers && dimensions[selectedSer]) {
            const conditionFunc = config.filterLarger?((d)=>(d >= config.metricFilter)):((d)=>(d <= config.metricFilter))
            let compMap = {};
            Object.keys(_scheme.computers).forEach(comp => {
                const arr = _scheme.computers[comp][dimensions[selectedSer].text];
                const isEmpty = !compMap[comp];
                if (isEmpty)
                    compMap[comp] = {};
                arr.forEach((d, ti) => {
                    if (conditionFunc(d)) {
                        compMap[comp][ti] = true;
                    }
                });
                if (isEmpty && (!Object.keys(compMap[comp]).length))
                    delete  compMap[comp]
            });
            let valueMap = ob2arr(compMap);
            if (flatmap)
                flatmap = _.intersectionBy(flatmap, valueMap, 'key');
            else
                flatmap = valueMap;

            if (config.suddenThreshold) {
                let sudenCompMap = {}
                Object.keys(_scheme.computers).forEach(comp => {
                    const arr = _scheme.computers[comp][dimensions[selectedSer].text];
                    const isEmpty = !sudenCompMap[comp];
                    if (isEmpty)
                        sudenCompMap[comp] = {};
                    arr.sudden.forEach((d, ti) => {
                        if (Math.abs(d) >= config.suddenThreshold) {
                            sudenCompMap[comp][ti] = true;
                            sudenCompMap[comp][ti - 1] = true;
                        }
                    });
                    if (isEmpty && (!Object.keys(sudenCompMap[comp]).length))
                        delete  sudenCompMap[comp]
                });
                let suddenMap = ob2arr(sudenCompMap);
                if (flatmap)
                    flatmap = _.intersectionBy(flatmap, suddenMap, 'key');
                else
                    flatmap = suddenMap;
            }

            if (selectedUser) {
                let selectedUsereMap = {}
                _scheme.users[selectedUser].node.forEach(com => {
                    if (_scheme.computers[com]) {
                        selectedUsereMap[com] = {};
                        _scheme.computers[com].users.forEach((u, i) => {
                            if (u.find(d => d === selectedUser)) selectedUsereMap[com][i] = true;
                        });
                    }
                });
                let usereMap = ob2arr(selectedUsereMap);
                if (flatmap)
                    flatmap = _.intersectionBy(flatmap, usereMap, 'key');
                else
                    flatmap = usereMap;
            } else if (!isFilter) {
                setDraw3DData(__draw3DData);
                if (userHighlight !== undefined) {
                    set_UserHighlight();
                    setUserHighlight();
                }
                return
            } else if (!flatmap || (flatmap.length === 0)) {
                setDraw3DData([]);
                if ((!userHighlight) || Object.keys(userHighlight).length) {
                    set_UserHighlight({});
                    setUserHighlight({});
                }
                return
            }
            selectedComputeMap = {};
            flatmap.forEach(({comp, timestep}) => {
                if (!selectedComputeMap[comp])
                    selectedComputeMap[comp] = {};
                selectedComputeMap[comp][timestep] = true;
            })
            const newdata = getData();
            setDraw3DData(newdata.draw3DData);
            set_UserHighlight(newdata.users);
            setUserHighlight(newdata.users);
        }
        function getData() {
            const users = {};
            const data = __draw3DData.filter(d => {
                if (selectedComputeMap[d.data.key] && selectedComputeMap[d.data.key][d.data.timestep]) {
                    users[d.data.user] = true;
                    return true;
                }
                return false;
            });
            return {draw3DData: data, users};
        }
    }


    return <div className={"containerThree"}>
        <div ref={view1} style={{position:'relative',width:(selectedSer2!==undefined)?'50%':'100%', pointerEvents:'all'}}>
            <div className="canvas">
                <Canvas>
                    {/*<ambientLight intensity={config.light}/>*/}
                    {/*<pointLight position={[150, 150, 150]} intensity={0.55} />*/}
                    {/*<fog attach="fog" args={["red", 5, 35]} />*/}
                    {/*<ambientLight intensity={1.5} />*/}
                    <directionalLight position={[-10, -10, -5]} intensity={0.5}/>
                    <directionalLight
                        castShadow
                        intensity={config3D.light}
                        position={[50, 50, 25]}
                        shadow-mapSize={[256, 256]}
                        shadow-camera-left={-10}
                        shadow-camera-right={10}
                        shadow-camera-top={10}
                        shadow-camera-bottom={-10}
                    />
                    <OrthographicCamera makeDefault zoom={30} position={[-10, 10, 100]}/>
                    {/*<Suspense fallback={null}>*/}

                        {/*<LayoutMap data={layout}/>*/}
                        {/*/!*{data.map((d,i)=><group key={i} position={[...d.position]}>*!/*/}

                        <group position={[-(width / 100 + .4), (height / 100 + 1.4), 0]}>
                            <NodeLayout data={draw3DData}
                                        timeGap={config3D.timeGap}
                                        getKey={getKey}
                                        selectService={selectedSer}
                                        // adjustscale={adjustscale()}
                                        adjustscale={d=>d}
                                        onUserhighlight={(d,comp) => {setUserHighlight(d); pcaRef.current.setIntanceHihghlight(comp)}}
                                        onReleaseUserhighlight={() => {setUserHighlight(_userHighlight); pcaRef.current.setIntanceHihghlight()}}
                            />
                            <ValueAxis
                                range={(dimensions[selectedSer] ? dimensions[selectedSer].range : [])}
                                timeGap={config3D.timeGap}/>
                        </group>
                        {/*{(!stackOption)&&<><LineLayout data={line3D} timeGap={config3D.timeGap} selectService={selectService}/>*/}
                        {/*<TimeAxis data={time_stamp} timeGap={config3D.timeGap}/></>}*/}
                        {/*<UserLayout data={users}/>*/}
                        <Html transform distanceFactor={10} ref={sankeyhtml} zIndexRange={[1, 0]}
                              portal={view1}
                              style={{pointerEvents: 'none'}}>
                        <Sankey
                            width={width} height={height}
                            data={sankeyData}
                            lineaScale={0}
                            timespan={selectedTime}
                            mode={'compute_num'}
                            maxPerUnit={maxPerUnit}
                            color={color}
                            colorByName={colorByName}
                            colorCluster={colorCluster}
                            // colorBy={colorBy}
                            colorBy={'name'}
                            getMetric={getMetric}
                            metrics={metrics}
                            theme={theme}
                            // mouseOver = {this.onMouseOverSankey.bind(this)}
                            // mouseLeave = {this.onMouseLeaveSankey.bind(this)}
                            // sankeyComputeSelected = {sankeyComputeSelected}
                            sankeyResult={onHandleSankeyResult}
                            userHighlight={userHighlight}
                        />
                        </Html>
                    {/*<group position={[0, -(height / 100/2), 0]}>*/}
                        {/*<gridHelper args={[1000, 200, '#151515', '#020202']} position={[0, -4, 0]} />*/}
                        {/*<mesh scale={200} rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]} receiveShadow>*/}
                            {/*<planeGeometry />*/}
                            {/*<shadowMaterial transparent opacity={0.3} />*/}
                        {/*</mesh>*/}
                    {/*</group>*/}
                    <GizmoHelper alignment={"bottom-left"} margin={[80, 80]} renderPriority={0}>
                        <GizmoViewcube/>
                    </GizmoHelper>
                    {/*<BakeShadows />*/}
                    {/*</Suspense>*/}
                    <Environment preset={"dawn"}/>
                    <CustomCamera ref={cameraRef}/>
                </Canvas>
            </div>
        </div>
        {(selectedSer2!==undefined)&&<div ref={view2} style={{position:'relative',width:'50%', pointerEvents:'all'}}>
            <div className="canvas">
                <Canvas>
                    <directionalLight position={[-10, -10, -5]} intensity={0.5}/>
                    <directionalLight
                        castShadow
                        intensity={config3D.light}
                        position={[50, 50, 25]}
                        shadow-mapSize={[256, 256]}
                        shadow-camera-left={-10}
                        shadow-camera-right={10}
                        shadow-camera-top={10}
                        shadow-camera-bottom={-10}
                    />
                    <OrthographicCamera makeDefault zoom={30} position={[-10, 10, 100]}/>
                    {/*<Suspense fallback={null}>*/}
                        {/*<LayoutMap data={layout}/>*/}

                        <group position={[-(width / 100 + .4), (height / 100 + 1.4), 0]}>
                            <NodeLayout data={draw3DData}
                                        timeGap={config3D.timeGap}
                                        getKey={getKey}
                                        selectService={selectedSer2}
                                        adjustscale={d=>d}
                                        onUserhighlight={(d) => setUserHighlight(d)}
                                        onReleaseUserhighlight={() => setUserHighlight(_userHighlight)}
                            />
                            <ValueAxis
                                range={(dimensions[selectedSer2] ? dimensions[selectedSer2].range : [])}
                                timeGap={config3D.timeGap}/>
                        </group>
                        {/*{(!stackOption)&&<><LineLayout data={line3D} timeGap={config3D.timeGap} selectService={selectService}/>*/}
                        {/*<TimeAxis data={time_stamp} timeGap={config3D.timeGap}/></>}*/}
                        {/*<UserLayout data={users}/>*/}


                    {/*<group position={[0, -(height / 100/2), 0]}>*/}
                        {/*<gridHelper args={[1000, 200, '#151515', '#020202']} position={[0, -4, 0]} />*/}
                        {/*<mesh scale={200} rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]} receiveShadow>*/}
                            {/*<planeGeometry />*/}
                            {/*<shadowMaterial transparent opacity={0.3} />*/}
                        {/*</mesh>*/}
                    {/*</group>*/}
                    {/*<GizmoHelper alignment={"bottom-left"} margin={[80, 80]} renderPriority={2}>*/}
                    {/*<GizmoViewcube/>*/}
                    {/*</GizmoHelper>*/}
                    {/*<BakeShadows />*/}
                    {/*</Suspense>*/}
                    <Environment preset={"dawn"}/>
                    <CustomCamera makeDefault  ref={camera2Ref}/>
                </Canvas>
            </div>
        </div>}
    </div>
}
export default Layout3D;
