import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, OnInit, OnDestroy, signal } from '@angular/core';
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
// import { GoogleMap } from '@capacitor/google-maps'; // REMOVIDO: Usaremos a API JS

import { SimplePopoverComponent } from '../../components/simple-popover/simple-popover.component';
import { AlertController, PopoverController } from '@ionic/angular/standalone';
import { ThemeService, ThemeMode } from '../../services/theme/theme';
import { HospitalService, Hospital, HospitalProcessado, LocalizacaoUsuario } from '../../services/sistema-hospital/hospital';

import { Subscription } from 'rxjs';

// **IMPORTANTE:** O Google Maps JavaScript API não usa a chave "apiKey" dessa forma.
// A chave deve ser carregada no <head> do index.html.
// No entanto, para fins de manter a estrutura de inicialização, vamos usá-la.
// const apiKey = "AIzaSyDvQ8YamcGrMBGAp0cslVWSRhS5NXNEDcI"; // Chave será usada na função loadGoogleMaps

// **IMPORTANTE:** Adicione este 'declare' para o TypeScript reconhecer as classes do Google Maps JS
// Elas se tornam disponíveis após o carregamento do script do Google Maps no index.html.
declare const google: any;

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
  // NEW: Usaremos 'google.maps.Map'
  newMap?: google.maps.Map; 
  userLocation?: { lat: number; lng: number };
  private themeSubscription?: Subscription;
  private raioSubscription?: Subscription;
  private hospitaisSubscription?: Subscription;
  currentTheme: 'light' | 'dark' = 'light';
  private isMapInitialized = false;
  
  // NEW: Usaremos 'google.maps.Marker[]'
  private hospitalMarkers: google.maps.Marker[] = [];
  // NEW: Usaremos 'google.maps.Marker' para o marcador do usuário
  private userMarker?: google.maps.Marker; 
  // NEW: Usaremos 'google.maps.Circle'
  private circleInstance?: google.maps.Circle; 
  
  private raioKm: number = 10;
  private enderecoManual: string = JSON.parse(localStorage.getItem('configuracoesUsuario') || '{}').EnderecoManual || '';
  private localizacaoAtual: string = JSON.parse(localStorage.getItem('configuracoesUsuario') || '{}').LocalizacaoAtual || '';

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
        // **ALTERAÇÃO:** RecreateMapWithNewTheme agora só precisa atualizar o estilo
        this.updateMapStyle(newTheme); 
      } else {
        this.currentTheme = newTheme;
      }
    });

    this.raioSubscription = this.hospitalService.raioChanged$.subscribe((novoRaio: number) => {
      this.raioKm = novoRaio;
      if (this.isMapInitialized) {
        // **ALTERAÇÃO:** Atualiza o raio e a câmera sem recriar o mapa inteiro
        this.atualizarMapaComNovoRaio(); 
      }
    });

    this.hospitaisSubscription = this.hospitalService.hospitaisFiltrados$.subscribe(hospitais => {
      this.hospitaisFiltrados = hospitais;
      if (this.isMapInitialized) {
        this.addHospitalMarkers(this.hospitaisFiltrados);
        // O círculo será adicionado ou atualizado em 'atualizarMapaComNovoRaio' ou 'ionViewDidEnter'
        // Chamada aqui para garantir que os hospitais recém-filtrados sejam exibidos
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
    // **ALTERAÇÃO:** Não há método 'destroy()' na API JS, mas limpamos as referências
    this.newMap = undefined; 
    this.isMapInitialized = false;
  }

  async presentPopover(event: Event) {
    const popover = await this.popoverCtrl.create({
      component: SimplePopoverComponent,
      event
    });
    await popover.present();
  }

  async ionViewDidEnter() {
    if (this.isMapInitialized) return;

    try {
      this.isLoading.set(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      let localizacaoUsuario: LocalizacaoUsuario | null = null;

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

      await this.loadGoogleMapsScript(); // Certifica-se de que a API JS está carregada
      await this.createMap();

      this.isMapInitialized = true;
      this.isLoading.set(false);

      this.raioKm = this.hospitalService.getRaioConfigurado();
      await this.addUserMarker();
      await this.addHospitalMarkers(this.hospitaisFiltrados);
      await this.addRadiusCircle();

    } catch (error: any) {
      console.error('Erro durante inicialização do mapa:', error);
      this.loadError.set(true);
      this.isLoading.set(false);
      this.presentAlert('Erro de Localização', error.message || 'Não foi possível carregar o mapa. Por favor, verifique suas configurações de localização.');
    }
  }

  async ionViewWillLeave() {
    // Na API JS, não precisamos de 'destroyMap' ao sair, pois o mapa
    // não está em uma camada nativa. Apenas limpamos marcadores e referências.
    this.clearMapObjects(); 
  }

  // Novo método para carregar o script do Google Maps JS
  private loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.maps) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      // **IMPORTANTE:** Substitua 'YOUR_API_KEY' pela sua chave real, ou a constante 'apiKey'
      // O Capacitor Google Maps usa uma chave no código, mas a API JS espera uma URL.
      // Vou usar a constante de exemplo que você forneceu.
      const apiKey = "AIzaSyDvQ8YamcGrMBGAp0cslVWSRhS5NXNEDcI"; 
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (error) => reject(new Error('Falha ao carregar o script do Google Maps JS.'));
      document.head.appendChild(script);
    });
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

    const zoomLevel = this.calculateZoomLevel(this.raioKm);
    
   
    this.newMap = new google.maps.Map(this.mapRef.nativeElement, {
      center: this.userLocation,
      zoom: zoomLevel,
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
      // **ALTERAÇÃO:** O mapId agora é usado para um mapa estilizado (não tema dinâmico com cores)
      // O estilo de tema é manipulado via 'styles' ou ID, mas aqui usamos o Map ID padrão se estiver definido.
      mapId: this.currentTheme === 'dark' ? "6fbe87b38800cc70488f7956" : "6fbe87b38800cc70bd62cb93",
    });

    // **ALTERAÇÃO:** Configura o Listener para o clique no marcador
    this.newMap?.addListener('click', (event: any) => {
        // Se precisar de um listener para o mapa inteiro.
    });
    
    // Se o mapa for recriado, os listeners dos marcadores serão configurados em 'addHospitalMarkers'

    // **REMOVIDO:** setPadding() não é necessário na API JS. O Ionic lida com o layout HTML.
    // **REMOVIDO:** Forçar setCamera() também não é necessário, pois já foi feito na criação.
  }

  private updateMapStyle(theme: 'light' | 'dark') {
      if (!this.newMap) return;
      
      const mapId = theme === 'dark' ? "6fbe87b38800cc70488f7956" : "6fbe87b38800cc70bd62cb93";

      // **ALTERAÇÃO:** Atualiza o estilo usando 'mapId'
      this.newMap.setOptions({ mapId: mapId }); 
      console.log(`Estilo do mapa atualizado para o tema: ${theme}`);
  }


  private calculateZoomLevel(radiusKm: number): number {
    // A lógica de cálculo do zoom pode ser mantida, mas também podemos usar fitBounds
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
    
    // **ALTERAÇÃO:** Remove o marcador de usuário antigo
    if (this.userMarker) {
        this.userMarker.setMap(null);
    }
    
    // **ALTERAÇÃO:** Criação do marcador usando 'google.maps.Marker'
    this.userMarker = new google.maps.Marker({
      position: this.userLocation,
      map: this.newMap,
      title: 'Sua localização',
      icon: {
        url: '../../../assets/icons/snippet-user.png',
        scaledSize: new google.maps.Size(40, 40)
      }
    });

    // **ALTERAÇÃO:** Adiciona listener para o marcador do usuário (opcional)
    this.userMarker?.addListener('click', () => {
        this.newMap!.setCenter(this.userLocation!);
    });

    // **REMOVIDO:** A API JS não usa 'snippet' diretamente, mas podemos usar InfoWindow se necessário.
  }

  async addHospitalMarkers(hospitais: (Hospital | HospitalProcessado)[]) {
    if (!this.newMap) return;
    try {
      await this.clearHospitalMarkers(); // Limpa marcadores antigos

      for (const hospital of hospitais) {
        try {
          // **ALTERAÇÃO:** Criação do marcador usando 'google.maps.Marker'
          const marker = new google.maps.Marker({
            position: {
              lat: hospital.lati,
              lng: hospital.longi
            },
            map: this.newMap,
            title: hospital.nome,
            icon: {
                url: '../../../assets/icons/snippet-hospital.png',
                scaledSize: new google.maps.Size(40, 40)
            }
          });
          
          // **ALTERAÇÃO:** Adiciona o Listener de clique
          marker.addListener('click', () => {
             // O HospitalService deve ter uma maneira de buscar o hospital pelo nome/coordenada
             this.showHospitalInfo(marker.getTitle()!); 
          });

          this.hospitalMarkers.push(marker);
        } catch (error) {
          console.error(`Erro ao adicionar marcador para ${hospital.nome}:`, error);
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar marcadores dos hospitais:', error);
    }
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


  async addRadiusCircle() {
    if (!this.newMap || !this.userLocation) {
      console.error('Mapa ou localização não definidos para adicionar o círculo.');
      return;
    }
    console.log('Valor de raioKm:', this.raioKm);
    
    // **ALTERAÇÃO:** Remove o círculo antigo
    if (this.circleInstance) {
        this.circleInstance.setMap(null);
    }

    try {
      // **ALTERAÇÃO:** Criação do círculo usando 'google.maps.Circle'
      this.circleInstance = new google.maps.Circle({
        strokeColor: '#fff',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#fff',
        fillOpacity: 0.2,
        map: this.newMap,
        center: this.userLocation,
        // Raio é em metros, então convertemos km para metros (* 1000)
        radius: this.raioKm * 1000
      });

      // **ALTERAÇÃO:** Ajusta o zoom do mapa para incluir o círculo
      const center = new google.maps.LatLng(this.userLocation.lat, this.userLocation.lng);
      const radiusInMeters = this.raioKm * 1000;
      const bounds = this.getBounds(center, radiusInMeters);
      this.newMap.fitBounds(bounds);
      
    } catch (error) {
      console.error('Erro ao adicionar círculo do raio:', error);
    }
  }
  
  // Novo método para calcular os limites (bounds) de um círculo (necessário para 'fitBounds')
  private getBounds(center: any, radiusInMeters: number): any {
    const bounds = new google.maps.LatLngBounds();
    // A fórmula para estimar o ponto a 90 graus (Norte, Leste, Sul, Oeste)
    const distance = radiusInMeters; 
    
    // Northeast (0 degrees - East)
    const northEast = google.maps.geometry.spherical.computeOffset(center, distance, 45); 
    const southWest = google.maps.geometry.spherical.computeOffset(center, distance, 225); 

    bounds.extend(northEast);
    bounds.extend(southWest);

    return bounds;
  }


  async showHospitalInfo(markerTitle: string) {
    try {
      
      const hospital = this.hospitaisFiltrados.find(h => h.nome === markerTitle);
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
                this.abrirNoMapa(hospital)
            },
          },
        ],
      });
      await alert.present();
    } catch (error) {
      console.error('Erro ao mostrar informações do hospital:', error);
    }
  }
  
  // O findHospitalByMarkerId não é mais necessário, pois o Listener passa o título do marcador

  private createHospitalSnippet(hospital: Hospital | HospitalProcessado): string {
    // ... (mantido inalterado)
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
      // **ALTERAÇÃO:** Limpa os marcadores usando setMap(null)
      this.hospitalMarkers.forEach(marker => marker.setMap(null));
      this.hospitalMarkers = [];
    } catch (error) {
      console.error('Erro ao limpar marcadores:', error);
    }
  }

  // **ALTERAÇÃO:** Não recria o mapa inteiro, apenas atualiza o zoom e o círculo
  async atualizarMapaComNovoRaio() {
    console.log('Atualizando mapa com novo raio:', this.raioKm);
    this.isLoading.set(true);
    try {
      if (!this.newMap) {
        await this.createMap(); // Recria se não existir
      }

      // **ALTERAÇÃO:** Atualiza o círculo com o novo raio
      await this.addRadiusCircle(); 
      
      // O addRadiusCircle já chama fitBounds, que lida com o zoom
      
      await this.addHospitalMarkers(this.hospitaisFiltrados); // Re-adiciona para garantir visibilidade

      this.isLoading.set(false);
    } catch (error) {
      console.error('Erro ao atualizar mapa com novo raio:', error);
      this.isLoading.set(false);
    }
  }

  // **ALTERAÇÃO:** Não recria o mapa, apenas atualiza o estilo
  async recreateMapWithNewTheme() {
    console.log('Atualizando estilo do mapa para o novo tema:', this.currentTheme);
    this.isLoading.set(true);
    try {
      this.updateMapStyle(this.currentTheme);
      this.isLoading.set(false);
    } catch (error) {
      console.error('Erro ao recriar mapa (apenas estilo):', error);
      this.isLoading.set(false);
    }
  }

  // Novo método para limpar todos os objetos do mapa
  private clearMapObjects() {
      this.clearHospitalMarkers();
      if (this.circleInstance) {
          this.circleInstance.setMap(null);
          this.circleInstance = undefined;
      }
      if (this.userMarker) {
          this.userMarker.setMap(null);
          this.userMarker = undefined;
      }
      this.newMap = undefined;
      this.isMapInitialized = false;
  }
  
  // **ALTERAÇÃO:** destroyMap() não é necessário na API JS
  async destroyMap() {
    // Apenas limpa as referências para permitir a coleta de lixo
    this.clearMapObjects(); 
  }

  async retryLoadMap() {
    // ... (Mantido inalterado, pois usa a lógica de localização e createMap)
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
      
      await this.loadGoogleMapsScript(); // Garante o script
      await this.createMap();
      this.addUserMarker();
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