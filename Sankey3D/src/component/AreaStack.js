import React, {Suspense, useCallback, useEffect, useRef, useState} from "react";
import {useControls, button} from "leva";
import * as d3 from "d3";
import * as _ from "lodash";
import {Grid,Stack,Button} from "@mui/material";
import {multiFormat} from "./ulti";
import "./AreaStack.css"


var outerWidth = 95,
    outerHeight = 85,
    margin = {
        top: 12,
        right: 1,
        bottom: 33,
        left: 0
    },
    width = outerWidth - margin.left - margin.right,
    height = outerHeight - margin.top - margin.bottom;
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
const AreaStack = function ({time_stamp,onLoad, metricRangeMinMax, color, config, selectedTime, selectedComputeMap, setSelectedComputeMap, selectedUser, dimensions, selectedSer,selectedSer2, scheme, colorByName, colorCluster, colorBy, getMetric, metrics, theme, line3D, layout, users, selectService, getKey}) {
    const [data,setData] = useState([]);
    const [configStack] = useControls('Stack',()=>({'SeperatedBy':{value:timeoptions['Hour'],options:timeoptions}}));

    useEffect(()=>{
        if (metrics){
            const formatGroup = d3[`time${configStack.SeperatedBy.unit}`].every(configStack.SeperatedBy.step);
            const mapTime = time_stamp.map((t,i)=>[t,i]);
            const timeIndex = d3.groups(mapTime,d=>formatGroup(d[0]));
            const maxLength = d3.max(timeIndex,t=>t[1].length);
            x.domain([0,maxLength-1]);
            const total = Object.keys(metrics);
            y.domain([0,total.length])
            stack.keys(['black',...steps.range()]);
            const _data = timeIndex.map(t=>{
                const group = {key:t[0],scale:t[1].length/maxLength};

                group.stack = stack(t[1].map(([t,ti],index)=>{
                    const obj ={time:t,timeIndex:index,'black':0};
                    steps.range().forEach(c=>{
                        obj[c]=0;
                    });
                    total.forEach(k=>{
                        if (metrics[k][ti][selectedSer]==null)
                            obj['black']++;
                        else
                            obj[steps(metrics[k][ti][selectedSer])]++
                    })
                    return obj;
                }))
                debugger
                return group;
            })
            debugger
            setData(_data);
        }else {
            setData([]);
        }
    },[metrics,configStack.SeperatedBy,time_stamp,selectedSer,metricRangeMinMax])
    return <div className={"containerThree"}>
        <div style={{position:'relative',width:(selectedSer2!==undefined)?'50%':'100%', pointerEvents:'all'}}>
            <Grid container style={{width:'100%',padding:10}} id="g-chart">
                {dimensions[selectedSer]&&<Grid item xs={12}>
                    <span>Legend</span>
                    <div>
                        <span>{Math.round(dimensions[selectedSer].scale.invert(0))}</span>
                    </div>
                </Grid>}
                <Grid item xs={12}>
                    {data.map(d=><svg width={width*d.scale + margin.left + margin.right} height={outerHeight} style={{}}>
                        <g transform={`translate(${margin.left},${margin.top})`}>
                            {d.stack.map(p=><path key={p.key} d={area(p)} fill={p.key}/>)}
                            <text y={height+4} dy=".71em" className={'year decade'}>{multiFormat(d.key)}</text>
                        </g>
                    </svg>)}
                </Grid>
            </Grid>
        </div>
    </div>
}
export default AreaStack;
