import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAppDialog } from './add-app-dialog';

describe('AddAppDialog', () => {
  let component: AddAppDialog;
  let fixture: ComponentFixture<AddAppDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAppDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(AddAppDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
