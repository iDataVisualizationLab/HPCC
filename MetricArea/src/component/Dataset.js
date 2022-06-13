import {useState} from "react";
import {useControls} from "leva";
import * as d3 from "d3";
import {getUrl} from "./ulti";

export default function Dataset({onChange,onLoad,onError}) {
    const [datalist,setDatalist] = useState({
        'April 17-18 2022':'./data/nocona_24h.json',
        'Jieoyao use case':'./data/nocona-jieoyao.json',
        'May 6-13 2022':'./data/nocona_1week_update.json',
        'Jun 3-10 2022':'./data/nocona_1weeks_update.json',
        '2 week':'./data/nocona_2weeks.json',//'https://www.myweb.ttu.edu/ngu00336/data/hpcc/nocona_2weeks.json',
        '1 month':'./data/nocona_4weeks.json',
        'Real-time':'realtime',
    });
    const [past,setPast] = useState('');
    const [{currentDataset},setCurrentDataset] = useControls("Dataset",()=>({currentDataset:{
        value: './data/nocona_24h.json', options: datalist, onChange:(val)=>{
            if (val==='realtime'){
                onLoad('Query realtime data');
                const _end = new Date(); //'2020-02-14T12:00:00-05:00'
                let _start = new Date(_end - 9600000); //'2020-02-14T18:00:00-05:
                const interval = '1m';
                const value = 'max';
                const compress = false;
                const url = getUrl({_start,_end,interval,value,compress});
                d3.text(url).then(s=>{
                    onError({level:"success",message:"Successfully load"})
                    onLoad('Process data');
                    const _data = JSON.parse(s.replaceAll("NaN",'null'));
                    onChange(_data);
                    setPast(val);
                }).catch(e=>{
                    onError({level:"error",message:"Couldn't load realtime data"});
                    onLoad(false);
                    setCurrentDataset({currentDataset:past})
                })
            }else{
                if (past!==val) {
                    onLoad('Load historical data');

                    fetch(val, {
                        method: 'GET', // *GET, POST, PUT, DELETE, etc.
                        mode: 'cors', // no-cors, *cors, same-origin
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(response=>{
                        response.json().then(_data=>{
                            onChange(_data);
                            setPast(val);
                        })
                    }).catch(e => {

                        onError({level: "error", message: "Couldn't load data"})
                        onLoad(false);
                        setCurrentDataset({currentDataset:past})

                    });


                    // d3.json(val).then(_data => {
                    //
                    //     onChange(_data);
                    //     setPast(val);
                    // }).catch(e => {
                    //
                    //         onError({level: "error", message: "Couldn't load data"})
                    //         onLoad(false);
                    //         setCurrentDataset({currentDataset:past})
                    //
                    // })
                }
            }
        }, label:"Current"
    }
    }),[datalist,past]);

    return '';
}