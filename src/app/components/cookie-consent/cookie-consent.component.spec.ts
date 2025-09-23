import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CookieConsentComponent } from './cookie-consent.component';

describe('CookieConsentComponent', () => {
  let component: CookieConsentComponent;
  let fixture: ComponentFixture<CookieConsentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CookieConsentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CookieConsentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
