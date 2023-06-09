import {useCallback, useMemo} from "react";
import {scaleLinear} from "d3";

const defaultScale = ()=>1;
export default function({
    scale,
    size=30,
    triggerScale=false,
    colorScale,
    data=[],
    markedIndex,
    onClick
}){
    const sizeScale = useMemo((d)=>{
        if (triggerScale) {
            const oldRange = scale.range(); // min low high max
            const mainband = (oldRange[2] - oldRange[1])*.25;
            const adjustRange = [oldRange[0],oldRange[1],oldRange[1]+mainband,oldRange[2]-mainband,oldRange[2],oldRange[3]];
            const rangeScale = [1, 1, 2.5, 2.5, 1, 1];
            if (adjustRange[4]===adjustRange[5]) {
                rangeScale[4] = 2.5;
                rangeScale[5] = 2.5;
            }
            if (adjustRange[0]===adjustRange[1]) {
                rangeScale[0] = 2.5;
                rangeScale[1] = 2.5;
            }
            return scaleLinear().domain(adjustRange).range(rangeScale)
        }else
            return defaultScale;
    },[triggerScale,scale])
    const renderFrame = useCallback((d,i) => {
        const rsize = size*sizeScale(scale(d.timestep));
        return <rect x={-rsize/2} y={-rsize/2} width={rsize} height={rsize}
                     rx={3} ry={3}
                     stroke={markedIndex===i?'red':'none'}
                     fill={colorScale?colorScale(d.value):'none'}
        />
    },[triggerScale,scale,colorScale])
    return <>
        {data.map((d,i)=><>{(d.value!==undefined)&&<g
            key={d.timestep} transform={`translate(${scale(d.timestep)},0)`}
            onClick={()=>onClick(i)}
        >
            {renderFrame(d, i)}
        </g>}</>)}
    </>
}