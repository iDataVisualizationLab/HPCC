import {OrbitControls} from "@react-three/drei";
import React, {useEffect, useRef,useImperativeHandle} from "react";
import {useFrame,useThree} from "@react-three/fiber";
import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js"

const p = new THREE.Vector3(-10,10,100)
const q = new THREE.Quaternion();
const CustomCamera = React.forwardRef(({cameraAnimate=false,...props},ref)=> {
    const {camera} = useThree()
    const divRef = useRef(null);
    useImperativeHandle(ref, () => ({
        pointOfView: function pointOfView() {
            var finalGeoCoords = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
            var transitionDuration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
            var curGeoCoords = {...camera.position,zoom:camera.zoom};//getGeoCoords(); // Getter
            new TWEEN.Tween(curGeoCoords).to(finalGeoCoords, transitionDuration).easing(TWEEN.Easing.Cubic.InOut)
                .onUpdate(_ref5=>{console.log(_ref5); setCameraPos(_ref5)}).start();
            function setCameraPos(pos) {
                var x = pos.x??camera.position.x,
                    y = pos.y??camera.position.y,
                    z = pos.z??camera.position.z;
                p.set(pos.x,pos.y,pos.z)
                camera.position.lerp(p,0.025);
                camera.zoom=pos.zoom ;
                camera.updateProjectionMatrix();
            }
        },
        current: divRef.current
    }),[camera]);
    useFrame((state)=>{
        if (cameraAnimate)
            TWEEN.update()
    })

    return <OrbitControls ref={divRef} enableDamping={false} {...props}/>
})
export default CustomCamera;
