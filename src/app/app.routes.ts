import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./sistema-de-login/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./sistema-de-login/cadastro/cadastro.page').then( m => m.CadastroPage)
  },
  {
    path: 'esqueci-senha',
    loadComponent: () => import('./sistema-de-login/esqueci-senha/esqueci-senha.page').then( m => m.EsqueciSenhaPage)
  },
  
];
