import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinalizacaoPage } from './finalizacao.page';

describe('FinalizacaoPage', () => {
  let component: FinalizacaoPage;
  let fixture: ComponentFixture<FinalizacaoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FinalizacaoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
