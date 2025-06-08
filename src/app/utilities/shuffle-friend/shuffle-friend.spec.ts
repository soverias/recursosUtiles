import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShuffleFriend } from './shuffle-friend';

describe('ShuffleFriend', () => {
  let component: ShuffleFriend;
  let fixture: ComponentFixture<ShuffleFriend>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShuffleFriend]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ShuffleFriend);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
