var sampleS
d3.json(srcpath+'/myscripts/generatedata/service0206_0806.json',function(dd){bigdata= dd})
sampleS.timespan = sampleS.timespan.map(d=>new Date(d3.timeFormat('%a %b %d %X CDT %Y')(new Date(d.replace('Z','')))));
timeRange = 9;
var csv = 'Series ID';
sampleS.timespan.filter(t=> t.getDate()===timeRange ).forEach(t=>csv+=(','+t))
hosts.forEach((h,hi)=>{
    [serviceFullList[0]].forEach((s,si)=>{
        csv += '\n' + hi + '_' + si;
        sampleS.timespan.forEach((t,ti)=>{
		if(t.getDate()===timeRange){
            	try {
                	let d = sampleS[h.name][serviceListattr[s.idroot]][ti];
                	csv += (',' + ((d[s.id] === null||d[s.id] === undefined) ? '' : d[s.id]));
            	} catch{
                	csv += (',' );
             	}
		}
        });
    })
});

// Generate data file
var csv = 'Series ID';
sampleS.timespan.forEach(t=>csv+=(','+t))
hosts.forEach((h,hi)=>{
    serviceFullList.forEach((s,si)=>{
        csv += '\n' + hi + '_' + si;
        sampleS.timespan.forEach((t,ti)=>{
            try {
                let d = sampleS[h.name][serviceListattr[s.idroot]][ti];
                csv += (',' + ((d[s.id] === null||d[s.id] === undefined) ? '' : d[s.id]));
            } catch{
                csv += (',' );
             }
        });
    })
});

// Generate host file
var tsv = 'code\tname';
hosts.forEach((h,hi)=>{
    tsv += `\n${hi}\t${h.name}`;
})


// Generate service file
var tsv = 'code\tname';
serviceFullList.forEach((s,si)=>{
    tsv += `\n${si}\t${s.text}`;
})

