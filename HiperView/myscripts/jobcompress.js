// this use only for old day data before July 2019
job_compress = []; //save
job_details = {};
hostResults.timespan.forEach((t,iteration)=>{
    hosts.forEach(h => {
        var result = simulateResults2(h.name, iteration, "Job_scheduling");
        const resultObj = result[0];
        if (resultObj) {
            resultObj.forEach(d=>{
                d.nodes= _.isArray( d.nodes) ? d.nodes:d.nodes.split(',')});
            jobList = _.union(jobList, resultObj);
        }
    });
    // handle dupliacte jobID
    jobList = _.chain(jobList)
        .groupBy(d=>d.jobID).values().map(d=>d.reduce((a,b)=>{a.nodes = _.union(a.nodes,b.nodes); return a;})).value();
});