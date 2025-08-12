import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-ger-colaboradores',
  templateUrl: './ger-colaboradores.page.html',
  styleUrls: ['./ger-colaboradores.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class GerColaboradoresPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
