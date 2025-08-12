import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddColaboradorPage } from './add-colaborador.page';

describe('AddColaboradorPage', () => {
  let component: AddColaboradorPage;
  let fixture: ComponentFixture<AddColaboradorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddColaboradorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
