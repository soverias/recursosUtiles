import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatManager } from './chat-manager';

describe('ChatManager', () => {
  let component: ChatManager;
  let fixture: ComponentFixture<ChatManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatManager]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatManager);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
