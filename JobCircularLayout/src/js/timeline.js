class Timeline{
    el;
    playbutton;
    timelineHolder;
    timeline;
    meassage;
    timeConf={scale:d3.scaleTime().range([0,100])};
    #play=()=>{
        const self = this;
        self.playbutton.datum().status=true;
        self.playbutton.call(self.playbutton_icon)
    };
    callbackPlay=()=>{};
    #pause=()=>{
        const self = this;
        self.playbutton.datum().status=false;
        self.playbutton.call(self.playbutton_icon)
    };
    callbackPause=()=>{};
    currentValue;
    constructor(elName,isplay) {
        const self = this;
        this.el = d3.select(elName);
        this.playbutton = this.el.append('button')
            .attr('type',"button")
            .attr('class',"btn btn-primary btn-circle btn-sm")
            .style("margin-left", "30px")
            .datum({status:isplay})
            .on('click',function(d){
                d.status=!d.status;
                if(d.status)
                    self.play();
                else
                    self.pause();
            });
        this.playbutton
            .append('svg')
            .attr('width',"1em")
            .attr('height',"1em")
            .attr('viewBox',"0 0 16 16")
            .attr('fill',"currentColor")
            .append('path');
        this.playbutton.call(self.playbutton_icon);

        this.timelineHolder = this.el.append('div')
            .attr('class',"progress align-self-center")
            .style("width", "80%");
        this.timeline = this.timelineHolder.append('div')
            .attr('class','progress-bar')
            .attr('role',"progressbar")
            .attr('aria-valuenow',"0")
            .attr('aria-valuemin',"0")
            .attr('aria-valuemax',"100");
        this.meassage = this.el.append('div')
            .attr('class','message')
            .style("width", "calc(20% - 80px)")
            .append('span');
    }
    play(){

        this.#play();
        this.callbackPlay();
    }
    pause(){

        this.#pause();
        this.callbackPause();
    }
    playbutton_icon(p){
        p.select('svg').select('path').attr('d',d=>d.status?pause_icon():play_icon())
        function play_icon(){
            return "M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z";
        }
        function pause_icon(){
            return "M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z";
        }
    }
    domain(domain){
        this.timeConf.scale.domain(domain);
    }
    update(value){
        if (_.isDate(value))
            this.currentValue = value;
        else
            this.currentValue = new Date(value);
        this.timeline
            .style("width", `${this.timeConf.scale(this.currentValue)}%`)
            .attr('aria-valuenow',this.timeConf.scale(this.currentValue))
    }

}
