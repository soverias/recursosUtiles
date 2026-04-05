import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExclusionListComponent } from './exclusion-list.component';
import { Exclusion, Participant } from '../../models';

const PARTICIPANTS: Participant[] = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Carlos' },
];

const EXCLUSIONS: Exclusion[] = [
  { participantIdA: '1', participantIdB: '2' },
];

describe('ExclusionListComponent', () => {
  let fixture: ComponentFixture<ExclusionListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ExclusionListComponent] });
    fixture = TestBed.createComponent(ExclusionListComponent);
    fixture.componentRef.setInput('participants', PARTICIPANTS);
    fixture.componentRef.setInput('exclusions', EXCLUSIONS);
    fixture.detectChanges();
  });

  it('renders one row per exclusion pair', () => {
    const items = fixture.nativeElement.querySelectorAll('li');
    expect(items.length).toBe(1);
  });

  it('shows participant names in the exclusion row', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Alice');
    expect(text).toContain('Bob');
  });

  it('emits removeExclusion when delete button clicked', () => {
    const emitted: { idA: string; idB: string }[] = [];
    fixture.componentInstance.removeExclusion.subscribe((e: { idA: string; idB: string }) => emitted.push(e));
    const btn = fixture.nativeElement.querySelector('[aria-label="Eliminar exclusión"]');
    (btn as HTMLButtonElement).click();
    expect(emitted).toEqual([{ idA: '1', idB: '2' }]);
  });

  it('emits addExclusion when two different participants selected and confirmed', () => {
    fixture.componentRef.setInput('exclusions', []);
    fixture.detectChanges();
    const emitted: { idA: string; idB: string }[] = [];
    fixture.componentInstance.addExclusion.subscribe((e: { idA: string; idB: string }) => emitted.push(e));

    const selects = fixture.nativeElement.querySelectorAll('select');
    selects[0].value = '1';
    selects[0].dispatchEvent(new Event('change'));
    selects[1].value = '3';
    selects[1].dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button[data-add-exclusion]');
    btn.click();
    expect(emitted).toEqual([{ idA: '1', idB: '3' }]);
  });

  it('confirm button is disabled when same participant selected for both', () => {
    const selects = fixture.nativeElement.querySelectorAll('select');
    selects[0].value = '1';
    selects[0].dispatchEvent(new Event('change'));
    selects[1].value = '1';
    selects[1].dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button[data-add-exclusion]');
    expect(btn.disabled).toBe(true);
  });

  it('shows empty state when no exclusions', () => {
    fixture.componentRef.setInput('exclusions', []);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Sin exclusiones');
  });
});
