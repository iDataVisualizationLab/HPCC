userNest = d3.nest().key(d=>d.user)
    .key(d=>d.jobID.split('.'))
    .entries(Dataset.data.currentjob);
userNest.forEach(d=>d.computes=_.uniq(_.flattenDeep(d.values.map(e=>e.values.map(c=>c.nodes)))));
userNest.sort((a,b)=>b.computes.length-a.computes.length)
data = Layout.data.groups;
tree = {name:"__main__",children:data.map(d=>(
        {
            name:d.Name,
            children:_.flatten(d.value)
                .filter(d=>d!==null)
                .map(d=>{
                    const item = {
                        name:d,
                        size:1
                    };
                    return item;
                })
        }))
};
userNest.forEach(u=>{
    tree.children.push({
        name: u.key,
        type: 'user',
        children: u.values.map(j=>{
            const job = {
                name: j.key,
                type: 'job'
            };
            if (j.values.length>1){
                job.type = 'job array';
                job.children = j.values.map(ja=>{
                    return {
                        name: ja.jobID,
                        radius:1,
                        imports: ja.nodes
                    }
                })
            }else {
                job.radius = 1;
                job.imports = j.values[0].nodes;
            }
            return job
        })
    })
})
