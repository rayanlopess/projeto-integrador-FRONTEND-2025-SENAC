import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AutenticacaoService } from 'src/app/service/autenticacao.service';

import { addIcons } from 'ionicons';
import { add, trash, chevronDown, personCircle, lockClosed, person, lockOpen } from 'ionicons/icons';
import { Router, RouterLink } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';

import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class LoginPage implements OnInit {

  isPasswordVisible = false;
   isAnimating = false;
  public login:string = '';
  public senha:string = '';

  constructor(
    public titleService: Title,
    public autenticacaoService: AutenticacaoService,
    public alertController: AlertController,
    public rt: Router
  ) { 
    addIcons({ add, trash, chevronDown, personCircle, lockClosed, person, lockOpen });
  }

  ngOnInit() {

    this.titleService.setTitle("Login");

  }



  togglePasswordVisibility() {
    this.isAnimating = true;
    this.isPasswordVisible = !this.isPasswordVisible;
    
    setTimeout(() => {
      this.isAnimating = false;
    }, 300); // Tempo igual à duração da animação
  }
  esqueciSenha(){
    this.rt.navigateByUrl('/esqueci-senha');
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
