import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CronBuilder } from './cron-builder';

describe('CronBuilder', () => {
  let component: CronBuilder;
  let fixture: ComponentFixture<CronBuilder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CronBuilder],
    }).compileComponents();

    fixture = TestBed.createComponent(CronBuilder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
