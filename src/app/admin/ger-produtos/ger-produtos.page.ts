import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-ger-produtos',
  templateUrl: './ger-produtos.page.html',
  styleUrls: ['./ger-produtos.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class GerProdutosPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
