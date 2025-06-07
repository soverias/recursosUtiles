import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatRoomSelector } from './chat-room-selector';

describe('ChatRoomSelector', () => {
  let component: ChatRoomSelector;
  let fixture: ComponentFixture<ChatRoomSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatRoomSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatRoomSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
