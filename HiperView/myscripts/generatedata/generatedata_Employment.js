// serviceListattr.map(s=>{return{v:s,missing:hosts.map(h=>{return{h:h.name,v:sampleS[h.name][s].filter(d=>d[0]===undefined).length}}).filter(d=>d.v)}})
//     // d3.text("../raw/state.txt"),
//     var files=[];
//     d3.tsv("../HiperView/data/data_raw/Industrycode.txt",function(file){
//         files.push(file);
//         d3.tsv("../HiperView/data/data_raw/statecode.txt",function(file){
//             files.push(file);
//             d3.csv("../HiperView/data/data_raw/employment.txt",function(file){
//                 files.push(file);
//                 d3.json("../HiperView/data/data_raw/LabolForce.json",function(file) {
//                     files.push(file);
//                     // files[0] will contain file1.csv
//                     // files[1] will contain file2.csv
//                     console.log(files)
//
//                     var industries_remove = ["10000000","15000000","31000000","32000000","55520000","60550000","65610000","70710000","90910000","90920000","90930000","08000000","60560000","65620000","20000000","50000000","55530000","60540000","70720000"];
//
//                     var industries = files[0].map(d => {
//                         return {code: d.code, value: d.name.trim().replace(/-| /g, '_').replace(/,_/g, '|')}
//                     }).filter(d=>!industries_remove.find(e=>d.code===e));;
//                     industries.map(d => d.value);
//                     var dataRaw = files[2]
//                     var data = {};
//                     var csv = 'timestamp';
//                     var timerange = files[2].columns.filter(d => d !== 'Series ID' && d.match("Annual ") === null);
//                     timerange.pop();
//                     timerange.pop();
//                     timerange.pop();
//                     timerange=timerange.slice(0,244)
//                     let force = file.filter(f=>f.Measure==="labor force");
//                     force.forEach(d=>{
//                         d.state = d.state.trim().replace(/ /g, '_');
//                         d.time = d.time.slice(36,36+244);
//                         d.data = d.data.slice(36,36+244);
//                     });
//                     console.log(force[0].time);
//
//                     var states = files[1].filter(d => d !== "");
//                     states.forEach(d => d.name = d.name.trim().replace(/ /g, '_'));
//
//                     var countrylist_remove = ["72","78"];
//                     var countrylist = states.filter(d=>!countrylist_remove.find(e=>d.code===e))
//                         .map(d => d.name);
//                     countrylist.forEach((c, ci) => {
//                         industries.map(d => d.value).forEach((s, si) => {
//                             csv += `,${c}-${s}`;
//
//                         })
//                     });
//                     console.log(csv)
//                     console.log(timerange)
//                     timerange.forEach((t, ti) => {
//                         csv += `\n${t},` + countrylist.map((c, ci) => {
//                             var force_local = force.find(f=>f.state===c);
//                             return industries.map(d => {
//                                 var s = d.value;
//                                 var code = generatecode('SMS', c, s);
//                                 var instance = dataRaw.find(d => d['Series ID'] === code);
//                                 var v = 0;
//                                 if (instance) {
//                                     v = +instance[t].split('(')[0];
//                                     v = Math.abs(v);
//                                     v = (v/(+force_local.data[ti]))*100*1000;
//                                     return v;
//                                 }
//                                 return '';
//                             }).join(',');
//                         });
//                     });
//
//                     // data["Variables"].shift();
//                     function generatecode(pre, state, industry) {
//                         const statecode = states.find(d => d['name'] === state)['code'];
//                         const inscode = industries.find(d => d['value'] === industry)['code'];
//                         return pre + statecode + '00000' + inscode + '01';
//                     }
//
//                     console.log(csv)
//                 });
//             })
//         })
//     })


// net change

// serviceListattr.map(s=>{return{v:s,missing:hosts.map(h=>{return{h:h.name,v:sampleS[h.name][s].filter(d=>d[0]===undefined).length}}).filter(d=>d.v)}})
// d3.text("../raw/state.txt"),
var files=[];
d3.tsv("../HiperView/data/data_raw/Industrycode.txt",function(file){
    files.push(file);
    d3.tsv("../HiperView/data/data_raw/statecode.txt",function(file){
        files.push(file);
        d3.csv("../HiperView/data/data_raw/employment.txt",function(file){
            files.push(file);
                // files[0] will contain file1.csv
                // files[1] will contain file2.csv
                console.log(files)

                var industries_remove = ["10000000","15000000","31000000","32000000","55520000","60550000","65610000","70710000","90910000","90920000","90930000","08000000","60560000","65620000","20000000","50000000","55530000","60540000","70720000"];

                var industries = files[0].map(d => {
                    return {code: d.code, value: d.name.trim().replace(/-| /g, '_').replace(/,_/g, '|')}
                }).filter(d=>!industries_remove.find(e=>d.code===e));;
                industries.map(d => d.value);
                var dataRaw = files[2]
                var data = {};
                var csv = 'timestamp';
                var timerange = files[2].columns.filter(d => d !== 'Series ID' && d.match("Annual ") === null);
                timerange.pop();
                timerange.pop();
                timerange.pop();
                var states = files[1].filter(d => d !== "");
                states.forEach(d => d.name = d.name.trim().replace(/ /g, '_'));

                var countrylist_remove = ["72","78"];
                var countrylist = states.filter(d=>!countrylist_remove.find(e=>d.code===e))
                    .map(d => d.name);
                countrylist.forEach((c, ci) => {
                    industries.map(d => d.value).forEach((s, si) => {
                        csv += `,${c}-${s}`;

                    })
                });
                console.log(csv)
                console.log(timerange);

                let country_va = [];
                countrylist.forEach((c, ci) => {
                    industries.forEach(d => {
                        var temp =  timerange.map((t, ti) => {
                            var s = d.value;
                            var code = generatecode('SMS', c, s);
                            var instance = dataRaw.find(d => d['Series ID'] === code);
                            var v = 0;
                            if (instance) {
                                v = +instance[t].split('(')[0];
                                v = Math.abs(v);
                                return v;
                            }
                            return 0;
                        });
                        var netchange = [];
                        for (let i = 0;i<timerange.length-1;i++){
                        // for (let i = 1;i<timerange.length;i++){
                            // netchange .push(Math.abs((temp[i]-temp[i-1])/temp[i-1]*100));
                            if ((temp[i]-temp[i+1])/temp[i+1]>0)
                                netchange.push((temp[i]-temp[i+1])/temp[i+1]);
                            else
                                netchange.push(0)
                        }
                        country_va.push(netchange);
                    })
                });
                timerange.shift()
                timerange.forEach((t, ti) => {
                    csv += `\n${t},` + countrylist.map((c, ci) => {
                        return industries.map((d,di) => {
                            return country_va[ci*industries.length +di][ti]
                        }).join(',');
                    })
                });

                // data["Variables"].shift();
                function generatecode(pre, state, industry) {
                    const statecode = states.find(d => d['name'] === state)['code'];
                    const inscode = industries.find(d => d['value'] === industry)['code'];
                    return pre + statecode + '00000' + inscode + '01';
                }

                console.log(csv)
        })
    })
})