import React, {useMemo, useRef, useState, useEffect, useCallback, createRef} from "react";
import {useFrame,useLoader} from "@react-three/fiber";
import {Html, Line, Text} from "@react-three/drei";
import {scaleTime} from 'd3'

import * as THREE from "three";
import {Vector3} from "three";
import {multiFormat} from "./ulti";
const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();
const tempVec = new THREE.Vector3();

const ORIGIN = [new Vector3(0, 0, 0),new Vector3(0, 0, 1)];

export default function TimeAxis({data=[],selectService=0,size=[0.4,20],timeGap=0,...others}) {const meshRef = useRef();
  const lineRef=useRef();
  const ticks= useMemo(()=>{
        const scale = scaleTime().domain([data[0], data[data.length-1]]).range([0,data.length-1]);
        ORIGIN[1].set(0,0,(data.length-1)*timeGap);
        if (lineRef.current)
        {
            lineRef.current.geometry.setPositions(Float32Array.from(
              new Array(ORIGIN.length)
                  .fill()
                  .flatMap((item, index) => ORIGIN[index].toArray())
            ));
            lineRef.current.geometry.attributes.position.needsUpdate = true;
        }
        return scale.ticks().map(d=>({key:d,text:multiFormat(d),pos:[0,0,scale(d)*timeGap]}))
    },[data,timeGap]);
    // useFrame((state) => {
    //     const hoverEmpty = hovered===undefined;
    //     const notMetric = typeof selectService === 'string';
    //     data.forEach((d,i)=>{
    //         // tempObject.position.set(d[0], d[1], d[2]*timeGap);
    //         d.needupdate = false;
    //         if (d[0]!==d.x){
    //             d[0] = d.x;
    //             d.needupdate = true;
    //         }
    //         if (d[1]!==d.y){
    //             d[1] = d.y;
    //             d.needupdate = true;
    //         }
    //         tempObject.position.set(d.x, d.y, d[2]*timeGap);
    //         tempObject.scale.setScalar(d.scale??1);
    //
    //         meshRef.current.geometry.attributes.color.needsUpdate = true;
    //         tempObject.updateMatrix();
    //         meshRef.current.setMatrixAt(i, tempObject.matrix)
    //     });
    //     meshRef.current.instanceMatrix.needsUpdate = true;
    // });
    // const getDataPos = useCallback((d)=>{
    //     return [d[0], d[1], d[2]*timeGap]
    // },[timeGap])
    return <>
        <Line ref={lineRef} points={ORIGIN} color="white"/>
        <group position={[-0.2,0,0]}>
        {
            ticks.map(d=><Text key={d.key} position={d.pos} scale={3} color="white" anchorX="right" anchorY="middle">
                {d.text}
            </Text>)
        }
        </group>
        {/*<arrowHelper args={[UP,ORIGIN,data.length*timeGap]}/>*/}
    </>
}
