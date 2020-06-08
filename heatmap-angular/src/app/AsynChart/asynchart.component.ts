import {AfterViewInit, Component, ElementRef, HostListener, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import {Scheme} from './model';
import * as mark from './mark';
import * as d3 from 'd3';
import * as _ from 'lodash';
import {ScaleType} from './scale';


@Component({
  selector: 'app-asynchart',
  templateUrl: './asynchart.component.html',
  styleUrls: ['./asynchart.component.scss']
})

export class AsynchartComponent implements OnInit, OnChanges, AfterViewInit {
  @ViewChild('foreground') public foregroundNode: ElementRef;
  @ViewChild('background') public backgroundNode: ElementRef;
  @ViewChild('highlighted') public highlightedNode: ElementRef;
  @ViewChild('svg') public svgNode: ElementRef;

  @Input() width: number;
  @Input() height: number;
  @Input() margin: any = {top: 0, right: 0, bottom: 0, left: 0};
  @Input() scheme: Scheme;

  private _originalWidth: number;
  private _originalHeight: number;
  private _foreground: any;
  private _background: any;
  private _highlighted: any;
  private _svg: any;
  private render_speed: number;

  private widthG = () => {
    return this._originalWidth - this.margin.left - this.margin.right;
  }
  private heightG = () => {
    return this._originalHeight - this.margin.top - this.margin.bottom;
  }

  get foreground() { return this._foreground; }
  set foreground(value: any) { this._foreground = value; }
  get background() { return this._background; }
  set background(value: any) { this._background = value; }
  get highlighted() { return this._highlighted; }
  set highlighted(value: any) { this._highlighted = value; }
  get svg() { return this._svg; }
  set svg(value: any) { this._svg = value; }

  ngOnInit(): void {
    this._originalHeight = this.height;
    this._originalWidth = this.width;
  }
  ngAfterViewInit(): void {
    this.initscreen();
    this.draw();
  }
  ngOnChanges(): void {
    if (this.foreground  === undefined) {
      return;
    }
    if (this.width === 0 || this.height === 0) {
      return;
    }
  }

  constructor(

  ){

  }
  initscreen(): void {
    d3.select(this.foregroundNode.nativeElement).attr('width', this.width).attr('height', this.height);
    d3.select(this.backgroundNode.nativeElement).attr('width', this.width).attr('height', this.height);
    d3.select(this.highlightedNode.nativeElement).attr('width', this.width).attr('height', this.height);
    d3.select(this.svgNode.nativeElement).attr('width', this.width).attr('height', this.height);
    this._foreground = this.foregroundNode.nativeElement.getContext('2d');
    this._background = this.backgroundNode.nativeElement.getContext('2d');
    this._highlighted = this.highlightedNode.nativeElement.getContext('2d');
    this._svg = d3.select(this.svgNode.nativeElement);
    this.foreground.globalCompositeOperation = 'destination-over';
  }
  make_axis(): void {
    const self = this;
    const axisx = d3.axisBottom(self.scheme.x.scale);
    const ticksx = (this.scheme.x.scale.ticks || this.scheme.x.scale.domain)().length;
    if (this.scheme.x.axis && this.scheme.x.axis.tickValues){
      const filterFunc = new Function('datum', 'index', self.scheme.x.axis.tickValues);
      axisx.tickValues(this.scheme.x.scale.domain().filter(filterFunc));
    }else
    if (ticksx > 20) {
      axisx.tickValues(this.scheme.x.scale.domain().filter((d, i) => !(i % Math.round(ticksx / 20))));
    }
    self.svg.select('.xaxis').attr('transform',`translate(${0},${this.heightG() + this.margin.top})`)
      .call(axisx);
    if (this.scheme.y.visible === undefined || this.scheme.y.visible === true) {
      self.svg.select('.yaxis').attr('transform', `translate(${this.margin.left},${0})`)
        .call(d3.axisRight(self.scheme.y.scale)).selectAll('.domain, line').style('display', 'none');
    }
  }
  onChangeColor(): void {
    const self = this;
    switch (self.scheme.color.type) {
      case ScaleType.LINEAR:
        self.scheme.color.scale = d3.scaleSequential(d3.interpolateTurbo)
          .domain(d3.extent(self.scheme.data.value, d => d[self.scheme.color.key]));
        break;
      case ScaleType.CATEGORY:
        self.scheme.color.scale = d3.scaleOrdinal(d3.schemeCategory10)
        // .interpolate(d3.interpolateTurbo)
        // .domain(d3.extent(scheme.data.value,d=>d[scheme.color.key]));
        break;
    }
  }
  onChangeVairableX(variable_prop): void{
    const self = this;
    if (variable_prop.key !== "") {
      variable_prop.scale = d3[`scale${variable_prop.type}`]().range([self.margin.left, self.widthG()]);
      switch (variable_prop.type) {
        case 'Band':
          const uniqueV = _.uniq(self.scheme.data.value.map(d => d[variable_prop.key]));
          variable_prop.scale.domain(uniqueV);
          break;
        case 'Time':
          variable_prop.scale.domain(d3.extent(self.scheme.data.value,d=>d[variable_prop.key]));
      }
    }
  }
  onChangeVairableY(variable_prop): void{
    const self = this;
    if (variable_prop.key!=="") {
      variable_prop.scale = d3[`scale${variable_prop.type}`]().range([self.heightG() + self.margin.top, self.margin.top]);
      switch (variable_prop.type) {
        case 'Band':
          let uniqueV = _.uniq(self.scheme.data.value.map(d=>d[variable_prop.key]));
          variable_prop.scale.domain(uniqueV);
          break;
      }
    }
  }
  draw(): void {
    const self = this;
    this.onChangeVairableX(this.scheme.x);
    this.onChangeVairableY(this.scheme.y);
    this.onChangeColor();
    this.make_axis();
    let render_item;
    let scheme = self.scheme;
    let foreground = self.foreground;
    let graphicopt = self;
    let timel;
    let render_speed = 500;
    function render_items(selected, ctx) {

      var n = selected.length,
        i = 0,
        // opacity = d3.min([2/Math.pow(n,0.3),1]),
        timer = (new Date()).getTime();


      let shuffled_data = selected;
      ctx.clearRect(0,0,graphicopt.width+1,graphicopt.height+1);

      let opacity = scheme.color.opacity;
      if(opacity===undefined)
        opacity = 1
      // render all lines until finished or a new brush event
      function animloop(){
        if (i >= n ) {
          timel.stop();
          return true;
        }
        var max = d3.min([i+render_speed, n]);
        render_range(shuffled_data, i, max, opacity);
        i = max;
        timer = optimize(timer);  // adjusts render_speed
      };
      if (timel)
        timel.stop();
      timel = d3.timer(animloop);
      // if(isChangeData)
      //     axisPlot.dispatch('plot',selected);
    }
    // render item i to i+render_speed
    function render_range(selection, i, max, opacity) {
      selection.slice(i,max).forEach(function(d) {
        render_item(d, foreground, colorCanvas(d[scheme.color.key],opacity));
      });
    };
    function colorCanvas(d,a) {
      var c = d3.hsl(scheme.color.scale(d));
      c.opacity=a;
      return c;
    }
    const RECT_draw = function(d, ctx, color) {
      ctx.fillRect(scheme.x.scale(d[scheme.x.key]),scheme.y.scale(d[scheme.y.key]),scheme.x.scale.bandwidth(),scheme.y.scale.bandwidth());
      // ctx.fillRect(scheme.x.scale(d[scheme.x.key]),scheme.y.scale(d[scheme.y.key]),1,scheme.y.scale.bandwidth());
      if (color){
        ctx.fillStyle = color;
        ctx.fill();
      }
    };

    const AREA = function (d, ctx, color) {
      ctx.beginPath();
      scheme.mark.path(d.values);
      if (color){
        ctx.fillStyle = color;
        ctx.fill()
      }
      ctx.beginPath();
      ctx.moveTo(scheme.x.scale.range()[0], scheme.y.scale(d.values[0][scheme.y.key])+scheme.y.scale.bandwidth());
      ctx.lineTo(scheme.x.scale.range()[1], scheme.y.scale(d.values[0][scheme.y.key])+scheme.y.scale.bandwidth());
      ctx.strokeStyle = '#ddd';
      ctx.stroke();
    };
    function optimize(timer) {
      const delta = (new Date()).getTime() - timer;
      render_speed = Math.max(Math.ceil(render_speed * 30 / delta), 100);
      render_speed = Math.min(render_speed, 1000);
      return (new Date()).getTime();
    }
    if (self.scheme.mark.type === mark.RECT) {
      render_item = RECT_draw;
      render_items(self.scheme.data.value, foreground);
    }else if (self.scheme.mark.type === mark.AREA){
      if (self.scheme.mark.key) {
        self.scheme.mark.scale = d3.scaleLinear().domain(d3.extent(self.scheme.data.value,d => d[self.scheme.mark.value])).range([0, -self.scheme.y.scale.bandwidth()*2])
        self.scheme.mark.path = d3.area()
          .x(function(d) {
            return self.scheme.x.scale(d[self.scheme.x.key]); })
          .y0(function(d) {
            return self.scheme.y.scale(d[self.scheme.y.key]) + self.scheme.y.scale.bandwidth() + self.scheme.mark.scale(0)})
          .y1(function(d) {
            return self.scheme.y.scale(d[self.scheme.y.key]) + self.scheme.y.scale.bandwidth() + self.scheme.mark.scale(d[self.scheme.mark.value]); })
          .curve(d3.curveMonotoneX)
          .context(foreground);
        render_item = AREA;
        let tranformedData = d3.nest().key(d => d[self.scheme[self.scheme.mark.key].key]).entries(self.scheme.data.value);
        tranformedData.sort((a,b)=>self.scheme[self.scheme.mark.key].scale(a.key)-self.scheme[self.scheme.mark.key].scale(b.key))
        render_items(tranformedData, foreground);
      }
    }
  }
}
