import {multiFormat} from "../ulti";
const emptyFunction = ()=>{};
export default function({width,height,margin={},scale,
                            majorTicks,
                            minorTicks,
                            majorGrid=emptyFunction,
                            minorGrid=emptyFunction,
                            minorTicksEnable=emptyFunction,
                            lensingTarget,
                            onMouseMove=emptyFunction,
                            onMouseLeave=emptyFunction,...others}) {
    return <svg width={width} height={height} className={"timeText w-full overflow-visible"} {...others}>
        <g transform={`translate(${margin.left??0},${margin.top??0})`}>
            <rect width={width}
                  height={height}
                  x={-margin.left??0}
                  y={-margin.top??0}
                  fill={'#adabab'}
            />
            {scale.ticks(majorTicks).map(t=><g transform={`translate(${scale(t)},-10)`}
                                     className={'timeLegendLine'}
                                     key={`tick ${t}`}>
                <text textAnchor={'middle'} className={'timeticks'} dy={-3}>{multiFormat(t)}</text>
                {majorGrid(t)}
            </g>)}
            {scale.ticks(minorTicks).map(t=><g transform={`translate(${scale(t)},-10)`}
                                               className={'timeLegendLine'}
                                               key={`tick ${t}`}>
                {minorTicksEnable(t)&&<text textAnchor={'middle'} dy={-3} className={'timeticks'}>{multiFormat(t)}</text>}
                {minorGrid(t)}
            </g>)}
            <rect style={{opacity:0}} width={width}
                  y={-margin.top??0}
                  height={height} className={'timeBrushBox'}
                  onMouseMove={onMouseMove}
                  onMouseLeave={onMouseLeave}
            />
            {lensingTarget&&<rect x={scale(lensingTarget)-2} width={4} y={-10} height={4}/>}
        </g>
    </svg>
}