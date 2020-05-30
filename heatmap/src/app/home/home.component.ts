import { Component, OnInit, HostListener } from '@angular/core';
import {Loaddata} from '../service-list/loaddata.service';
import {ServiceListComponent} from '../service-list/service-list.component';
import {Subject} from 'rxjs';
import {Scheme} from '../AsynChart/model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  providers: [],
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private splitScreen: boolean;
  private isKeyDown: boolean;
  _data: Scheme[];
  dataframe: any[];
  _serviceFullList: any[];
  isPagebusy: boolean;
  get data() {return this._data}
  set data(value) {this._data = value; }
  get serviceFullList() {return this._serviceFullList; }
  set serviceFullList(value) {this._serviceFullList = value; this.onChangeService(); }
  constructor(private loadDataFrame: Loaddata) {
  }

  @HostListener('document:keyup', ['$event'])
  @HostListener('document:keydown', ['$event'])

  ngOnInit() {
    this.isPagebusy = true;
    this.onResize();
    this.loadDataFrame.dataObj = {
      id: "serviceWed26Sep_removedmetric",
      name: "HPC data - 26 Sep 2018",
      url: "../assets/influxdb0424-0427.json",
      description: "",
      category: 'hpcc',
      date: "26 Apr 2019",
      group: "sample",
      formatType: 'json'
    };
    this.getData();
  }

  getData(): void {
    this.loadDataFrame.getDataFrame( (data) => {
      this.dataframe = data.dataframe;
      this.serviceFullList = data.serviceFullList;
      this.isPagebusy = false;
      return;
    });
  }
  onChangeFunc($event) {
    this.serviceFullList = $event;
  }
  onChangeService(): void {
    let temp_dataframe = [];
    const self = this;
    self.serviceFullList.forEach((s,si)=>{
      if (s.enable)
        temp_dataframe.push(self.getHeatmap(s.text));
    })
    self.data = temp_dataframe;
  }
  trackByFn(index, item ) {
    return( item.color.key );
  }
  getHeatmap = (selectedService) => {
    return {
      data: {value:this.dataframe},
      x: {key:'timestep', type: 'Band'},
      y: {key: 'compute', type: 'Band',visible:false},
      mark: {type: 'rect'},
      color: {key:selectedService, type: 'linear'}
    };
  }
  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

  }
}
