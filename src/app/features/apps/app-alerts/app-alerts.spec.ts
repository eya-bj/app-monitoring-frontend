import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppAlerts } from './app-alerts';

describe('AppAlerts', () => {
  let component: AppAlerts;
  let fixture: ComponentFixture<AppAlerts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppAlerts],
    }).compileComponents();

    fixture = TestBed.createComponent(AppAlerts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
