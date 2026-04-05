import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RankingPage } from './ranking.page';

const MOCK_PLAYERS = [
  { id: 'u1', username: 'alice', wins: 10, avgReactionMs: 210, winRatio: 0.75 },
  { id: 'u2', username: 'bob',   wins: 6,  avgReactionMs: 185, winRatio: 0.60 },
  { id: 'u3', username: 'carol', wins: 3,  avgReactionMs: 250, winRatio: 0.43 },
];

describe('RankingPage', () => {
  let fixture: ComponentFixture<RankingPage>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RankingPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(RankingPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('http://localhost:5000/api/ranking').flush(MOCK_PLAYERS);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('renders a row for each player', () => {
    const rows = fixture.nativeElement.querySelectorAll('[data-player-row]');
    expect(rows.length).toBe(3);
  });

  it('shows alice as first row (sorted by wins desc by default)', () => {
    const rows = fixture.nativeElement.querySelectorAll('[data-player-row]');
    expect(rows[0].textContent).toContain('alice');
  });

  it('shows wins, avgReactionMs and winRatio for each player', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('10');
    expect(text).toContain('210');
    expect(text).toContain('75');
  });

  it('sorts by avgReactionMs ascending when header is clicked', () => {
    fixture.nativeElement.querySelector('[data-sort-reaction]').click();
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('[data-player-row]');
    expect(rows[0].textContent).toContain('bob');
  });

  it('sorts by winRatio descending when header is clicked', () => {
    fixture.nativeElement.querySelector('[data-sort-ratio]').click();
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('[data-player-row]');
    expect(rows[0].textContent).toContain('alice');
  });
});
