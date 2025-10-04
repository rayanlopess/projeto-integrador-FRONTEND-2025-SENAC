import { Injectable, NgZone } from '@angular/core';
import { RequiemDosDeusesService } from '../requisicao-HTTP/requisicao';
import { BehaviorSubject } from 'rxjs';
import { Geolocation } from '@capacitor/geolocation';

declare var google: any;

// A interface Hospital reflete o dado bruto que pode vir do backend
export interface Hospital {
  id: number;
  nome: string;
  uf: string;
  cidade: string;
  logradouro: string;
  bairro: string;
  lati: number;
  longi: number;
  tempo_espera: number;
  // Permite receber o objeto Buffer ou a string Base64 já convertida (caso venha direto)
  foto: { type: 'Buffer', data: number[] } | string | null; 
}

// A interface HospitalProcessado define a foto como a string Base64 final para exibição
export interface HospitalProcessado extends Hospital {
  distancia?: number;
  tempoDeslocamento?: number;
  distanciaRota?: number;
  enderecoCompleto?: string;
  // A foto aqui é sempre a string Base64 ou null (para exibição)
  foto: string | null; 
}

export interface LocalizacaoUsuario {
  lat: number;
  lng: number;
  endereco?: string;
}

export interface ConfiguracoesUsuario {
  Distancia: number;
  EnderecoManual: string;
  LocalizacaoAtual: string;
}

@Injectable({
  providedIn: 'root'
})
export class HospitalService {

  private hospitaisFiltradosSource = new BehaviorSubject<HospitalProcessado[]>([]);
  hospitaisFiltrados$ = this.hospitaisFiltradosSource.asObservable();

  private localizacaoUsuarioSource = new BehaviorSubject<LocalizacaoUsuario | null>(null);
  localizacaoUsuario$ = this.localizacaoUsuarioSource.asObservable();

  constructor(
    private requisicaoService: RequiemDosDeusesService,
    private ngZone: NgZone
  ) { }

  private raioChangedSubject = new BehaviorSubject<number>(this.getRaioConfigurado());
  public raioChanged$ = this.raioChangedSubject.asObservable();

  setRaioConfigurado(raio: number) {
    localStorage.setItem('raioKm', raio.toString());
    this.raioChangedSubject.next(raio);
  }

  getRaioConfigurado(): number {
    const raio = localStorage.getItem('raioKm');
    return raio ? parseInt(raio, 10) : 10;
  }

  getConfiguracoes(): ConfiguracoesUsuario | null {
    try {
      const configStr = localStorage.getItem('configuracoesUsuario');
      if (configStr) {
        return JSON.parse(configStr);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Método para obter hospitais processados
  getHospitaisProcessados(): HospitalProcessado[] {
    return this.hospitaisFiltradosSource.value;
  }
  
  /**
   * Converte um objeto Buffer do backend para uma string Base64 para exibição.
   * Assume que o tipo de imagem é 'image/jpeg'.
   * @param rawData O campo foto bruto do hospital.
   * @returns String Base64 formatada ou null.
   */
  private converterBufferParaBase64(rawData: { type: 'Buffer', data: number[] } | string | null): string | null {
    if (rawData && typeof rawData === 'object' && rawData.type === 'Buffer' && Array.isArray(rawData.data)) {
      try {
        // Cria um Buffer a partir do array de números (bytes)
        const buffer = new Uint8Array(rawData.data);
        
        // Converte o Buffer em uma string Base64
        let binary = '';
        buffer.forEach(byte => binary += String.fromCharCode(byte));
        const base64String = btoa(binary);

        // Retorna a string Base64 com o prefixo do tipo MIME
        return `data:image/jpeg;base64,${base64String}`;
      } catch (e) {
        console.error('Erro na conversão para Base64:', e);
        return null;
      }
    }
    // Retorna a string existente (se já for Base64 ou URL) ou null
    return typeof rawData === 'string' ? rawData : null;
  }

  /**
   * Método para obter hospitais básicos, aplicando a conversão da foto.
   */
  async getTodosHospitais(): Promise<HospitalProcessado[]> {
    try {
      const todosHospitais = await this.requisicaoService.get(
        '/hospital',
        {}
      ).toPromise() as any[];

      return todosHospitais.map(hospital => ({
        id: hospital.id,
        nome: hospital.nome,
        uf: hospital.uf,
        cidade: hospital.cidade,
        logradouro: hospital.logradouro,
        bairro: hospital.bairro,
        // Garante que lati e longi são do tipo number
        lati: parseFloat(hospital.lati as any), 
        longi: parseFloat(hospital.longi as any),
        
        // Aplica a conversão para Base64
        foto: this.converterBufferParaBase64(hospital.foto), 
        tempo_espera: hospital.tempo_espera,
        qtd_pacientes: hospital.qtd_pacientes // Adicionei qtd_pacientes aqui, já que está sendo usado abaixo
      } as HospitalProcessado));
    } catch (error) {
      console.error('Erro ao buscar hospitais:', error);
      return [];
    }
  }

  // ================== MÉTODOS PRINCIPAIS ================== //

  async inicializarComConfiguracoesSalvas(): Promise<LocalizacaoUsuario> {
    try {
      const config = await this.obterConfiguracoesLocalStorage();

      if (config.LocalizacaoAtual === 'true') {
        return await this.inicializarComLocalizacaoAtual();
      } else if (config.EnderecoManual) { 
        return await this.inicializarComEndereco(config.EnderecoManual);
      } else {
        throw new Error('Nenhuma configuração de localização válida encontrada');
      }
    } catch (error) {
      console.error('Erro ao inicializar com configurações salvas:', error);
      throw error;
    }
  }

  // Este é o método que deve ser chamado para carregar todos os dados.
  // Ele agora orquestra a localização e o carregamento dos hospitais.
  async carregarHospitaisComConfiguracoesSalvas(): Promise<void> {
    try {
      // 1. Obtém as configurações do localStorage (Distancia, LocalizacaoAtual, etc.)
      const config = await this.obterConfiguracoesLocalStorage();

      // 2. Com base nas configurações, inicializa a localização do usuário.
      // Esta chamada atualiza o BehaviorSubject `localizacaoUsuarioSource`.
      const localizacaoUsuario = await this.inicializarComConfiguracoesSalvas();

      // 3. Atualiza o raio e notifica os ouvintes (como a MapaPage).
      this.setRaioConfigurado(config.Distancia);

      // 4. Carrega e processa os hospitais com base na localização e no raio.
      // Esta chamada atualiza o BehaviorSubject `hospitaisFiltradosSource`.
      await this.carregarHospitaisProximos(config.Distancia);

    } catch (error) {
      console.error('Erro ao carregar com configurações salvas:', error);
      throw error;
    }
  }

  private async obterConfiguracoesLocalStorage(): Promise<ConfiguracoesUsuario> {
    try {
      const configStr = localStorage.getItem('configuracoesUsuario');
      if (configStr) {
        const config = JSON.parse(configStr);
        if (config.Distancia && config.EnderecoManual !== undefined && config.LocalizacaoAtual !== undefined) {
          return config;
        }
      }
      throw new Error('Configurações não encontradas ou inválidas no localStorage');
    } catch (error) {
      console.error('Erro ao ler configurações:', error);
      throw new Error('Erro ao carregar configurações salvas');
    }
  }

  async inicializarComLocalizacaoAtual(): Promise<LocalizacaoUsuario> {
    try {
      await this.verificarPermissoes();

      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const loc = {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      };

      this.ngZone.run(() => {
        this.localizacaoUsuarioSource.next(loc);
      });

      return loc;

    } catch (error: any) {
      console.error('Erro ao obter localização:', error);
      throw new Error(this.tratarErroGeolocalizacao(error));
    }
  }

  private async verificarPermissoes(): Promise<void> {
    try {
      // Capacitor.checkPermissions() só existe se a plataforma suportar
      if (typeof Geolocation.checkPermissions === 'function') {
        const permissionStatus = await Geolocation.checkPermissions();

        if (permissionStatus.location !== 'granted') {
          const requestStatus = await Geolocation.requestPermissions();

          if (requestStatus.location !== 'granted') {
            throw new Error('Permissão de localização negada pelo usuário');
          }
        }
      }
    } catch (error) {
      console.error('Erro nas permissões:', error);
      throw new Error('Não foi possível verificar as permissões de localização');
    }
  }

  private tratarErroGeolocalizacao(error: any): string {
    const errorCode = error.code || error.message;

    switch (errorCode) {
      case 1:
      case 'PERMISSION_DENIED':
        return 'Permissão de localização negada. Ative nas configurações do seu dispositivo.';
      case 2:
      case 'POSITION_UNAVAILABLE':
        return 'Localização indisponível. Verifique se o GPS está ativado.';
      case 3:
      case 'TIMEOUT':
        return 'Tempo esgotado para obter localização. Tente novamente.';
      default:
        return 'Erro ao obter localização. Tente novamente.';
    }
  }

  async inicializarComEndereco(endereco: string): Promise<LocalizacaoUsuario> {
    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();

      geocoder.geocode({ address: endereco, componentRestrictions: { country: 'BR' } }, (results: any[], status: string) => {
        this.ngZone.run(() => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            const loc = {
              lat: location.lat(),
              lng: location.lng(),
              endereco: results[0].formatted_address
            };

            this.localizacaoUsuarioSource.next(loc);
            resolve(loc);
          } else {
            reject(this.tratarErroGeocoding(status));
          }
        });
      });
    });
  }

  private tratarErroGeocoding(status: string): string {
    switch (status) {
      case 'ZERO_RESULTS':
        return 'Endereço não encontrado. Verifique se está correto.';
      case 'OVER_QUERY_LIMIT':
        return 'Limite de consultas excedido. Tente novamente mais tarde.';
      case 'REQUEST_DENIED':
        return 'Consulta ao serviço de geolocalização negada.';
      case 'INVALID_REQUEST':
        return 'Endereço inválido. Verifique os dados informados.';
      default:
        return `Erro ao processar endereço: ${status}`;
    }
  }

  async carregarHospitaisProximos(raioKm: number = 10): Promise<void> {
    const localizacao = this.localizacaoUsuarioSource.value;
    if (!localizacao) {
      throw new Error('Localização do usuário não definida');
    }
    
    try {
      // 1. Obtém todos os hospitais (agora com a conversão de foto e mapeamento de tipos resolvidos)
      const todosHospitais: HospitalProcessado[] = await this.getTodosHospitais();

      // 2. Calcula a distância em linha reta (Haversine)
      const hospitaisComDistanciaInicial = todosHospitais.map(hospital => {
        const distancia = this.calcularDistancia(
          localizacao.lat, localizacao.lng,
          hospital.lati, hospital.longi
        );
        return {
          ...hospital,
          distancia,
        } as HospitalProcessado;
      })
      // Filtra com uma margem (20%) para garantir que hospitais próximos por estrada não sejam perdidos
      .filter(hospital => (hospital.distancia ?? Infinity) <= raioKm * 1.2); 

      // 3. Calcula rotas e tempos (apenas para os 10 mais próximos em linha reta)
      hospitaisComDistanciaInicial.sort((a, b) => (a.distancia ?? Infinity) - (b.distancia ?? Infinity));

      const hospitaisParaCalcularRota = hospitaisComDistanciaInicial.slice(0, 10);
      const hospitaisComRota = await this.calcularRotasETempos(
        hospitaisParaCalcularRota,
        localizacao.lat,
        localizacao.lng
      );

      // 4. Combina resultados e define a distância final para filtragem
      const hospitaisRestantes = hospitaisComDistanciaInicial.slice(10).map(h => ({ 
        ...h, 
        tempoDeslocamento: undefined, // Limpa os campos de rota para os que não foram calculados
        distanciaRota: undefined 
      }));

      const todosHospitaisProcessados = [
        ...hospitaisComRota,
        ...hospitaisRestantes
      ];

      // 5. Filtra pelo raio final (usando a rota se disponível, ou a distância Haversine)
      const hospitaisFinais = todosHospitaisProcessados.filter(h => {
        const distanciaFinal = h.distanciaRota ?? h.distancia;
        return (distanciaFinal ?? Infinity) <= raioKm;
      });

      // 6. Ordena por Distância (Rota ou Haversine) e desempata por tempo de espera
      hospitaisFinais.sort((a, b) => {
        const distA = a.distanciaRota ?? a.distancia ?? Infinity;
        const distB = b.distanciaRota ?? b.distancia ?? Infinity;
        
        if (distA !== distB) {
          return distA - distB;
        }
        return a.tempo_espera - b.tempo_espera;
      });

      this.hospitaisFiltradosSource.next(hospitaisFinais);
    } catch (error) {
      console.error('Erro ao carregar hospitais:', error);
      this.hospitaisFiltradosSource.next([]);
      throw error;
    }
  }

  // ================== MÉTODOS AUXILIARES ================== //

  private formatarEndereco(hospital: HospitalProcessado): string {
    const parts = [hospital.logradouro, hospital.bairro, hospital.cidade, hospital.uf];
    return parts.filter(part => part && part.trim()).join(', ');
  }

  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private async calcularRotasETempos(hospitais: HospitalProcessado[], latOrigem: number, lngOrigem: number): Promise<HospitalProcessado[]> {
    const origem = new google.maps.LatLng(latOrigem, lngOrigem);
    const directionsService = new google.maps.DirectionsService();

    const promises = hospitais.map(async (hospital) => {
      try {
        const destino = new google.maps.LatLng(hospital.lati, hospital.longi);

        const result = await new Promise<any>((resolve, reject) => {
          directionsService.route({
            origin: origem,
            destination: destino,
            travelMode: 'DRIVING',
            unitSystem: google.maps.UnitSystem.METRIC,
            region: 'BR'
          }, (result: any, status: string) => {
            // A API do Maps retorna status na string. Usamos ngZone.run() para garantir que 
            // a promessa se resolva no contexto do Angular, embora não seja estritamente 
            // necessário aqui devido ao uso de Promise.
            this.ngZone.run(() => {
                status === 'OK' ? resolve(result) : reject(status);
            });
          });
        });

        const rota = result.routes[0].legs[0];
        return {
          ...hospital,
          // Tempo em minutos
          tempoDeslocamento: Math.ceil(rota.duration.value / 60), 
          // Distância em km
          distanciaRota: rota.distance.value / 1000 
        };
      } catch (error) {
        console.warn(`Erro ao calcular rota para ${hospital.nome}. Status:`, error);
        // Em caso de erro, retorna o hospital sem os dados de rota.
        return hospital; 
      }
    });

    // Usamos Promise.all para executar as requisições de rota em paralelo
    return Promise.all(promises);
  }

  // ================== MÉTODOS ÚTEIS ================== //

  getLocalizacaoAtual(): LocalizacaoUsuario | null {
    return this.localizacaoUsuarioSource.value;
  }

  limparDados(): void {
    this.hospitaisFiltradosSource.next([]);
    this.localizacaoUsuarioSource.next(null);
  }

  async atualizarRaio(raioKm: number): Promise<void> {
    // É importante salvar a nova configuração de raio aqui
    this.setRaioConfigurado(raioKm); 
    
    const localizacao = this.localizacaoUsuarioSource.value;
    if (localizacao) {
      await this.carregarHospitaisProximos(raioKm);
    }
  }

  temConfiguracoesSalvas(): boolean {
    try {
      const configStr = localStorage.getItem('configuracoesUsuario');
      if (configStr) {
        const config = JSON.parse(configStr);
        return !!(config.Distancia && (config.EnderecoManual !== undefined || config.LocalizacaoAtual === 'true'));
      }
      return false;
    } catch (error) {
      return false;
    }
  }
}
