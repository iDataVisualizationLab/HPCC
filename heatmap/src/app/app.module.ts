import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { DataTablesModule } from 'angular-datatables';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {AsynchartComponent} from './AsynChart/asynchart.component';
import {HomeComponent} from './home/home.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ServiceListComponent } from './service-list/service-list.component';
import {FormsModule} from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AsynchartComponent,
    ServiceListComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    FontAwesomeModule,
    DataTablesModule,
    AppRoutingModule,
    NgbModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
