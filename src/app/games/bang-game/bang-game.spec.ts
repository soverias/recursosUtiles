import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BangGame } from './bang-game';

describe('BangGame', () => {
  let component: BangGame;
  let fixture: ComponentFixture<BangGame>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BangGame]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BangGame);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
