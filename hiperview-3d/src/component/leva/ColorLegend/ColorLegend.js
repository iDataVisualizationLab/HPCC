import React from "react";
import {uniqueId} from "lodash";

import { useInputContext, styled, Components } from 'leva/plugin'
import {format,scaleLinear} from "d3"

const { Label, Row, String } = Components;

const Ticks = styled('text', {
    fill: '$toolTipBackground',
})


export default function ColorLegendGraph(){
    const { label,value, displayValue, settings, onUpdate, onChange, setSettings } = useInputContext();

    const { height=30,barHeight=10,style={},scale,range } = settings;

    const id = React.useMemo(()=>uniqueId(),[]);
    const {ticks,fills,cloneColor} = React.useMemo(()=>{
        const _value = scale.domain();
        const newvalue = (_value[0]>_value[1])?range.slice().reverse():range.slice();
        const cscale = scale.copy().domain(newvalue);
        const scalep = scaleLinear().domain(newvalue).range([0,100])
        return {ticks:cscale.ticks(5).sort((a,b)=>a-b).map(v=>[v,scalep(v)]),fills:cscale.ticks(20).sort((a,b)=>a-b).map(v=>[v,scalep(v)]),cloneColor:cscale};
    },[scale,range]);
    return <>
        <Row><Label>{label}</Label></Row>
        <Row>
            <svg style={{width:'100%',height,...style}}>
                <defs>
                    <linearGradient id={"linear-gradient"+id}>
                        {fills.map((t, i, n) => <stop key={t[0]} offset={`${t[1]}%`} stopColor={cloneColor(t[0])}/>)}
                    </linearGradient>
                </defs>
                <rect width={'100%'} height={barHeight} style={{fill:`url(#${"linear-gradient"+id})`}}/>
                {ticks.map((t, i, n) => <Ticks key={t[0]} x={`${t[1]}%`} dy={"1rem"} y={barHeight}>{Math.abs(t)>999?format('.2s')(t[0]):t[0]}</Ticks>)}
            </svg>
        </Row>
    </>
}
