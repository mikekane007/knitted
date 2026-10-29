import { dateRangeFor } from './event-list.component';

describe('dateRangeFor', () => {
  // Wednesday 4 November 2026
  const wednesday = new Date(2026, 10, 4, 15, 0);

  it('covers the coming Saturday and Sunday for "weekend"', () => {
    expect(dateRangeFor('weekend', wednesday)).toEqual({ from: '2026-11-07', to: '2026-11-08' });
  });

  it('starts today when it is already the weekend', () => {
    expect(dateRangeFor('weekend', new Date(2026, 10, 8))).toEqual({ from: '2026-11-08', to: '2026-11-08' });
  });

  it('runs from today to Sunday for "week" and to month end for "month"', () => {
    expect(dateRangeFor('week', wednesday)).toEqual({ from: '2026-11-04', to: '2026-11-08' });
    expect(dateRangeFor('month', wednesday)).toEqual({ from: '2026-11-04', to: '2026-11-30' });
  });

  it('only sets a start date for "upcoming"', () => {
    expect(dateRangeFor('upcoming', wednesday)).toEqual({ from: '2026-11-04' });
  });
});
