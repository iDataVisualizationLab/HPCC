import { Component, OnInit, HostListener } from '@angular/core';
import { useAnimation, transition, trigger, style, animate } from '@angular/animations';
import {Loaddata} from '../service-list/loaddata.service';
import {Scheme} from '../AsynChart/model';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  providers: [Loaddata],
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  _data: Scheme[];
  dataframe: any[];
  _serviceFullList: any[];
  isPagebusy: boolean;
  get data() {return this._data }
  set data(value) {this._data = value; }
  get serviceFullList() {return this._serviceFullList; }
  set serviceFullList(value) {this._serviceFullList = value; this.onChangeService(); }

  constructor(private loadDataFrame: Loaddata) {
  }

  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;
  openNav = false;
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
    this.loadDataFrame.loadData();
    this.loadDataFrame.serviceFullList.subscribe(serviceFullList => this.serviceFullList = serviceFullList);
    this.loadDataFrame.dataframe.subscribe(dataframe => (this.isPagebusy = false, this.dataframe = dataframe));
  }

  onChangeService(): void {
    let temp_dataframe = [];
    const self = this;
    self.serviceFullList.forEach((s,si)=>{
      if (s.enable)
        temp_dataframe.push(self.getHeatmap(s.text));
    });
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
