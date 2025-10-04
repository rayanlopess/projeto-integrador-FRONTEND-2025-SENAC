import { Routes } from '@angular/router';
import { PathsPage } from './pages/paths/paths.page';

export const routes: Routes = [

  //rotas principais
  {
    path: 'path',
    component: PathsPage,
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage)
      },
      {
        path: 'mapa',
        loadComponent: () => import('./pages/mapa/mapa.page').then(m => m.MapaPage)
      },
      {
        path: 'telefones',
        loadComponent: () => import('./pages/telefones/telefones.page').then(m => m.TelefonesPage)
      },
      {
        path: '',
        redirectTo: '/path/home',
        pathMatch: 'full',
      }
    ],
  },



  //caminho vazio redireciona para home
  {
    path: '',
    redirectTo: 'tela-logo',
    pathMatch: 'full',
  },
  {
    path: 'swipper',
    loadComponent: () => import('./pages/subpages/swipper/swipper.page').then(m => m.SwipperPage)
  },
  {
    path: 'privacidade-seguranca',
    loadComponent: () => import('./pages/subpages/termos-privacidade/privacidade-seguranca/privacidade-seguranca.page').then(m => m.PrivacidadeSegurancaPage)
  },
  {
    path: 'termos-uso',
    loadComponent: () => import('./pages/subpages/termos-privacidade/termos-uso/termos-uso.page').then(m => m.TermosUsoPage)
  },
  {
    path: 'config-user',
    loadComponent: () => import('./pages/subpages/config-user/config-user.page').then(m => m.ConfigUserPage)
  },
  {
    path: 'tela-logo',
    loadComponent: () => import('./pages/subpages/tela-logo/tela-logo.page').then(m => m.TelaLogoPage)
  },
  {
    path: 'config-inicial',
    loadComponent: () => import('./pages/subpages/config-inicial/config-inicial.page').then( m => m.ConfigInicialPage)
  },
  {
    path: 'central-ajuda',
    loadComponent: () => import('./pages/subpages/central-ajuda/central-ajuda.page').then( m => m.CentralAjudaPage)
  },
  {
    path: 'teste-mapa',
    loadComponent: () => import('./teste-mapa/teste-mapa.page').then( m => m.TesteMapaPage)
  },






];
