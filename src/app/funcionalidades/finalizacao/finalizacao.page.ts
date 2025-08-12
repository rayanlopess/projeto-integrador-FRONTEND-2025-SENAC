import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-finalizacao',
  templateUrl: './finalizacao.page.html',
  styleUrls: ['./finalizacao.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class FinalizacaoPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
