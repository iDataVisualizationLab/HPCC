

const _format = d=>d.toString();
const YAxis = ({scale,ticks,x=0,y=0,
                   format=_format,line=true,
                   fontSize=10,tickLength=5})=>{
    return  <g className={'yTick'} transform={`translate(${x},${y})`}>
        {line&&<line y2={'100%'} strokeWidth={0.5} stroke={'#777'}/>}
        {scale.ticks(ticks).map(t=><g transform={`translate(0,${scale(t)})`}>
            <line vectorEffect={"non-scaling-stroke"} stroke={'black'} x1={-tickLength}/>
            <text fontSize={fontSize} dy={fontSize/3} dx={-tickLength} textAnchor={'end'}>{format(t)}</text>
        </g>)}
    </g>
}
export default YAxis