import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GerProdutosPage } from './ger-produtos.page';

describe('GerProdutosPage', () => {
  let component: GerProdutosPage;
  let fixture: ComponentFixture<GerProdutosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GerProdutosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
