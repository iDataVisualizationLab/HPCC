// find timerange 
var maxlength = [];
hosts.forEach(h=>{
	serviceListattr.forEach(s=>{
		if(sampleS[h.name][s]) 
            if (maxlength.length < sampleS[h.name][s].length)
                maxlength = sampleS[h.name][s].map(d=>new Date(d.result.query_time))
	})
})
tirange = maxlength.map(d=>d.toISOString());


news = {}
hosts.forEach(h=>{
	news[h.name] = {};
	serviceListattr.forEach((s,i)=>{
		if(sampleS[h.name][s]) 
			news[h.name][s] = sampleS[h.name][s].map(d=>processData (d.data.service.plugin_output,serviceList[i]));
	})
})

hosts.forEach(h=>{
	let maxl = 0; 
	serviceListattr.forEach(s=>{
		if(news[h.name][s]) 
			if(maxl < news[h.name][s].length)
				maxl = news[h.name][s].length;
	})
	serviceListattr.forEach((s,i)=>{
		if(news[h.name][s]) {
			const needfill = maxl - news[h.name][s].length;
			for (let j=0; j<needfill ;j++)
				news[h.name][s].push(processData (undefined,serviceList[i]));
		}
	})
})
news ['timespan'] = tirange