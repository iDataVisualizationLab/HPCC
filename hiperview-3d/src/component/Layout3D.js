import {Canvas} from "@react-three/fiber";
import {OrbitControls,GizmoHelper,GizmoViewcube,Center,OrthographicCamera} from "@react-three/drei";
import React from "react";
import NodeLayout from "./NodeLayout";
import LineLayout from "./LineLayout";
import LayoutMap from "./LayoutMap";
import {useControls} from "leva";

const Layout3D = function({data,line3D,layout,selectService}){
    const config = useControls("3D",{timeGap:{value:0.04,min:0,max:1,step:0.01},light:{value:0.5,min:0,max:1,step:0.01}});
    return <Canvas mode="concurrent">
        <OrthographicCamera makeDefault zoom={30} position={[-10,10,100]} />
        <ambientLight intensity={config.light}/>
        <Center>
            <LayoutMap data={layout}/>
            {/*{data.map((d,i)=><group key={i} position={[...d.position]}>*/}
            {data.map((d,i)=><group key={i} position={[0,0,0]}>
                <NodeLayout data={d.possArr} timeGap={config.timeGap} selectService={selectService}/>
            </group>)}
            <LineLayout data={line3D} timeGap={config.timeGap} selectService={selectService}/>
            <arrowHelper length={100}/>
        </Center>
        <GizmoHelper alignment={"top-left"} margin={[80, 80]}>
            <GizmoViewcube/>>
         </GizmoHelper>

        <OrbitControls/>
    </Canvas>
}
export default Layout3D;
