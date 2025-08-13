import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AutenticacaoService } from 'src/app/service/autenticacao.service';

import { addIcons } from 'ionicons';
import { add, trash, chevronDown, personCircle, lockClosed, person, lockOpen, mail} from 'ionicons/icons';
import { Router, RouterLink } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';

import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PedidosPage implements OnInit {
  public login:string = '';
  public senha:string = '';

  constructor(
    public titleService: Title,
    public autenticacaoService: AutenticacaoService,
    public alertController: AlertController,
    public rt: Router
  ) { 
    addIcons({ add, trash, chevronDown, personCircle, lockClosed, person, lockOpen, mail });
  }

  ngOnInit() {

    this.titleService.setTitle("Pedidos");

  }
}
