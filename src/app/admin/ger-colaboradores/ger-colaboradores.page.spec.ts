import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GerColaboradoresPage } from './ger-colaboradores.page';

describe('GerColaboradoresPage', () => {
  let component: GerColaboradoresPage;
  let fixture: ComponentFixture<GerColaboradoresPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GerColaboradoresPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
