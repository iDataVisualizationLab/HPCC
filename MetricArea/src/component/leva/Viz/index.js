import React from "react";
import { createPlugin } from 'leva/plugin'
import Viz from "./Viz";
import {normalize, sanitize} from "./plugin";


export const viz = createPlugin({
    normalize,
    sanitize,
    component: Viz,
})
