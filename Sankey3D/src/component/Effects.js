import React, { useRef, useEffect } from 'react'
import { EffectComposer, SSAO, Bloom } from "@react-three/postprocessing"


export default function Effects() {
    return (
        <EffectComposer>
            {/*<SSAO radius={0.4} intensity={50} luminanceInfluence={0.4} color="red" />*/}
            {/*<Bloom intensity={1.25} kernelSize={2} luminanceThreshold={0.85} luminanceSmoothing={0.0} />*/}
        </EffectComposer>
    )
}
