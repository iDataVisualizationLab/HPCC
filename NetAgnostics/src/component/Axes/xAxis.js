

const _format = d=>d.toString();
const XAxis = ({scale,ticks,x=0,y=0,
                   format=_format,line=true,
                   fontSize=10,tickLength=5})=>{
    return  <g className={'xTick'} transform={`translate(${x},${y})`}>
        {line&&<line x2={'100%'} strokeWidth={0.5} stroke={'#777'}/>}
        {scale.ticks(ticks).map(t=><g transform={`translate(${scale(t)},0)`}>
            <line vectorEffect={"non-scaling-stroke"} stroke={'black'} y2={tickLength}/>
            <text fontSize={fontSize} dy={fontSize+tickLength} textAnchor={'middle'}>{format(t)}</text>
        </g>)}
    </g>
}
export default XAxis