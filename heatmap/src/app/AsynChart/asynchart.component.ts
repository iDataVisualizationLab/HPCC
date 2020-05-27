import {Component, HostListener, Input, OnChanges, OnInit} from "@angular/core";
import * as d3 from 'd3';

@Component({
  selector: 'app-asynchart',
  templateUrl: './asynchart.component.html',
  styleUrls: ['./asynchart.component.scss']
})

export class AsynchartComponent implements OnInit, OnChanges {

  @Input() width: number;
  @Input() height: number;

  private _originalWidth: number;
  private _originalHeight: number;
  private _uniqueID: string;
  private _selectionContext: any;
  private _context: any;

  get context() { return this._context; }
  set context(value: any) { this._context = value; }
  ngOnInit(): void {
    this._originalHeight = this.height;
    this._originalWidth = this.width;
  }

  ngOnChanges(): void {
    if (this.context === undefined) {
      return;
    }
    if (this.width === 0 || this.height === 0) {
      return;
    }
    // this.selectionRect.offset = {
    //   x: this.configuration.leftSide ? 0 : window.innerWidth - this.width,
    //   y: 0
    // };
  }

  constructor(

  ){

  }
}
