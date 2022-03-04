import React,{useMemo,useRef,useState,useLayoutEffect} from "react";
import {useFrame} from "@react-three/fiber";
import * as THREE from "three";
const tempObject = new THREE.Object3D()
const tempColor = new THREE.Color()
export default function NodeLayout({data=[],size=[0.6, 0.3, 0.01],timeGap=0,...others}) {
    const [hovered, set] = useState()
    const meshRef = useRef();
    const colorArray = useMemo(() => Float32Array.from(new Array(data.length).fill().flatMap((_, i) => tempColor.set(data[i].color??'black').toArray())), [data]);
    useFrame(() => {
        data.forEach((d,i)=>{
            tempObject.position.set(d[0], d[1], d[2]*timeGap);
            // tempColor.set(id === hovered ? 'white' : data[id].color).toArray(colorArray, id * 3)
            // meshRef.current.geometry.attributes.color.needsUpdate = true
            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObject.matrix)
        })
        meshRef.current.instanceMatrix.needsUpdate = true
    });
    return <instancedMesh ref={meshRef} args={[null, null, data.length]}>
        <boxGeometry args={size}>
            <instancedBufferAttribute attachObject={['attributes', 'color']} args={[colorArray, 3]} />
        </boxGeometry>
        <meshPhongMaterial vertexColors={THREE.VertexColors} />
    </instancedMesh>
}
