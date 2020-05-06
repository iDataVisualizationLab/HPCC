importScripts("../../../../HiperView/js/lodash.min.js");


let controller = new AbortController();
let signal = controller.signal;
let currentQuery=undefined;
let queue=[];
addEventListener('message',function ({data}){
    switch (data.action) {
        case 'add':
            let queryData = data.data;

            // check queue existed or not
            if (queue.find(d=>d.id===queryData.id))
            {
                postMessage({action:'warning',status:'Query is already in queue! please wait',data:queryData});
                return;
            }
            queue.push(queryData);
            postMessage({action:'add',status:'add to query queue',data:queryData});

            // if queue empty, then start to fetch data
            if (!currentQuery)
            {
                currentQuery = queue.pop();
                fetchData(buildQuery(currentQuery.query));
            }
            break;
        case 'remove':
            let instanceid = data.id;
            if (instanceid===currentQuery.id) // abort current fetch
                controller.abort();
            else{
                _.pullAllBy(queue,[{id: instanceid}],'id')
                postMessage({action:'remove',data:data.id})
            }
            break;
        default:
            break;
    }
});
function buildQuery(query){
    let str = 'http://redfish.hpcc.ttu.edu:8080/v1/metrics?';
    for (let key in query){
        str+=`${key}=${query[key]}`
    }
}
function fetchData(url) {
    postMessage({action:'fetching',data:currentQuery});
    fetch(url, {signal}).then(function(response) {
        // success
        postMessage({action:'success',data:currentQuery});

        // preprocess data
        currentQuery.data = {};
        postMessage({action:'done',data:currentQuery});

        // call next Query
        next();
    }).catch(function(e) {
        // reports.textContent = 'Download error: ' + e.message;
        postMessage({action:'remove',status:'abort query!',data:currentQuery.id});
        currentQuery = undefined;
    })
}
function next(){
    currentQuery = undefined;
    currentQuery = queue.pop();
    if (currentQuery){
        fetchData(buildQuery(currentQuery.query));
    }
}