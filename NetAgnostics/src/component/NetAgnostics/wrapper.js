import {startTransition, useCallback, useEffect, useMemo, useState} from "react";
import AxisTime from "./AxisTime";
import ScatterArray from "./ScatterArray";
import {scaleTime, scaleLinear, pointer,scaleThreshold, bisect} from "d3";
import {isNumber} from "lodash";
import {colorScaleList} from "../../ulti";
import BoxplotArray from "./BoxplotArray";
import "./index.css"
import StreamArray from "./StreamArray";
import TextCloud from "./TextCloud";
import {emptyArray, emptyObject} from "../ulti";

const _margin = {
    top: 40,
    right: 20,
    bottom: 0,
    left: 80
};

const NUMTEXTCLOUD = 6;
const FONTSIZE = 12;
export default function ({
                             timeRange = emptyArray,
                             width = 1200,
                             height = 600,
                             margin = _margin,
                             node=emptyObject,
                             dimensions=emptyArray,
                             serviceSelected=0,
                             time=emptyArray,
                             colorNet
                         }) {
    const layout = useMemo(() => ({margin, width, height}), [margin, width, height]);
    const [islensing,setIslensing] = useState(true);
    const [lensingTarget,setLensingTarget] = useState();
    const [streamOrderIndex,setStreamOrderIndex] = useState();
    const [lensingConfig,setLensingConfig] = useState({expandRate:3,zoomScale:80});

    const _xScaleLinear = useMemo(() => {
        let width = layout.width - layout.margin.left - layout.margin.right;
        return scaleTime().domain(timeRange).range([0,width])
    },[timeRange,layout.width])

    const _xScale = useMemo(() => {
        let width = layout.width - layout.margin.left - layout.margin.right;
        if (islensing&&(lensingTarget!==undefined)){
            const or = scaleTime().domain(timeRange);
            const orRang = scaleLinear().range([0,width]);
            const _target = or(lensingTarget.time);
            const ratio = lensingConfig.zoomScale / (orRang(or(time[1]))-orRang(or(time[0])));
            const lensRang = scaleLinear().range([0,width*ratio]);
            const dx = orRang(_target) - lensRang(_target);
            const lensingRange= [or(time[Math.max(0,lensingTarget.index-lensingConfig.expandRate)]),or(time[Math.min(time.length-1,lensingTarget.index+lensingConfig.expandRate)])];

            const domain = [];
            const range = [];
            // if (lensingRange[0]>0){
                domain.push(timeRange[0]);
                range.push(orRang(0));
            // }
            const upper = Math.max(lensRang(lensingRange[0])+dx,0); //lensRang(lensingRange[0])+dx
            domain.push(or.invert(lensingRange[0]));
            range.push(upper);


            const downer = Math.min(lensRang(lensingRange[1])+dx,width); //lensRang(lensingRange[1])+dx
            domain.push(or.invert(lensingRange[1]));
            range.push(downer);
            // if (lensingRange[1]<1){
                domain.push(timeRange[1]);
                range.push(orRang(1));
            // }
            return scaleTime().domain(domain).range(range);
        }else
            return scaleTime().domain(timeRange).range([0, width])
    }, [timeRange,time, layout.width, layout.margin,lensingConfig,lensingTarget,islensing]);
    const [currentMetric,setCurrentMetric] = useState([]);
    const [currentNet,setCurrentNet] = useState([]);
    const [textCloud,setTextCloud] = useState([]);
    const [boxplotNodes,setBoxplotNodes] = useState([]);
    const [streamData,setStreamData] = useState([]);

    const boxplot = () => {
        const newMap = {};
        let currentNet = time.map((t) => ({timestep: t, value: 0, hasValue:false}));
        let boxplotNodes = time.map((t) => ({
            timestep: t, sumAbove: 0, sumBelow: 0,
            countAbove: 0, countBelow: 0, maxAbove: 0, maxBelow: 0, nodes: [], hasValue:false
        }));

        if (dimensions[serviceSelected] && time.length) {
            const key = dimensions[serviceSelected].text;
            Object.keys(node).forEach(comp => {
                if (node[comp][key]) {
                    newMap[comp] = node[comp][key].map((d, i) => {
                        const sudden = node[comp][key].sudden[i];
                        if (!isNumber(d))
                            return {timestep: time[i], value: undefined}
                        if (!currentNet[i])
                            debugger
                        currentNet[i].hasValue = true;
                        if (Math.abs(sudden) > Math.abs(currentNet[i].value))
                            currentNet[i].value = sudden;

                        boxplotNodes[i].hasValue = true;
                        if (sudden > 0) {
                            boxplotNodes[i].sumAbove += sudden;
                            boxplotNodes[i].countAbove++;
                        }
                        if (sudden < 0) {
                            boxplotNodes[i].sumBelow += sudden;
                            boxplotNodes[i].countBelow++;
                        }
                        boxplotNodes[i].nodes.push(sudden);

                        return {timestep: time[i], value: d};
                    })
                }
            });
            boxplotNodes.forEach((obj) => {
                obj.nodes.sort((a, b) => b - a);
                if (obj.countAbove > 0)
                    obj.averageAbove = obj.sumAbove / obj.countAbove;
                else
                    obj.averageAbove = 0;
                if (obj.countBelow > 0)
                    obj.averageBelow = obj.sumBelow / obj.countBelow;
                else
                    obj.averageBelow = 0;
                obj.maxAbove = obj.nodes[0];
                obj.maxBelow = obj.nodes[obj.nodes.length - 1];
            })
        }
        currentNet.forEach((d,i)=>{
            if (!d.hasValue)
                currentNet[i].value = undefined;
        })

        return {newMap, currentNet, boxplotNodes};
    }

    const streamFunc = ()=>{
        const newMap = {};
        if (dimensions[serviceSelected]) {
            const key = dimensions[serviceSelected].text;
            Object.keys(node).forEach(comp => {
                if (node[comp][key]) {
                    newMap[comp] = node[comp][key].map((d, i) => {
                        const sudden = node[comp][key].sudden[i];
                        if (!isNumber(d))
                            return {timestep: time[i], value: undefined,sudden}
                        else
                            return {timestep: time[i], value: d,sudden}
                    })
                }
            })
        }
        return (Object.entries(newMap));
    }
    // stream
    useEffect(()=>{
        startTransition(()=>{
            const {newMap, currentNet, boxplotNodes} = boxplot();
            const streamData = streamFunc()
            const textCloud = textCloudFunc();
            setCurrentMetric(newMap);
            setCurrentNet(currentNet);
            setBoxplotNodes(boxplotNodes);
            setStreamData(streamData)
            setTextCloud(textCloud);
        })
    },[node,dimensions,serviceSelected,time])

    // textCLoud
    const textCloudFunc = ()=>{
        const textCloud = time.map((t) => ({timestep: t, value: []}));
        if (dimensions[serviceSelected] && time.length) {
            const key = dimensions[serviceSelected].text;
            Object.keys(node).forEach(comp => {
                if (node[comp][key]) {
                    node[comp][key].forEach((d, i) => {
                        const sudden = node[comp][key].sudden[i];
                        textCloud[i].value.push({key: comp, value: sudden,abs:Math.abs(sudden??0)})
                    })
                }
            })
            textCloud.forEach(d=>{
                d.value.sort((a,b)=>-a.abs +b.abs);
                d.value = d.value.slice(0,NUMTEXTCLOUD)
            })
        }
        return textCloud;
    }


    const onMouseMove = useCallback((event)=> {
        if (islensing) {
            const _lensTime = _xScaleLinear.invert(pointer(event)[0]);
            const index = bisect(time,_lensTime);
            setLensingTarget({time:_lensTime,index});
            setStreamOrderIndex(index)
        }
    },[_xScaleLinear,islensing,time])

    const onMouseLeave = useCallback(()=> {
        if (islensing)
            setLensingTarget(undefined)
    },[islensing])

    const orderStream = useCallback(()=>{
        return (streamOrderIndex!==undefined)?((a,b)=> {
            return Math.abs(b[1][streamOrderIndex]?.sudden??0) - Math.abs(a[1][streamOrderIndex]?.sudden??0)
        }):undefined
    },[streamOrderIndex])
    return <div className={"w-full h-full overflow-hidden"}>
        <button className={"fixed top-5 right-2 p-1 rounded bg-slate-300 shadow"} onClick={()=>setLensingTarget()}>Clear lensing</button>
        <div className={"relative w-full h-full pointer-events-auto"}>
            <AxisTime width={layout.width} height={layout.margin.top}
                      minorTicks={100}
                      majorTicks={20}
                      scale={_xScale} margin={layout.margin}
                      majorGrid={()=><line y1={layout.height} stroke={'currentColor'}
                                      strokeDasharray={'4 2'} strokeWidth={0.5}
                      />}
                      minorGrid={()=><line y1={layout.height} stroke={'currentColor'}
                                           strokeDasharray={'2 2'} strokeWidth={0.2}
                      />}
                      minorTicksEnable={(t)=> {
                          if (lensingTarget) {
                              return scaleThreshold().domain(_xScale.range()).range([0,0,1,0,0])(_xScale(t))
                          }
                          return 0;
                      }}
                      onMouseMove={onMouseMove}
                      lensingTarget={lensingTarget?.time}
                      // onMouseLeave={onMouseLeave}
            />
            <svg width={layout.width} height={layout.height-layout.margin.top} className={"w-full overflow-visible"}>
                <g transform={`translate(${layout.margin.left},0)`}>
                    <g transform={`translate(0,${40})`}>
                        <ScatterArray scale={_xScale}
                                      data={currentNet}
                                      colorScale={colorNet}
                                      triggerScale={lensingTarget}
                                      markedIndex={lensingTarget?.index}
                                      onClick={(t)=> {
                                          setLensingTarget({index:t,time:time[t]})
                                          setStreamOrderIndex(t)
                                      }}
                        />
                    </g>
                    <g transform={`translate(0,${30+FONTSIZE*NUMTEXTCLOUD})`}>
                        {lensingTarget&&<TextCloud scale={_xScale}
                                    data={textCloud}
                                    height={FONTSIZE*NUMTEXTCLOUD}
                                    numeLine={NUMTEXTCLOUD}
                                   fontSize={FONTSIZE}
                        />}
                    </g>
                    <g transform={`translate(0,${30+FONTSIZE*NUMTEXTCLOUD+120})`}>
                        <BoxplotArray scaleX={_xScale}
                                      data={boxplotNodes}
                                      height={80}
                                      boxW={2}
                        />
                    </g>
                    <g transform={`translate(0,${30+FONTSIZE*NUMTEXTCLOUD+200})`}>
                        <StreamArray scaleX={_xScale}
                                      data={streamData}
                                      yDomain={dimensions[serviceSelected]?.scale?.domain()}
                                      height={20}
                                     order={orderStream()}
                        />
                    </g>
                </g>
            </svg>
        </div>
    </div>
}
