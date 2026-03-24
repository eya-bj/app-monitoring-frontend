import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignAppDialog } from './assign-app-dialog';

describe('AssignAppDialog', () => {
  let component: AssignAppDialog;
  let fixture: ComponentFixture<AssignAppDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignAppDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(AssignAppDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
