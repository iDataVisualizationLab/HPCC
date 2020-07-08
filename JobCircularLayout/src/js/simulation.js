class Simulation {
    #data;
    timer;
    interval=1000;
    #index=0;
    #currentTime;
    isRealTime;
    query;
    onFinishQuery=[];
    onDataChange=[];
    onUpdateTime=[];
    constructor(url) {
        this.isRealTime = !url;
        if (!this.isRealTime) {
            let updatePromise=d3.json(url).then((data) => {
                data.time_stamp = data.time_stamp.map(d=>new Date(d*1000))
                this.#data = data;
                this.onDataChange.forEach(function(listener) {
                    listener(d3.extent(data.time_stamp));
                });
                return d3.extent(data.time_stamp);
            });

        }
    }
    request(){
        console.log(this.#index)
        if (this.isRealTime || (this.#index<this.#data.time_stamp.length)) {
            let updatePromise;
            let self = this;
            if (self.isRealTime)
                updatePromise = this.requestFromURL();
            else
                updatePromise = this.requestFromData(this.#index);
            this.onFinishQuery.forEach(function (listener) {
                updatePromise = updatePromise.then(listener);
            });
            this.onUpdateTime.forEach(function (listener) {
                updatePromise = updatePromise.then(() => listener(self.#currentTime));
            });
        }else{
            this.stop()
        }
    }
    requestFromData(index){
        const self = this;
       return new Promise((resolve,refuse)=>{
           let timer;
            if (!this.#data){
                timer = d3.interval(update,100);
            }
            else{
                update();
            }
            function update() {
                if (self.#data) {
                    if (timer)
                        timer.stop();
                    const currentTime = self.#data.time_stamp[index];

                    const jobs_info = _.omit(self.#data.jobs_info, function (val, key, object) {
                        return (val.start_time <= currentTime) && (val.finish_time > currentTime);
                    });
                    const nodes_info = {};
                    d3.keys(self.#data.nodes_info).forEach(c => {
                        nodes_info[c] = {};
                        d3.keys(self.#data.nodes_info[c]).forEach(s => {
                            nodes_info[c][s] = [self.#data.nodes_info[c][s][index]];
                        })
                    });
                    const time_stamp = [currentTime];
                    self.#currentTime = currentTime;
                    self.#index ++;
                    resolve({jobs_info, nodes_info, time_stamp,currentTime})

                }
            }
       });
    }
    getRunningJob(currentTime){
        return {}
    }
    requestFromURL(){
        const self = this;
       // todo need method to cancle
        return d3.json(url).then(function(data){self.#data = data; return data;});
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
            this.timer = d3.interval(this.request.bind(this),this.interval);
    }
    pause(){
        if(this.timer)
            this.timer.stop()
    }
    stop(){
        if (this.timer) {
            this.timer.stop();
            this.#index =0;
        }
    }
    destroy(){
        console.log('timeline destroyed!');
    }
}
