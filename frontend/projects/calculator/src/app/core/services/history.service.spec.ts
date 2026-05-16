import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HistoryService } from './history.service';
import { HistoryEntry } from '../models/expression.model';

function makeEntry(id: number): HistoryEntry {
  return {
    id,
    expression: `${id} + 1`,
    result: { value: id + 1, unit: null, formatted: `${id + 1}` },
    timestamp: Date.now(),
  };
}

describe('HistoryService', () => {
  let service: HistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HistoryService);
  });

  it('HIST-01: entries starts empty', () => {
    expect(service.entries()).toHaveLength(0);
  });

  it('HIST-02: addEntry prepends to the list', () => {
    service.addEntry(makeEntry(1));
    expect(service.entries()).toHaveLength(1);
    expect(service.entries()[0].id).toBe(1);
  });

  it('HIST-03: most recent entry is first', () => {
    service.addEntry(makeEntry(1));
    service.addEntry(makeEntry(2));
    expect(service.entries()[0].id).toBe(2);
    expect(service.entries()[1].id).toBe(1);
  });

  it('HIST-04: clearHistory empties the list', () => {
    service.addEntry(makeEntry(1));
    service.addEntry(makeEntry(2));
    service.clearHistory();
    expect(service.entries()).toHaveLength(0);
  });
});
