import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckDetail } from './check-detail';

describe('CheckDetail', () => {
  let component: CheckDetail;
  let fixture: ComponentFixture<CheckDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
