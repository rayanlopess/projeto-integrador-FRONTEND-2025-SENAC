import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EsqueciSenhaPage } from './esqueci-senha.page';

describe('EsqueciSenhaPage', () => {
  let component: EsqueciSenhaPage;
  let fixture: ComponentFixture<EsqueciSenhaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EsqueciSenhaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
