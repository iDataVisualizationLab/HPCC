import {Canvas} from "@react-three/fiber";
import {OrbitControls, GizmoHelper, GizmoViewcube, Center, OrthographicCamera, BakeShadows} from "@react-three/drei";
import React, {Suspense} from "react";
import NodeLayout from "./NodeLayout";
import UserLayout from "./UserLayout";
import LineLayout from "./LineLayout";
import LayoutMap from "./LayoutMap";
import {useControls} from "leva";
import Effects from "./Effects";
import {Vector3} from "three";
import TimeAxis from "./TimeAxis";
import TWEEN from '@tweenjs/tween.js';

const Layout3D = function({data,time_stamp,line3D,layout,users,selectService}){
    const config = useControls("3D",{timeGap:{value:0.04,min:0,max:1,step:0.01},
        light:{value:0.5,min:0,max:1,step:0.01},
        cameraAnimate:{value:true}});
    return <Canvas mode="concurrent"
                   shadows gl={{ antialias: true }}
    >
        {/*<ambientLight intensity={config.light}/>*/}
        {/*<pointLight position={[150, 150, 150]} intensity={0.55} />*/}
        {/*<fog attach="fog" args={["red", 5, 35]} />*/}
        {/*<ambientLight intensity={1.5} />*/}
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <directionalLight
            castShadow
            intensity={config.light}
            position={[50, 50, 25]}
            shadow-mapSize={[256, 256]}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
        />
        <OrthographicCamera makeDefault zoom={30} position={[-10,10,100]} />
        {/*<Suspense fallback={null}>*/}
            <Center>
                <LayoutMap data={layout}/>
                {/*{data.map((d,i)=><group key={i} position={[...d.position]}>*/}
                {data.map((d,i)=><group key={i} position={[0,0,0]}>
                    <NodeLayout data={d.possArr} cameraAnimate={config.cameraAnimate} timeGap={config.timeGap} selectService={selectService}/>
                </group>)}
                <LineLayout data={line3D} timeGap={config.timeGap} selectService={selectService}/>
                <UserLayout data={users}/>
                <TimeAxis data={time_stamp} timeGap={config.timeGap}/>
            </Center>
            <GizmoHelper alignment={"top-left"} margin={[80, 80]}>
                <GizmoViewcube/>>
             </GizmoHelper>
            <BakeShadows />
        {/*</Suspense>*/}

        <OrbitControls/>
        <Effects />
    </Canvas>
}
export default Layout3D;
