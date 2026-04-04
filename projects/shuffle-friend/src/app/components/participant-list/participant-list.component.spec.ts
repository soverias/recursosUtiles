import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParticipantListComponent } from './participant-list.component';
import { Participant } from '../../models';

const PARTICIPANTS: Participant[] = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
];

describe('ParticipantListComponent', () => {
  let fixture: ComponentFixture<ParticipantListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ParticipantListComponent] });
    fixture = TestBed.createComponent(ParticipantListComponent);
    fixture.componentRef.setInput('participants', PARTICIPANTS);
    fixture.detectChanges();
  });

  it('renders one item per participant', () => {
    const items = fixture.nativeElement.querySelectorAll('li');
    expect(items.length).toBe(2);
  });

  it('renders participant names', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Alice');
    expect(text).toContain('Bob');
  });

  it('emits remove with participant id when remove button clicked', () => {
    const emitted: string[] = [];
    fixture.componentInstance.remove.subscribe((id: string) => emitted.push(id));
    const buttons = fixture.nativeElement.querySelectorAll('[aria-label^="Eliminar"]');
    (buttons[0] as HTMLButtonElement).click();
    expect(emitted).toEqual(['1']);
  });

  it('emits add with the name when add button clicked', () => {
    const emitted: string[] = [];
    fixture.componentInstance.add.subscribe((name: string) => emitted.push(name));
    const input = fixture.nativeElement.querySelector('input');
    input.value = 'Carlos';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const addBtn = fixture.nativeElement.querySelector('button[data-add]');
    addBtn.click();
    expect(emitted).toEqual(['Carlos']);
  });

  it('add button is disabled when input is empty', () => {
    const addBtn = fixture.nativeElement.querySelector('button[data-add]');
    expect(addBtn.disabled).toBe(true);
  });

  it('shows empty state message when no participants', () => {
    fixture.componentRef.setInput('participants', []);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Sin participantes');
  });
});
