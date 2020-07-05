class Timeline{
    el;
    playbutton;
    timelineHolder;
    timeline;
    timeConf={scale:d3.scaleTime().range([0,100])};
    play=()=>{};
    pause=()=>{};
    currentValue;
    constructor(elName) {
        const self = this;
        this.el = d3.select(elName);
        this.playbutton = this.el.append('button')
            .attr('type',"button")
            .attr('class',"btn btn-primary btn-circle btn-sm")
            .style("margin-left", "30px")
            .datum(false)
            .html(`<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-play-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
            </svg>`).on('click',function(d){
                d=!d;
                if(d)
                    self.play();
                else
                    self.pause();
            });
        this.timelineHolder = this.el.append('div')
            .attr('class',"progress align-self-center")
            .style("width", "80%");
        this.timeline = this.timelineHolder.append('div')
            .attr('class','progress-bar')
            .attr('role',"progressbar")
            .attr('aria-valuenow',"0")
            .attr('aria-valuemin',"0")
            .attr('aria-valuemax',"100");
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
