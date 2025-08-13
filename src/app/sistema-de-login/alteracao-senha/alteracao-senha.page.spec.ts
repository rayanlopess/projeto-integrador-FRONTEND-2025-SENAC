import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlteracaoSenhaPage } from './alteracao-senha.page';

describe('AlteracaoSenhaPage', () => {
  let component: AlteracaoSenhaPage;
  let fixture: ComponentFixture<AlteracaoSenhaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AlteracaoSenhaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
