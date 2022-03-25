import React, {useMemo, useRef, useState, useEffect, useCallback} from "react";
import {useFrame} from "@react-three/fiber";
import {Html} from "@react-three/drei";
import * as THREE from "three";
import makeStyles from "@mui/styles/makeStyles";

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();
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
export default function NodeLayout({data=[],selectService=0,size=[0.4, 0.1, 0.01],timeGap=0,stackOption=false,...others}) {
    const classes = useStyles();
    const [hovered, set] = useState();
    const [freeze, setfreeze] = useState(false);
    const prevRef = useRef();
    // useEffect(() => void (prevRef.current = hovered), [hovered])
    const meshRef = useRef();
    const colorArray = useMemo(() => {
        setfreeze(false);
        set(undefined);
        return Float32Array.from(new Array(data.length).fill().flatMap((_, i) => [...tempColor.set(data[i].color??'black').toArray(),1]))}, [data,selectService]);
    // useEffect(()=>{
    //     if (globeEl.current) {
    //         if (currentSequnce < MAP_CENTERs.length) {
    //             const interval = setTimeout(() => {
    //                 globeEl.current.pointOfView(MAP_CENTERs[currentSequnce], 4000)
    //                 setCurrentSequnce(currentSequnce + 1);
    //             }, 4000);
    //             return () => {
    //                 clearInterval(interval);
    //             };
    //         }
    //     }
    // },[currentSequnce]);

    useFrame((state) => {
        const hoverEmpty = hovered===undefined;
        const notMetric = typeof selectService === 'string'
        data.forEach((d,i)=>{
            tempObject.position.set(d[0], d[1]+(notMetric?0.5:(d.data.values[selectService]??0.5))*size[1], d[2]*timeGap);
            colorArray[i*4+3] = (hoverEmpty||(i===hovered))?1:0.01;
            meshRef.current.geometry.attributes.color.needsUpdate = true
            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObject.matrix)
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });
    const getDataPos = useCallback((d)=>{
        return [d[0], d[1], d[2]*timeGap]
    },[timeGap])
    return <><instancedMesh ref={meshRef} args={[null, null, data.length]}
                            onClick={(e)=>{setfreeze(!freeze); if(freeze) set(undefined)}} onPointerMove={(e) => {if(!freeze) set(e.instanceId)}} onPointerOut={(e) => {if(!freeze) set(undefined)}}>
        <boxGeometry args={size}>
            <instancedBufferAttribute attachObject={['attributes', 'color']} args={[colorArray, 4]} />
        </boxGeometry>
        <meshStandardMaterial vertexColors toneMapped={false} transparent={true} alphaTest={0} />
    </instancedMesh>
    <Html scaleFactor={1}
          position={((hovered!==undefined)&&data[hovered])?getDataPos(data[hovered]):undefined}
          className={classes.tooltip} style={{ pointerEvents: "none", display: (hovered!==undefined) ? "block" : "none" }}>
        <div>
            {data[hovered]&&data[hovered].data.toolTip}
        </div>
    </Html>
    </>
}
