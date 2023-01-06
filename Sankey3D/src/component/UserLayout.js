import React, {useMemo, useRef, useState, useEffect, useCallback, createRef} from "react";
import {useFrame,useLoader} from "@react-three/fiber";
import {Html, Line} from "@react-three/drei";
import img from './image/user_small.png'
import {forceSimulation,forceCollide} from 'd3'

import * as THREE from "three";
import makeStyles from "@mui/styles/makeStyles";
const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();
const tempVec = new THREE.Vector3();
const useStyles = makeStyles({
    tooltip: {
        background: 'rgba(0,0,0,0.66)',
        fontSize:'70%',
        border: 0,
        borderRadius: 3,
        boxShadow: '0 3px 5px 2px rgba(255, 255, 255, .3)',
        color: 'white',
        padding: 5,
        width: '300px'
    },
});

export default function UserLayout({data=[],selectService=0,size=[0.4,20],timeGap=0,...others}) {
    const texture = useLoader(THREE.TextureLoader, img)
    const classes = useStyles();
    const [hovered, set] = useState();
    const [freeze, setfreeze] = useState(false);
    // useEffect(() => void (prevRef.current = hovered), [hovered])
    const meshRef = useRef();
    const colorArray = useMemo(() => {
        setfreeze(false);
        set(undefined);
        return Float32Array.from(new Array(data.length).fill().flatMap((_, i) => [...tempColor.set(data[i].color??'white').toArray(),1]))}, [data,selectService]);
    const links= useMemo(()=>{
        const linkData = data.links??[];
        return linkData.map(l=>{
            const start = tempVec.set(...l[0]).clone();
            const end = tempVec.set(...l[1]).clone();
            const mid = start.clone().add(end.clone().sub(start)).add(new THREE.Vector3((start.x - end.x)/2, (start.y - end.y)/2, (start.z - end.z)/2-start.distanceTo(end)/2)) // prettier-ignore
            return new THREE.QuadraticBezierCurve3(start, mid, end);
        });
    },[data]);
    const linkRef = useMemo(()=>(data.links??[]).map(createRef),[data])
    useEffect(()=>{
        const simulation = forceSimulation();
        // copy nodes into simulation
        simulation.nodes([...data])
            .force("collide", forceCollide().radius(d => (d.scale??1)*size[0]).iterations(2))
        // slow down with a small alpha
        simulation.alpha(0.1).restart()
        return ()=>simulation.stop();
    },[data]);

    useFrame((state) => {
        const hoverEmpty = hovered===undefined;
        const notMetric = typeof selectService === 'string';
        data.forEach((d,i)=>{
            // tempObject.position.set(d[0], d[1], d[2]*timeGap);
            d.needupdate = false;
            if (d[0]!==d.x){
                d[0] = d.x;
                d.needupdate = true;
            }
            if (d[1]!==d.y){
                d[1] = d.y;
                d.needupdate = true;
            }
            tempObject.position.set(d.x, d.y, d[2]*timeGap);
            tempObject.scale.setScalar(d.scale??1);
            if ((hoverEmpty||(i===hovered)))
                d.alpha = 1;
            else{
                d.alpha = 0.01;
            }
            colorArray[i*4+3] = d.alpha;
            meshRef.current.geometry.attributes.color.needsUpdate = true;
            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObject.matrix)
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
        (data.links??[]).forEach((l,i)=>{
            if (l[0].needupdate) {
                const start = tempVec.set(...l[0]).clone();
                const end = tempVec.set(...l[1]).clone();
                const mid = start.clone().add(end.clone().sub(start)).add(new THREE.Vector3((start.x - end.x) / 2, (start.y - end.y) / 2, (start.z - end.z) / 2 - start.distanceTo(end) / 2)) // prettier-ignore
                links[i].v0 = start;
                links[i].v1 = mid;
                links[i].v2 = end;
                const p = links[i].getPoints(20);
                linkRef[i].current.geometry.setPositions(Float32Array.from(
                    new Array(p.length)
                        .fill()
                        .flatMap((item, index) => p[index].toArray())
                ));
                linkRef[i].current.geometry.attributes.position.needsUpdate = true;
                linkRef[i].current.geometry.computeBoundingSphere();
            }
            linkRef[i].current.visible = (l[0].alpha===1);
        });
        data.forEach((d,i)=> {
            d.needupdate = false;
        })
        // linkRef
    });
    const getDataPos = useCallback((d)=>{
        return [d[0], d[1], d[2]*timeGap]
    },[timeGap]);
    const onFree = useCallback(()=>{
        setfreeze(!freeze);
        if(freeze)
            set(undefined)
    },[freeze]);
    const mouseover = useCallback((e)=>{
        if(!freeze) set(e.instanceId)
    },[freeze]);
    const mouseout = useCallback((e)=>{
        if(!freeze) set(undefined)
    },[freeze]);
    return <><instancedMesh ref={meshRef} args={[null, null, data.length]}
                            onClick={onFree} onPointerMove={mouseover} onPointerOut={mouseout}>
        <circleGeometry args={size}>
            <instancedBufferAttribute attachObject={['attributes', 'color']} args={[colorArray, 4]} />
        </circleGeometry>

        <meshBasicMaterial vertexColors toneMapped={false} side={THREE.DoubleSide} transparent={true} map={texture} alphaTest={0} />
        {/*<meshStandardMaterial vertexColors toneMapped={false} transparent={true} alphaTest={0} />*/}
    </instancedMesh>
    {links.map((curve, index) => (
        <Line ref={linkRef[index]} key={index} points={curve.getPoints(20)} lineWidth={0.1} color="white" />
    ))}
    <Html scaleFactor={1}
          position={((hovered!==undefined)&&data[hovered])?getDataPos(data[hovered]):undefined}
          className={classes.tooltip} style={{ pointerEvents: "none", display: (hovered!==undefined) ? "block" : "none" }}>
        <div>
            {data[hovered]&&data[hovered].toolTip}
        </div>
    </Html>
    </>
}
