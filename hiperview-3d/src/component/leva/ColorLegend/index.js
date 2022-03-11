import React from "react";
import { createPlugin } from 'leva/plugin'
import ColorLegendGraph from "./ColorLegend";
import { normalize, sanitize, format } from './plugin'


export const colorLegend = createPlugin({
    normalize,
    sanitize,
    format,
    component: ColorLegendGraph,
})
