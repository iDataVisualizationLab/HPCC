import {scaleLinear, line, area} from "d3";
import {startTransition, useEffect, useMemo, useState} from "react";

export default function({
                            scaleX,
                            height,
                            yDomain=[0,1],
                            data=[],
                            order
                        }){
    const [_data,setData] = useState([]);
    useEffect(()=>{
        // startTransition(()=>{
            if (order)
                data.sort(order)
            setData(data);
        // })
    },[data,order])
    const scaleY = useMemo(()=> {
        return scaleLinear().domain(yDomain)
            .range([height,0])
    },[height,yDomain]);

    const scaleGrid = useMemo(()=> {
        return scaleLinear().domain([0,1])
            .range([0, height])
    },[height]);

    const areaChart = useMemo(()=> {
        return area()
            .x(d=>scaleX(d.timestep))
            .y0(()=>scaleY(0))
            .y1(function (d, i) {
                return scaleY(d.value);
            })
            .defined(d => !(isNaN(d.value)|| d.value===undefined))
    },[scaleY,scaleX]);

    const lineChart = useMemo(()=> {
        return line()
            .x(d=>scaleX(d.timestep))
            .y(function (d, i) {
                return scaleY(d.value);
            })
            .defined(d => !(isNaN(d.value)|| d.value===undefined))
    },[scaleY,scaleX]);

    return <>
        {_data.map(([key,value],i)=><g key={key} transform={`translate(0,${scaleGrid(i)})`}>
            {i<20?<>
                <path className={'layerAreaProfile'} d={areaChart(value)}/>
                <path className={'layerLineProfile'} d={lineChart(value)} stroke={'black'}/>
            </>:''}
            <text textAnchor={'end'} dx={-2} dy={height}>{key}</text>
        </g>)}
    </>
}