class Simulation {
    data;
    timer;
    interval=1000;
    integrate=1.5*60*1000;
    index=0;
    currentTime;
    isRealTime; userDict={}; userReverseDict={};
    query;
    callbackStop = ()=>{};
    onFinishQuery=[];
    onTimeChange=[];
    onDataChange=[];
    onUpdateTime=[];
    onStartQuery=()=>{};
    constructor(url) {
        this.isRealTime = !url;
        if (!this.isRealTime) {
            console.time('load data')
            let updatePromise=(_.isString(url)?d3.json(url):url).then((data) => {
                data.time_stamp = data.time_stamp.map(d=>new Date(d/1000000));
                d3.keys(data.jobs_info).forEach(jID=>{if (!this.userDict[data.jobs_info[jID].user_name] && !this.userReverseDict[data.jobs_info[jID].user_name]){
                         const encoded =  'user'+d3.keys(this.userDict).length;
                        this.userDict[data.jobs_info[jID].user_name] = encoded;
                        this.userReverseDict[encoded] = data.jobs_info[jID].user_name;
                        data.jobs_info[jID].user_name = this.userDict[data.jobs_info[jID].user_name];
               }else if (!this.userReverseDict[data.jobs_info[jID].user_name]){
                         data.jobs_info[jID].user_name = this.userDict[data.jobs_info[jID].user_name];
               }
                    data.jobs_info[jID].node_list_obj = {};
                    data.jobs_info[jID].node_list = data.jobs_info[jID].node_list.map(c=>{
                        let split = c.split('-');
                        data.jobs_info[jID].node_list_obj[split[0]] = +split[1];
                        return split[0];
                    });
                    if(data.jobs_info[jID].start_time>9999999999999)
                    {data.jobs_info[jID].start_time = data.jobs_info[jID].start_time/1000000
                        data.jobs_info[jID].submit_time = data.jobs_info[jID].submit_time/1000000
                        if (data.jobs_info[jID].finish_time && data.jobs_info[jID].finish_time>9999999999999)
                            data.jobs_info[jID].finish_time = data.jobs_info[jID].finish_time/1000000}
                });
                console.timeEnd('load data')
                this.data = data;
                this.onTimeChange.forEach(function(listener) {
                    listener(d3.extent(data.time_stamp));
                });

                this.onDataChange.forEach(function(listener) {
                    listener(data);
                });
                return d3.extent(data.time_stamp);
            });

        }
    }
    request(timesexlapse,index){
        if(index!=undefined && this.data)
            if (_.isDate(index)) {
                let range = [d3.bisectLeft(this.data.time_stamp, index),d3.bisectRight(this.data.time_stamp, index)];

                if ((this.data.time_stamp[range[1]]-index )>(index-this.data.time_stamp[range[0]]))
                    this.index = range[0];
                else
                    this.index = range[1];
            }else
                this.index = index;
        if (this.isRealTime || (!this.isRealTime&&this.data===undefined)||(this.index<this.data.time_stamp.length)) {
            let updatePromise;
            let self = this;
            this.onStartQuery();
            if (self.isRealTime)
                updatePromise = this.requestFromURL();
            else
                updatePromise = this.requestFromData(this.index);
            this.onFinishQuery.forEach(function (listener) {
                updatePromise = updatePromise.then(listener);
            });
            this.onUpdateTime.forEach(function (listener) {
                updatePromise = updatePromise.then(() => listener(self.currentTime));
            });
        }else{
            this.stop()
        }
    }
    queryRange(timepoint,step,list){
        let self= this;
        if(this.data&&list.length){
            let index = self.data.time_stamp.findIndex(d=>d>timepoint);
            index = (index===-1?self.data.time_stamp.length:index);
            const nodes_info = {};
            list.forEach(c => {
                nodes_info[c] = {};
                d3.keys(self.data.nodes_info[c]).forEach(s => {
                    nodes_info[c][s] = self.data.nodes_info[c][s].slice(Math.max(0,index-step),index);
                })
            });
            let time_stamp = self.data.time_stamp.slice(Math.max(0,index-step),index)
            return {nodes_info,time_stamp};
        }
        return {};
    }
    requestFromData(index){
        const self = this;
       return new Promise((resolve,refuse)=>{
           let timer;
            if (!this.data){
                timer = d3.interval(update,100);
            }
            else{
                update();
            }
            function update() {
                if (self.data) {
                    if (timer)
                        timer.stop();
                    const currentTime = self.data.time_stamp[index];
                    const jobs_info = _.omit(self.data.jobs_info, function (val, key, object) {
                        return (val.start_time - self. integrate> currentTime) || ((val.finish_time!==null)&&(val.finish_time < currentTime));
                    });

                    const nodes_info = {};
                    d3.keys(self.data.nodes_info).forEach(c => {
                        nodes_info[c] = {};
                        d3.keys(self.data.nodes_info[c]).forEach(s => {
                            nodes_info[c][s] = [self.data.nodes_info[c][s][index]];
                        })
                    });
                    const time_stamp = [currentTime];
                    self.currentTime = currentTime;
                    self.index ++;
                    resolve({jobs_info, nodes_info, time_stamp,currentTime})

                }
            }
       });
    }
    getRunningJob(currentTime){
        return {}
    }
    requestFromURL(start,end){
        const self = this;
       // todo need method to cancle
        console.time('request time: ')
        const _end = end??new Date(); //'2020-02-14T12:00:00-05:00'
        let _start = start??new Date(_end - self.interval); //'2020-02-14T18:00:00-05:
        const interval = '5m';
        const value = 'max';
        const compress = false;
        const url = self.getUrl({_start,_end,interval,value,compress});
        console.log(url)
        return d3.json(url).then(function(data){
            data.time_stamp=data.time_stamp.map(e=>new Date(e/1000000));
            d3.keys(data.jobs_info).forEach(jID=>{
                if (!self.userDict[data.jobs_info[jID].user_name])
                    self.userDict[data.jobs_info[jID].user_name] = 'user'+d3.keys(self.userDict).length;
                data.jobs_info[jID].user_name = self.userDict[data.jobs_info[jID].user_name];
                data.jobs_info[jID].node_list = data.jobs_info[jID].node_list.map(c=>c.split('-')[0]);
                if(data.jobs_info[jID].start_time>9999999999999)
                {data.jobs_info[jID].start_time = data.jobs_info[jID].start_time/1000000
                    data.jobs_info[jID].submit_time = data.jobs_info[jID].submit_time/1000000
                    if (data.jobs_info[jID].finish_time && data.jobs_info[jID].finish_time>9999999999999)
                        data.jobs_info[jID].finish_time = data.jobs_info[jID].finish_time/1000000}
            })
            data.currentTime = _.last(data.time_stamp);
            self.currentTime = data.currentTime;
            self.data = data;
            console.timeEnd('request time: ')
            return data;
        });
    }
    getUrl({_start,_end,interval,value,compress}){
        const timeFormat = d3.timeFormat('%Y-%m-%dT%H:%M:%S-05:00');
        const start = timeFormat(_start)
        const end = timeFormat(_end)
        interval = interval||'5m';
        value = value||'max';
        compress = compress||false;
        const url = `https://influx.ttu.edu:8080/v1/metrics?start=${start}&end=${end}&interval=${interval}&value=${value}&compress=${compress}`;
        return url;
    }
    setInterval(interval){
        this.interval = interval;    }
    start(interval){
        if(interval)
            this.interval = interval;
        if(this.timer)
            // this.timer.restart(this.request.bind(this),this.interval);
            this.timer.stop();
        // else
        this.request()
        this.timer = d3.interval(this.request.bind(this),this.interval);
    }
    pause(){
        if(this.timer)
            this.timer.stop()
    }
    stop(){
        if (this.timer) {
            this.timer.stop();
            this.index =0;
            this.callbackStop();
        }
    }
    destroy(){
        console.log('timeline destroyed!');
    }
}
