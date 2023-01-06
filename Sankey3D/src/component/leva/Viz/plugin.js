import {scaleSequential,interpolateTurbo} from "d3"
import { normalizeVector, sanitizeVector ,formatVector} from 'leva/plugin'

export const sanitize = (value, settings, prevValue) => {
    debugger
    const _value = sanitizeVector(value, settings, prevValue);
    const newValue = _value;
    return newValue
};

export const format = (value, settings) => {
    return value
}

const defaultSettings = { }

export const normalize = ({ value, ..._settings }) => {
    const settings = { ...defaultSettings, ..._settings }
    return { value, settings}
}
