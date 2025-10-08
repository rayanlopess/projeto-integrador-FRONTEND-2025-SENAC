import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonModal,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonRange,
    IonLabel,
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular/standalone';


import { addIcons } from 'ionicons';
import { sunny, moon, phonePortrait, close, arrowBackOutline, search, trash } from 'ionicons/icons';
import { Router } from '@angular/router';

import { HospitalService } from '../../../services/sistema-hospital/hospital';
import { BuscarLocalizacao } from '../../../services/maps/buscar-localizacao';
import { Geolocation } from '@capacitor/geolocation';
import { GeocodificacaoService } from '../../../services/maps/geocodificacao';
import { Navigation } from '../../../services/navigation/navigation';


@Component({
    selector: 'app-config-user',
    templateUrl: './config-user.page.html',
    styleUrls: ['./config-user.page.scss'],
    standalone: true,
    imports: [
        IonTabs,
        IonTabBar,
        IonTabButton,
        IonIcon,
        IonModal,
        IonHeader,
        IonToolbar,
        IonButtons,
        IonButton,
        IonTitle,
        IonContent,
        IonGrid,
        IonRow,
        IonCol,
        IonCard,
        IonCardContent,
        IonList,
        IonItem,
        IonRange,
        IonLabel,
        CommonModule,
        FormsModule
    ]
})
export class ConfigUserPage implements OnInit {
    public range: number = 50;
    public enderecoManual: string = '';
    public class_enderecoManual: string = '';
    public predictions: any[] = [];
    public enderecosSalvos: any[] = [];
    public enderecoAtivo: any = null;
    public usandoLocalizacaoAtual: boolean = false;

    constructor(
        private router: Router,
        private alertController: AlertController,
        private hospitalService: HospitalService,
        private buscarLocalizacaoService: BuscarLocalizacao,
        private geocodificacaoService: GeocodificacaoService,
        private location: Location,
        private navigationService: Navigation
    ) {
        addIcons({ sunny, moon, phonePortrait, close, arrowBackOutline, search, trash });
    }

    ngOnInit() {
        this.carregarConfiguracoes();
        this.enderecoManual = '';
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

    async carregarConfiguracoes() {
        const enderecosStr = localStorage.getItem('enderecosSalvos');
        if (enderecosStr) {
            this.enderecosSalvos = JSON.parse(enderecosStr);
        }

        const configStr = localStorage.getItem('configuracoesUsuario');
        if (configStr) {
            const config = JSON.parse(configStr);
            this.range = config.Distancia || 50;
            this.usandoLocalizacaoAtual = config.LocalizacaoAtual === 'true';
            this.enderecoManual = config.EnderecoManual !== 'false' ? config.EnderecoManual : '';

            // Adiciona o endereço manual se ele não estiver na lista
            if (this.enderecoManual && !this.enderecosSalvos.some(e => e.descricao === this.enderecoManual)) {
                this.enderecosSalvos.push({
                    descricao: this.enderecoManual,
                    eLocalizacaoAtual: false,
                    selecionado: false
                });
                localStorage.setItem('enderecosSalvos', JSON.stringify(this.enderecosSalvos));
            }



            // Adiciona a "Localização Atual" com o nome da rua, se estiver ativa e não na lista
            // Note que a descrição 'Localização Atual' foi substituída por config.EnderecoManual
            if (this.usandoLocalizacaoAtual && !this.enderecosSalvos.some(e => e.eLocalizacaoAtual === true)) {
                try {
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
                            descricao = formattedAddress.formatted_address;
                        } else {
                            // Se não encontrar uma rua, use o endereço mais geral
                            descricao = enderecoEncontrado.results[0].formatted_address;
                        }
                    }

                    this.salvarNovoEndereco(descricao, true);

                } catch (error) {
                    console.error('Erro ao obter localização ou endereço:', error);
                    const alert = await this.alertController.create({
                        header: 'Erro',
                        message: 'Não foi possível obter sua localização. Verifique as permissões do aplicativo.',
                        buttons: ['OK']
                    });
                    await alert.present();
                }
            }
        }

        this.selecionarEnderecoAtivo(this.enderecoManual);
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

    onInputBlur() {
        setTimeout(() => {
            this.predictions = [];
            this.enderecoManual = '';
        }, 200);
    }

    async selectPrediction(prediction: any) {
        // Remove a linha que atribui o valor à caixa de busca, deixando-a vazia
        this.predictions = [];
        this.usandoLocalizacaoAtual = false;
        this.salvarNovoEndereco(prediction.description, false);
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
        setTimeout(() => {
            this.enderecoManual = '';
        }, 0);
    }

    async usarLocalizacaoAtual() {
        try {
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
                    descricao = formattedAddress.formatted_address;
                } else {
                    // Se não encontrar uma rua, use o endereço mais geral
                    descricao = enderecoEncontrado.results[0].formatted_address;
                }
            }

            this.salvarNovoEndereco(descricao, true);

        } catch (error) {
            console.error('Erro ao obter localização ou endereço:', error);
            const alert = await this.alertController.create({
                header: 'Erro',
                message: 'Não foi possível obter sua localização. Verifique as permissões do aplicativo.',
                buttons: [{
                    text: 'OK',
                    role: 'OK',
                    cssClass: 'confirmarAction',
                    handler: () => {

                    },
                },]
            });
            await alert.present();
        }
        finally {
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
    }

    salvarNovoEndereco(descricao: string, eLocalizacaoAtual: boolean) {
        let enderecoExistente = this.enderecosSalvos.find(e => e.descricao === descricao);

        if (enderecoExistente) {
            this.selecionarEndereco(enderecoExistente);
        } else {
            const novoEndereco = {
                descricao: descricao,
                eLocalizacaoAtual: eLocalizacaoAtual,
                selecionado: true
            };

            this.enderecosSalvos.forEach(e => e.selecionado = false);
            this.enderecosSalvos.push(novoEndereco);
            this.enderecoAtivo = novoEndereco;

            localStorage.setItem('enderecosSalvos', JSON.stringify(this.enderecosSalvos));
            this.salvarConfiguracoesUsuarios(novoEndereco);
        }
    }

    selecionarEndereco(endereco: any) {
        this.enderecosSalvos.forEach(e => e.selecionado = (e === endereco));
        this.enderecoAtivo = endereco;
        this.salvarConfiguracoesUsuarios(endereco);
    }

    onRangeChange() {
        this.salvarConfiguracoesUsuarios(this.enderecoAtivo);
    }

    salvarConfiguracoesUsuarios(enderecoSelecionado: any) {
        const config = {
            Distancia: this.range,
            EnderecoManual: enderecoSelecionado.eLocalizacaoAtual ? "false" : enderecoSelecionado.descricao,
            LocalizacaoAtual: enderecoSelecionado.eLocalizacaoAtual ? "true" : "false"
        };

        localStorage.setItem('configuracoesUsuario', JSON.stringify(config));
        this.hospitalService.setRaioConfigurado(this.range);
        this.hospitalService.carregarHospitaisComConfiguracoesSalvas();
    }

    selecionarEnderecoAtivo(enderecoManual: string) {
        this.enderecoAtivo = this.enderecosSalvos.find(e => e.descricao === enderecoManual || (this.usandoLocalizacaoAtual && e.eLocalizacaoAtual));
        if (this.enderecoAtivo) {
            this.selecionarEndereco(this.enderecoAtivo);
        }
    }


    async removerEndereco(enderecoParaRemover: any, event: MouseEvent) {
        event.stopPropagation(); // Impede a propagação do clique

        const alert = await this.alertController.create({
            header: 'Confirmar exclusão',
            message: `Tem certeza que deseja remover o endereço "${enderecoParaRemover.descricao}"?`,
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel',
                    cssClass: 'confirmarAction',
                },
                {
                    text: 'Excluir',
                    cssClass: 'cancelarAction',
                    handler: () => {
                        // Filtra o array, removendo o endereço selecionado
                        this.enderecosSalvos = this.enderecosSalvos.filter(
                            (e) => e !== enderecoParaRemover
                        );

                        // Se o endereço removido era o selecionado, selecione outro
                        if (enderecoParaRemover.selecionado) {
                            this.enderecoAtivo = null;
                            if (this.enderecosSalvos.length > 0) {
                                this.selecionarEndereco(this.enderecosSalvos[0]);
                            } else {
                                // Se não houver mais endereços, limpa o EnderecoManual
                                this.usandoLocalizacaoAtual = false;
                                const config = {
                                    Distancia: this.range,
                                    EnderecoManual: "false",
                                    LocalizacaoAtual: "false"
                                };
                                localStorage.setItem('configuracoesUsuario', JSON.stringify(config));
                                this.hospitalService.setRaioConfigurado(this.range);
                                this.hospitalService.carregarHospitaisComConfiguracoesSalvas();
                            }
                        }

                        // Salva o novo array no localStorage
                        localStorage.setItem(
                            'enderecosSalvos',
                            JSON.stringify(this.enderecosSalvos)
                        );
                    },
                },
            ],
        });

        await alert.present();
    }

    async voltar() {
        await this.router.navigate(['/path/home']).then(() => {
            window.location.reload();
        });
    }
}