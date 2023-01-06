import React, {useImperativeHandle, useRef,useState, useEffect} from "react";
import * as d3 from 'd3'
import Popover from "@mui/material/Popover/Popover";
let closeDistance = 75;


const Lasso = React.forwardRef(({start,end,width,height,disable,axis,selectedSer,...props},ref)=> {
    const [lassoPolygon,setlassoPolygon] = useState({value:undefined})
    const [axisOver,setAxisOver] = useState(undefined);
    const svgRef = useRef();
    const gRef = useRef();
    // distance last point has to be to first point before it auto closes when mouse is released
    useEffect(()=>{
        const area = d3.select(svgRef.current).select('rect.area')
        const drag = d3
            .drag()
            .on('start', handleDragStart)
            .on('drag', handleDrag)
            .on('end', handleDragEnd);

        area.call(drag);
    },[start,end]);

    const handleDragStart = (event) => {
        lassoPolygon.value = [d3.pointer(event,gRef.current)];
        lassoPolygon.condition = false;
        lassoPolygon.end = false;
        setlassoPolygon({...lassoPolygon})
        if(start)
            start(lassoPolygon.value);
    }

    const handleDrag = (event) => {
        const point = d3.pointer(event,gRef.current);
        lassoPolygon.value.push(point);

        // indicate if we are within closing distance
        if (
            distance(lassoPolygon.value[0], lassoPolygon.value[lassoPolygon.value.length - 1]) <
            closeDistance
        ) {
            lassoPolygon.condition = point;
        } else {
            lassoPolygon.condition = false;
        }

        setlassoPolygon({...lassoPolygon})
    }

    const handleDragEnd = () => {
        // remove the close path
        lassoPolygon.end = true;

        // succesfully closed

        if ((distance(lassoPolygon.value[0], lassoPolygon.value[lassoPolygon.value.length - 1]) < closeDistance)&&(lassoPolygon.value.length>2)) {
            lassoPolygon.condition = true;
            // otherwise cancel
        } else {
            lassoPolygon.value = undefined;
        }
        if(end)
            end(lassoPolygon.value);
        setlassoPolygon({...lassoPolygon})
    }
    useImperativeHandle(ref, () => {

        return ({
            reset: ()=>{
                lassoPolygon.value = undefined;
                setlassoPolygon(lassoPolygon)
            },
            zoom:(transform)=>{
                if (gRef.current){
                    d3.select(gRef.current).attr('transform',`translate(${transform.x},${transform.y}) scale(${transform.k})`)
                }
            }
        })
    });


    return <><svg ref={svgRef} width={width} height={height} viewBox={[0,0,width,height]} style={{position:'absolute',top:0,left:0, width:'100%', height:'100%', pointerEvents: disable?'none':null}}>
        <defs>
            <marker id={'arrowred'} refX={6} refY={6} markerWidth={30} markerHeight={30} orient={"auto"}>
                <path d={"M 0 0 12 6 0 12 3 6"} fill={"red"}/>
            </marker>
            <marker id={'arrowgray'} refX={6} refY={6} markerWidth={30} markerHeight={30} orient={"auto"}>
                <path d={"M 0 0 12 6 0 12 3 6"} fill={"gray"}/>
            </marker>
            <filter id='shadow' colorInterpolationFilters="sRGB">
                <feComponentTransfer in="SourceGraphic">
                    <feFuncR type="discrete" tableValues=".5"/>
                    <feFuncG type="discrete" tableValues=".5"/>
                    <feFuncB type="discrete" tableValues=".5"/>
                </feComponentTransfer>
                <feGaussianBlur stdDeviation=".85"/>
                <feOffset dx="1" dy="1" result="shadow"/>
                <feComposite in="SourceGraphic" in2="shadow" operator="over"/>
            </filter>
        </defs>
        <rect className={'area'} width={'100%'} height={'100%'} opacity={0}/>
        <g className="lasso-group" ref={gRef}>
            <g className={'axis'}>
                {axis&&axis.feature.map((a,i)=><g key={a.name} opacity={i===selectedSer?1:0.2}><line x1={a[0][0]} y1={a[0][1]} x2={a[1][0]} y2={a[1][1]}
                                           stroke={i===selectedSer?'red':'gray'} strokeWidth={2} markerEnd={`url(#arrow${(i===selectedSer)?'red':'gray'})`}
                     onMouseOver={(e)=>{setAxisOver({el:e.target,content:a.name})}}
                     onMouseLeave={(e)=>setAxisOver(undefined)}
                />
                    {(i===selectedSer)&&<text x={a[1][0]} y={a[1][1]} textAnchor={"middle"} dy={a[1][1]>a[0][1] ? 15:-15}
                          filter="url(#shadow)"
                          fill={i===selectedSer?'red':'gray'} >{a.name}</text>}
                </g>)}
            </g>
            {lassoPolygon.value&&<>
                <path fill={'#0bb'} fillOpacity={0.1} stroke={'#0bb'} strokeDasharray={'3 3'} d={polygonToPath(lassoPolygon.value)+((lassoPolygon.condition&&lassoPolygon.end)?'Z':'')}/>
                {(!lassoPolygon.end)&&<line
                    x1={lassoPolygon.condition[0]}
                    y1={lassoPolygon.condition[1]}
                    x2={lassoPolygon.value[0][0]}
                    y2={lassoPolygon.value[0][1]}
                    stroke={'#0bb'} strokeDasharray={'3 3'} opacity={lassoPolygon.condition?1:0}/>}
            </>}
        </g>
    </svg>
        {axisOver&&<Popover
            anchorEl={axisOver.el}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'center',
            }}
            transformOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
            }}
        >
            {axisOver.content}
        </Popover>}
        </>
});
export default Lasso;

function polygonToPath(polygon) {
    return ("M" + (polygon.map(function (d) { return d.join(','); }).join('L')));
}

function distance(pt1, pt2) {
    return Math.sqrt(Math.pow( (pt2[0] - pt1[0]), 2 ) + Math.pow( (pt2[1] - pt1[1]), 2 ));
}