import React, {Suspense, useCallback, useEffect, useRef, useState} from "react";
import {useControls, button} from "leva";
import * as d3 from "d3";
import * as _ from "lodash";
import {Grid,Stack,Button} from "@mui/material";
import {multiFormat} from "./ulti";
import "./AreaStack.css"
import Paper from "@mui/material/Paper/Paper";


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
const AreaStack = function ({time_stamp, metricRangeMinMax, color, config, selectedTime,metrics, selectedComputeMap, setSelectedComputeMap, selectedUser, dimensions, selectedSer,selectedSer2, scheme, colorByName, colorCluster, colorBy, getMetric, objects, theme, line3D, layout, users, selectService, getKey}) {
    const [data,setData] = useState([]);
    const [configStack] = useControls('Stack',()=>({'SeperatedBy':{value:timeoptions['Hour'],options:timeoptions}}));

    useEffect(()=>{
        if (objects){
            const formatGroup = d3[`time${configStack.SeperatedBy.unit}`].every(configStack.SeperatedBy.step);
            const mapTime = time_stamp.map((t,i)=>[t,i]);
            const timeIndex = d3.groups(mapTime,d=>formatGroup(d[0]));
            const maxLength = d3.max(timeIndex,t=>t[1].length);
            x.domain([0,maxLength-1]);

            // # compute
            const total = Object.keys(metrics);
            y.domain([0,total.length])
            // percentage
            // y.domain([0,1])

            stack.keys(['black',...steps.range()]);
            const _data = Object.keys(objects).map(k=>{
                const v = objects[k];
                const item = {key:k,max:0};
                item.values = timeIndex.map((t)=>{
                    const group = {key:t[0],scale:t[1].length/maxLength,max:0};
                    group.values = t[1].map(([t,ti],index)=>{
                        const obj ={time:t,timeIndex:index,'black':0,max:0};
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
            debugger
            console.log(d3.max(_data.find(d=>d.key==='npaulat').values,d=>d3.max(d.stack,e=>d3.max(e,f=>f[1]))))
            console.log(d3.max(_data.find(d=>d.key==='xiaopson').values,d=>d3.max(d.stack,e=>d3.max(e,f=>f[1]))))
            setData(_data);
        }else {
            setData([]);
        }
    },[objects,configStack.SeperatedBy,time_stamp,selectedSer,metricRangeMinMax]);
    const onMouseOverlay = (event,d)=>{
        debugger
    }
    return <div style={{width:'100%',height:'100%',overflow:'auto'}}>
        <div style={{position:'relative',width:(selectedSer2!==undefined)?'50%':'100%', pointerEvents:'all'}}>
            <Grid container style={{width:'100%',padding:10}} id="g-chart" spacing={2}>
                {dimensions[selectedSer]&&<Grid item xs={12}>
                    <span>Legend</span>
                    <div>
                        <span>{Math.round(dimensions[selectedSer].scale.invert(0))}</span>
                    </div>
                </Grid>}
                {data.map(({key,values,max})=><Grid key={key} item xs={12}>
                    <Paper style={{padding:2}} elevation={3} >
                        <h5 >User: {key} , Max #compute: {max}</h5>
                        {values.map(d=><svg width={width*d.scale + margin.left + margin.right} height={outerHeight} style={{'& .year':{fill: '#777',
                            fontSize: 11}}}>
                            <g transform={`translate(${margin.left},${margin.top})`}>
                                <rect width={width} height={height} className={'overlay'}
                                onMouseMove={event=>onMouseOverlay(event,d)}/>
                                {d.stack.map(p=><path key={p.key} d={area(p)} fill={p.key}/>)}
                                <text y={height+4} dy=".71em" className={'year decade'}>{multiFormat(d.key)}</text>
                            </g>
                        </svg>)}
                    </Paper>
                </Grid>)}
            </Grid>
        </div>
    </div>
}
export default AreaStack;
