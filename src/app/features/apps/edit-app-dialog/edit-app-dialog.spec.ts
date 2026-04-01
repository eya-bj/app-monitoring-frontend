import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditAppDialog } from './edit-app-dialog';

describe('EditAppDialog', () => {
  let component: EditAppDialog;
  let fixture: ComponentFixture<EditAppDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditAppDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(EditAppDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
