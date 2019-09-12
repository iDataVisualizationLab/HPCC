function requestRT(iteration,count)
{
    var promises =  serviceList.map(function (d,i){
        return requestService(count,i);
    });
    return Promise.all(promises).then(()=>{return [iteration, count];});
}

function requestService(count,serin)
{
    return new Promise(function(resolve, reject)
    {
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    var result = processResult(JSON.parse(this.responseText));
                    var name = result.data.service.host_name;
                    hostResults[name][serviceAttr[serin]].push(result);
                    console.log(results);
                    console.log(name);
                    console.log(serin);
                    console.log(serviceAttr);
                    console.log(serviceAttr[serin]);
                    if (selectedService === serviceList[serin])
                    {
                        hostResults[name].arr = hostResults[name][serviceAttr[serin]];
                        plotResult(result);
                    }
                    resolve(xhr.response);
                } else {
                    reject(xhr.status);
                }
            }
        };
        xhr.ontimeout = function () {
            reject('timeout');
        };
        xhr.open('get', "http://10.10.1.4/nagios/cgi-bin/statusjson.cgi?query=service&hostname=" + hosts[count].name + "&servicedescription=check+"+serviceQuery[serin], true);
        xhr.send();
    })
}

function processResult(r)
{
    var obj = {};
    obj.result = {};
    obj.result.query_time = r.result.query_time;
    obj.data = {};
    obj.data.service={};
    obj.data.service.host_name = r.data.service.host_name;
    obj.data.service.plugin_output = r.data.service.plugin_output
    return obj;
}