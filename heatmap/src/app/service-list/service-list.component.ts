import {Component, OnInit, OnDestroy, Input, Output, EventEmitter} from '@angular/core';
import {Subject} from 'rxjs';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-service-list',
  templateUrl: './service-list.component.html',
  styleUrls: ['./service-list.component.scss']
})
export class ServiceListComponent implements OnDestroy, OnInit {
  @Input() serviceFullList: any;
  @Output() onChangeService = new EventEmitter<any>();
  dtOptions: DataTables.Settings = {};
  faCheck = faCheck;
  constructor() { }
  onClickDisable (event){
    event.enable = !event.enable;
    this.onChangeService.emit(this.serviceFullList);
  }
  ngOnInit(): void {
    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 50
    };
  }
  ngOnDestroy(): void {
    // Do not forget to unsubscribe the event
  }
}
