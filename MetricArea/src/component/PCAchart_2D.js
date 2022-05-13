import React, {useImperativeHandle, useRef, useState, useEffect, useCallback} from "react";
import * as d3 from 'd3'
import {PCA} from './PCA'
import Lasso from "./Lasso";
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import PanToolIcon from '@mui/icons-material/PanTool';
import GestureIcon from '@mui/icons-material/Gesture';
import Tooltip from "@mui/material/Tooltip/Tooltip";
import './pcachart.css'
const xscale = d3.scaleLinear();
const yscale = d3.scaleLinear();
export const PCAchart = React.forwardRef(({DIM=2,dimensions,selectedSer,setSelectedComputeMap,...props},ref)=> {
    const canvasRef = useRef();
    const zoomRef = useRef({x:0,y:0,k:1});
    const lassoRef = useRef();
    const width=500;
    const height=500;
    const r = 2;
    const [data,setData] = useState([]);
    const [isPan,setPan] = useState('select');
    const [message,setMessage] = useState('');
    useEffect(()=>{
        d3.select(canvasRef.current).call(d3.zoom()
            .scaleExtent([1, 8])
            .on("zoom", ({transform}) =>{
                zoomRef.current = transform;
                zoomed(data);
            }));
        zoomRef.current = d3.zoomIdentity;
        zoomed(data);

    },[data]);
    const handleLassoEnd = useCallback((lassoPolygon)=> {
        if (lassoPolygon) {
            const comps = {};
            data.forEach((d) => {
                const [x, y] = d;
                const transform = zoomRef.current;
                if (!d3.polygonContains(lassoPolygon, [xscale(x), yscale(y)])) {
                    d._color = 'black'
                } else {
                    delete d._color;
                    if(!comps[d.data.key])
                        comps[d.data.key] = {};
                    comps[d.data.key][d.data.timestep]=true
                }
            });
            setSelectedComputeMap(comps)
        }else{
            data.forEach((d) => {
                delete d._color;
            });
            setSelectedComputeMap(undefined)
        }
        zoomed(data);
        setData(data);
    },[data]);
    const handleLassoStart = useCallback((lassoPolygon)=> {
        data.forEach((d) => {
            delete d._color;
        });
        zoomed(data);
        setData(data);
    },[data]);
    useImperativeHandle(ref, () => ({
        setIntanceHihghlight: function setIntanceHihghlight(d){

            if(d) {
                let highlight = data.find(e => (e.data.key === d.data.key) && (e.data.timestep === d.data.timestep));
                if (highlight) {
                    console.log(highlight)
                    data.highlight = highlight;
                    if (message !== '')
                        setMessage('');
                } else {
                    delete data.highlight;
                    setMessage('Not included in current plot!');
                }
                zoomed(data);
                setData(data);
            }else{
                delete data.highlight;
                setMessage('');
                zoomed(data);
                setData(data);
            }
        },
        calculatePCA: function calculatePCA(data){

            const dataIn = [];
            data.forEach(d=>{
                if ( d.data.values.find(e=>e===null) === undefined) {
                    d.data.values.color = d.color
                    dataIn.push(d.data.values)
                }
            });
            let pca = new PCA();
            // console.log(brand_names);
            // let matrix = pca.scale(dataIn, true, true);

            let matrix = pca.scale(dataIn, false, false);

            let pc = pca.pca(matrix,DIM);

            let A = pc[0];  // this is the U matrix from SVD
            let B = pc[1];  // this is the dV matrix from SVD
            let chosenPC = pc[2];   // this is the most value of PCA
            let solution = dataIn.map((d,i)=>{
                const dd = d3.range(0,DIM).map(dim=>A[i][chosenPC[dim]]);
                dd.data = d;
                return dd
            });

            let xrange = d3.extent(solution, d => d[0]);
            let yrange = d3.extent(solution, d => d[1]);
            xscale.range([0, width]);
            yscale.range([0, height]);
            const ratio = height / width;
            if ((yrange[1] - yrange[0]) / (xrange[1] - xrange[0]) > height / width) {
                yscale.domain(yrange);
                let delta = ((yrange[1] - yrange[0]) / ratio - (xrange[1] - xrange[0])) / 2;
                xscale.domain([xrange[0] - delta, xrange[1] + delta])
            } else {
                xscale.domain(xrange);
                let delta = ((xrange[1] - xrange[0]) * ratio - (yrange[1] - yrange[0])) / 2;
                yscale.domain([yrange[0] - delta, yrange[1] + delta])
            }

            const feature = dimensions.map(function (key, i) {
                let brand = [[xscale(0),yscale(0)],d3.range(0,DIM).map(dim=>B[i][chosenPC[dim]])];
                brand.name = key.text;
                return brand
            });
            let multiplyBrands = Math.sqrt(d3.max([
                distance([xscale(0),yscale(0),xscale.range()[0],yscale.range()[0]]),
                distance([xscale(0),yscale(0),xscale.range()[0],yscale.range()[1]]),
                distance([xscale(0),yscale(0),xscale.range()[1],yscale.range()[0]]),
                distance([xscale(0),yscale(0),xscale.range()[1],yscale.range()[1]]),
            ])/d3.max(feature,d=>distance([xscale(0),yscale(0),xscale(d[1][0]),yscale(d[1][1])])));
            feature.forEach(f=>{
                f[1][0] = xscale(f[1][0]*multiplyBrands);
                f[1][1] = yscale(f[1][1]*multiplyBrands);
            });
            solution.axis = {feature}

            setData(solution);
        }
    }),[dimensions,data,message]);
    // useEffect(()=>{
    //     zoomed(d3.zoomIdentity);
    // },[data])

    function zoomed(data) {
        const transform =  zoomRef.current;
        if (lassoRef.current)
            lassoRef.current.zoom(transform)
        const context = canvasRef.current.getContext('2d')
        context.save();
        context.clearRect(0, 0, width, height);
        context.translate(transform.x, transform.y);
        context.scale(transform.k, transform.k);

        if (data.highlight){
            for (const d of data) {
                const [x, y] = d;
                context.fillStyle = 'black';
                context.beginPath();
                context.moveTo(xscale(x) + r, yscale(y));
                context.arc(xscale(x), yscale(y), r, 0, 2 * Math.PI);
                context.fill();
            }
            const d = data.highlight;
            const [x, y] = d;
            context.fillStyle = d._color??d.data.color;
            context.strokeStyle = 'yellow';
            context.beginPath();
            context.moveTo(xscale(x) + r*5, yscale(y));
            context.arc(xscale(x), yscale(y), r*5, 0, 2 * Math.PI);
            context.stroke();
            context.fill();
        }else{
            for (const d of data) {
                const [x, y] = d;
                context.fillStyle = d._color??d.data.color;
                context.beginPath();
                context.moveTo(xscale(x) + r, yscale(y));
                context.arc(xscale(x), yscale(y), r, 0, 2 * Math.PI);
                context.fill();
            }
        }
        // if (data.axis){
        //     data.axis.feature.forEach(d=>{
        //         // console.log([xscale(0),yscale(0),xscale(d[0]*data.axis.multiplyBrands),yscale(d[1]*data.axis.multiplyBrands)])
        //         drawArrow(context,xscale(0),yscale(0),xscale(d[0]*data.axis.multiplyBrands),yscale(d[1]*data.axis.multiplyBrands),2,'red')
        //     })
        // }
        context.restore();
        function drawArrow(ctx, fromx, fromy, tox, toy, arrowWidth, color){
            //variables to be used when creating the arrow
            var headlen = 10;
            var angle = Math.atan2(toy-fromy,tox-fromx);

            ctx.strokeStyle = color;

            //starting path of the arrow from the start square to the end square
            //and drawing the stroke
            ctx.beginPath();
            ctx.moveTo(fromx, fromy);
            ctx.lineTo(tox, toy);
            ctx.lineWidth = arrowWidth;
            ctx.stroke();

            //starting a new path from the head of the arrow to one of the sides of
            //the point
            ctx.beginPath();
            ctx.moveTo(tox, toy);
            ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/7),
                toy-headlen*Math.sin(angle-Math.PI/7));

            //path from the side point of the arrow, to the other side point
            ctx.lineTo(tox-headlen*Math.cos(angle+Math.PI/7),
                toy-headlen*Math.sin(angle+Math.PI/7));

            //path from the side point back to the tip of the arrow, and then
            //again to the opposite side point
            ctx.lineTo(tox, toy);
            ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/7),
                toy-headlen*Math.sin(angle-Math.PI/7));

            //draws the paths created above
            ctx.stroke();
        }
    }


    return <div style={{position: 'relative',width:'100%'}}>
        <canvas ref={canvasRef} width={width} height={height} style={{width:'100%'}}/>
        <Lasso ref={lassoRef} start={(d)=>handleLassoStart(d)} width={width} height={height}
               selectedSer={selectedSer}
               axis={data.axis}
               message={message}
               end={d=>handleLassoEnd(d)} disable={isPan==='pan'}/>
        <div className={"floatMenu"} style={{position:'absolute',bottom:0,left:0,display:"flex",alignItems:"center"}}>
            <ToggleButtonGroup
                value={isPan}
                exclusive
                onChange={(e,v)=>setPan(v)}
                aria-label="text alignment"
                color="primary"
            >

                    <ToggleButton value="pan" aria-label="left aligned" >
                        <Tooltip title="Pan" placement="top">
                    <PanToolIcon />
                        </Tooltip>
                </ToggleButton>


                <ToggleButton value="select" aria-label="centered" >
                    <Tooltip title="Select" placement="top">
                    <GestureIcon />
                    </Tooltip>
                </ToggleButton>

            </ToggleButtonGroup>
            <div>
                <span>{message}</span>
            </div>
        </div>
    </div>
});


function distance(d){
    return Math.sqrt((d[2]-d[0])*(d[2]-d[0])+(d[3]-d[1])*(d[3]-d[1]));
}