import React, {useState, useCallback, useMemo, useLayoutEffect} from "react";
import * as d3 from "d3"

import _layout from "../data/layout";
import * as _ from "lodash";
import {getRefRange, JOB_STATE} from "./ulti"
import {useControls, folder, button} from 'leva';
import Grid from "./general/Grid";
import Container from "./general/Container";

const coreLimit = 128;
const colorByMetric = d3.scaleSequential()
    .interpolator(d3.interpolateTurbo).domain([0, 1]);
const colorByName = d3.scaleOrdinal(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#bcbd22", "#17becf", "#aec7e8", "#ffbb78", "#98df8a", "#ff9896", "#c5b0d5", "#c49c94", "#f7b6d2", "#dbdb8d", "#9edae5"])
const colorByVal = d3.scaleSequential(d3.interpolateGreys).domain([1, -0.25]);
let color = colorByName;
const userEncoded = false;

const STATE_KEYS = {MARKER_TIME_START:'value_changed_at',MARKER_TIME_END:'value_end_at',MARKER_TYPE:'value'}
const STATE_KEY = 'nodes_alloc'




function DataProcss({onLoad, theme, _data}) {
    const [scheme, setScheme] = useState({data: {}, users: {}, time_stamp: [], timerange: [new Date(), new Date()]});
    const [dimensions, setDimensions] = useState([]);
    const [layout, setLayout] = useState(_layout);
    const [drawUserData, setDrawUserData] = useState([]);

    // holder

    useLayoutEffect(() => {
        const {scheme, drawUserData, dimensions, layout, sankeyData} = handleData(_data);
        setDimensions(dimensions);

        setScheme(scheme);
        setSankeyData(sankeyData);
        setDrawUserData(drawUserData);
        setLayout(layout);
        onLoad(false);
        const timerange = [+scheme.time_stamp[0], +scheme.time_stamp[scheme.time_stamp.length - 1]];
        setSelectedTime({min: timerange[0], max: timerange[1], value: timerange, arr: scheme.time_stamp.slice()})
    }, [_data]);
    const optionsColor = useMemo(() => {
        const option = dimensions.reduce((a, v) => ({...a, [v.text]: v.index}), {});
        // option["Dataset cluster"] = "cluster"
        return option;
    }, [dimensions]);
    const optionsUser = useMemo(() => {
        const option = {'': undefined};
        Object.keys(scheme.users).forEach(d => option[d] = d);
        // option["Dataset cluster"] = "cluster"
        return option;
    }, [scheme.users]);
    const optionsView = useMemo(() => {
        const option = dimensions.reduce((a, v) => ({...a, [v.text]: v.index}), {'': undefined});
        return option;
    }, [dimensions]);
    const [selectedUser, setSelectedUser] = useState();//useControls("Setting",()=>({"selectedUser":{label:'User',value:undefined,options:optionsUser}}),[optionsUser]);

    const [{metricRangeMinMax}, setMetricRangeMinMax] = useControls("Setting", () => (
        {
            metricRangeMinMax: {
                value: false, label: 'Min-Max scale', onChange: (metricRangeMinMax) => {
                    if (metricRangeMinMax) {
                        dimensions.forEach(dim => {
                            dim.range = [dim.min, dim.max];
                            dim.scale.domain(dim.range)
                        })
                    } else {
                        dimensions.forEach(dim => {
                            dim.range = dim.possibleUnit.range.slice();
                            dim.scale.domain(dim.range)
                        })
                    }

                    if (scheme.computers) {
                        Object.keys(scheme.computers).forEach(d => {
                            scheme.time_stamp.forEach((t, ti) => {
                                dimensions.forEach((dim, ki) => {
                                    scheme.tsnedata[d][ti][ki] = dimensions[ki].scale(scheme.computers[d][dim.text][ti] ?? undefined) ?? null;
                                })
                            })
                        });
                    }
                    setDimensions(dimensions)
                }, transient: false
            }
        }), [dimensions, scheme.computers]);

    const metricSetting = useMemo(() => {
        // if (dimensions[selectedSer]){
        //     const range = (dimensions[selectedSer]??{range:[0,1]}).range;
        //     return {
        //         // legend:colorLegend({label:'Legend',
        //         // value:(dimensions[selectedSer]??{range:[0,1]}).range,range:(dimensions[selectedSer]??{range:[0,1]}).range,scale:colorByMetric}),
        //
        //         filterLarger:{value:true,label:'Greater than'},
        //         metricFilter:{value:range[0],label:'',min:(dimensions[selectedSer]??{range:[0,1]}).range[0],max:(dimensions[selectedSer]??{range:[0,1]}).range[1],step:0.1}
        //         ,suddenThreshold:{value:0,min:0,max:(dimensions[selectedSer]??{max:1}).max,step:0.1, label:"Sudden Change"}}
        // }else{
        //     return {filterLarger:{value:true,label:'Greater than'}}
        // }
        return {}
    }, [dimensions, selectedSer, metricRangeMinMax]);

    const binopt = useControls("DatasetCluster", {
        clusterMethod: {label: 'Method', value: 'leaderbin', options: ['leaderbin', 'kmean']},
        normMethod: {value: 'l2', options: ['l1', 'l2']},
        bin: folder({
            startBinGridSize: {value: 10, render: () => false},
            range: {value: [8, 9], min: 1, step: 1, max: 20}
        }, {label: 'parameter', render: (get) => get("DatasetCluster.clusterMethod") === "leaderbin"}),
        kmean: folder({k: {value: 8, step: 1, min: 2}, iterations: {value: 10, min: 1, step: 1}}, {
            label: 'parameter',
            render: (get) => get("DatasetCluster.clusterMethod") === "kmean"
        }),
        // DataProcssly:button((get)=>{console.log(get("Cluster"));recalCluster(scheme, dimensions)}),
        "iqr": {min: 1.5, max: 4, step: 0.1, value: 1.5},
    }, {
        label: "Dataset Cluster",
        collapsed: true
    });

    return (

        <Grid container style={{height: "100vh", width: '100wh', overflowY: 'auto'}}>
            <Container maxWidth="lg">
                <Grid container>
                    <Grid item xs={12}>
                        <h3>Nocona <Typography variant="subtitle1"
                                               style={{display: 'inline-block'}}>from {scheme.timerange[0].toLocaleString()} to {scheme.timerange[1].toLocaleString()}</Typography>
                        </h3>
                    </Grid>
                    <Grid item xs={2}>
                        {
                            selectedUser && <>
                                #Jobs: {scheme.users[selectedUser].job.length} #Nodes: {scheme.users[selectedUser].node.length}</>

                        }</Grid>
                </Grid>
            </Container>
            {/*<div style={{height: "auto", width: '100%'}}>*/}
            {/*    <ParallelCoordinate data={scheme.jobs??{}}/>*/}
            {/*</div>*/}
            <div style={{height: "auto", width: '100%'}}>
                <PowerViewWrapper node={scheme.computers??[]}
                                  metrics={scheme.tsnedata}
                                  dimensions={dimensions}
                                  state={scheme[STATE_KEY]}
                                  stateKeys={STATE_KEYS}
                                  time={scheme.time_stamp}/>
                {/*<TimeLineWrapper node={scheme.computers??[]} job={scheme.jobs??{}}*/}
                {/*                 serviceSelected={selectedSer}*/}
                {/*                 metrics={scheme.tsnedata}*/}
                {/*                 dimensions={dimensions}*/}
                {/*                 // state={scheme.node_state}*/}
                {/*                 state={scheme[STATE_KEY]}*/}
                {/*                 stateKeys={STATE_KEYS}*/}
                {/*                 time={scheme.time_stamp}/>*/}
            </div>
            <div style={{height: "auto", width: '100%'}}>
                <JobPie data={scheme.jobs??{}}/>
            </div>
            <div style={{height: "auto", width: '100%'}}>
                <TimeLineWrapper node={scheme.computers??[]} job={scheme.jobs??{}}
                                 serviceSelected={selectedSer}
                                 metrics={scheme.tsnedata}
                                 dimensions={dimensions}
                                 // state={scheme.node_state}
                                 state={scheme[STATE_KEY]}
                                 stateKeys={STATE_KEYS}
                                 time={scheme.time_stamp}/>
            </div>
        {/*    <div style={{height: "auto", width: '100%'}}>*/}
        {/*        <TimeLineArrayWrapper*/}
        {/*            node={scheme.computers??[]}*/}
        {/*            job={scheme.jobs??{}}*/}
        {/*            user={scheme.users??{}}*/}
        {/*             serviceSelected={selectedSer}*/}
        {/*             metrics={scheme.tsnedata}*/}
        {/*             dimensions={dimensions}*/}
        {/*// state={scheme.node_state}*/}
        {/*             time={scheme.time_stamp}/>*/}
        {/*    </div>*/}
            {/*<div style={{height: "100vh", width: '100vw', overflow: 'hidden'}}>*/}
            {/*    <LineBand time_stamp={scheme.time_stamp}*/}
            {/*           metrics={scheme.tsnedata}*/}
            {/*           theme={theme}*/}
            {/*           dimensions={dimensions}*/}
            {/*           config={config}*/}
            {/*           scheme={scheme}*/}
            {/*    />*/}
            {/*</div>*/}
        </Grid>
    );
}

export default DataProcss;

function shortArray(arr = [], limit = 2) {
    return arr.length > limit ? (arr.slice(0, limit).join(',') + `, +${arr.length - limit} more`) : arr.join(',')
}

function adjustTime(d) {
    if (d > 999999999999999999)
        return d / 1000000;
    else if (d < 9999999999) {
        return d * 1000;
    }
    return d;
}