import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EventService } from './event.service';

describe('EventService event search filters', () => {
  let service: EventService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EventService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(EventService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('sends the existing filters and advanced search options to the API', () => {
    service.getEvents('coffee', 'DUMBO', 'Under $20', {
      category: 'Art & Design',
      minPrice: 5,
      maxPrice: 19,
      dateFrom: '2026-10-21',
      dateTo: '2026-10-31',
      sortBy: 'price',
    }).subscribe((events) => expect(events).toEqual([]));

    const request = httpTestingController.expectOne((req) => req.url.endsWith('/events'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys().sort()).toEqual([
      'category',
      'dateFrom',
      'dateTo',
      'maxPrice',
      'minPrice',
      'neighborhood',
      'price',
      'search',
      'sortBy',
    ]);
    expect(request.request.params.get('search')).toBe('coffee');
    expect(request.request.params.get('neighborhood')).toBe('DUMBO');
    expect(request.request.params.get('price')).toBe('Under $20');
    expect(request.request.params.get('category')).toBe('Art & Design');
    expect(request.request.params.get('minPrice')).toBe('5');
    expect(request.request.params.get('maxPrice')).toBe('19');
    expect(request.request.params.get('dateFrom')).toBe('2026-10-21');
    expect(request.request.params.get('dateTo')).toBe('2026-10-31');
    expect(request.request.params.get('sortBy')).toBe('price');
    request.flush([]);
  });
});
