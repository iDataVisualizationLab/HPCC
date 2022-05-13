import {scaleSequential,interpolateTurbo} from "d3"
import { normalizeVector, sanitizeVector ,formatVector} from 'leva/plugin'

export const sanitize = (value, settings, prevValue) => {
    const _value = sanitizeVector(value, settings, prevValue);
    const newValue = _value;
    return newValue
};

export const format = (value, settings) => {
    return value
}

const defaultSettings = { height:30,barHeight:10,style:{},range:[0,1], colorFunc:scaleSequential().interpolator(interpolateTurbo).domain([0,1])}

export const normalize = ({ colorFunc=scaleSequential().interpolator(interpolateTurbo).domain([0,1]),value, ..._settings }) => {
    const newvalue = value.slice();
    const settings = { ...defaultSettings, ..._settings }
    return { value:newvalue, settings}
}
