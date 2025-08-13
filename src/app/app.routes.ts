import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'cardapio',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./sistema-de-login/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'esqueci-senha',
    loadComponent: () => import('./sistema-de-login/esqueci-senha/esqueci-senha.page').then( m => m.EsqueciSenhaPage)
  },
  {
    path: 'pedidos',
    loadComponent: () => import('./colaborador/pedidos/pedidos.page').then( m => m.PedidosPage)
  },
  {
    path: 'painel',
    loadComponent: () => import('./admin/painel/painel.page').then( m => m.PainelPage)
  },
  {
    path: 'ger-colaboradores',
    loadComponent: () => import('./admin/ger-colaboradores/ger-colaboradores.page').then( m => m.GerColaboradoresPage)
  },
  {
    path: 'ger-produtos',
    loadComponent: () => import('./admin/ger-produtos/ger-produtos.page').then( m => m.GerProdutosPage)
  },
  {
    path: 'add-colaborador',
    loadComponent: () => import('./admin/add-colaborador/add-colaborador.page').then( m => m.AddColaboradorPage)
  },
  {
    path: 'add-produto',
    loadComponent: () => import('./admin/add-produto/add-produto.page').then( m => m.AddProdutoPage)
  },
  {
    path: 'cardapio',
    loadComponent: () => import('./funcionalidades/cardapio/cardapio.page').then( m => m.CardapioPage)
  },
  {
    path: 'carrinho',
    loadComponent: () => import('./funcionalidades/carrinho/carrinho.page').then( m => m.CarrinhoPage)
  },
  {
    path: 'pagamento',
    loadComponent: () => import('./funcionalidades/pagamento/pagamento.page').then( m => m.PagamentoPage)
  },
  {
    path: 'finalizacao',
    loadComponent: () => import('./funcionalidades/finalizacao/finalizacao.page').then( m => m.FinalizacaoPage)
  },
  {
    path: 'alteracao-senha',
    loadComponent: () => import('./sistema-de-login/alteracao-senha/alteracao-senha.page').then( m => m.AlteracaoSenhaPage)
  }
  
];
