import React from "react";
import {uniqueId} from "lodash";
import {useTheme} from "@mui/material/styles";
import {format,scaleLinear} from "d3"

function ColorLegend({colorScale,range,height=30,barHeight=10,style}){
    const theme = useTheme();
    const id = React.useMemo(()=>uniqueId(),[]);
    const {ticks,cloneColor} = React.useMemo(()=>{
        const _range = colorScale.domain();
        const newRange = (_range[0]>_range[1])?range.slice().reverse():range.slice();
        const scale = colorScale.copy().domain(newRange);
        const scalep = scaleLinear().domain(newRange).range([0,100])
        return {ticks:scale.ticks(5).sort((a,b)=>a-b).map(v=>[v,scalep(v)]),cloneColor:scale};
    },[colorScale,range]);
    return <svg style={{width:'100%',height,...style}}>
        <defs>
            <linearGradient id={"linear-gradient"+id}>
                {ticks.map((t, i, n) => <stop key={t[0]} offset={`${t[1]}%`} stopColor={cloneColor(t[0])}/>)}
            </linearGradient>
        </defs>
        <rect width={'100%'} height={barHeight} style={{fill:`url(#${"linear-gradient"+id})`}}/>
        {ticks.map((t, i, n) => <text key={t[0]} x={`${t[1]}%`} dy={"1rem"} fill={theme.palette.text.primary} y={barHeight}>{Math.abs(t)>999?format('.2s')(t[0]):t[0]}</text>)}
    </svg>
}
export default ColorLegend
