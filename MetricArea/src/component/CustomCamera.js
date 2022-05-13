import {OrbitControls} from "@react-three/drei";
import React, {useEffect, useRef,useImperativeHandle} from "react";
import {useFrame,useThree} from "@react-three/fiber";
import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js"

const p = new THREE.Vector3(-10,10,100);
const p2 = new THREE.Euler(0,0,0);
const q = new THREE.Quaternion();

const spherical = new THREE.Spherical();
const rotationMatrix = new THREE.Matrix4();
const targetQuaternion = new THREE.Quaternion();

const CustomCamera = React.forwardRef(({cameraAnimate=false,...props},ref)=> {
    const {camera} = useThree()
    const divRef = useRef(null);
    useImperativeHandle(ref, () => ({
        pointOfView: function pointOfView() {
            var finalGeoCoords = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
            var transitionDuration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
            var curGeoCoords = {...camera.position,zoom:camera.zoom};//getGeoCoords(); // Getter

            var finalLookAt = {
                x: finalGeoCoords.lookAtX??0,
                y: finalGeoCoords.lookAtY??0,
                z: finalGeoCoords.lookAtZ??0
            };

            var o={t:0};
            p2.set(finalGeoCoords.rx,finalGeoCoords.ry,finalGeoCoords.rz)
            var qb = new THREE.Quaternion().setFromEuler(p2);

            new TWEEN.Tween(curGeoCoords).to(finalGeoCoords, transitionDuration).easing(TWEEN.Easing.Cubic.InOut)
                .onUpdate(_ref5=>{setCameraPos(_ref5)}).start();
            new TWEEN.Tween(o).to({t:1}, transitionDuration).easing(TWEEN.Easing.Cubic.InOut)
                .onUpdate(_ref5=>{setCameraRotation(_ref5)}).start();
            new TWEEN.Tween(getLookAt()).to(finalLookAt, transitionDuration).easing(TWEEN.Easing.Cubic.InOut)
                .onUpdate(_ref5=>{setLookAt(_ref5)}).start();
            function setCameraPos(pos) {
                var x = pos.x??camera.position.x,
                    y = pos.y??camera.position.y,
                    z = pos.z??camera.position.z;
                p.set(x,y,z);
                if (divRef.current&&divRef.current.target){
                    divRef.current.object.position.lerp(p,1);
                    divRef.current.object.zoom=pos.zoom??divRef.current.object.zoom ;
                    divRef.current.object.updateProjectionMatrix();
                    divRef.current.update();
                }else{
                    camera.position.lerp(p,1);
                    camera.zoom=pos.zoom??camera.zoom ;
                    camera.updateProjectionMatrix();
                }
            }
            function setCameraRotation({t}){
                if (divRef.current&&divRef.current.target){
                    console.log(divRef.current.object.rotation)
                    divRef.current.object.quaternion.slerp(qb,t);
                    divRef.current.object.updateProjectionMatrix();
                    divRef.current.update();
                }else{
                    camera.quaternion.slerp(qb,t);
                    camera.updateProjectionMatrix();
                }
            }
            function getLookAt() {
                if (divRef.current&&divRef.current.target)
                    return divRef.current.target;
                return Object.assign(new THREE.Vector3(0, 0, 0).applyQuaternion(camera.quaternion).add(camera.position));
            }
            function setLookAt(pos) {
                var x = pos.x,
                    y = pos.y,
                    z = pos.z;
                p.set(x,y,z);
                if (divRef.current&&divRef.current.target){
                    divRef.current.target.lerp(p,1);
                    divRef.current.update();
                }else{
                    camera.lookAt(p);
                    camera.updateProjectionMatrix();
                }
            }
        },
        current: divRef.current
    }),[camera]);
    useFrame((state)=>{
        // if (cameraAnimate)
            TWEEN.update()
    })

    return <OrbitControls ref={divRef} makeDefault  enableDamping={false} {...props}/>
})
export default CustomCamera;
