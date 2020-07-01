import { Component, OnInit } from '@angular/core';
import {Scheme} from "../../../../heatmap-angular/src/app/AsynChart/model";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  _data: Scheme[];
  isPagebusy: boolean;
  get data() {return this._data }
  set data(value) {this._data = value; }
  constructor() { }

  ngOnInit(): void {
    this.isPagebusy = true;
    this.onResize();

  }
  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

  }

}
