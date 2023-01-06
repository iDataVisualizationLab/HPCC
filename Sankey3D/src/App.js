// import logo from './logo.svg';
import './App.css';
import AreaStack from "./component/AreaStack_user"
import LineStack from "./component/LineStack_user"
import React, {useState, useEffect, useCallback, useMemo, useLayoutEffect, useRef} from "react";
import {Grid, Backdrop, CircularProgress, createTheme,FormControl,InputLabel,Select,MenuItem,Typography} from "@mui/material";
import CssBaseline from '@mui/material/CssBaseline';
import {ThemeProvider} from '@mui/material/styles';
import * as d3 from "d3"

import _layout from "./data/layout";
// import _data from "./data/2182022";
// import _data from "./data/nocona_24h";
// import _data from "./data/nocona-jieoyao";
import * as _ from "lodash";
import {getRefRange, getUrl} from "./component/ulti"
import ColorLegend from "./component/ColorLegend";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Slider from "@mui/material/Slider";
import Container from "@mui/material/Container";
import { useControls, folder, button } from 'leva';
import {outlier} from './component/outlier'
import {calculateCluster} from './component/cluster'
import {colorLegend} from "./component/leva/ColorLegend";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import {viz} from "./component/leva/Viz";
import {Radar} from "./component/radar";
import Dataset from "./component/Dataset";
import DataProcss from "./component/DataProcess";

const ColorModeContext = React.createContext({
    toggleColorMode: () => {
    }
});

function App() {
    const [_data, set_Data] = useState(undefined);
    const [alertMess, setAlertMess] = useState();
    const [isBusy, setIsBusy] = useState("Load data");
    const [mode, setMode] = React.useState('light');



    const colorMode = React.useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
            },
        }),
        [],
    );

    const theme = React.useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                },
            }),
        [mode],
    );


    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                    <Dataset onChange={(_data)=>set_Data(_data)} onLoad={(m)=>setIsBusy(m)} onError={(e)=>setAlertMess(e)}/>

                {_data&&<DataProcss _data={_data} onLoad={(m)=>setIsBusy(m)} theme={theme}/>}
                    <Backdrop
                        sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}
                        open={!!isBusy}
                    >
                        <h1>{isBusy}</h1>
                        <CircularProgress color="inherit"/>
                    </Backdrop>
                <Snackbar anchorOrigin={{vertical:"top",horizontal:"right"}} open={!!alertMess} autoHideDuration={4000} onClose={()=>setAlertMess(undefined)}>
                    <Alert severity={alertMess&&alertMess.level} sx={{ width: '100%' }}>
                        {alertMess&&alertMess.message}
                    </Alert>
                </Snackbar>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

export default App;

function shortArray(arr=[],limit=2){
    return arr.length>limit?(arr.slice(0,limit).join(',')+`, +${arr.length-limit} more`): arr.join(',')
}
function adjustTime(d){
    if (d > 999999999999999999)
        return d / 1000000;
    else if (d < 9999999999){
        return d * 1000;
    }
    return d;
}