import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCheck } from './add-check';

describe('AddCheck', () => {
  let component: AddCheck;
  let fixture: ComponentFixture<AddCheck>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCheck],
    }).compileComponents();

    fixture = TestBed.createComponent(AddCheck);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
