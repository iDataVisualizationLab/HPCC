import {useData} from "../../container/Data";
import NetAgnostics from "../NetAgnostics/wrapper";
import AutoSizer from "react-virtualized-auto-sizer";
import Loading from "../Loading/Loading";
import {useEffect, useMemo, useState} from "react";
import ColorLegend from "../ColorLegend";
import {scaleLinear} from "d3";
import {colorScaleList} from "../../ulti";

const emptyObject = {};
const emptyArray = [];
const initColorFunc =  scaleLinear().domain([0,0.2, 0.4, 0.6, 0.8, 0.9, 1]).range(colorScaleList.colorBlueRed)
export default function (){
    const {getList,isLoading,queryData,getQuery} = useData();
    const [selectedSer,setselectedSer] = useState(0);
    const [query,setQuery] = useState({byUser:{}});
    const [scheme,setScheme] = useState({});
    const [userList,setUserList] = useState([]);
    useEffect(()=>{
        queryData('./data/nocona_2023-04-13-2023-04-14.json')
        // queryData('./data/nocona_2023-06-01-2023-06-07.json')
    },[])
    const _scheme = getList('scheme');
    useEffect(()=>{
        debugger
        if (_scheme) {
            setScheme(_scheme);
            const userList = Object.keys(_scheme.users);
            userList.sort()
            setUserList(userList);
        }else{
            setScheme(emptyObject);
            setUserList(emptyArray);
        }
    },[_scheme]);

    useEffect(()=>{
        debugger
        getQuery(query);
    },[query,_scheme])

    const nodeFilter = getList('nodeFilter');
    const dimensions = getList('dimensions')??[];


    const colorNet = useMemo(()=> {
        if (dimensions[selectedSer]) {
            const netMin = dimensions[selectedSer].suddenRange[0];
            const netMax = dimensions[selectedSer].suddenRange[1];
            return initColorFunc.copy().domain([netMin, netMin / 2, netMin / 4, 0, netMax / 4, netMax / 2, netMax]);
        }else
            return initColorFunc
    },[dimensions,selectedSer]);



    return <div className={"flex w-full h-full"}>
        <div className={"flex-initial w-64 p-1"}>
            <h2 className={'text-right'}>Time</h2>

            <h4 className={'text-center font-bold'}>{dimensions[selectedSer]?.text} Net</h4>
            <div style={{maxWidth:'100%', height:30, marginLeft:10}}>
                <ColorLegend colorScale={colorNet} range={colorNet.domain()} style={{overflow:'visible',paddingRight:10}}/>
            </div>

            <div className={" p-3 rounded bg-slate-300 shadow"}>
                <label htmlFor="countries" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Primary Variable</label>
                <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        value={selectedSer}
                        onChange={(event)=>setselectedSer(event.currentTarget.value)}>
                    {dimensions.map((s,i)=><option key={i} value={i}>{s.text}</option>)}
                </select>

                <label htmlFor="countries" className="block mt-5 mb-2 text-sm font-medium text-gray-900 dark:text-white">Filter by user</label>
                <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        onChange={(event)=> {
                            if (event.currentTarget.value && (event.currentTarget.value!=='All users'))
                                setQuery({...query,byUser: {[event.currentTarget.value]:true}})
                            else if (query){
                                setQuery({...query,byUser:{}})
                            }
                        }}
                        defaultValue={undefined}
                >
                    <option selected={!query.byUser} value={undefined}>{'All users'}</option>
                    {userList.map((u,i)=><option key={u} selected={u in (query.byUser)} value={u}>{u}</option>)}
                </select>
            </div>
        </div>
        <div className={"flex-grow w-full h-full"}>
            <AutoSizer style={{width:'100%',height:'100%'}}>
                {({height, width}) =>
                    <NetAgnostics
                        width={width}
                        height={height}
                        colorNet={colorNet}
                        timeRange={scheme.timerange}
                        node={nodeFilter}
                        serviceSelected={selectedSer}
                        metrics={scheme.tsnedata}
                        dimensions={dimensions}
                        time={scheme.time_stamp}
                    />
                }
            </AutoSizer>
        </div>
        {(isLoading('data')||isLoading('scheme'))&&<Loading/>}
    </div>
}