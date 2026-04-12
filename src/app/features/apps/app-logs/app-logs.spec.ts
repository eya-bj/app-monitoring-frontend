import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppLogs } from './app-logs';

describe('AppLogs', () => {
  let component: AppLogs;
  let fixture: ComponentFixture<AppLogs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppLogs],
    }).compileComponents();

    fixture = TestBed.createComponent(AppLogs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
