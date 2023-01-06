
import React from "react";
import { css, cx} from '@emotion/css'

export class NodeElement extends React.Component{
    onHandleClick(){
        const _freezing = this.props.freezing;
        const freezing = !_freezing;
        // d3.select('.tippannel').select('.freezing').text(freezing ? 'unfreeze' : 'freeze')
        this.props.setfreezing(freezing)

    }
    onMouseOver(event){
        if(!this.props.freezing && this.props.mouseOver){
            this.props.mouseOver(event)
        }
    }
    onMouseLeave(event){
        if(!this.props.freezing && this.props.mouseLeave){
            this.props.mouseLeave(event)
        }
    }
    onMouseMove(event){
        if(!this.props.freezing && this.props.mouseMove){
            this.props.mouseMove(event)
        }
    }
    render(){
        const {children,className,mouseMove,mouseLeave,setfreezing,...other} = this.props;
        const freezing = this.props.freezing;
        return <g {...other} onClick={()=>this.onHandleClick()}
                  className={cx(className,freezing?css`
                  &:not(.highlight) 
                  {pointerEvents: 'none';}`:
                      css`
                  &:not(.highlight) 
                  {pointerEvents: 'auto';}`)}

                  onMouseMove={!freezing?this.onMouseMove.bind(this):undefined}
                  onMouseOver={!freezing?this.onMouseOver.bind(this):undefined}
                  onMouseLeave={!freezing?this.onMouseLeave.bind(this):undefined}
        >
            {this.props.children}
        </g>;
    }
}
export default NodeElement;
