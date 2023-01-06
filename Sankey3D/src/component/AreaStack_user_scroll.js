import React, {useTransition, useMemo, useEffect, useCallback, useLayoutEffect, useState} from "react";
import {useControls, button} from "leva";
import * as d3 from "d3";
import * as _ from "lodash";
import {Grid, Stack, Button, CircularProgress, Backdrop} from "@mui/material";
import {multiFormat} from "./ulti";
import "./AreaStack.css"
import Paper from "@mui/material/Paper/Paper";
import {viz} from "./leva/Viz";
import Popover from "@mui/material/Popover/Popover";
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
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

const nullColor = '#ccc'
const timeoptions = {'Day':{unit:'Day',step:1},'Hour':{unit:'Hour',step:1},'30 Minute':{unit:'Minute',step:30}};

// const colorRange = ["#119955", "#7abb6d", "#c0dc8f", "#ffffbb", "#f1c76e", "#e98736", "#dd3322"];
// const stackColor = [nullColor,...colorRange];
// stack.keys(stackColor);
const AreaStack = function ({time_stamp, metricRangeMinMax,onLoad, color, config, selectedTime,metrics, selectedComputeMap, setSelectedComputeMap, selectedUser, dimensions, selectedSer,selectedSer2, scheme, colorByName, colorCluster, colorBy, getMetric, objects, theme, line3D, layout, users, selectService, getKey}) {
    const [_data,set_Data] = useState([]);
    const [dataF,setdataF] = useState([]);
    const [data,setdata] = useState([]);
    const [before,setBefore] = useState([]);
    const [after,setAfter] = useState([]);
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
    const stack = useMemo(()=> d3.stack()
        .offset(d3.stackOffsetNone),[]);
    const singleTimeLineWithoutColor = (_timeIndex=timeIndex,v, k, type, scale = 1,maxLength) => {

        const item = {key: k, max: 0, type, data: v, height: height * scale + margin.top + margin.bottom};
        item.values = _timeIndex.map((t, ti) => {
            const offset = (!ti) ? (maxLength - t[1].length) : 0;
            const group = {key: t[0], max: 0, offset};
            group.values = t[1].map(([t, ti], index) => {
                const obj = {time: t, timeIndex: index + offset, timestep: ti, max: 0};
                // # compute
                if (v[ti] && v[ti].computes) {
                    const comp = Object.values(v[ti].computes)//d3.groups(v[ti],d=>d.key);
                    if (obj.max < comp.length)
                        obj.max = comp.length;
                    if (group.max < comp.length)
                        group.max = comp.length;
                }
                // percentage

                return obj;
            });
            group.stack = [];
            if (item.max < group.max)
                item.max = group.max;
            return group;
        });
        return item
    }
    const singleTimeLineUpdateColor = (_timeIndex=timeIndex,v, item) => {

        item.values.forEach((group, ti) => {
            group.values.forEach((obj, index) => {
                const ti = obj.timestep;
                obj[nullColor]= 0;
                steps.range().forEach(c => {
                    obj[c] = 0;
                });
                // # compute
                if (v[ti] && v[ti].computes) {
                    const comp = Object.values(v[ti].computes);
                    comp.forEach(d => {
                        if (d[selectedSer] == null)
                            obj[nullColor]++;
                        else
                            obj[steps(d[selectedSer])]++
                    });
                }
                // percentage

                return obj;
            });
            group.stack = stack(group.values)
        });
    }
    const singleTimeLine = (_timeIndex=timeIndex,v, k, type, scale = 1,maxLength) => {
        const item = {key: k, max: 0, type, data: v, height: height * scale + margin.top + margin.bottom};
        item.values = _timeIndex.map((t, ti) => {
            const offset = (!ti) ? (maxLength - t[1].length) : 0;
            const group = {key: t[0], max: 0, offset};
            group.values = t[1].map(([t, ti], index) => {
                const obj = {time: t, timeIndex: index + offset, timestep: ti, [nullColor]: 0, max: 0};
                steps.range().forEach(c => {
                    obj[c] = 0;
                });
                // # compute
                if (v[ti]) {
                    const comp = v[ti]//d3.groups(v[ti],d=>d.key);
                    if (obj.max < comp.length)
                        obj.max = comp.length;
                    if (group.max < comp.length)
                        group.max = comp.length;
                    comp.forEach(d => {
                        if (d[selectedSer] == null)
                            obj[nullColor]++;
                        else
                            obj[steps(d[selectedSer])]++
                    });
                }
                // percentage

                return obj;
            });
            group.stack = stack(group.values)
            if (item.max < group.max)
                item.max = group.max;
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

                _data.sort((a, b) => b.max - a.max);
                _data.forEach((d, i) => {
                    d.index = i;
                })
                if (_data[0])
                    y.domain([0, _data[0].max])
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

            if (_data.length &&  dimensions[selectedSer]) {
                const maxLength = d3.max(timeIndex, t => t[1].length);
                // adjust color legend
                const scaleNumber = dimensions[selectedSer].scale.copy().range([1, 0]);
                const colorticks = dimensions[selectedSer].scale.ticks(7);
                const colorRange = colorticks.map(t => d3.interpolateRdYlGn(scaleNumber(t)));//["#119955", "#7abb6d", "#c0dc8f", "#ffffbb", "#f1c76e", "#e98736", "#dd3322"];
                const stackColor = [nullColor, ...colorRange];
                steps.domain([colorticks[0], colorticks[colorticks.length - 1] + colorticks[1] - colorticks[0]].map(d => dimensions[selectedSer].scale(d))).range(colorRange);

                stack.keys(stackColor);

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
                        return singleTimeLine(timeIndex,focus.data.jobs[j], j, 'Job', 0.3, d3.max(timeIndex, t => t[1].length))
                    })
                }
                focus.sub.sort((a,b)=>b.max-a.max);
                const tail = _data.slice(focus.index+1);
                const data = [..._data.slice(0,focus.index+1),...focus.sub,...tail];
                let offset=0;
                data.forEach(d=>{
                    d.py = offset;
                    d._y = offset;
                    d.y = offset;
                    offset+=d.height;
                });
                focus.sub.forEach(d=>d.py=focus.y)
                data.height = offset;
                // data.height =
                setdataF(data);
                onScroll(undefined,data);
                // setdata(data);
                return;
            }else {
                let offset = 0;
                _data.forEach(d=>{
                    d.py = offset;
                    d._y = offset;
                    d.y = offset;
                    offset+=d.height;
                });
                _data.height = offset;
                setdataF(_data);
                onScroll(undefined,_data);
                // setdata(_data);
                return ;
            }
        })

    }
    const [legendColor] = useControls('Setting',()=>({legend:viz({value:0,
            label:dimensions[selectedSer]?`${dimensions[selectedSer].text} (${dimensions[selectedSer].possibleUnit?dimensions[selectedSer].possibleUnit.unit:''})`:'',
            com:<>{dimensions[selectedSer]&&<div style={{width:'100%'}}>
                <div style={{paddingLeft:'30%'}}>
                    {
                        colorScale.colorticks.map((v,i)=><div key={v} className={'legendCell'} style={{textAlign: 'right'}}>
                            <div style={{width:20,height:10,backgroundColor:colorScale.colorRange[colorScale.colorRange.length-1-i]}}></div>
                            <span style={{transform:'translateY(-50%)', visibility:i?null:'hidden'}}>{colorScale.colorticks[colorScale.colorticks.length-i]}</span>
                        </div>)
                    }
                    <div className={'legendCell'}>
                        <div style={{width:20,height:10,backgroundColor:nullColor}}></div>
                        <span>Null</span>
                    </div>
                </div>
            </div>}</>})}),[colorScale])
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
                // data.sort((a,b)=>a._y-b._y);
                // const Index = data.findIndex(d => d.key === key);
                // debugger
                // data.forEach((d,i)=>{
                //     d.order = i;
                //     if (i<Index)
                //         d.y = -2;
                //     else
                //         d.y=0
                // });
                // data[Index].y = -1;
                main.x = position[0];
                if (main.data[current.timestep].computes) {
                    Object.values(main.data[current.timestep].computes).forEach((comp) => {
                        const {key, timestep} = comp;
                        scheme.computers[key].users[timestep].forEach(u => {
                            highlights[u] = true;
                            // if (u !== main.key) {
                            //     const target = data.find(d => d.key === u);
                            //     // if (target.order>Index)
                            //     //     target.y = (-0.5);
                            //     // else
                            //     //     target.y = (-1.5);
                            //     // links.push({
                            //     //     source: main,
                            //     //     target,
                            //     //     color: comp[selectedSer] === null ? nullColor : steps(comp[selectedSer])
                            //     // });
                            // }
                        })
                    });
                    // data.sort((a,b)=>a.y-b.y);
                    // links = d3.groups(links, d => [d.source.key, d.target.key]).map(l => {
                    //     l[1][0].value = l[1].length;
                    //     l[1][0].target.x = main.x;
                    //     return l[1][0]
                    // });
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
                        {main.data[current.timestep]?<Grid container direction="column" rowSpacing={0}>
                            <Grid item xs={12}>{current.time.toLocaleString()}</Grid>
                            <Grid item xs={12}>#Computes:     {current.max}</Grid>
                            {main.data[current.timestep].jobs&&<Grid item xs={12}>#Jobs:         {main.data[current.timestep].jobs.length}</Grid>}
                            {(sharedu>0)?<Grid item xs={12}>#Shared Users: {sharedu}</Grid>:''}
                        {list.map(d=><Grid key={d[0]} xs={12}><div className={'legendCell'} style={{marginLeft:10}}>
                            <div style={{width:20,height:10,backgroundColor:d[0]}}></div>
                            <span>{d[1]}</span>
                        </div></Grid>)}
                        </Grid>:'No running job'}
                    </Paper>})
        }else{
            setHover();
        }
        // let offset=0;
        // data.forEach(d=>{
        //     d.y = offset;
        //     offset+=d.height;
        // });
        setdata(data)
    },[data,scheme.computers,colorScale]);
    const onScroll = (event,__data=dataF)=>{
        let top = 0;
        let cheight = 0;
        if (event) {
            let element = event.target;
            top = element.scrollTop;
            cheight = element.clientHeight;
        }else{
            let element = d3.select('#g-chart-holder');
            if (!element.empty()){
                element = element.node()
                top = element.scrollTop;
                cheight = element.clientHeight;
            }
        }
        // disapear
        // let collapData = __data.filter(d=>(d.y>=top) && (d.y<=(top+cheight)) );
        // collapData.height = __data.height
        // setdata(collapData)
        // other way
        let before = [];
        let middle = [];
        let after = [];
        let collapData = [];
        __data.forEach(d=>{
            // if (d.y<(top+height)){
            //     before.push(d);
            // }else if(d.y>(top+cheight-height*1.5-30)) {
            //     after.push(d);
            // }else{
            //     middle.push(d);
            // }
            if(d.y>(top+cheight-height*1.5-30)) {
                if (d.type==='User')
                    after.push(d);
            }else{
                middle.push(d);
            }
        });
        if (before.length===1){
            collapData.push(before[0]);
            before = [];
        }else if (before.length){
            //handle before
            // before = [sumup(before,top,'Up')];
            before = [sumup(before,height/3,'Up')];
        }
        middle.forEach(d=>collapData.push(d));
        if (after.length===1){
            collapData.push(after[0])
            after = [];
        }else if (after.length){
            //handle after
            // after = [sumup(after,top+cheight-height-30,'Down')];
            after = [sumup(after,cheight-height-30,'Down')];
        }
        collapData.height = __data.height
        setdata(collapData);
        setAfter(after);
        setBefore(before);

        function sumup(after,y,k){
            const v = [];
            const vo = [];
            let jobsCount = 0;
            after.forEach((item)=>{
                item.data.forEach((c,i)=>{
                    if (!vo[i]) {
                        vo[i] = {};
                        v[i]=[];
                    }
                    c.forEach(d=>{
                        if (!vo[i][d.key])
                        {
                            vo[i][d.key] = d;
                            v[i].push(d);
                        }
                    })
                });
                if (item.data.jobs)
                    jobsCount += Object.keys(item.data.jobs).length;
                else
                    jobsCount--
            });
            let out = singleTimeLine(timeIndex,v,k,'ohter',1,d3.max(timeIndex, t => t[1].length));
            out.y = y;
            out._y = out.y ;
            out.py = out.y ;
            out.count = after.length;
            out.jobsCount = jobsCount;
            console.log( out.count)
            return (out)
        }

    }
    const totalw = data[0]?((outerWidth)*data[0].values.length +marginGroup.left+marginGroup.right):200;
    return <div style={{width:'100%',height:'100%',overflow:'hidden'}}>
        <div style={{position:'relative',width:(selectedSer2!==undefined)?'50%':'100%',height:'100%', pointerEvents:'all'}}>
            <div style={{width:'100%',height:'88%',position:'relative'}} id="g-chart" spacing={2}>
                <div ref={holderref} style={{width:'100%',height:'100%', overflow:'auto'}} id="g-chart-holder" onScroll={onScroll}>
                    <svg width={totalw} height={data.height+marginGroup.top+marginGroup.bottom} style={{overflow:'visible',marginTop:10}}>
                        <g transform={`translate(${marginGroup.left},${marginGroup.top})`}>
                            <AnimatePresence>

                            {data.map((main,i)=><motion.g key={main.key}
                                                          initial={{y: main.py??0,opacity:0}}
                                                          animate={{ y: main.y,opacity:((!hover) || hover.highlights[main.key])?1:0.1 }}
                                                          exit={{y: main.py??0,opacity:0}}
                                                          transition={{ type: "spring", stiffness: 30 }}>
                                <g transform={`translate(0,${main.height-outerHeight})`}>

                                    {main.values.map((d,ti)=>
                                        <g key={ti} transform={`translate(${(outerWidth*ti)},0)`} >
                                        <g transform={`translate(${margin.left},${margin.top})`}>
                                            {d.stack.map(p=><path key={p.key} d={area(p)} fill={p.key} style={{transition:"2s"}}/>)}
                                            <rect width={width} y={-main.height+outerHeight} height={main.height-margin.top-margin.bottom} className={'overlay'}
                                                  onMouseMove={event=>onMouseOverlay(event,ti,d,main)}
                                                  onMouseOut={event=>onMouseLeave(event)}
                                            />
                                        </g>
                                    </g>)}
                                </g>
                                <text className={'title'} dy={main.height/2} x={main.type==='User'?0:40}
                                      onClick={()=>(main.type==='User')?(focus&&(focus.key===main.key)?setfocus(undefined):setfocus(main)):null}
                                >{main.type==='User'?(focus===main?'(-)':'(+)'):''} {main.type}: {main.key} , Max #computes: {main.max}{main.data.jobs?`, #jobs: ${Object.keys(main.data.jobs).length}`:''}</text>

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
                <svg width={totalw} height={'100%'} style={{overflow:'visible',top:0, position:'absolute',pointerEvents:'none'}}>
                    <g transform={`translate(${marginGroup.left},${marginGroup.top})`}>
                        {before.map((main,i)=><g key={main.key}
                                                 className={'notransition'}
                                                 transform={`translate(0,${main.y})`}>
                            <g transform={`translate(0,${main.height-outerHeight})`}>

                                {main.values.map((d,ti)=>
                                    <g key={ti} transform={`translate(${(outerWidth*ti)},0)`} >
                                        <g transform={`translate(${margin.left},${margin.top})`}>
                                            {d.stack.map(p=><path key={p.key} d={area(p)} fill={p.key} style={{transition:"2s"}}/>)}
                                            <rect width={width} y={-main.height+outerHeight} height={main.height-margin.top-margin.bottom} className={'overlay'}
                                                // onMouseMove={event=>onMouseOverlay(event,ti,d,main)}
                                                // onMouseOut={event=>onMouseLeave(event)}
                                            />
                                        </g>
                                    </g>)}
                            </g>
                            <g transform={`translate(20,${main.height/2-12})`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"  fill={'#ddd'}
                                     className="bi bi-arrow-up-circle-fill" viewBox="0 0 16 16">
                                    <path
                                        d="M16 8A8 8 0 1 0 0 8a8 8 0 0 0 16 0zm-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z"/>
                                </svg>
                            </g>
                            <text className={'title'} dy={main.height/2} x={40}
                                  onClick={()=>(main.type==='User')?(focus&&(focus.key===main.key)?setfocus(undefined):setfocus(main)):null}
                            >{main.count} more users , Max #computes: {main.max}, #jobs: {main.jobsCount}</text>

                        </g>)}
                        {after.map((main,i)=><g key={main.key}
                                                className={'notransition'}
                                                transform={`translate(0,${main.y})`}>
                            <g transform={`translate(0,${main.height-outerHeight})`}>

                                {main.values.map((d,ti)=>
                                    <g key={ti} transform={`translate(${(outerWidth*ti)},0)`} >
                                        <g transform={`translate(${margin.left},${margin.top})`}>
                                            {d.stack.map(p=><path key={p.key} d={area(p)} fill={p.key} style={{transition:"2s"}}/>)}
                                            <rect width={width} y={-main.height+outerHeight} height={main.height-margin.top-margin.bottom} className={'overlay'}
                                                // onMouseMove={event=>onMouseOverlay(event,ti,d,main)}
                                                // onMouseOut={event=>onMouseLeave(event)}
                                            />
                                        </g>
                                    </g>)}
                            </g>
                            <g transform={`translate(20,${main.height/2-12})`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                     className="bi bi-arrow-down-circle-fill" viewBox="0 0 16 16">
                                    <path
                                        d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v5.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V4.5z"/>
                                </svg>
                            </g>
                            <text className={'title'} dy={main.height/2} x={40}
                                  onClick={()=>(main.type==='User')?(focus&&(focus.key===main.key)?setfocus(undefined):setfocus(main)):null}
                            >{main.count} more users , Max #computes: {main.max}, #jobs: {main.jobsCount}</text>

                        </g>)}
                    </g>
                </svg>
                {_data[0]&&<svg width={(outerWidth)*_data[0].values.length +marginGroup.left+marginGroup.right} height={30} style={{position:'absolute',bottom:0,left:0}}>
                    <g transform={`translate(${marginGroup.left},${marginGroup.top})`}>
                        {_data[0]&&_data[0].values.map((d,ti)=><g key={ti} transform={`translate(${(outerWidth*ti)},0)`} >
                            <g transform={`translate(${margin.left},${margin.top})`}>
                                <text y={4} dy=".65em" className={'year decade'}>{multiFormat(d.key)}</text>}
                            </g>
                        </g>)}
                    </g>
                </svg>}
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
            </div>
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

// function GroupPosition(data){
//     const transitions = useTransition(data, {
//         from: { transform:  },
//         enter: { opacity: 1 },
//         leave: { opacity: 0 },
//         delay: 200,
//         config: config.molasses,
//         onRest: () => setItems([]),
//     })
// }

export default AreaStack;
