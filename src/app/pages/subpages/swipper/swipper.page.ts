import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonIcon,
  IonContent,
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonThumbnail,
  IonTabBar,
  IonTabButton,
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
  IonNote,
  IonModal,
  IonCheckbox,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, map, call, settings, personCircle, chevronBack, chevronForward, ellipsisVertical, arrowBackOutline } from 'ionicons/icons';

import { ThemeService, ThemeMode } from '../../../services/theme/theme';
import { AlertController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

import { DateService } from '../../../services/datetime-service/date-service';

import { App } from '@capacitor/app';

@Component({
  selector: 'app-swipper',
  templateUrl: './swipper.page.html',
  styleUrls: ['./swipper.page.scss'],
  standalone: true,
  imports: [IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonIcon,
    IonContent,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonThumbnail,
    IonTabBar,
    IonTabButton,
    IonGrid,
    IonRow,
    IonCol,
    IonLabel,
    IonNote,
    IonModal,
    IonCheckbox,
    IonText,
    CommonModule,
    FormsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SwipperPage implements OnInit {

  public data: string = this.dateService.getFormattedDate();
  isModalOpen = false;



  constructor(
    private themeService: ThemeService,
    public alertController: AlertController,
    private rt: Router,
    private dateService: DateService,
  ) {
    addIcons({ home, map, call, settings, personCircle, chevronBack, chevronForward, ellipsisVertical, arrowBackOutline });
  }



  ngOnInit() {

  }

  onSubmit() {

  }

  //
  public temaAtual: string = this.themeService.getCurrentTheme()
  currentIndex = 0;
  pages = Array(8).fill(0); // 7 páginas

  goToNext() {
    if (this.currentIndex < 7) {
      this.currentIndex++;
    }
  }

  goToPrev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  public checkbox: boolean = false;
  public class_error: string = 'ion-touched ion-invalid';
  public isCheckboxInvalid: boolean = false; // Nova variável para controle
  irHome() {
    if (!this.checkbox) {
      this.isCheckboxInvalid = true; // Marca como inválido
      return;
    }

    // Se chegou aqui, checkbox está marcado
    this.isCheckboxInvalid = false; // Remove o erro
    this.rt.navigate(['/config-inicial']);
  }


  async pularHome() {

    const alert = await this.alertController.create({
      header: `Deseja pular a apresentação?`,
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
            this.currentIndex = 6;
          },
        },
      ],
    });

    await alert.present();
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

  setOpenModalTerm(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

}
