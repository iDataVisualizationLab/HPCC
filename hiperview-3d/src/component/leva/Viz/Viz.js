import React from "react";
import {uniqueId} from "lodash";

import { useInputContext, styled, Components } from 'leva/plugin'

const { Label, Row } = Components;


export default function Viz(){
    const { label,value, displayValue, settings, onUpdate, onChange, setSettings } = useInputContext();
    const { com } = settings;
    
    return <>
        <Row><Label>{label}</Label></Row>
        <Row>
            {com}
        </Row>
    </>
}
