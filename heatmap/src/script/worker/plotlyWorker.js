let window = self;
importScripts("../../../../HiperView/js/d3.v4.js");
importScripts("../../../../HiperView/js/underscore-min.js");
importScripts("../../../../HiperView/js/lodash.min.js");

let namelist,schema,serviceIndex,serviceListattr,hostResults;
addEventListener('message',function ({data}){
    switch (data.action) {
        case "initDataRaw":
            namelist = data.namelist;
            schema = data.schema;
            serviceIndex = data.serviceIndex;
            serviceListattr = data.serviceListattr;
            hostResults = data.hostResults;
            scaleTime = d3.scaleLinear().domain(data.scaleTime.domain).range(data.scaleTime.range);
            let layout = {
                paper_bgcolor:"#ddd",
                plot_bgcolor:"#ddd",
                margin: {
                    l: 50,
                    r: 50,
                    b: 20,
                    t: 50,
                },
            };



            const data_in = namelist.map( name=>{
                let s =schema[serviceIndex];
                let temp = {x:[],
                    y:[],
                    text:[],
                    mode: 'lines',
                    hovertemplate: '%{text}',
                    marker:{
                        symbol:s.id
                    },
                    line: {
                        color: '#000',
                        width: 1
                    }
                };
                hostResults[name][serviceListattr[s.idroot]].forEach((e,ti) => {
                    temp.x.push(new Date(scaleTime.invert(ti)));
                    temp.y.push(d3.scaleLinear().domain(s.range)(e[s.id]));
                    temp.text.push(e[s.id]);
                });
                temp.name = name;
                let data_temp = temp;
                return data_temp;
            });
            layout.title = name;
            layout.yaxis = {
                autorange: true
            };
            layout.xaxis = {
                autorange: true,
                range: scaleTime.domain(),
                rangeslider: {range: scaleTime.domain()},
            };
            postMessage({action:'return', layout:layout,data_in:data_in});
            break;
    }
});
