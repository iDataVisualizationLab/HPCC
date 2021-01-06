class Timeline{
    el;
    playbutton;
    timelineHolder;
    timelineClone;
    timelineText;
    timeline;
    timelineHandler;
    meassage;
    timelineTicks;
    step = ()=>{};
    timeConf={scale:d3.scaleTime().range([0,100]).domain([0,0])};
    play_in=()=>{
        const self = this;
        self.playbutton.datum().status=true;
        self.timeline.classed('progress-bar-animated',true)
        self.timeline.classed('progress-bar-striped',true)
        self.playbutton.call(self.playbutton_icon)
    };
    callbackPlay=()=>{};
    pause_in=()=>{
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
        this.timelineHolder.append('div')
            .attr('class','input-group row justify-content-center')
            .html(`<span class="input-group-text" id="addon-wrapping">Current time</span> <button class="btn btn-outline-secondary timeDecrease" type="button"><</button><input type="text" class="timeInput" >
  <button class="btn btn-outline-secondary timeIncrease" type="button">></button>`);
        this.timelineHolder.select('button.timeIncrease').on('click',()=>onChangeTimeByStep(1));
        this.timelineHolder.select('button.timeDecrease').on('click',()=>onChangeTimeByStep(-1));
        this.timelineText = this.timelineHolder.select('input.timeInput')
            .on('click',function(){self.pause()})
            .on('change',function(){self.step(new Date(this.value))});


        const timediv = this.timelineHolder
            .append('div')
            .attr('class',"timeprogress")
            .style("width", "100%")
            .style("position", "relative")
        const timedivS = timediv
            .append('div')
            .attr('class',"progress")
            .style("width", "100%")
            // .style("height", "2rem")
            .style("height", "0.5rem")
            .style('position',"relative")
            .on('click',onClickTimeline);
        // this.timelineClone = timediv
        //     .append('div')
        //     .attr('class','progress-bar clone')
        //     .style('color','var(--primary)')
        //     .style('font-size','small')
        //     .style('overflow','visible');
        this.timeline = timedivS
            .append('div')
            .attr('class','progress-bar')
            .style('font-size','small')
            .attr('role',"progressbar")
            // .style('position',"absolute")
            // .style('top',0)
            // .style('bottom',0)
            // .style('height','2rem')
            .attr('aria-valuenow',"0")
            .attr('aria-valuemin',"0")
            .attr('aria-valuemax',"100");
        this.timelineHandler = timediv
            .append('div').attr('class','progress-bar-handle align-self-center');
        this.timelineTicks = this.timelineHolder
            .append('div').attr('class','ticksHandeler')
            .style('position','relative').style('width','100%');
        this.#updateTick();
        this.meassageHolder = this.el.append('div')
            .attr('class','message align-items-center row')
            .style("padding-left", "20px")
            .style("width", "200px");
        this.meassageHolder.setMessage=function(message){
            this.meassageHolder.select('.spinner-border').classed('hide',message==="");
            this.meassage.text(message);
            }.bind(this);
        this.meassageHolder.append('div').attr('class','spinner-border spinner-border-sm hide').attr('role','status').html(`<span class="sr-only">Loading...</span>
</div>`)
        this.meassage = this.meassageHolder.append('span').attr('class','col');
        this.timelineHandler.call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

        function dragstarted(d) {
            self.pause();
            // self.timelineClone.style('transition','unset')
            self.timeline.style('transition','unset')
            self.timelineHandler.style('transition','unset')
        }

        function dragged(d) {
            let value = d3.event.x/self.timelineHolder.node().getBoundingClientRect().width*100;
            value = Math.min(Math.max(0,value),100);
            // self.currentValue = self.timeConf.scale.invert(percentage);
            // self.timeline
            //     .style("width", `${percentage}%`)
            //     .attr('aria-valuenow',self.timeConf.scale(self.currentValue))
            //     .text(self.currentValue.toLocaleString());
            // self.timelineHandler.style('left',`${percentage}%`);
            console.log(self.timeConf.scale.invert(value))
            requestAnimationFrame(()=> self.step(self.timeConf.scale.invert(value)))
            // d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
        }

        function dragended(d) {
            // self.timelineClone.style('transition',null)
            self.timeline.style('transition',null);
            self.timelineHandler.style('transition',null)
            // d3.select(this).attr("stroke", null);
        }

        function onChangeTimeByStep(step){
            self.step(new Date(+self.currentValue+step*5*60*1000));
        }

        function onClickTimeline(){
            self.pause();
            const mouse = d3.mouse(this);
            let value = mouse[0]/this.getBoundingClientRect().width*100;
            value = Math.min(Math.max(0,value),100);
            self.step(self.timeConf.scale.invert(value));
        }
    }
    #updateTick(){
        if (this.timeConf.scale.domain()[0]-this.timeConf.scale.domain()[1])
       {
            const ticks = this.timeConf.scale.ticks()
            this.timelineTicks.selectAll('div.ticksLabel').data(ticks,d=>d)
                .join('div').attr('class','ticksLabel').style('position','absolute').style('transform','translate(-50%,10px)')
                .text(d=>multiFormat(d)).style('left',d=>this.timeConf.scale(d)+'%');
            this.timelineTicks.selectAll('div.ticks').data(ticks,d=>d)
                .join('div').attr('class','ticks').style('position','absolute').style('transform','translate(-50%,2px)')
                .style('margin-left','-1px')
                .style('width','2px')
                .style('background-color','#ddd')
                .style('height','8px').style('left',d=>this.timeConf.scale(d)+'%');
       }
    }
    disableHandle(isdisable){
        this.timelineHolder.classed('disabled',isdisable)
    }
    play(){

        this.play_in();
        this.callbackPlay();
    }
    pause(){
        this.pause_in();
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
        this.#updateTick();
    }
    update(value){
        if (_.isDate(value))
            this.currentValue = value;
        else
            this.currentValue = new Date(value);
        let percentage = 100;
        if (this.timeConf.scale.domain()[0]-this.timeConf.scale.domain()[1])
            percentage = this.timeConf.scale(this.currentValue);
        // this.timelineClone
        //     .style("width", `${percentage}%`)
        //     .attr('aria-valuenow',this.timeConf.scale(this.currentValue))
        //     .text(this.currentValue.toLocaleString());
        this.timeline
            .style("width", `${percentage}%`)
            .attr('aria-valuenow',this.timeConf.scale(this.currentValue))
            // .text(this.currentValue.toLocaleString());
        this.timelineText.node().value=this.currentValue.toLocaleString();
        this.timelineHandler.style('left',`${percentage}%`)
    }

}
