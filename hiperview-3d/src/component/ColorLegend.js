import React from "react";
import {uniqueId} from "lodash";
import {useTheme} from "@mui/material/styles";
import {format} from "d3"

function ColorLegend({colorScale,range,height=30,barHeight=10,style}){
    const theme = useTheme();
    const id = React.useMemo(()=>uniqueId(),[]);
    const {ticks,cloneColor} = React.useMemo(()=>{
        const _range = colorScale.domain();
        const newRange = (_range[0]>_range[1])?range.slice().reverse():range.slice();
        const scale = colorScale.copy().domain(newRange);
        return {ticks:scale.ticks().sort((a,b)=>a-b),cloneColor:scale};
    },[colorScale,range]);
    return <svg style={{width:'100%',height,...style}}>
        <defs>
            <linearGradient id={"linear-gradient"+id}>
                {ticks.map((t, i, n) => <stop key={t} offset={`${100*i/n.length}%`} stopColor={cloneColor(t)}/>)}
            </linearGradient>
        </defs>
        <rect width={'100%'} height={barHeight} style={{fill:`url(#${"linear-gradient"+id})`}}/>
        {ticks.map((t, i, n) => <text key={t} x={`${100*i/n.length}%`} dy={"1rem"} fill={theme.palette.text.primary} y={barHeight}>{t>999?format('.2s')(t):t}</text>)}
    </svg>
}
export default ColorLegend
