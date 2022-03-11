import React from "react";
import * as d3 from "d3";
import _ from 'lodash';
//
// interface Props extends Record<string, any>{
//     width?: number
//     height?:number
//     margin?: {l?:number,r?:number,t?:number,b?:number}
//     data?: RadarData[],
//     rings?: number,
//     fill?: string|string[],
//     stroke?: string|string[],
//     area?:boolean
//     mean?:boolean
//     compact?:boolean
//     meanColor?:string,
//     showAxis?:boolean,
//     onMouseOver?:Function
//     onMouseLeave?:Function
// }

export class Radar extends React.Component {
    rScale = d3.scaleLinear().range([0,50]);
    innerKey='minval';
    outterKey='maxval';
    radarLine = d3.radialLine()
        .curve(d3.curveCardinalClosed.tension(0.7))
        .radius((d) => {
            return ((d.value<0) || (d.value===undefined))?0:this.rScale(d.value);
        })
        .angle(function (d) {
            return d.angle;
        });
    radarMeanLine = d3.radialLine()
        .curve(d3.curveCardinalClosed.tension(0.7))
        .radius((d) => {
            return ((d.mean<0) || (d.mean===undefined))?0:this.rScale(d.mean);
        })
        .angle(function (d) {
            return d.angle;
        });
    radialAreaGenerator = d3.radialArea().curve(d3.curveCardinalClosed.tension(0.8))
        .angle(function (d, i) {
            return d.angle;
        })
        .innerRadius( (d, i)=> {
            return ((d[this.innerKey]<0) || (d[this.innerKey]===undefined))?0:this.rScale(d[this.innerKey]);
        })
        .outerRadius( (d, i) =>{
            return ((d[this.outterKey]<0) || (d[this.outterKey]===undefined))?0:this.rScale(d[this.outterKey]);
        });
    getColor(key,index){
        if (_.isArray(this.props[key] ))
            return this.props[key][index];
        else
            return this.props[key]
    }
    render(){
        // @ts-ignore
        const {margin={l:0,b:0,t:0,r:0},width=100,height=100,data=[],fill='#fff',stroke='black',fillOpacity=0.8,
            strokeWidth=0.5, rings=5, area=false, mean=false, compact=false, meanColor="black", showAxis=false,
        onMouseOver=(()=>{})} = this.props;
        const {l=0,r=0,b=0,t=0} = margin;
        const radius = Math.min(width-l-r,height-t-b)/2;
        this.rScale.range([0,radius]);
        const ringsv = d3.range(0,rings).map(d=>this.rScale(d/rings));
        const instance = data[0]??[];

        const drawFunc = area?this.radialAreaGenerator:this.radarLine;
        return <svg width={width} height={height} viewBox={`${-width/2} ${-height/2} ${width} ${height}`}
                    onMouseOver={()=>{onMouseOver(data)}}
                    onMouseLeave={()=>{onMouseOver()}}
        >
            <defs><filter id="glow"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"></feGaussianBlur><feMerge><feMergeNode in="coloredBlur"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge></filter></defs>
            {(!compact)?<circle r={radius} fill={'#ddd'}/>:''}
            {
                !compact && ringsv.map(d=><circle key={d} r={d} fill={'rgba(205, 205, 205,0.1)'} filter={'#glow'} strokeWidth={0.15} stroke={'black'}/>)
            }
            {
                !compact && instance.map(d=><line key={d.axis} y1={-radius} stroke={'white'} strokeWidth={1} transform={`rotate(${d.angle*180/Math.PI})`}/>)
            }
            {data.map((d,i)=><g>
                <path key={`${d.id??d.name}_${i}`} d={drawFunc(d)??''}
                // transform={`translate(${this.xScale(d.time)},${this.yScale(d.mean)})`}
                  fill={this.getColor('fill',i)}
                  fillOpacity={fillOpacity}
                  stroke={stroke!=='match'?this.getColor('stroke',i):this.getColor('fill',i)}
                  strokeWidth={strokeWidth}
                />
                {mean?<path d={this.radarMeanLine(d)??''} fill={'none'} strokeDasharray={'2 1'} stroke={meanColor}/>:''}
            </g>)}
            {
                (showAxis&&data[0])&&<g className={"axis"}>
                    {
                        data[0].map((d,i)=><text key={`${d.axis}_${i}`} textAnchor={(((d.angle>-0.0001)&&(d.angle<0.0001))||((d.angle>(Math.PI-0.0001))&&(d.angle<(Math.PI+0.0001))))?"middle":((d.angle<Math.PI)?'start':'end')}
                                                 transform={findNewPoint(d.angle,(this.rScale(1)??0)+10).toString()}>{d.axis}</text>)
                    }
                </g>
            }
        </svg>;
    }
}
function findNewPoint(angle, distance,x=0, y=0) {
    let result = {x:0,y:0,toString:()=>{return ''}};

    result.x = Math.round(Math.cos(angle-Math.PI/2) * distance + x);
    result.y = Math.round(Math.sin(angle-Math.PI/2) * distance + y);
    result.toString = ()=>`translate(${result.x},${result.y})`;
    return result;
}
