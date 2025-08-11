import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AutenticacaoService } from 'src/app/service/autenticacao.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class LoginPage implements OnInit {

  public login:string = '';
  public senha:string = '';

  constructor(
    public autenticacaoService: AutenticacaoService
  ) { }

  ngOnInit() {
  }
  logar(){
    let login = this.login;
    let senha = this.senha;

    this.autenticacaoService
    .logar(login, senha)
    .subscribe(
      (_res:any) => {

      
    })
  }

}
