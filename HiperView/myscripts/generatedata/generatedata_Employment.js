
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
                var industries = files[0].map(d=> {return {code: d.code,value:d.name.trim().replace(/-| /g,'_').replace(/,_/g,'|')}});
                industries.map(d=>d.value);
                var dataRaw = files[2]
                var data ={};
                var csv = 'timestamp';
                var timerange = files[2].columns.filter(d=> d!=='Series ID' && d.match("Annual ")===null);
                var states = files[1].filter(d => d !== "");
                states.forEach(d => d.name = d.name.trim().replace(/ /g, '_'));
                var countrylist = states
                .map(d => d.name);
                countrylist.forEach((c, ci) => {
                    industries.map(d => d.value).forEach((s, si) => {
                        csv += `,${c}-${s}`;

                    })
                });
                console.log(csv)
                console.log(timerange)
                timerange.forEach((t,ti)=> {
                    csv += `\n${t},`+ countrylist.map((c, ci) => {
                        return industries.map(d => {
                            var s = d.value;
                            var code = generatecode('SMS',c,s);
                            var instance = dataRaw.find(d=>d['Series ID']===code);
                            var v = 0;
                            if (instance) {
                                v = + instance[t].split('(')[0];
                                v = Math.abs(v);
                                return v;
                            }
                            return '';
                        }).join(',');
                    });
                });

                // data["Variables"].shift();
                function generatecode(pre,state,industry){
                    const statecode = states.find(d=>d['name']===state)['code'];
                    const inscode = industries.find(d=>d['value']===industry)['code'];
                    return pre+statecode+'00000'+inscode+'01';
                }

                console.log(csv)
            })
        })
    })