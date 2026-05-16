import { TestBed } from '@angular/core/testing';
import { HistoryService } from './history.service';

describe('HistoryService', () => {
  let service: HistoryService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(HistoryService);
  });

  it('starts empty when localStorage has no history', () => {
    expect(service.entries()).toEqual([]);
  });

  it('adds a password to the front of the list', () => {
    service.add('first');
    service.add('second');
    expect(service.entries().map(e => e.password)).toEqual(['second', 'first']);
  });

  it('ignores empty password adds', () => {
    service.add('');
    expect(service.entries()).toHaveLength(0);
  });

  it('caps the history at 10 entries (oldest dropped)', () => {
    for (let i = 0; i < 15; i++) service.add(`pw-${i}`);
    const entries = service.entries();
    expect(entries).toHaveLength(10);
    expect(entries[0].password).toBe('pw-14');
    expect(entries[9].password).toBe('pw-5');
  });

  it('removes an entry by index', () => {
    service.add('a');
    service.add('b');
    service.add('c'); // entries: ['c','b','a']
    service.remove(1); // removes 'b'
    expect(service.entries().map(e => e.password)).toEqual(['c', 'a']);
  });

  it('clears all entries', () => {
    service.add('a');
    service.add('b');
    service.clear();
    expect(service.entries()).toEqual([]);
  });

  it('persists to localStorage', () => {
    service.add('hello');
    const raw = localStorage.getItem('pwgen_history');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed[0].password).toBe('hello');
  });

  it('restores from localStorage on construction', () => {
    localStorage.setItem(
      'pwgen_history',
      JSON.stringify([{ password: 'restored', createdAt: 123 }]),
    );

    // Create a fresh injection of the service to trigger constructor
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const fresh = TestBed.inject(HistoryService);

    expect(fresh.entries()).toHaveLength(1);
    expect(fresh.entries()[0].password).toBe('restored');
  });

  it('tolerates a corrupt localStorage payload', () => {
    localStorage.setItem('pwgen_history', '{not json');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const fresh = TestBed.inject(HistoryService);
    expect(fresh.entries()).toEqual([]);
  });
});
