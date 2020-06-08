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
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import {MatExpansionModule} from '@angular/material/expansion';
import { ViolinChartComponent } from './violin-chart/violin-chart.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AsynchartComponent,
    ServiceListComponent,
    ViolinChartComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    FontAwesomeModule,
    DataTablesModule,
    AppRoutingModule,
    NgbModule,
    BrowserAnimationsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatExpansionModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
