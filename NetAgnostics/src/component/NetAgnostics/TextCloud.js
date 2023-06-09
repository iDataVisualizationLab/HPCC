import {useMemo} from "react";
import {scaleLinear} from "d3";

const FONTSIZE = 12
export default function ({
     scale,
     data= [],
     height=60,
     numeLine=6,
    fontSize = FONTSIZE
}){
    const scaleGrid = useMemo(()=>scaleLinear().domain([0,numeLine]).range([0,height]));
    const sizeScale = useMemo(()=>{
        const oldRange = scale.range(); // min low high max
        const mainband = (oldRange[2] - oldRange[1])*.25;
        const adjustRange = [oldRange[0],oldRange[1],oldRange[1]+mainband,oldRange[2]-mainband,oldRange[2],oldRange[3]];
        const rangeScale = [0, 0, 1, 1, 0, 0];
        // debugger
        // if (adjustRange[4]===adjustRange[5]) {
        //     rangeScale[4] = 1;
        //     rangeScale[5] = 1;
        // }
        // if (adjustRange[0]===adjustRange[1]) {
        //     rangeScale[0] = 1;
        //     rangeScale[1] = 1;
        // }
        return scaleLinear().domain(adjustRange).range(rangeScale)
    },[scale])
    return <>
        {data.map(d=><>{sizeScale(scale(d.timestep))?<g
            key={d.timestep}
            fontSize={FONTSIZE*sizeScale(scale(d.timestep))}
            transform={`translate(${scale(d.timestep)},0)`}>
            {d.value.map((t,i) => <text
                key={t.key}
                textAnchor={'middle'}
                y={scaleGrid(i)}
            >{t.key}</text>)}
        </g>:''}</>)}
    </>
}