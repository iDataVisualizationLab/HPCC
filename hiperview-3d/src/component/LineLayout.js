import React, {useMemo, useRef, useState, useLayoutEffect, useCallback} from "react";
import {useFrame} from "@react-three/fiber";
import {Html} from "@react-three/drei";
import * as THREE from "three";
import makeStyles from "@mui/styles/makeStyles";
import * as _ from "lodash";
const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();
const tempV = new THREE.Vector3();
const useStyles = makeStyles({
    tooltip: {
        background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
        border: 0,
        borderRadius: 3,
        boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
        color: 'white',
        padding: 5,
        width: '300px'
    },
});
export default function LineLayout({data=[],selectService=0,timeGap=0,graphHeight=0.15,...others}) {
    const classes = useStyles();
    const [hovered, set] = useState()
    const meshRef = useRef();
    const [vertexArray,setVertex] = useState([]);
    useLayoutEffect(()=>{
        debugger
        const possFlat = [];
        data.forEach(d=>{
            const n = d.length;
            if (n) {
                if (_.isNumber(d[1].data.values[selectService]))
                    possFlat.push(d[0]);
                for (let i=1;i<d.length-1;i++){
                    if (_.isNumber(d[i-1].data.values[selectService]))
                        possFlat.push(d[i]);
                    if (_.isNumber(d[i+1].data.values[selectService]))
                        possFlat.push(d[i]);
                }
                if ((n>1)&&_.isNumber(d[n-2].data.values[selectService]))
                    possFlat.push(d[n-1]);
            }
        })
        setVertex(possFlat)
    },[data,selectService])
    const lineGeometry = useMemo(() => {
        const points = vertexArray.map(d=>new THREE.Vector3(d[0],d[1]+graphHeight*d.data.values[selectService],d[2]*timeGap));
        return new THREE.BufferGeometry().setFromPoints(points);
    }, [vertexArray])
    useFrame(()=>{
        // debugger
        // console.log(lineGeometry)
        // lineGeometry.attributes.position.
        vertexArray.forEach((d,id)=>{
            tempV.set(d[0],d[1]+graphHeight*d.data.values[selectService],d[2]*timeGap).toArray(lineGeometry.attributes.position.array, id * 3)  ;
        });
        lineGeometry.computeBoundingSphere();
        lineGeometry.attributes.position.needsUpdate = true;
    });
    // useFrame(() => {
    //     data.forEach((d,i)=>{
    //         tempObject.position.set(d[0], d[1], d[2]*timeGap);
    //         // tempColor.set(id === hovered ? 'white' : data[id].color).toArray(colorArray, id * 3)
    //         // meshRef.current.geometry.attributes.color.needsUpdate = true
    //         tempObject.updateMatrix();
    //         meshRef.current.setMatrixAt(i, tempObject.matrix)
    //     })
    //     meshRef.current.instanceMatrix.needsUpdate = true
    // });
    // const getDataPos = useCallback((d)=>{
    //     debugger
    //     return [d[0], d[1], d[2]*timeGap]
    // },[timeGap])
    return <><lineSegments ref={meshRef} geometry={lineGeometry}>
        <lineBasicMaterial attach="material" color={'#9c88ff'} linewidth={10} linecap={'round'} linejoin={'round'} />
    </lineSegments>
    </>
}
