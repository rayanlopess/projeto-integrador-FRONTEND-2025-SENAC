import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonContent,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonThumbnail,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';

import { addIcons } from 'ionicons';
import { home, map, call, settings, personCircle, invertMode, medicalOutline, warningOutline, car, navigate, time, people, location} from 'ionicons/icons';
import { AlertController, PopoverController, LoadingController, RefresherCustomEvent } from '@ionic/angular/standalone';

import { DateService } from '../../services/datetime-service/date-service';
import { SimplePopoverComponent } from '../../components/simple-popover/simple-popover.component';
import { HospitalService, HospitalProcessado } from '../../services/sistema-hospital/hospital';
import { Subscription } from 'rxjs';



import { RefresherEventDetail } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonContent,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonThumbnail, CommonModule, FormsModule]
})
export class HomePage implements OnInit, OnDestroy {

  public hospitais: HospitalProcessado[] = [];
  public carregando: boolean = true;
  public erroCarregamento: boolean = false;
  public mensagemErro: string = '';
  public data: string = this.dateService.getFormattedDate();
public hospitalPhoto: string | null = null; // Base64 da foto
    public hospitalPhotoFilename: string = 'foto_hospital.jpeg'; // Nome do arquivo para o backend
  private subscription!: Subscription;

  isRefreshing = false;

  constructor(
    private router: Router,
    private dateService: DateService,
    public alertController: AlertController,
    private popoverCtrl: PopoverController,
    private hospitalService: HospitalService,
    private loadingController: LoadingController
  ) {
    addIcons({ home, map, call, settings, personCircle, invertMode, medicalOutline, warningOutline, car, navigate, time, people, location});
  }

  async ngOnInit() {
    await this.carregarHospitais();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    
  }

  handleRefresh(event: CustomEvent<RefresherEventDetail>) {
     this.isRefreshing = true;
    setTimeout(() => {
      this.isRefreshing = false;
      event.detail.complete(); 
      this.carregarHospitais();
    }, 2000); 
  }

  isModalOpen = false;

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  async carregarHospitais() {
    this.carregando = true;
    this.erroCarregamento = false;

    try {
      // Verifica se tem configurações salvas
      if (this.hospitalService.temConfiguracoesSalvas()) {
        await this.hospitalService.carregarHospitaisComConfiguracoesSalvas();
      } else {
        // Se não tem configurações, redireciona para configuração inicial
        this.router.navigate(['/config-user']);
        return;
      }

      // Se inscreve para receber os hospitais
      this.subscription = this.hospitalService.hospitaisFiltrados$.subscribe({
        next: (hospitais) => {
          this.hospitais = hospitais;
          console.log(hospitais)
          this.carregando = false;
          console.log('Hospitais carregados:', this.hospitais);
        },
        error: (error) => {
          console.error('Erro ao carregar hospitais:', error);
          this.mensagemErro = 'Erro ao carregar hospitais. Verifique sua conexão.';
          this.erroCarregamento = true;
          this.carregando = false;
        }
      });

    } catch (error: any) {
      console.error('Erro:', error);
      this.mensagemErro = error.message || 'Erro ao carregar hospitais';
      this.erroCarregamento = true;
      this.carregando = false;
    }
  }

  async tentarNovamente() {
    await this.carregarHospitais();
  }

  irParaConfiguracao() {
    this.router.navigate(['/config-user']);
  }

  async presentPopover(event: Event) {
    const popover = await this.popoverCtrl.create({
      component: SimplePopoverComponent,
      event
    });
    await popover.present();
  }

  async irHospital(hospital: HospitalProcessado) {
    // Use route distance if available, otherwise use straight line distance
    const distancia = hospital.distanciaRota ?? hospital.distancia;
    const tempoDeslocamento = hospital.tempoDeslocamento ? `${hospital.tempoDeslocamento} min` : '?';
    
    const alert = await this.alertController.create({
      header: `Deseja realmente ir até ${hospital.nome}?`,
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
          text: 'OK',
          role: 'confirm',
          cssClass: 'confirmarAction',
          handler: async () => {
            this.abrirNoMapa(hospital);
          },
        },
      ],
    });

    await alert.present();
  }

  private abrirNoMapa(hospital: HospitalProcessado) {
    const userLocation = this.hospitalService.getLocalizacaoAtual();
    
    if (userLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${hospital.nome}&travelmode=driving`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${hospital.lati},${hospital.longi}`;
      window.open(url, '_blank');
    }
  }

  // Helper methods for template - use these in your HTML to display the correct values
  getDistanciaDisplay(hospital: HospitalProcessado): string {
    // Prefer route distance, fall back to straight line distance
    const distancia = hospital.distanciaRota ?? hospital.distancia;
    return distancia ? this.formatarDistancia(distancia) : '?';
  }

  getTempoDeslocamentoDisplay(hospital: HospitalProcessado): string {
    return hospital.tempoDeslocamento ? `${hospital.tempoDeslocamento} min` : 'Calculando...';
  }

  getTempoEsperaDisplay(hospital: HospitalProcessado): string {
    return hospital.tempo_espera ? this.formatarTempo(hospital.tempo_espera) : '?';
  }

  formatarTempo(minutos: number): string {
    if (minutos < 60) {
      return `${minutos} min`;
    } else {
      const horas = Math.floor(minutos / 60);
      const mins = minutos % 60;
      return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
    }
  }

  formatarDistancia(km: number): string {
    return km < 1 ? `${(km * 1000).toFixed(0)}m` : `${km.toFixed(1)}km`;
  }
}