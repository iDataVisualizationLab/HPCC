import {scaleLinear,max, area} from "d3";
import {useMemo} from "react";

export default function({
        scaleX,
        height,
        boxW=5,
        data=[]
    }){
    const scaleY = useMemo(()=> {
        return scaleLinear().domain([0, max(data,d=>Math.max(d.maxAbove,Math.abs(d.maxBelow)))])
            .range([1, height]) /// why 1??
    },[height,data]);

    const areaTopAbove = useMemo(()=> {
        return area()
            .x(d=>scaleX(d.timestep))
            .y0(() => 0)
            .y1(function (d, i) {
                return -scaleY(d.maxAbove);
            })
            .defined(d => !isNaN(d.maxAbove))
    },[scaleY,scaleX]);
    const areaTopBelow = useMemo(()=> {
        return area()
            .x(d=>scaleX(d.timestep))
            .y0(() => 0)
            .y1(function (d, i) {
                return -scaleY(d.maxBelow);
            })
            .defined(d => !isNaN(d.maxBelow))
    },[scaleY,scaleX]);
    return <>
        {data.map(d=><>{(!!d.nodes.length) && <g key={d.timestep} transform={`translate(${scaleX(d.timestep)},0)`}>
            <line className={'boxplotLine'} y1={-scaleY(d.maxAbove)} y2={-scaleY(d.maxBelow)}/>
            <rect width={boxW} x={-boxW / 2} height={scaleY(d.averageAbove)} y={-scaleY(d.averageAbove)}
                  className={'boxplotRectAbove'}/>
            <rect width={boxW} x={-boxW / 2} height={scaleY(-d.averageBelow)} className={'boxplotRectBelow'}/>
        </g>}</>)}
        <path className={'layerTopAbove'} d={areaTopAbove(data)}/>
        <path className={'layerTopBelow'} d={areaTopBelow(data)}/>
    </>
}