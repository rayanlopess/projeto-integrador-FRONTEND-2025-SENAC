import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Geolocation } from '@capacitor/geolocation';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
  IonButtons,
  IonRange,
  IonList,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';

import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { search, close } from 'ionicons/icons';
import { HospitalService } from '../../../services/sistema-hospital/hospital'; // Add this import
import { BuscarLocalizacao } from '../../../services/maps/buscar-localizacao';
import { AlertController } from '@ionic/angular/standalone';
import { GeocodificacaoService } from 'src/app/services/maps/geocodificacao';

@Component({
  selector: 'app-config-inicial',
  templateUrl: './config-inicial.page.html',
  styleUrls: ['./config-inicial.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonIcon,
    IonButtons,
    IonRange,
    IonList,
    IonItem,
    IonLabel,
    CommonModule,
    FormsModule]
})
export class ConfigInicialPage implements OnInit {
  public range: number = 20;
  public enderecoManual: string = '';
  public class_enderecoManual: string = '';
  public class_error: string = 'ion-touched ion-invalid';
  public usandoLocalizacaoAtual: boolean = false;
  public carregando: boolean = false; // Added loading state

  public predictions: any[] = [];


  constructor(
    private router: Router, // Changed from public rt to private router
    private alertController: AlertController,
    private hospitalService: HospitalService, // Added HospitalService
    private buscarLocalizacaoService: BuscarLocalizacao,
    private geocodificacaoService: GeocodificacaoService
  ) {
    addIcons({ search, close});
  }

  ngOnInit() {
  }

  @ViewChild('inputRef') inputElement: ElementRef | undefined;
    @ViewChild('inputEnderecoManualRef') inputEnderecoManualRef: ElementRef | undefined;
    limparInput(campo: 'enderecoManual') {
        let inputRef: ElementRef | undefined;

        if (campo === 'enderecoManual') {
            this.enderecoManual = '';
            inputRef = this.inputEnderecoManualRef;
        }


        // Retorna o foco
        if (inputRef && inputRef.nativeElement) {
            inputRef.nativeElement.focus();
        }
    }

  pinFormatter(value: number) {
    return `${value}km`;
  }

  onAddressInput(event: any) {
    const query = event.target.value;
    if (query && query.length > 2) {
      this.buscarLocalizacaoService.getAddresses(query).subscribe(
        (data) => {
          this.predictions = data.predictions || [];
        },
        (error) => {
          console.error('Erro ao buscar endereços:', error);
          this.predictions = [];
        }
      );
    } else {
      this.predictions = [];
    }
  }

  async selectPrediction(prediction: any) {
    this.enderecoManual = prediction.description;
    this.predictions = [];
    this.usandoLocalizacaoAtual = false;
     const alert = await this.alertController.create({
                header: 'Endereço adicionado com sucesso!',
                buttons: [{
                    text: 'OK',
                    role: 'OK',
                    cssClass: 'confirmarAction',
                    handler: () => {

                    },
                },],
            });

            await alert.present();
  }

  async salvarConfig() {
    // Verifica se o usuário não forneceu nenhuma forma de localização
    if (!this.usandoLocalizacaoAtual && this.enderecoManual.trim() === '') {
      const alert = await this.alertController.create({
        header: 'Localização necessária',
        message: 'Selecione uma localização ou digite um endereço.',
        cssClass: 'container-alert',
        buttons: [
          {
            text: 'OK',
            role: 'confirm',
            cssClass: 'confirmarAction',
          },
        ],
      });

      await alert.present();
      return;
    }

    this.carregando = true;

    try {
      // Altere o JSON para salvar apenas as configurações de localização
      const config = {
        Distancia: this.range, // Manter o valor no JSON para referência futura, se necessário
        EnderecoManual: this.usandoLocalizacaoAtual ? "false" : this.enderecoManual,
        LocalizacaoAtual: this.usandoLocalizacaoAtual ? "true" : "false"
      };

      localStorage.setItem('configuracoesUsuario', JSON.stringify(config));

      // AQUI É O PONTO CRÍTICO: Chame o método do serviço para salvar e emitir o novo raio
      this.hospitalService.setRaioConfigurado(this.range);

      // O método carregarHospitaisProximos não precisa do `this.range` como parâmetro,
      // pois ele já pegará o raio do `BehaviorSubject`
      if (this.usandoLocalizacaoAtual) {
        await this.hospitalService.inicializarComLocalizacaoAtual();
      } else {
        await this.hospitalService.inicializarComEndereco(this.enderecoManual);
      }

      // Altere a chamada para carregarHospitaisProximos para que ele use o valor salvo
      await this.hospitalService.carregarHospitaisComConfiguracoesSalvas();

      this.router.navigate(['/path/home']);
      localStorage.setItem("isFirstTime", "false");

    } catch (error: any) {
      // ...
    } finally {
      this.carregando = false;
    }
  }

  async usarLocalizacaoAtual() {
    this.usandoLocalizacaoAtual = true;
    this.class_enderecoManual = '';


    const coordinates = await Geolocation.getCurrentPosition();
            const lat = coordinates.coords.latitude;
            const lng = coordinates.coords.longitude;

            // Chama o novo serviço para obter o endereço
            const enderecoEncontrado = await this.geocodificacaoService.getAddressFromCoords(lat, lng).toPromise();

            // Encontra o endereço mais relevante (ex: com nome de rua e número)
            let descricao = 'Localização Atual';
            if (enderecoEncontrado.results && enderecoEncontrado.results.length > 0) {
                const formattedAddress = enderecoEncontrado.results.find((result: any) => result.types.includes('route') || result.types.includes('street_address'));
                if (formattedAddress) {
                    this.enderecoManual = formattedAddress.formatted_address;
                } else {
                    // Se não encontrar uma rua, use o endereço mais geral
                    this.enderecoManual = enderecoEncontrado.results[0].formatted_address;
                }
            }



     const alert = await this.alertController.create({
                header: 'Localização adicionada com sucesso!',
                buttons: [{
                    text: 'OK',
                    role: 'OK',
                    cssClass: 'confirmarAction',
                    handler: () => {

                    },
                },],
            });

            await alert.present();
  }

  // Added method to handle manual address input
  onEnderecoManualChange() {
    if (this.enderecoManual.trim() !== '') {
      this.usandoLocalizacaoAtual = false;
    }
  }

  // Added getter for template
  get usandoEnderecoManual(): boolean {
    return !this.usandoLocalizacaoAtual && this.enderecoManual.trim() !== '';
  }
}