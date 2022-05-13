import React, {Suspense, useCallback, useEffect, useRef, useState} from "react";
import {useControls, button} from "leva";
import * as d3 from "d3";
import * as _ from "lodash";
import {Grid,Stack,Button} from "@mui/material";
import {multiFormat} from "./ulti";
import "./AreaStack.css"
import Paper from "@mui/material/Paper/Paper";


var outerWidth = 60,
    outerHeight = 110,
    margin = {
        top: 0,
        right: 1,
        bottom: 0,
        left: 0
    },
    width = outerWidth - margin.left - margin.right,
    height = outerHeight - margin.top - margin.bottom,
    marginGroup = {
        top: 0,
        right: 10,
        bottom: 0,
        left: 10
    };
var x = d3.scaleLinear()
    .rangeRound([0, width]);

var y = d3.scaleLinear()
    .rangeRound([height, 0]);

var stack = d3.stack()
    .offset(d3.stackOffsetNone);
var area = d3.area()
    .curve(d3.curveStepAfter)
    .x(function(d) {
        return x(d.data.timeIndex);
    })
    .y0(function(d) {
        return y(d[0]);
    })
    .y1(function(d) {
        return y(d[1]);
    });
const steps = d3.scaleQuantize()
    .domain([0,0.2,0.4,0.6,0.8,1])
    .range(["#119955", "#7abb6d", "#c0dc8f", "#ffffbb", "#f1c76e", "#e98736", "#dd3322"]);
const timeoptions = {'Day':{unit:'Day',step:1},'Hour':{unit:'Hour',step:1},'30 Minute':{unit:'Minute',step:30}};
const AreaStack = function ({time_stamp, metricRangeMinMax, color, config, selectedTime,metrics, selectedComputeMap, setSelectedComputeMap, selectedUser, dimensions, selectedSer,selectedSer2, scheme, colorByName, colorCluster, colorBy, getMetric, objects, theme, line3D, layout, users, selectService, getKey}) {
    const [data,setData] = useState([]);
    const [hover,setHover] = useState();
    const [configStack] = useControls('Stack',()=>({'SeperatedBy':{value:timeoptions['Hour'],options:timeoptions}}));

    useEffect(()=>{
        if (objects){
            const formatGroup = d3[`time${configStack.SeperatedBy.unit}`].every(configStack.SeperatedBy.step);
            const mapTime = time_stamp.map((t,i)=>[t,i]);
            const timeIndex = d3.groups(mapTime,d=>formatGroup(d[0]));
            const maxLength = d3.max(timeIndex,t=>t[1].length);
            x.domain([0,maxLength-1]);

            // # compute

            // percentage
            // y.domain([0,1])

            stack.keys(['black',...steps.range()]);
            const _data = Object.keys(objects).map(k=>{
                const v = objects[k];
                const item = {key:k,max:0};
                item.values = timeIndex.map((t)=>{
                    const group = {key:t[0],max:0};
                    const offset = maxLength - t[1].length
                    group.values = t[1].map(([t,ti],index)=>{
                        const obj ={time:t,timeIndex:index+offset,'black':0,max:0};
                        steps.range().forEach(c=>{
                            obj[c]=0;
                        });
                        // # compute
                        if (v[ti]) {
                            const comp = d3.groups(v[ti],d=>d.key);
                            if (obj.max<comp.length)
                                obj.max = comp.length;
                            if (group.max<comp.length)
                                group.max = comp.length;
                            comp.forEach(d => {
                                if (d[1][0][selectedSer] == null)
                                    obj['black']++;
                                else
                                    obj[steps(d[1][0][selectedSer])]++
                            });
                        }
                        // percentage

                        return obj;
                    });
                    group.stack = stack(group.values)
                    if (item.max<group.max)
                        item.max = group.max;
                    return group;
                })
                return item
            })

            _data.sort((a,b)=>b.max-a.max);
            if (_data[0])
            y.domain([0,_data[0].max])
            setData(_data);
        }else {
            setData([]);
        }
    },[objects,configStack.SeperatedBy,time_stamp,selectedSer,metricRangeMinMax]);
    const onMouseOverlay = (event,key,timeIndex,d)=>{
        const mouse = d3.pointer(event,event.currentTarget);
        const current = d.values[Math.round(x.invert(mouse[0]))];
        if (current){
            const position =[x(current.timeIndex),y(current.max)];
        console.log(current)
            setHover({key,timeIndex,position,value:current.max,data:current})
        }else{
            setHover()
        }
    }
    return <div style={{width:'100vw',height:'100%',overflow:'hidden'}}>
        <div style={{position:'relative',width:(selectedSer2!==undefined)?'50%':'100%',height:'100%', pointerEvents:'all'}}>
            {data[0]&&<div style={{width:'100%',height:'100%'}} id="g-chart" spacing={2}>
                {dimensions[selectedSer]&&<div style={{width:'100%'}}>
                    <span>Legend</span>
                    <div>
                        <span>{Math.round(dimensions[selectedSer].scale.invert(0))}</span>
                    </div>
                </div>}
                <div style={{width:'100%',height:'100%', overflow:'auto'}}>
                    <svg width={(outerWidth+marginGroup.left+marginGroup.right)*data[0].values.length} height={(outerHeight+marginGroup.top+marginGroup.bottom)*data.length} style={{overflow:'visible'}}>
                        <g transform={`translate(${marginGroup.left},${marginGroup.top})`}>
                            {data.map(({key,values,max},i)=><g key={key} item xs={12}>
                                <g transform={`translate(0,${i*(outerHeight+marginGroup.top+marginGroup.bottom)})`}>

                                    {values.map((d,ti)=><g key={ti} transform={`translate(${(outerWidth*ti)},0)`} >
                                        <g transform={`translate(${margin.left},${margin.top})`}>
                                            {d.stack.map(p=><path key={p.key} d={area(p)} fill={p.key}/>)}
                                            <rect width={width} height={height} className={'overlay'}
                                                  onMouseMove={event=>onMouseOverlay(event,key,ti,d)}/>
                                            {(hover&&(hover.key===key))&&<line x2={width} y1={hover.position[1]} y2={hover.position[1]} stroke={'black'} strokeDasharray={'2 1'}/>}
                                            {(hover&&(hover.key===key)&&(hover.timeIndex===ti))?<><g transform={`translate(${hover.position[0]},0)`}>
                                                <line y2={hover.position[1]} y1={y(0)} stroke={'black'} strokeDasharray={'2 1'}/>
                                                <text y={hover.position[1]} dy="-.1em" textAnchor={'middle'} className={'tooltip'}>#Computes: {hover.value}</text>
                                            </g>
                                                <text y={height+4} dy=".65em" className={'year decade'}>{multiFormat(hover.data.time)}</text>
                                            </>: <text y={height+4} dy=".65em" className={'year decade'}>{multiFormat(d.key)}</text>}
                                        </g>
                                    </g>)}
                                    <text className={'title'} dy={'4em'}>User: {key} , Max #computes: {max}</text>
                                </g>
                            </g>)}
                        </g>
                    </svg>
                </div>
            </div>}
        </div>
    </div>
}
export default AreaStack;
