import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import * as d3 from 'd3';
import {Scheme} from "../../../../heatmap-angular/src/app/AsynChart/model";

@Component({
  selector: 'app-circular-layout',
  templateUrl: './circular-layout.component.html',
  styleUrls: ['./circular-layout.component.scss']
})
export class CircularLayoutComponent implements OnInit {
  @ViewChild('svg') public svgNode: ElementRef;

  @Input() width: number;
  @Input() height: number;
  @Input() margin: any = {top: 0, right: 0, bottom: 0, left: 0};
  @Input() scheme: Scheme;

  private _originalWidth: number;
  private _originalHeight: number;
  private _svg: any;

  private widthG = () => {
    return this._originalWidth - this.margin.left - this.margin.right;
  }
  private heightG = () => {
    return this._originalHeight - this.margin.top - this.margin.bottom;
  }


  get svg() { return this._svg; }
  set svg(value: any) { this._svg = value; }
  ngAfterViewInit(): void {
    this.initscreen();
    this.draw();
  }
  constructor() { }
  initscreen(): void {

    d3.select(this.svgNode.nativeElement).attr('width', this.width).attr('height', this.height);
    this._svg = d3.select(this.svgNode.nativeElement);
  }

  draw(): void {

  }

  ngOnInit(): void {
    this._originalHeight = this.height;
    this._originalWidth = this.width;
  }



}
