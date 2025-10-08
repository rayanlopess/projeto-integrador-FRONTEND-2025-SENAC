import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonModal,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/angular/standalone';

import { ThemeActionService } from '../../services/theme/theme-action';
import { ThemeService, ThemeMode } from '../../services/theme/theme';

import { addIcons } from 'ionicons';
import { sunny, moon, phonePortrait, close, arrowBackOutline } from 'ionicons/icons';

import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { PopoverController, AlertController } from '@ionic/angular/standalone';

import { App } from '@capacitor/app';

@Component({
  selector: 'app-simple-popover',
  standalone: true,
  imports: [IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonModal,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol, CommonModule],
  template: `
    <ion-list>
      
      <ion-item lines="none" button (click)="irConfig()">
        <ion-label>Localização</ion-label>
        <ion-note slot="end">Raio: {{raioDistancia()}}km</ion-note>
      </ion-item>

      <ion-item lines="none" button (click)="openThemeSelector()">
        <ion-label>Tema</ion-label>
        <ion-note slot="end">{{ getCurrentStatus() }}</ion-note>
      </ion-item>
     
      <ion-item lines="none" button (click)="setOpenModalTerm(true)">
        <ion-label >Termos de Uso</ion-label>
      </ion-item>

      <ion-item lines="none" button (click)="setOpenModalPriv(true)">
        <ion-label>Privacidade e Segurança</ion-label>
      </ion-item>

      <ion-item lines="none" button (click)="abrirCentralAjuda()">
        <ion-label>Central de Ajuda</ion-label>
      </ion-item>

      <ion-item lines="none" button (click)="sairApp()">
        <ion-label class="cancelarAction">Sair</ion-label>
      </ion-item>
    </ion-list>





  <ion-modal [isOpen]="isModalOpen">
    <ng-template>
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button id="botao-toolbar" (click)="setOpenModalTerm(false)">
              <ion-icon name="arrow-back-outline"></ion-icon>
            </ion-button>
          </ion-buttons>
          <div class="titulos-container">
            <ion-title id="home-title">Termos de Uso</ion-title>
          </div>
        </ion-toolbar>
      </ion-header>

      <ion-content [fullscreen]="true">
        <ion-grid>
          <ion-row>
            <ion-col>
              <h1 id="titulo-termos-uso">
                TERMOS DE USO – FILAMED
              </h1>
            </ion-col>
          </ion-row>
          <ion-row>
            <ion-col>
              <p id="texto-termos-uso">
                <span>1. Aceitação dos Termos:</span> <br><br>
                Ao utilizar o aplicativo <a>FilaMed</a>, o usuário declara que leu, compreendeu e concorda integralmente com os
                presentes <a>Termos de Uso</a>. Caso não concorde, deve interromper imediatamente o uso do aplicativo. <br><br>
                <span>2. Informações sobre o Aplicativo:</span> <br><br>
                O <a>FilaMed</a> é um aplicativo desenvolvido pela empresa <a>FilaMed</a>, com o objetivo de contribuir para a saúde
                pública. Sua função é calcular, em tempo real, a fila de hospitais e <a>Unidades de Pronto Atendimento (UPAs)</a>,
                auxiliando o usuário a decidir entre a unidade mais próxima ou outra com menor tempo de espera. <br><br>
                <span>3. Público-Alvo:</span> <br><br>
                O aplicativo é destinado ao <a>público em geral</a>, desde que alfabetizado, não havendo restrição de idade
                específica. <br> <br>
                <span>4. Cadastro e Acesso:</span> <br> <br>
                O aplicativo não exige <a>cadastro</a> ou <a>login</a> para utilização de suas funcionalidades.<br> <br>
                <span>5. Uso Permitido e Proibido</span> <br><br>
                O usuário se compromete a utilizar o aplicativo de forma <a>lícita</a> e <a>responsável</a>. <a>É expressamente proibido</a>:<br><br>
                <a id="lista-termos-uso">5.1 Utilizar os contatos de emergência disponibilizados no app para efetuar ligações falsas ou indevidas;</a> <br><br>
                <a id="lista-termos-uso">5.2 Utilizar o aplicativo para fins ilegais, imorais ou que possam causar prejuízo a terceiros.</a> <br> <br>
                <span>6. Interação entre Usuários:</span> <br><br>
                O <a>FilaMed</a> não possui recursos de interação entre usuários (como chats, comentários ou postagens).<br> <br>
                <span>7. Propriedade Intelectual:</span> <br><br>
                Todos os direitos relacionados ao aplicativo, incluindo <a>marca, design, código-fonte, layout, funcionalidades e
                conteúdos</a>, pertencem exclusivamente à empresa <a>FilaMed</a>. É vedada qualquer <a>reprodução, modificação, distribuição
                ou utilização</a> não autorizada do conteúdo do aplicativo. <br> <br>
                <span>8. Conteúdo de Usuários:</span> <br><br>
                O aplicativo não permite o envio de conteúdos por parte dos usuários. <br> <br>
                <span>9. Coleta e Uso de Dados:</span> <br> <br>
                O Filamed coleta apenas dados de localização, necessários para o correto funcionamento do aplicativo. O app
                também integra recursos de terceiros, como:<br><br>
                <a id="lista-termos-uso">9.1 API de dados hospitalares;</a><br><br>
                <a id="lista-termos-uso">9.2 Aplicativo de telefone (para realizar chamadas diretamente do celular);</a><br><br>
                <a id="lista-termos-uso">9.3 Google Maps (para exibição de rotas e mapas).</a><br><br>
                O usuário, ao aceitar os Termos, autoriza o uso dessas integrações. <br> <br>
                <span>10. Limitação de Responsabilidade:</span> <br><br>
                O Filamed se destina apenas a fornecer informações estimadas sobre filas em UPAs. A empresa não se
                responsabiliza por: <br><br>
                <a id="lista-termos-uso">10.1 Eventuais erros, desatualizações ou indisponibilidade de dados;</a><br><br>
                <a id="lista-termos-uso">10.2 Decisões tomadas pelo usuário com base nas informações do aplicativo;</a><br><br>
                <a id="lista-termos-uso">10.3 Danos diretos ou indiretos decorrentes do uso inadequado do app.</a> <br> <br>
                <span>11. Alterações nos Termos:</span> <br> <br>
                Os presentes Termos não possuem previsão de alteração frequente. Contudo, caso seja necessário, a empresa
                poderá revisar este documento, e a versão atualizada será disponibilizada no próprio aplicativo. <br> <br>
                <span>12. Foro e Legislação Aplicável:</span> <br><br> 
                Os presentes Termos serão regidos pelas leis da <a>República Federativa do Brasil</a>. Fica eleito o foro da comarca
                de <a>Criciúma/SC</a> para resolver quaisquer disputas oriundas destes Termos. <br> <br>
                <span>13. Contato:</span> <br> <br>
                Em caso de dúvidas, o usuário pode entrar em contato com a empresa por meio do e-mail:
                <a>noreplyfilamedpi@gmail.com</a> <br> <br>
              </p>
            </ion-col>
          </ion-row>
        </ion-grid>
      </ion-content>

    </ng-template>
  </ion-modal>



  <ion-modal [isOpen]="isModalOpen1">
    <ng-template>

      <ion-header>
      <ion-toolbar>

        <ion-buttons slot="start">
          <ion-button id="botao-toolbar" (click)="setOpenModalPriv(false)">
            <ion-icon name="arrow-back-outline"></ion-icon>
          </ion-button>
        </ion-buttons>

        <div class="titulos-container">
          <ion-title id="home-title">Privacidade e Segurança</ion-title>
        
        </div>

      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-grid>
        <ion-row>
          <ion-col>
            <h1 id="titulo-termos-uso">
              POLÍTICA DE PRIVACIDADE – FILAMED
            </h1>
          </ion-col>
        </ion-row>

        <ion-row>
          <ion-col>
            <p id="texto-termos-uso">
              <span>1. Aceitação dos Termos:</span> <br><br>
              Ao utilizar o aplicativo Filamed, o usuário declara que leu, compreendeu e concorda
              integralmente com os presentes Termos de Uso. Caso não concorde, deve interromper imediatamente o uso do
              aplicativo. <br><br>

              <span>2. Informações sobre o Aplicativo:</span> <br><br>
              O Filamed é um aplicativo desenvolvido pela empresa Filamed, com o objetivo de contribuir para a saúde
              pública. Ele calcula em tempo real a fila dos hospitais de pronto atendimento (UPAs), para o usuário saber se
              deve ir em uma UPA mais distante, mas em que a fila está menor, já que o mais perto pode ter muita fila. A
              parte de administrador organiza os hospitais cadastrados e os dados a serem mostrados aos usuários. <br><br>

              <span>3. Público-Alvo:</span> <br><br>
              O aplicativo é destinado ao público em geral, desde que alfabetizado, não havendo restrição de idade
              específica. <br><br>

              <span>4. Cadastro e Acesso:</span> <br><br>
              Não há possibilidade de autoinscrição por parte dos usuários. O aplicativo exige cadastro/login, que é
              fornecido diretamente pelos criadores do Sistema para os Administradores.<br><br>

              <span>5. Uso Permitido e Proibido</span> <br><br>
              O usuário se compromete a utilizar o aplicativo de forma <a>lícita</a> e <a>responsável</a>. <a>É
              expressamente proibido</a>:<br><br>
              <a id="lista-termos-uso">5.1 Modificar ou alterar informações sem responsabilidade;</a> <br><br>
              <a id="lista-termos-uso">5.2 Manipular dados de hospitais de maneira incorreta ou fraudulenta;</a> <br><br>
              <a id="lista-termos-uso">5.3 Realizar qualquer ação que prejudique os usuários do aplicativo Filamed.</a> <br><br>

              <span>6. Interação entre Usuários:</span> <br><br>
              Os módulos: administrador ou usuário não possuem recursos de interação entre usuários (como chats, comentários
              ou postagens).<br><br>

              <span>7. Propriedade Intelectual:</span> <br><br>
              Todos os direitos relacionados ao aplicativo, incluindo marca, design, código-fonte, layout, funcionalidades e
              conteúdos, pertencem exclusivamente à empresa Filamed. É vedada qualquer reprodução, modificação, distribuição
              ou utilização não autorizada do conteúdo do aplicativo.<br><br>

              <span>8. Conteúdo de Usuários:</span> <br><br>
              O aplicativo não permite o envio de conteúdos por parte dos usuários. Por parte dos administradores, é
              permitido o envio. <br><br>

              <span>9. Coleta e Uso de Dados:</span> <br><br>
              O Filamed coleta os seguintes dados pessoais dos administradores: nome completo, CPF, e-mail, senha (criada
              pelos organizadores), login (criado pelos organizadores) e data de nascimento. O app também integra recursos
              de terceiros, como:<br><br>
              <a id="lista-termos-uso">9.1 API de dados hospitalares;</a><br><br>
              <a id="lista-termos-uso">9.2 Aplicativo de telefone (para realizar chamadas diretamente do
              celular);</a><br><br>
              <a id="lista-termos-uso">9.3 Câmera e galeria de fotos do dispositivo;</a> <br><br>
              <a id="lista-termos-uso">9.4 Google Maps (para exibição de rotas e mapas).</a><br><br>
              O usuário, ao aceitar os Termos, autoriza o uso dessas integrações. <br><br>

              <span>10. Limitação de Responsabilidade:</span> <br><br>
              O Filamed (Módulo Administrador) se destina apenas a fornecer e organizar informações hospitalares. A
              empresa não se responsabiliza por: <br><br>
              <a id="lista-termos-uso">10.1 Erros ou alterações feitas indevidamente por administradores;</a><br><br>
              <a id="lista-termos-uso">10.2 Danos diretos ou indiretos decorrentes do uso inadequado do app;</a><br><br>
              <a id="lista-termos-uso">10.3 Consequências negativas de manipulação incorreta dos dados.</a> <br><br>

              <span>11. Alterações nos Termos:</span> <br><br>
              Os presentes Termos não possuem previsão de alteração frequente. Contudo, caso seja necessário, a empresa
              poderá revisar este documento, e a versão atualizada será disponibilizada no próprio aplicativo. <br><br>

              <span>12. Foro e Legislação Aplicável:</span> <br><br>
              Os presentes Termos serão regidos pelas leis da <a>República Federativa do Brasil</a>. Fica eleito o foro da
              comarca de <a>Criciúma/SC</a> para resolver quaisquer disputas oriundas destes Termos. <br><br>

              <span>13. Contato:</span> <br><br>
              Em caso de dúvidas, o usuário pode entrar em contato com a empresa por meio do e-mail:
              <a>noreplyfilamedpi@gmail.com</a> <br><br>
            </p>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>


    </ng-template>
  </ion-modal>



  `,
  styles: [`
    ion-list {
      padding: 0;
      margin: 0;
    }
    ion-item {
      --min-height: 48px;
    }
  `]
})
export class SimplePopoverComponent {
  themeInfo: any;
  private subscription!: Subscription;
  public config: any = localStorage.getItem('configuracoesUsuario');

  isModalOpen = false;
  isModalOpen1 = false;

  constructor(
    private themeActionService: ThemeActionService,
    private themeService: ThemeService,
    private router: Router,
    private popoverCtrl: PopoverController,
    public alertController: AlertController
  ) {
    addIcons({ sunny, moon, phonePortrait, close, arrowBackOutline });
  }


  setOpenModalTerm(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }
  setOpenModalPriv(isOpen: boolean) {
    this.isModalOpen1 = isOpen;
  }

  async abrirCentralAjuda() {
    await this.popoverCtrl.dismiss();

    // Navega para a página de configuração
    this.router.navigate(['/central-ajuda']);
  }


  ngOnInit() {
    this.updateThemeInfo();
    // Escuta mudanças em tempo real
    this.subscription = this.themeService.themeChanged$.subscribe(() => {
      this.updateThemeInfo();
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  raioDistancia() {
    const raio = JSON.parse(this.config);
    const distancia = raio.Distancia
    return distancia;
  }
  async irConfig() {
    // Fecha o popover atual antes de navegar
    await this.popoverCtrl.dismiss();

    // Navega para a página de configuração
    this.router.navigate(['/config-user']);
  }

  async openThemeSelector() {
    await this.themeActionService.openThemeSelector();
  }

  getCurrentStatus(): string {

    const temaAtual = this.themeService.getCurrentTheme() === 'dark' ? 'Escuro' : 'Claro';



    const mode = this.themeService.getCurrentMode();
    switch (mode) {
      case 'auto': return `Auto (${temaAtual})`;
      case 'light': return 'Claro';
      case 'dark': return 'Escuro';
      default: return 'Automático';
    }
  }

  private updateThemeInfo() {
    this.themeInfo = this.themeService.getThemeInfo();
    console.log('Tema atualizado:', this.themeInfo);
  }

  public async sairApp(): Promise<void> {
   const alert = await this.alertController.create({
      header: `Deseja realmente sair do App?`,
      cssClass: 'container-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'cancelarAction',
          handler: () => {
            console.log('Operação cancelada.');
          },
        },
        {
          text: 'Sim',
          role: 'confirm',
          cssClass: 'confirmarAction',
          handler: async () => {
            await App.exitApp();
          },
        },
      ],
    });

    await alert.present();
  }

}