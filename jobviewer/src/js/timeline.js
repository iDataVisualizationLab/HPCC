class Timeline{
    el;
    playbutton;
    timelineHolder;
    timeline;
    timelineHandler;
    meassage;
    step = ()=>{};
    timeConf={scale:d3.scaleTime().range([0,100])};
    #play=()=>{
        const self = this;
        self.playbutton.datum().status=true;
        self.timeline.classed('progress-bar-animated',true)
        self.timeline.classed('progress-bar-striped',true)
        self.playbutton.call(self.playbutton_icon)
    };
    callbackPlay=()=>{};
    #pause=()=>{
        const self = this;
        self.playbutton.datum().status=false;
        self.timeline.classed('progress-bar-animated',false)
        self.timeline.classed('progress-bar-striped',false)
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
            .attr('class','progress-bar-wrapper align-self-center')
            .style("width", "calc(100% - 30px - 200px)");
        this.timeline = this.timelineHolder.append('div')
            .attr('class',"progress")
            .style("width", "100%")
            .on('click',onClickTimeline)
            .append('div')
            .attr('class','progress-bar')
            .attr('role',"progressbar")
            .attr('aria-valuenow',"0")
            .attr('aria-valuemin',"0")
            .attr('aria-valuemax',"100");
        this.timelineHandler = this.timelineHolder
            .append('div').attr('class','progress-bar-handle align-self-center');

        this.meassageHolder = this.el.append('div')
            .attr('class','message align-items-center row')
            .style("width", "200px");
        this.meassageHolder.append('div').attr('class','spinner-border spinner-border-sm').attr('role','status').html(`<span class="sr-only">Loading...</span>
</div>`)
        this.meassage = this.meassageHolder.append('span').attr('class','col');
        this.timelineHandler.call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

        function dragstarted(d) {
            self.pause();
        }

        function dragged(d) {
            // d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
        }

        function dragended(d) {
            // d3.select(this).attr("stroke", null);
        }

        function onClickTimeline(){
            self.pause();
            const mouse = d3.mouse(this);
            const value = mouse[0]/this.getBoundingClientRect().width*100;
            self.step(self.timeConf.scale.invert(value));
        }
    }
    disableHandle(isdisable){
        this.timelineHolder.classed('disabled',isdisable)
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
        const percentage = this.timeConf.scale(this.currentValue)
        this.timeline
            .style("width", `${percentage}%`)
            .attr('aria-valuenow',this.timeConf.scale(this.currentValue))
            .text(this.currentValue.toLocaleString());
        this.timelineHandler.style('left',`${percentage}%`)
    }

}
