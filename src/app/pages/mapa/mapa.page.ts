import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, AfterViewInit, ViewChild, OnInit, OnDestroy, signal } from '@angular/core';
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
} from '@ionic/angular/standalone';


import { addIcons } from 'ionicons';
import { home, map, call, settings, personCircle, invertMode, medical, locate } from 'ionicons/icons';
import { GoogleMap } from '@capacitor/google-maps';

import { SimplePopoverComponent } from '../../components/simple-popover/simple-popover.component';
import { AlertController, PopoverController } from '@ionic/angular/standalone';
import { ThemeService, ThemeMode } from '../../services/theme/theme';
import { HospitalService, Hospital, HospitalProcessado, LocalizacaoUsuario } from '../../services/sistema-hospital/hospital';

import { point } from '@turf/helpers';
import { circle } from '@turf/circle';

import { Subscription } from 'rxjs';

const apiKey = "AIzaSyDvQ8YamcGrMBGAp0cslVWSRhS5NXNEDcI";

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.page.html',
  styleUrls: ['./mapa.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
    IonSpinner,
    CommonModule,
    FormsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MapaPage implements OnInit, OnDestroy {
  @ViewChild('map')
  mapRef!: ElementRef<HTMLElement>;
  newMap?: GoogleMap;
  userLocation?: { lat: number; lng: number };
  private themeSubscription?: Subscription;
  private raioSubscription?: Subscription;
  private hospitaisSubscription?: Subscription; // Adicione esta linha
  currentTheme: 'light' | 'dark' = 'light';
  private isMapInitialized = false;
  private hospitalMarkers: string[] = [];
  private circleId?: string;
  private raioKm: number = 10;
  private enderecoManual: string = JSON.parse(localStorage.getItem('configuracoesUsuario') || '{}').EnderecoManual || '';
  private localizacaoAtual: string = JSON.parse(localStorage.getItem('configuracoesUsuario') || '{}').LocalizacaoAtual || '';

  // Adicione uma propriedade para armazenar os hospitais filtrados
  private hospitaisFiltrados: HospitalProcessado[] = [];

  isLoading = signal(true);
  loadError = signal(false);

  constructor(
    public alertController: AlertController,
    private popoverCtrl: PopoverController,
    private themeService: ThemeService,
    private hospitalService: HospitalService
  ) {
    addIcons({ home, map, call, settings, personCircle, invertMode, medical, locate });
  }

  ngOnInit() {
    this.currentTheme = this.themeService.getCurrentTheme();


    this.themeSubscription = this.themeService.themeChanged$.subscribe((mode: ThemeMode) => {
      const newTheme = this.themeService.getCurrentTheme();
      if (newTheme !== this.currentTheme && this.isMapInitialized) {
        this.currentTheme = newTheme;
        this.recreateMapWithNewTheme();
      } else {
        this.currentTheme = newTheme;
      }
    });

    this.raioSubscription = this.hospitalService.raioChanged$.subscribe((novoRaio: number) => {
      // Apenas atualiza o valor e, se o mapa estiver pronto, atualiza o mapa
      this.raioKm = novoRaio;
      if (this.isMapInitialized) {
        this.atualizarMapaComNovoRaio();
      }
    });

    // Adicione a inscrição para a lista de hospitais filtrados
    this.hospitaisSubscription = this.hospitalService.hospitaisFiltrados$.subscribe(hospitais => {
      this.hospitaisFiltrados = hospitais;
      if (this.isMapInitialized) {
        this.addHospitalMarkers(this.hospitaisFiltrados);
        this.addRadiusCircle();
      }
    });
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.raioSubscription) {
      this.raioSubscription.unsubscribe();
    }
    if (this.hospitaisSubscription) {
      this.hospitaisSubscription.unsubscribe();
    }
    this.destroyMap();
  }

  async presentPopover(event: Event) {
    const popover = await this.popoverCtrl.create({
      component: SimplePopoverComponent,
      event
    });
    await popover.present();
  }

  async ionViewDidEnter() {
    // Se o mapa já foi inicializado, ignore.
    if (this.isMapInitialized) return;

    // --- LÓGICA DE INICIALIZAÇÃO MOVIDA PARA CÁ ---
    try {
      this.isLoading.set(true);

      // NOVO: Adicione um atraso extra e final para garantir que o layout Ionic esteja concluído.
      // 500ms é um valor seguro para acomodar a renderização nativa.
      await new Promise(resolve => setTimeout(resolve, 500));

      let localizacaoUsuario: LocalizacaoUsuario | null = null;
      // ... (Restante da lógica de busca de localização)
      try {
        localizacaoUsuario = await this.hospitalService.inicializarComConfiguracoesSalvas();
      } catch (error) {
        console.warn('Não foi possível inicializar com configurações salvas, usando a localização atual como fallback.', error);
        localizacaoUsuario = await this.hospitalService.inicializarComLocalizacaoAtual();
      }

      if (localizacaoUsuario) {
        this.userLocation = {
          lat: localizacaoUsuario.lat,
          lng: localizacaoUsuario.lng
        };
      } else {
        throw new Error('Não foi possível obter a localização do usuário.');
      }
      // --- FIM DA LÓGICA DE BUSCA ---

      await this.createMap(); // Onde o mapa é de fato criado

      this.isMapInitialized = true;
      this.isLoading.set(false);

      this.raioKm = this.hospitalService.getRaioConfigurado();
      this.addHospitalMarkers(this.hospitaisFiltrados);
      this.addRadiusCircle();

    } catch (error: any) {
      console.error('Erro durante inicialização do mapa:', error);
      this.loadError.set(true);
      this.isLoading.set(false);
      this.presentAlert('Erro de Localização', error.message || 'Não foi possível carregar o mapa. Por favor, verifique suas configurações de localização.');
    }
  }

  async ionViewWillLeave() {
    await this.destroyMap();
  }


  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async createMap() {
    if (!this.mapRef?.nativeElement) {
      console.error('Map container not found');
      this.loadError.set(true);
      return;
    }

    if (!this.userLocation) {
      console.error('User location not defined before map creation.');
      this.loadError.set(true);
      return;
    }

    if (this.localizacaoAtual === "false" && this.enderecoManual === "false") {
      console.error('User location not defined before map creation.');
      this.loadError.set(true);
      return;
    }

    try {
      await this.destroyMap();

      const zoomLevel = this.calculateZoomLevel(this.raioKm);

      this.newMap = await GoogleMap.create({
        id: 'my-map',
        element: this.mapRef.nativeElement,
        apiKey: apiKey,

        config: {
          center: this.userLocation,
          zoom: zoomLevel,
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
          mapId: this.currentTheme === 'dark' ? "6fbe87b38800cc70488f7956" : "6fbe87b38800cc70bd62cb93",
        },
      });

      await this.newMap.setOnMarkerClickListener(async (event) => {
        await this.showHospitalInfo(event.markerId);
      });

      // ----------------------------------------------------
      // SOLUÇÃO CRÍTICA (CORRIGIDA): USANDO setPadding
      // ----------------------------------------------------

      // 1. Tenta obter a altura real da barra de ferramentas (toolbar)
      const toolbarElement = document.querySelector('ion-toolbar');
      let toolbarHeight = 0;
      if (toolbarElement) {
        toolbarHeight = toolbarElement.offsetHeight;
      }
      // Valor padrão seguro (56px é o padrão do Ionic) caso não encontre o elemento
      await this.newMap.setPadding({
        top: toolbarHeight,
        bottom: 0,
        left: 0,
        right: 0
      });

      // NOVO PASSO: Força uma atualização da câmera e re-renderização
      await this.newMap.setCamera({
        coordinate: this.userLocation, // Usa a localização já obtida
        zoom: zoomLevel // Usa o nível de zoom já calculado
      });

      // ----------------------------------------------------

      await this.addUserMarker();

    } catch (error) {
      console.error('Error creating map:', error);
      throw error;
    }
  }

  private calculateZoomLevel(radiusKm: number): number {
    if (radiusKm <= 10) return 11.3;
    if (radiusKm <= 20) return 10.3;
    if (radiusKm <= 30) return 9.7;
    if (radiusKm <= 40) return 9.3;
    if (radiusKm <= 50) return 9;
    if (radiusKm <= 60) return 8.7;
    if (radiusKm <= 70) return 8.5;
    if (radiusKm <= 80) return 8.3;
    if (radiusKm <= 90) return 8.1;
    if (radiusKm <= 100) return 8;
    return 11.3;
  }

  async addUserMarker() {
    if (!this.newMap || !this.userLocation) return;
    try {
      await this.newMap.addMarker({
        coordinate: this.userLocation,
        title: 'Sua localização',
        snippet: 'Você está aqui!',
        iconUrl: '../../../assets/icons/snippet-user.png',
        iconSize: { width: 40, height: 40 }
      });
    } catch (error) {
      console.error('Error adding user marker:', error);
    }
  }

  // Refatorado para receber a lista de hospitais como parâmetro
  async addHospitalMarkers(hospitais: (Hospital | HospitalProcessado)[]) {
    if (!this.newMap) return;
    try {
      await this.clearHospitalMarkers();

      for (const hospital of hospitais) {
        try {
          const markerId = await this.newMap.addMarker({
            coordinate: {
              lat: hospital.lati,
              lng: hospital.longi
            },
            title: hospital.nome,
            snippet: this.createHospitalSnippet(hospital),
            iconUrl: '../../../assets/icons/snippet-hospital.png',
            iconSize: { width: 40, height: 40 }
          });
          this.hospitalMarkers.push(markerId);
        } catch (error) {
          console.error(`Erro ao adicionar marcador para ${hospital.nome}:`, error);
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar marcadores dos hospitais:', error);
    }
  }


  async addRadiusCircle() {
    if (!this.newMap || !this.userLocation) {
      console.error('Mapa ou localização não definidos para adicionar o círculo.');
      return;
    }
    console.log('Valor de raioKm:', this.raioKm);



    try {


      const centerPoint = point([this.userLocation.lng, this.userLocation.lat]);

      // Usamos 'as any' para contornar o erro de tipagem.
      // Isso informa ao TypeScript para não verificar os tipos neste objeto.
      const options = { steps: 64, units: 'kilometers' } as any;
      const circlePolygon = circle(centerPoint, this.raioKm, options);

      console.log(`Desenhando círculo com raio de ${this.raioKm}km`);

      const polygonIds = await this.newMap.addPolygons([{
        paths: circlePolygon.geometry.coordinates[0].map(coord => ({
          lat: coord[1],
          lng: coord[0]
        })),
        strokeColor: '#3880ff',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#3880ff',
        fillOpacity: 0.2
      }]);

      this.circleId = polygonIds[0];
    } catch (error) {
      console.error('Erro ao adicionar círculo do raio:', error);
    }
  }



  async showHospitalInfo(markerId: string) {
    try {
      const hospital = await this.findHospitalByMarkerId(markerId);
      if (!hospital) return;

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

            },
          },
        ],
      });
      await alert.present();
    } catch (error) {
      console.error('Erro ao mostrar informações do hospital:', error);
    }
  }

  private async findHospitalByMarkerId(markerId: string): Promise<Hospital | HospitalProcessado | null> {
    // Agora busca na lista filtrada, que está em this.hospitaisFiltrados
    const markerIndex = this.hospitalMarkers.indexOf(markerId);
    if (markerIndex !== -1 && markerIndex < this.hospitaisFiltrados.length) {
      return this.hospitaisFiltrados[markerIndex];
    }
    return null;
  }

  private createHospitalSnippet(hospital: Hospital | HospitalProcessado): string {
    let snippet = '';
    snippet += `Cidade: ${hospital.cidade} - ${hospital.uf}\n`;
    snippet += `Bairro: ${hospital.bairro}\n`;
    if ('tempo_espera' in hospital) {
      snippet += `Tempo de espera: ${hospital.tempo_espera} min\n`;
    }
    if ('distancia' in hospital && hospital.distancia) {
      snippet += `Distância: ${hospital.distancia.toFixed(1)} km\n`;
    }
    if ('tempoDeslocamento' in hospital && hospital.tempoDeslocamento) {
      snippet += `Tempo de deslocamento: ${hospital.tempoDeslocamento} min\n`;
    }
    return snippet;
  }

  async clearHospitalMarkers() {
    if (!this.newMap || this.hospitalMarkers.length === 0) return;
    try {
      await this.newMap.removeMarkers(this.hospitalMarkers);
      this.hospitalMarkers = [];
    } catch (error) {
      console.error('Erro ao limpar marcadores:', error);
    }
  }

  async atualizarMapaComNovoRaio() {
    console.log('Atualizando mapa com novo raio:', this.raioKm);
    this.isLoading.set(true);
    try {
      // Destrói o mapa atual antes de recriá-lo
      await this.destroyMap();

      // Recria o mapa com a nova configuração de zoom
      await this.createMap();

      // Adiciona novamente os marcadores de hospital e o círculo com o novo raio
      await this.addHospitalMarkers(this.hospitaisFiltrados);
      await this.addRadiusCircle();

      this.isMapInitialized = true;
      this.isLoading.set(false);
    } catch (error) {
      console.error('Erro ao atualizar mapa com novo raio:', error);
      this.isLoading.set(false);
    }
  }

  async recreateMapWithNewTheme() {
    console.log('Recriando mapa com novo tema:', this.currentTheme);
    this.isLoading.set(true);
    try {
      await this.createMap();
      await this.addHospitalMarkers(this.hospitaisFiltrados); // Adicionar await
      await this.addRadiusCircle(); // Adicionar await
      this.isLoading.set(false);
    } catch (error) {
      console.error('Erro ao recriar mapa:', error);
      this.isLoading.set(false);
    }
  }

  async destroyMap() {
    if (this.newMap) {
      try {
        // Limpar markers e circles ANTES de destruir o mapa
        await this.clearHospitalMarkers();
        if (this.circleId) {
          await this.newMap.removeCircles([this.circleId]);
          this.circleId = undefined;
        }

        // A CHAVE: Destruir o recurso nativo
        await this.newMap.destroy();
        this.newMap = undefined;
        this.isMapInitialized = false; // Resetar o flag
      } catch (error) {
        console.error('Error destroying map:', error);
      }
    }
  }

  async retryLoadMap() {
    this.loadError.set(false);
    this.isLoading.set(true);
    try {
      const localizacaoUsuario = await this.hospitalService.inicializarComConfiguracoesSalvas();
      if (localizacaoUsuario) {
        this.userLocation = {
          lat: localizacaoUsuario.lat,
          lng: localizacaoUsuario.lng
        };
      } else {
        throw new Error('Não foi possível obter a localização do usuário.');
      }
      await this.createMap();
      this.addHospitalMarkers(this.hospitaisFiltrados);
      this.addRadiusCircle();
      this.isMapInitialized = true;
      this.isLoading.set(false);
    } catch (error: any) {
      console.error('Erro ao recarregar mapa:', error);
      this.loadError.set(true);
      this.isLoading.set(false);
      this.presentAlert('Erro ao Recarregar', error.message || 'Não foi possível carregar o mapa. Tente novamente mais tarde.');
    }
  }
}