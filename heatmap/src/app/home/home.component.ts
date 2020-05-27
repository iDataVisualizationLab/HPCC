import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  providers: [],
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private splitScreen: boolean;
  private isKeyDown: boolean;

  constructor() {

  }

  @HostListener('document:keyup', ['$event'])
  @HostListener('document:keydown', ['$event'])

  ngOnInit() {
    this.onResize();
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

  }
}
