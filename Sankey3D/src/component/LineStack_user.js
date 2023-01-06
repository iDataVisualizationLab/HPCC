import React, {useTransition, useMemo, useEffect, useRef, useState, useLayoutEffect, useCallback} from "react";
import {useControls, button} from "leva";
import * as d3 from "d3";
import * as _ from "lodash";
import {Grid, Stack, Button, CircularProgress, Backdrop} from "@mui/material";
import {multiFormat} from "./ulti";
import "./AreaStack.css"
import Paper from "@mui/material/Paper/Paper";
import {viz} from "./leva/Viz";
import Popover from "@mui/material/Popover/Popover";
import useMeasure from 'react-use-measure'
import { motion ,AnimatePresence } from 'framer-motion'

var outerHeight = 110,
    margin = {
        top: 0,
        right: 1,
        bottom: 0,
        left: 0
    },
    height = outerHeight - margin.top - margin.bottom,
    marginGroup = {
        top: 0,
        right: 10,
        bottom: 0,
        left: 10
    };
let init_outerWidth = 60;
let init_width = init_outerWidth-margin.left-margin.right

var x = d3.scaleLinear()
    .rangeRound([0, init_width]);

var y = d3.scaleLinear()
    .rangeRound([height, 0]);


var area = d3.line()
    .curve(d3.curveStepAfter)
    .x(function(d) {
        return x(d[0]);
    })
    .y(function(d) {
        return y(d[1]);
    }).defined(d=>d&&(d[1]!==null));

const nullColor = '#ccc'
const timeoptions = {'Day':{unit:'Day',step:1},'Hour':{unit:'Hour',step:1},'30 Minute':{unit:'Minute',step:30}};

// const colorRange = ["#119955", "#7abb6d", "#c0dc8f", "#ffffbb", "#f1c76e", "#e98736", "#dd3322"];
// const stackColor = [nullColor,...colorRange];
// stack.keys(stackColor);
const AreaStack = function ({time_stamp, metricRangeMinMax,onLoad, color, config, selectedTime,metrics, selectedComputeMap, setSelectedComputeMap, selectedUser, dimensions, selectedSer,selectedSer2, scheme, colorByName, colorCluster, colorBy, getMetric, objects, theme, line3D, layout, users, selectService, getKey}) {
    const [_data,set_Data] = useState([]);
    const [data,setdata] = useState([]);
    const [timeIndex,setTimeIndex] = useState([]);
    const [isPending,startTransition] = useTransition();
    const [holderref,bounds] = useMeasure();
    const [hover,setHover] = useState();
    const [focus,setfocus] = useState();
    var [outerWidth,setouterWidth] = useState(60);
    var [width,setwidth] = useState(60-margin.left-margin.right);
    var [colorScale,setColorScale] = useState({colorRange:[],stackColor:[],colorticks:[]});
    const [configStack] = useControls('Graphic',()=>({'SeperatedBy':{value:timeoptions['Hour'],options:timeoptions,label:'Major tick'}}));

    useLayoutEffect(()=>{
        if (_data[0])
            startTransition(()=>{
                const currentw = bounds.width-20;
                let _outerWidth = (currentw - marginGroup.left - marginGroup.right) / _data[0].values.length;
                let _width = _outerWidth-margin.left-margin.right;
                x.rangeRound([0, _width]);
                setouterWidth(_outerWidth);
                setwidth(_width);
            })
    },[bounds.width,_data])
    const steps = useMemo(()=>d3.scaleQuantize()
        .domain([0,1])
        .range(["#119955", "#7abb6d", "#c0dc8f", "#ffffbb", "#f1c76e", "#e98736", "#dd3322"]),[]);
    const singleTimeLineWithoutColor = (_timeIndex=timeIndex,v, k, type, scale = 1,maxLength) => {

        const item = {key: k, max: 0, type, data: v, height: height * scale + margin.top + margin.bottom, maxComp:0};
        item.values = _timeIndex.map((t, ti) => {
            const offset = (!ti) ? (maxLength - t[1].length) : 0;
            const group = {key: t[0], max: 0, offset, maxComp:0};
            group.values = t[1].map(([time,ti],index)=>{
                const obj ={time, timeIndex: index + offset, timestep: ti,max:0,maxComp:0};
                // # compute
                if (v[ti] && v[ti].computes) {
                    const comp = Object.values(v[ti].computes)
                    if (obj.maxComp<comp.length)
                        obj.maxComp = comp.length;
                    if (group.maxComp<comp.length)
                        group.maxComp = comp.length;
                }
                // percentage

                return obj;
            });
            group.stack = [];

            if (item.max<group.max)
                item.max = group.max;
            if (item.maxComp<group.maxComp)
                item.maxComp = group.maxComp;
            return group;
        });
        return item
    }
    const singleTimeLineUpdateColor = (_timeIndex=timeIndex,v, item) => {
        debugger
        item.max = 0
        item.values.forEach((group, _ti) => {
            const comps = {};
            group.values.forEach((obj, index) => {
                const ti = obj.timestep;
                // # compute
                if (v[ti] && v[ti].computes) {
                    const comp = Object.values(v[ti].computes);
                    comp.forEach(d => {
                        if (!comps[d.key]){
                            comps[d.key] = [];
                            _timeIndex[_ti][1].forEach(([t,ti],index)=>comps[d.key][ti]=([index+group.offset,null]));
                            comps[d.key].key = d.key;
                            comps[d.key].data = [];
                        }
                        if (!comps[d.key][ti])
                        debugger
                        comps[d.key][ti][1] = d[selectedSer];
                        if (obj.max<d[selectedSer])
                            obj.max = d[selectedSer];
                        if (group.max<d[selectedSer])
                            group.max = d[selectedSer];
                    });

                }
                // percentage

                return obj;
            });
            group.stack = Object.values(comps);
            if (item.max<group.max)
                item.max = group.max;
        });
    }
    const singleTimeLine = (_timeIndex=timeIndex,v, k, type, scale = 1,maxLength) => {
        const item = {key: k, max: 0, type, data: v, height: height * scale + margin.top + margin.bottom,maxComp:0};
        item.values = _timeIndex.map((t, ti) => {
            const offset = (!ti) ? (maxLength - t[1].length) : 0;
            const group = {key: t[0], max: 0, offset, maxComp:0};
            let comps={}
            let timearr = t[1];
            group.values = t[1].map(([t, ti], index) => {
                const obj = {time: t, timeIndex: index + offset, timestep: ti,maxComp:0, max: 0};
                // # compute
                if (v[ti]) {
                    const comp = v[ti]//d3.groups(v[ti],d=>d.key);
                    if (obj.maxComp<comp.length)
                        obj.maxComp = comp.length;
                    if (group.maxComp<comp.length)
                        group.maxComp = comp.length;
                    comp.forEach(d => {
                        if (!comps[d.key]){
                            comps[d.key] = [];
                            timearr.forEach(([t,ti],index)=>comps[d.key][ti]=([index+offset,null]));
                            comps[d.key].key = d.key;
                            comps[d.key].data = [];
                        }
                        comps[d.key][ti][1] = d[selectedSer];
                        if (obj.max<d[selectedSer])
                            obj.max = d[selectedSer];
                        if (group.max<d[selectedSer])
                            group.max = d[selectedSer];
                    });
                }
                // percentage

                return obj;
            });
            group.stack = Object.values(comps);
            if (item.max<group.max)
                item.max = group.max;
            if (item.maxComp<group.maxComp)
                item.maxComp = group.maxComp;
            return group;
        });
        return item
    }
    useEffect(()=>{
        startTransition(()=> {
            console.time('process data array')
            if (objects) {
                const formatGroup = d3[`time${configStack.SeperatedBy.unit}`].every(configStack.SeperatedBy.step);
                const mapTime = time_stamp.map((t, i) => [t, i]);
                const timeIndex = d3.groups(mapTime, d => formatGroup(d[0]));
                setTimeIndex(timeIndex)
                const maxLength = d3.max(timeIndex, t => t[1].length);
                x.domain([0, maxLength - 1]);

                // # compute

                // percentage
                // y.domain([0,1])

                const _data = Object.keys(objects).map(k => {
                    return singleTimeLineWithoutColor(timeIndex,objects[k], k, 'User',1,maxLength)
                });
                console.log(_data)
                _data.sort((a, b) => b.maxComp - a.maxComp);
                _data.forEach((d, i) => {
                    d.index = i;
                })
                // if (_data[0])
                //     y.domain([0, _data[0].max])
                set_Data(_data);
                if (focus) {
                    const _focus = _data.find(d => d.key === focus.key);
                    if (_focus) {
                        setfocus(_focus)
                    } else {
                        setfocus(undefined)
                    }
                }
            } else {
                set_Data([]);
            }
            console.timeEnd('process data array')
        })
    },[objects,configStack.SeperatedBy,time_stamp]);
    useEffect(()=>{
        startTransition(()=> {
            debugger
            if (_data.length &&  dimensions[selectedSer]) {
                const maxLength = d3.max(timeIndex, t => t[1].length);
                // adjust color legend
                const scaleNumber = dimensions[selectedSer].scale.copy().range([1, 0]);
                const colorticks = dimensions[selectedSer].scale.ticks(7);
                const colorRange = colorticks.map(t => d3.interpolateRdYlGn(scaleNumber(t)));//["#119955", "#7abb6d", "#c0dc8f", "#ffffbb", "#f1c76e", "#e98736", "#dd3322"];
                const stackColor = [nullColor, ...colorRange];
                steps.domain([colorticks[0], colorticks[colorticks.length - 1] + colorticks[1] - colorticks[0]].map(d => dimensions[selectedSer].scale(d))).range(colorRange);


                setColorScale({colorRange, stackColor, colorticks});
                // # compute

                // percentage
                // y.domain([0,1])

                _data.forEach(item => {
                    singleTimeLineUpdateColor(timeIndex,item.data, item)//(timeIndex,objects[k], k, 'User',1,maxLength)
                    // delete item.sub
                    if (item.sub)
                        item.sub.forEach((item=>{
                            singleTimeLineUpdateColor(timeIndex,item.data, item)
                        }))
                });
                console.log(_data[0])
                y.domain([0, d3.max(_data,d=>d.max)])
                set_Data(_data);
            }

        })
    },[_data,timeIndex,selectedSer,metricRangeMinMax]);

    useEffect(()=>{
        updateData()
    },[_data,focus,timeIndex,selectedSer,metricRangeMinMax]);
    function updateData(){
        startTransition(()=>{
            if (focus&&focus.data.jobs){
                if (focus.data.jobs){//&&(!focus.sub)) {
                    focus.sub = Object.keys(focus.data.jobs).map(j => {
                        return singleTimeLine(timeIndex,focus.data.jobs[j], j, 'Job', 0.5, d3.max(timeIndex, t => t[1].length))
                    })
                }
                focus.sub.sort((a,b)=>b.maxComp-a.maxComp);
                const tail = _data.slice(focus.index+1);
                const data = [..._data.slice(0,focus.index+1),...focus.sub,...tail];
                let offset=0;
                data.forEach(d=>{
                    d._y = offset;
                    d.y = offset;
                    offset+=d.height;
                });
                focus.sub.forEach(d=>d.py=focus.y)
                data.height = offset;
                // data.height =
                setdata(data);
                return;
            }else {
                let offset = 0;
                _data.forEach(d=>{
                    d._y = offset;
                    d.y = offset;
                    offset+=d.height;
                });
                _data.height = offset;
                setdata(_data);
                return ;
            }
        })

    }
    // const [legendColor] = useControls('Setting',()=>({legend:viz({value:0,
    //         label:dimensions[selectedSer]?`${dimensions[selectedSer].text} (${dimensions[selectedSer].possibleUnit?dimensions[selectedSer].possibleUnit.unit:''})`:'',
    //         com:<>{dimensions[selectedSer]&&<div style={{width:'100%'}}>
    //             <div style={{paddingLeft:'30%'}}>
    //                 {
    //                     colorScale.colorticks.map((v,i)=><div key={v} className={'legendCell'} style={{textAlign: 'right'}}>
    //                         <div style={{width:20,height:10,backgroundColor:colorScale.colorRange[colorScale.colorRange.length-1-i]}}></div>
    //                         <span style={{transform:'translateY(-50%)', visibility:i?null:'hidden'}}>{colorScale.colorticks[colorScale.colorticks.length-i]}</span>
    //                     </div>)
    //                 }
    //                 <div className={'legendCell'}>
    //                     <div style={{width:20,height:10,backgroundColor:nullColor}}></div>
    //                     <span>Null</span>
    //                 </div>
    //             </div>
    //         </div>}</>})}),[colorScale])
    const onMouseLeave = useCallback((event,timeIndex,d,main)=>{
        // data.sort((a,b)=>a._y-b._y)
        // data.forEach(d=>{
        //     d.y = d._y;
        // });
        // setdata(data)
        setHover();
    },[data])
    const onMouseOverlay = useCallback((event,timeIndex,d,main)=>{
        const key = main.key;
        const mouse = d3.pointer(event,event.currentTarget);
        const index = Math.round(x.invert(mouse[0]))-d.offset;
        const current = d.values[index];
        if (current){
            const position =[x(current.timeIndex),y(current.max)];
            // console.log(current,stackColor);
            const highlights = {};
            let links = [];
            if (main.data[current.timestep]) {
                // data.forEach((d,i)=>{
                //     d.order = i;
                //     if (i<index)
                //         d.y = -2;
                // });
                // current.y = -1;
                main.x = position[0];
                if (main.data[current.timestep].computes) {
                    Object.values(main.data[current.timestep].computes).forEach((comp) => {
                        const {key, timestep} = comp;
                        scheme.computers[key].users[timestep].forEach(u => {
                            highlights[u] = true;
                            if (u !== main.key) {
                                const target = data.find(d => d.key === u);
                                // if (target.order>index)
                                //     target.y = (-0.5);
                                // else
                                //     target.y = (-1.5);
                                links.push({
                                    source: main,
                                    target,
                                    color: comp[selectedSer] === null ? nullColor : steps(comp[selectedSer])
                                });
                            }
                        })
                    });
                    // data.sort((a,b)=>a.y-b.y);
                    links = d3.groups(links, d => [d.source.key, d.target.key]).map(l => {
                        l[1][0].value = l[1].length;
                        l[1][0].target.x = main.x;
                        return l[1][0]
                    });
                }
            }else
                highlights[main.key] = true;
            const list = colorScale.stackColor.map(k=>[k,current[k]]).reverse().filter(d=>d[1]);
            const sharedu = Object.keys(highlights).length-1;
            setHover({key,timeIndex,position,mouse:d3.pointer(event,document.body),value:current.max,data:current,parent:main,
                highlights,
                links,
                tooltip:
                    <Paper sx={{
                        p: 2,
                        margin: 'auto',
                        maxWidth: 500,
                        flexGrow: 1,
                        backgroundColor: (theme) =>
                            theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
                    }}>
                        <Grid container direction="column" spacing={2}>
                            <Grid item xs={12}>Max {dimensions[selectedSer].text}: {Math.round(dimensions[selectedSer].scale.invert(current.max))}</Grid>
                            {list.map(d=><Grid key={d[0]} xs={12}><div className={'legendCell'} style={{marginLeft:10}}>
                                <div style={{width:20,height:10,backgroundColor:d[0]}}></div>
                                <span>{d[1]}</span>
                            </div></Grid>)}
                        </Grid>
                    </Paper>})
        }else{
            setHover();
        }
        // let offset=0;
        // data.forEach(d=>{
        //     d.y = offset;
        //     offset+=d.height;
        // });
        // setdata(data)
    },[data,scheme.computers,colorScale]);
    const totalw = data[0]?((outerWidth)*data[0].values.length +marginGroup.left+marginGroup.right):200;
    return <div style={{width:'100%',height:'100%',overflow:'hidden'}}>
        <div style={{position:'relative',width:(selectedSer2!==undefined)?'50%':'100%',height:'100%', pointerEvents:'all'}}>
            {data[0]&&<div style={{width:'100%',height:'88%',position:'relative'}} id="g-chart" spacing={2}>
                <div ref={holderref} style={{width:'100%',height:'100%', overflow:'auto'}}>
                    <svg width={totalw} height={data.height+marginGroup.top+marginGroup.bottom} style={{overflow:'visible',marginTop:10}}>
                        <g transform={`translate(${marginGroup.left},${marginGroup.top})`}>
                            <AnimatePresence>
                                {data.map((main,i)=><motion.g key={main.key}
                                                              initial={{y: main.py??0}}
                                                              animate={{ y: main.y }}
                                                              exit={{y: main.py??0}}
                                                              transition={{ type: "spring", stiffness: 30 }}
                                                              style={{ opacity: ((!hover) || hover.highlights[main.key])?1:0.1}}>
                                    <g transform={`translate(0,${main.height-outerHeight})`}>

                                        {main.values.map((d,ti)=>
                                            <g key={ti} transform={`translate(${(outerWidth*ti)},0)`} >
                                                <g transform={`translate(${margin.left},${margin.top})`}>
                                                    {d.stack.map(p=><path key={p.key} d={area(p)} stroke={steps(p[p.length-1][1])} fill={'none'} style={{transition:"2s"}}/>)}
                                                    <rect width={width} y={-main.height+outerHeight} height={main.height-margin.top-margin.bottom} className={'overlay'}
                                                          onMouseMove={event=>onMouseOverlay(event,ti,d,main)}
                                                          onMouseOut={event=>onMouseLeave(event)}
                                                    />
                                                </g>
                                            </g>)}
                                        {/*{main.values.map((d,ti)=><g key={ti} transform={`translate(${(outerWidth*ti)},0)`} >*/}
                                        {/*<g transform={`translate(${margin.left},${margin.top})`}>*/}

                                        {/*<rect width={width} y={-main.height+outerHeight} height={main.height-margin.top-margin.bottom} className={'overlay'}*/}
                                        {/*onMouseMove={event=>onMouseOverlay(event,main.key,ti,d)}/>*/}
                                        {/*/!*{(hover&&(hover.key===main.key))&&<line x2={width} y1={hover.position[1]} y2={hover.position[1]} stroke={'black'} strokeDasharray={'2 1'}/>}*!/*/}
                                        {/*/!*{(hover&&(hover.key===main.key)&&(hover.timeIndex===ti))?<><g transform={`translate(${hover.position[0]},0)`}>*!/*/}
                                        {/*/!*<line y2={hover.position[1]} y1={y(0)} stroke={'black'} strokeDasharray={'2 1'}/>*!/*/}
                                        {/*/!*</g>*!/*/}
                                        {/*/!*<text y={main.height-margin.top-margin.bottom+4} dy=".65em" className={'year decade'}>{multiFormat(hover.data.time)}</text>*!/*/}
                                        {/*/!*</>: ''}*!/*/}
                                        {/*</g>*/}
                                        {/*</g>)}*/}
                                    </g>
                                    <text className={'title'} dy={main.height/2} x={main.type==='User'?0:40}
                                          onClick={()=>(main.type==='User')?(focus&&(focus.key===main.key)?setfocus(undefined):setfocus(main)):null}
                                    >{main.type==='User'?(focus===main?'(-)':'(+)'):''} {main.type}: {main.key} , Max #computes: {main.maxComp}{main.data.jobs?`, #jobs: ${Object.keys(main.data.jobs).length}`:''}</text>

                                </motion.g>)}
                            </AnimatePresence>
                            {hover&&<><line x2={'100%'} y1={hover.position[1]+hover.parent.y} y2={hover.position[1]+hover.parent.y} stroke={'black'} strokeDasharray={'2 1'}/>}
                                <g transform={`translate(${(outerWidth*hover.timeIndex + margin.left)},${margin.top})`} style={{pointerEvents:'none'}}>
                                    <line y2={'100%'} y1={0} stroke={'black'} strokeDasharray={'2 1'} x1={hover.position[0]} x2={hover.position[0]}/>
                                    <text y={hover.parent.y+hover.parent.height-margin.top-margin.bottom+4} dy=".65em" className={'year decade'}>{multiFormat(hover.data.time)}</text>
                                    <g transform={`translate(0,${hover.position[1]})`}>
                                        {
                                            hover.links.map(l=><path d={linkArc(l)} stroke={l.color} strokeWidth={l.value} fill={'none'}/>)
                                        }
                                    </g>
                                </g>
                            </>}
                        </g>
                    </svg>
                </div>
                <svg width={(outerWidth)*data[0].values.length +marginGroup.left+marginGroup.right} height={30} style={{position:'absolute',bottom:0,left:0}}>
                    <g transform={`translate(${marginGroup.left},${marginGroup.top})`}>
                        {data[0]&&data[0].values.map((d,ti)=><g key={ti} transform={`translate(${(outerWidth*ti)},0)`} >
                            <g transform={`translate(${margin.left},${margin.top})`}>
                                <text y={4} dy=".65em" className={'year decade'}>{multiFormat(d.key)}</text>}
                            </g>
                        </g>)}
                    </g>
                </svg>
                {hover&&<Popover
                    sx={{
                        pointerEvents: 'none',
                    }}
                    open={true}
                    anchorReference="anchorPosition"
                    anchorPosition={{ top: hover.mouse[1]-20, left: hover.mouse[0]-20 }}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    disableRestoreFocus
                >
                    {hover.tooltip}
                </Popover>}
                {isPending&&<Backdrop
                    sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}
                    open={true}
                >
                    <h1>Rendering...</h1>
                    <CircularProgress color="inherit"/>
                </Backdrop>}
            </div>}
        </div>
    </div>
}

function linkArc(d) {
    var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = Math.sqrt(dx * dx + dy * dy) / 2;
    if (d.source.y < d.target.y)
        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    else
        return "M" + d.target.x + "," + d.target.y + "A" + dr + "," + dr + " 0 0,1 " + d.source.x + "," + d.source.y;
}
export default AreaStack;
