import {Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, AfterViewInit, DoCheck} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import {Loaddata} from './loaddata.service';
import { DataTableDirective } from 'angular-datatables';
import * as d3 from 'd3';

@Component({
  selector: 'app-service-list',
  templateUrl: './service-list.component.html',
  styleUrls: ['./service-list.component.scss'],

})
export class ServiceListComponent implements OnDestroy, OnInit {
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  serviceFullListSubscription: Subscription;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();
  faCheck = faCheck;
  _serviceFullList: any[];
  serviceFullList_or: any[];
  get serviceFullList() { return this._serviceFullList; }
  set serviceFullList(value) { this._serviceFullList = value; }
  constructor(private loadDataFrame: Loaddata) {}
  onClickDisable(event){
    event.enable = !event.enable;
    this.loadDataFrame.onChangeService(this.serviceFullList_or);
  }
  ngOnInit(): void {
    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 20
    };
    this.loadDataFrame.serviceFullList.subscribe(serviceFullList => {
      this.serviceFullList_or = serviceFullList.slice();
      if (this.serviceFullList && serviceFullList.length === this.serviceFullList.length) {
        const serviceFullList_ob = {};
        this.serviceFullList.forEach((s, si) => {
          serviceFullList_ob[s.text] = si;
        });
        serviceFullList.sort((a, b) => serviceFullList_ob[a.text] - serviceFullList_ob[b.text]);
        this.serviceFullList = serviceFullList;
        // this.rerender();
      }else{
        this.serviceFullList = serviceFullList;
        this.makeNewTable();
      }
    });
  }

  ngOnDestroy(): void {
    // Do not forget to unsubscribe the event
    this.dtTrigger.unsubscribe();
    // this.serviceFullListSubscription.unsubscribe();
  }

  makeNewTable(): void {
    if (this.dtElement && this.dtElement.dtInstance) {
      this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
        dtInstance.destroy(true);
      });
    }
    this.dtTrigger.next();
  }

}
