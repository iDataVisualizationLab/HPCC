import React, {Suspense, useMemo, useEffect, useRef, useState} from "react";
import {useControls, button} from "leva";
import * as d3 from "d3";
import * as _ from "lodash";
import {Grid,Stack,Button} from "@mui/material";
import {multiFormat} from "./ulti";
import "./AreaStack.css"
import Paper from "@mui/material/Paper/Paper";
import {viz} from "./leva/Viz";
import Popover from "@mui/material/Popover/Popover";

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

const nullColor = '#ccc'
const timeoptions = {'Day':{unit:'Day',step:1},'Hour':{unit:'Hour',step:1},'30 Minute':{unit:'Minute',step:30}};

// const colorRange = ["#119955", "#7abb6d", "#c0dc8f", "#ffffbb", "#f1c76e", "#e98736", "#dd3322"];
// const stackColor = [nullColor,...colorRange];
// stack.keys(stackColor);
const AreaStack = function ({time_stamp, metricRangeMinMax, color, config, selectedTime,metrics, selectedComputeMap, setSelectedComputeMap, selectedUser, dimensions, selectedSer,selectedSer2, scheme, colorByName, colorCluster, colorBy, getMetric, objects, theme, line3D, layout, users, selectService, getKey}) {
    const [_data,set_Data] = useState([]);

    const holderref = useRef();
    const [hover,setHover] = useState();
    const [focus,setfocus] = useState();
    var [graphic,setGraphic] = useState({outerWidth:60,width:60-margin.left-margin.right});
    var [colorScale,setColorScale] = useState({colorRange:[],stackColor:[],colorticks:[]});
    const [configStack] = useControls('Graphic',()=>({'SeperatedBy':{value:timeoptions['Hour'],options:timeoptions,label:'Major tick'}}));
    const [graphicBtn] = useControls('Graphic',()=>({'Fit Screen':button(()=>{
        // setFit
        if (holderref.current && _data[0]) {
            const currentw = holderref.current.getBoundingClientRect().width-20;
            let _outerWidth = (currentw - marginGroup.left - marginGroup.right) / _data[0].values.length;
            let _width = _outerWidth-margin.left-margin.right
            x.rangeRound([0, _width]);
            setGraphic({...graphic,outerWidth:_outerWidth,width:_width})
        }
    })}),[_data,graphic]);

    const steps = useMemo(()=>d3.scaleQuantize()
        .domain([0,1])
        .range(["#119955", "#7abb6d", "#c0dc8f", "#ffffbb", "#f1c76e", "#e98736", "#dd3322"]),[]);

    useEffect(()=>{
        if (objects){
            const formatGroup = d3[`time${configStack.SeperatedBy.unit}`].every(configStack.SeperatedBy.step);
            const mapTime = time_stamp.map((t,i)=>[t,i]);
            const timeIndex = d3.groups(mapTime,d=>formatGroup(d[0]));
            const maxLength = d3.max(timeIndex,t=>t[1].length);
            x.domain([0,maxLength-1]);


            // adjust color legend
            const scaleNumber = dimensions[selectedSer].scale.copy().range([1,0]);
            const colorticks = dimensions[selectedSer].scale.ticks(7);
            const colorRange = colorticks.map(t=>d3.interpolateRdYlGn(scaleNumber(t)));//["#119955", "#7abb6d", "#c0dc8f", "#ffffbb", "#f1c76e", "#e98736", "#dd3322"];
            const stackColor = [nullColor,...colorRange];
            steps.domain([colorticks[0],colorticks[colorticks.length-1]+colorticks[1]-colorticks[0]].map(d=>dimensions[selectedSer].scale(d))).range(colorRange);
            debugger
            stack.keys(stackColor);

            setColorScale({colorRange,stackColor,colorticks});
            // # compute

            // percentage
            // y.domain([0,1])
            const singleTimeLine = (v,k,type,scale=1)=>{
                const item = {key:k,max:0,type,data:v,height:height*scale+margin.top+margin.bottom};
                item.values = timeIndex.map((t)=>{
                    const group = {key:t[0],max:0};
                    const offset = maxLength - t[1].length
                    group.values = t[1].map(([t,ti],index)=>{
                        const obj ={time:t,timeIndex:index+offset,[nullColor]:0,max:0};
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
                                    obj[nullColor]++;
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
                });
                if (v.jobs){
                    item.sub = Object.keys(v.jobs).map(j=>{
                        return singleTimeLine(v.jobs[j],j,'Job',0.5)
                    })
                }
                return item
            }

            const _data = Object.keys(objects).map(k=>{
                return singleTimeLine(objects[k],k,'User')
            })

            _data.sort((a,b)=>b.max-a.max);
            _data.forEach((d,i)=>{
                d.index = i;
            })
            if (_data[0])
            y.domain([0,_data[0].max])
            set_Data(_data);
            if (focus){
                const _focus = _data.find(d=>d.key===focus.key);
                if (_focus){
                    setfocus(_focus)
                }else{
                    setfocus(undefined)
                }
            }
        }else {
            set_Data([]);
        }
    },[objects,configStack.SeperatedBy,time_stamp,selectedSer,metricRangeMinMax]);
    const data = useMemo(()=>{
        if (focus&&focus.sub){
            focus.sub.sort((a,b)=>b.max-a.max);
            const tail = (focus.index!==(_data.length-1))?_data.slice(focus.index+1,_data.length-1):[];
            const data = [..._data.slice(0,focus.index+1),...focus.sub,...tail];
            let offset=0;
            data.forEach(d=>{
                d.y = offset;
                offset+=d.height;
            });
            data.height = offset;
            // data.height =
            return data;
        }else {
            let offset = 0;
            _data.forEach(d=>{
                d.y = offset;
                offset+=d.height;
            });
            _data.height = offset;
            return _data;
        }
    },[_data,focus]);
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
    const onMouseOverlay = (event,key,timeIndex,d)=>{
        const mouse = d3.pointer(event,event.currentTarget);
        const current = d.values[Math.round(x.invert(mouse[0]))];
        if (current){
            const position =[x(current.timeIndex),y(current.max)];
            // console.log(current,stackColor);
            const list = colorScale.stackColor.map(k=>[k,current[k]]).reverse().filter(d=>d[1]);
            setHover({key,timeIndex,position,mouse:d3.pointer(event,document.body),value:current.max,data:current,tooltip:
                    <Paper sx={{
                        p: 2,
                        margin: 'auto',
                        maxWidth: 500,
                        flexGrow: 1,
                        backgroundColor: (theme) =>
                            theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
                    }}>
                        <Grid container direction="column" spacing={2}>
                            <Grid item xs={12}>#Computes: {current.max}</Grid>
                        {list.map(d=><Grid key={d[0]} xs={12}><div className={'legendCell'} style={{marginLeft:10}}>
                            <div style={{width:20,height:10,backgroundColor:d[0]}}></div>
                            <span>{d[1]}</span>
                        </div></Grid>)}
                        </Grid>
                    </Paper>})
        }else{
            setHover()
        }
    };
    const {outerWidth,width} = graphic;
    return <div style={{width:'100vw',height:'100%',overflow:'hidden'}}>
        <div style={{position:'relative',width:(selectedSer2!==undefined)?'50%':'100%',height:'100%', pointerEvents:'all'}}>
            {data[0]&&<div style={{width:'100%',height:'88%',position:'relative'}} id="g-chart" spacing={2}>
                <div ref={holderref} style={{width:'100%',height:'100%', overflow:'auto'}}>
                    <svg width={(outerWidth)*data[0].values.length +marginGroup.left+marginGroup.right} height={data.height+marginGroup.top+marginGroup.bottom} style={{overflow:'visible',marginTop:10}}>
                        <g transform={`translate(${marginGroup.left},${marginGroup.top})`}>
                            {data.map((main,i)=><g key={main.key} transform={`translate(0,${main.y})`}>
                                <g transform={`translate(0,${main.height-outerHeight})`}>

                                    {main.values.map((d,ti)=><g key={ti} transform={`translate(${(outerWidth*ti)},0)`} >
                                        <g transform={`translate(${margin.left},${margin.top})`}>
                                            {d.stack.map(p=><path key={p.key} d={area(p)} fill={p.key}/>)}

                                        </g>
                                    </g>)}
                                    {main.values.map((d,ti)=><g key={ti} transform={`translate(${(outerWidth*ti)},0)`} >
                                        <g transform={`translate(${margin.left},${margin.top})`}>

                                            <rect width={width} y={-main.height+outerHeight} height={main.height-margin.top-margin.bottom} className={'overlay'}
                                                  onMouseMove={event=>onMouseOverlay(event,main.key,ti,d)}/>
                                            {(hover&&(hover.key===main.key))&&<line x2={width} y1={hover.position[1]} y2={hover.position[1]} stroke={'black'} strokeDasharray={'2 1'}/>}
                                            {(hover&&(hover.key===main.key)&&(hover.timeIndex===ti))?<><g transform={`translate(${hover.position[0]},0)`}>
                                                <line y2={hover.position[1]} y1={y(0)} stroke={'black'} strokeDasharray={'2 1'}/>
                                                {/*<foreignObject width={100} height={200} x={-50} y={hover.position[1]} className={'tooltip'}>{hover.tooltip}</foreignObject>*/}
                                            </g>
                                                <text y={main.height-margin.top-margin.bottom+4} dy=".65em" className={'year decade'}>{multiFormat(hover.data.time)}</text>
                                            </>: ''}
                                        </g>
                                    </g>)}
                                </g>
                                <text className={'title'} dy={main.height/2} x={main.type==='User'?0:40}
                                      onClick={()=>(main.type==='User')?(focus===main?setfocus(undefined):setfocus(main)):null}
                                >{main.type==='User'?(focus===main?'(-)':'(+)'):''} {main.type}: {main.key} , Max #computes: {main.max}{main.sub?`, #jobs: ${main.sub.length}`:''}</text>

                            </g>)}
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
                    anchorPosition={{ top: hover.mouse[1], left: hover.mouse[0] }}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                    disableRestoreFocus
                >
                    {hover.tooltip}
                </Popover>}
            </div>}
        </div>
    </div>
}
export default AreaStack;
