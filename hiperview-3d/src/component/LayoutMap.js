import React,{useFrame,useRef} from "react"
import {Text,Plane} from "@react-three/drei"
import {MathUtils} from "three"

export default function Layout3D({data}){
    const mapData = React.useMemo(() => {
        const layout=[];
        Object.keys(data).forEach(k=>{
            layout.push({position:data[k].position,size:data[k].size,color:'gray',text:k});
        })
        return layout;
    }, [data]);
    return (<>{mapData.map((d,i)=><><Text key={i} position={[d.position[0]+d.size[0]/2,d.position[1]+0.1,d.position[2]]} direction={"auto"}
                                     anchorX="center"
                                     anchorY="bottom"
                                     fontSize={0.3}>{d.text}</Text>
        <Plane position={[d.position[0] + d.size[0]/2,d.position[1]- d.size[1]/2,d.position[2]]} args={[d.size[0], d.size[1]]} >
            <meshBasicMaterial attach="material" color={d.color} />
        </Plane>
    </>)}
        {/*<Grid scale={10}/>*/}
    </>)
}

function Grid({ children, scale, divisions = 10, ...props }) {
    const grid = useRef()
    const plane = useRef()
    return (
        <group {...props}>
            <group scale={scale}>
                <gridHelper ref={grid} position={[0, 0, 0]} args={[1, divisions]} />
                <mesh receiveShadow ref={plane} rotation-x={-Math.PI / 2}>
                    <planeGeometry />
                    <meshStandardMaterial transparent color="lightblue" polygonOffset polygonOffsetUnits={1} polygonOffsetFactor={1} />
                </mesh>
            </group>
        </group>
    )
}
