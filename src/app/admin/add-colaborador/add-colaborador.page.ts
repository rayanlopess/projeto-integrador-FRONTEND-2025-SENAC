import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-add-colaborador',
  templateUrl: './add-colaborador.page.html',
  styleUrls: ['./add-colaborador.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class AddColaboradorPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
