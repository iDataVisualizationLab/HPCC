function request()
{
    var count = 0;
    var iteration = 0;
    currentMiliseconds = new Date().getTime();  // For simulation
    query_time=currentMiliseconds;

    interval2 = setInterval(function(){
        if (isRealtime){
            var xmlhttp = new XMLHttpRequest();
            var url = "http://10.10.1.4/nagios/cgi-bin/statusjson.cgi?query=service&hostname="+hosts[count].name+"&servicedescription=check+temperature";
            xmlhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var result = processResult(JSON.parse(this.responseText));
                    var name =  result.data.service.host_name;
                    hostResults[name].arrTemperature.push(result);
                    if (selectedService == serviceList[0]){
                        hostResults[name].arr=hostResults[name].arrTemperature;
                        plotResult(result);
                    }          
                }
                else{
                    console.log(count+"ERROR__check+temperature__ this.readyState:"+this.readyState+" this.status:"+this.status+" "+this.responseText);
                }

            };
            xmlhttp.open("GET", url, true);
            xmlhttp.send();

            var xmlhttp2 = new XMLHttpRequest();
            var url2 = "http://10.10.1.4/nagios/cgi-bin/statusjson.cgi?query=service&hostname="+hosts[count].name+"&servicedescription=check+cpu+load";
            xmlhttp2.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var result = processResult(JSON.parse(this.responseText));
                    var name =  result.data.service.host_name;
                    hostResults[name].arrCPU_load.push(result);
                   // plotResult(result);
                }
                else{
                    console.log(count+"ERROR__check+cpu+load__ this.readyState:"+this.readyState+" this.status:"+this.status+" "+this.responseText);
                }
            };
            xmlhttp2.open("GET", url2, true);
            xmlhttp2.send();


            var xmlhttp3 = new XMLHttpRequest();
            var url3 = "http://10.10.1.4/nagios/cgi-bin/statusjson.cgi?query=service&hostname="+hosts[count].name+"&servicedescription=check+memory+usage";
            xmlhttp3.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var result = processResult(JSON.parse(this.responseText));
                    var name =  result.data.service.host_name;
                    hostResults[name].arrMemory_usage.push(result);
                    // plotResult(result);
                }
                else{
                    console.log(count+"ERROR__check+memory+usage__ this.readyState:"+this.readyState+" this.status:"+this.status+" "+this.responseText);
                }
            };
            xmlhttp3.open("GET", url3, true);
            xmlhttp3.send();

            var xmlhttp4 = new XMLHttpRequest();
            var url4 = "http://10.10.1.4/nagios/cgi-bin/statusjson.cgi?query=service&hostname="+hosts[count].name+"&servicedescription=check+fans+health";
            xmlhttp4.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var result = processResult(JSON.parse(this.responseText));
                    var name =  result.data.service.host_name;
                    hostResults[name].arrFans_health.push(result);
                    // plotResult(result);
                }
                else{
                    console.log(count+"ERROR__check+fans+health__ this.readyState:"+this.readyState+" this.status:"+this.status+" "+this.responseText);
                }
            };
            xmlhttp4.open("GET", url4, true);
            xmlhttp4.send();

            var xmlhttp5 = new XMLHttpRequest();
            var url5 = "http://10.10.1.4/nagios/cgi-bin/statusjson.cgi?query=service&hostname="+hosts[count].name+"&servicedescription=check+power+usage";
            xmlhttp5.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var result = processResult(JSON.parse(this.responseText));
                    var name =  result.data.service.host_name;
                    hostResults[name].arrPower_usage.push(result);
                    // plotResult(result);
                }
                else{
                    console.log(count+"ERROR__check+power+usage__ this.readyState:"+this.readyState+" this.status:"+this.status+" "+this.responseText);
                }
            };
            xmlhttp5.open("GET", url5, true);
            xmlhttp5.send();

            var result = {};

            
        }
        else{
            // var result = simulateResults(hosts[count].name);
            
            var result = simulateResults2(hosts[count].name,iteration, selectedService);
            // Process the result
            var name =  result.data.service.host_name;
            hostResults[name].arr.push(result);
            plotResult(result);

            //console.log(hosts[count].name+" "+hostResults[name]);
            var result = simulateResults2(hosts[count].name,iteration, serviceList[0]);
            hostResults[name].arrTemperature.push(result);

            var result = simulateResults2(hosts[count].name,iteration, serviceList[1]);
            hostResults[name].arrCPU_load.push(result);

            var result = simulateResults2(hosts[count].name,iteration, serviceList[2]);
            hostResults[name].arrMemory_usage.push(result);

            var result = simulateResults2(hosts[count].name,iteration, serviceList[3]);
            hostResults[name].arrFans_health.push(result);

            var result = simulateResults2(hosts[count].name,iteration, serviceList[4]);
            hostResults[name].arrPower_usage.push(result);       
        }

        count++;

        var xTimeSummaryScale = d3.scaleLinear()
                .domain([currentMiliseconds, currentMiliseconds+0.9*numberOfMinutes*60*1000]) // input
                .range([30, width]); // output

        Date.prototype.timeNow = function () {
             return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes();
        }

        Date.prototype.timeNow2 = function () {
             return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
        }

        if (count>=hosts.length){// Draw the summary Box plot ***********************************************************
            var arr = [];
            var xx; 
            var lastIndex;
            
            for (var h=0; h<hosts.length;h++){
                var name = hosts[h].name; 
                var r = hostResults[name];
                lastIndex = r.arr.length-1;
                if (lastIndex>=0){   // has some data
                    var a = processData(r.arr[lastIndex].data.service.plugin_output, selectedService);
                    if (h==hosts.length-1){
                        query_time =r.arr[lastIndex].result.query_time;
                        console.log(query_time);
                         xx = xTimeSummaryScale(query_time);     
                    }
                    arr.push(a[0]);
                }
            }
        }

            
    } , simDuration);

}


function simulateResults2(hostname,iter, s)
{

    console.log(sampleS[hostname].arrTemperature[iter]);
    var newService;
    if (s == serviceList[0])             
        newService = sampleS[hostname].arrTemperature[iter];
    else if (s == serviceList[1])
        newService = sampleS[hostname].arrCPU_load[iter];
    else if (s == serviceList[2]) 
        newService = sampleS[hostname].arrMemory_usage[iter];
    else if (s == serviceList[3]) 
        newService = sampleS[hostname].arrFans_health[iter];
    else if (s == serviceList[4]) 
        newService = sampleS[hostname].arrPower_usage[iter];

    return newService;
    
}


function addDatasetsOptions() {
    var select = document.getElementById("datasetsSelect");
    for(var i = 0; i < serviceList.length; i++) {
        var opt = serviceList[i];
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        el["data-image"]="images/"+serviceList[i]+".png";
        select.appendChild(el);
    }
    document.getElementById('datasetsSelect').value = initialService;  //************************************************
    selectedService = document.getElementById("datasetsSelect").value;

    //loadData();
}

function loadNewData(event) {
    //alert(this.options[this.selectedIndex].text + " this.selectedIndex="+this.selectedIndex);
    //svg.selectAll("*").remove();
    selectedService = this.options[this.selectedIndex].text;

    resetRequest();
}