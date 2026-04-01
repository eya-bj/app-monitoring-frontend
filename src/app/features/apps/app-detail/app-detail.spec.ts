import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppDetail } from './app-detail';

describe('AppDetail', () => {
  let component: AppDetail;
  let fixture: ComponentFixture<AppDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(AppDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
