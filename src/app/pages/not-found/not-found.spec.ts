import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, TitleStrategy, UrlSerializer, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from '../../app.routes';
import { PageHeadStrategy } from '../../core/i18n/page-head-strategy';
import { PageLangService } from '../../core/i18n/page-lang';
import { SOCIAL_CARDS, SocialCard, SocialCardKey } from '../../core/seo/page-social';
import { TrailingSlashUrlSerializer } from '../../core/routing/trailing-slash';
import { Landing } from '../../landing/landing';
import { Privacy } from '../privacy/privacy';
import { Talent } from '../talent/talent';
import { DOOR_LABEL, NOT_FOUND_COPY, NotFound, doorsFrom } from './not-found';

describe('NotFound', () => {
  let fixture: ComponentFixture<NotFound>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFound],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFound);
    await fixture.whenStable();
  });

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  it('says what happened, in one h1', () => {
    const headings = host().querySelectorAll('h1');

    expect(headings.length).toBe(1);
    expect(headings[0].textContent?.trim()).toBe(NOT_FOUND_COPY.en.title);
  });

  it('follows the page language instead of hardcoding English', async () => {
    TestBed.inject(PageLangService).set('es-MX');
    await fixture.whenStable();

    expect(host().querySelector('h1')?.textContent?.trim()).toBe(NOT_FOUND_COPY['es-MX'].title);
  });

  it('offers a door to every public page', () => {
    const hrefs = Array.from(host().querySelectorAll<HTMLAnchorElement>('.not-found__door')).map(
      (anchor) => anchor.getAttribute('href'),
    );

    expect(hrefs).toEqual([
      '/',
      '/talento',
      '/engineers',
      '/empresas',
      '/companies',
      '/privacidad',
      '/privacy',
    ]);
  });

  // Why the doors are labelled one by one instead of reusing the card titles: a
  // Spanish reader must not have to read English to find the way out.
  it('labels each door in its own language, and says so to a screen reader', () => {
    const doors = Array.from(host().querySelectorAll<HTMLAnchorElement>('.not-found__door'));
    const labelled = doors.map((anchor) => [
      anchor.textContent?.trim(),
      anchor.getAttribute('lang'),
    ]);

    expect(labelled).toEqual([
      ['Home', 'en'],
      ['Para devs', 'es-MX'],
      ['For engineers', 'en'],
      ['Para empresas', 'es-MX'],
      ['For companies', 'en'],
      ['Aviso de privacidad', 'es-MX'],
      ['Privacy notice', 'en'],
    ]);
  });

  it('marks each door with the hreflang the rest of the site uses', () => {
    const doors = Array.from(host().querySelectorAll<HTMLAnchorElement>('.not-found__door'));

    for (const anchor of doors) {
      expect(anchor.getAttribute('hreflang')).toBe(anchor.getAttribute('lang'));
    }
  });

  // A 404 page that prints the address back is a free billboard for anyone who
  // can send a link. The address bar already holds it.
  it('does not echo the URL that got here', () => {
    expect(host().textContent).not.toContain('http');
  });

  it('labels its section for a screen reader', () => {
    const sections = Array.from(host().querySelectorAll('section'));
    const unlabelled = sections.filter(
      (section) => !section.getAttribute('aria-labelledby') && !section.getAttribute('aria-label'),
    );

    expect(unlabelled.length).toBe(0);
  });
});

describe('the door list', () => {
  it('is derived from the manifest, so a page added later gets a door', () => {
    const invented = {
      ...SOCIAL_CARDS,
      talento: { ...SOCIAL_CARDS.talento, route: '/otra-cosa' },
    } as Readonly<Record<SocialCardKey, SocialCard>>;

    expect(doorsFrom(invented).map((door) => door.route)).toContain('/otra-cosa');
  });

  it('gives a label to every public page — a card without one is a page with no way back', () => {
    const unlabelled = (Object.keys(SOCIAL_CARDS) as SocialCardKey[]).filter(
      (key) => SOCIAL_CARDS[key].indexable && DOOR_LABEL[key] === null,
    );

    expect(unlabelled).toEqual([]);
  });

  it('keeps the internal screens out', () => {
    expect(doorsFrom().map((door) => door.route)).not.toContain('/health');
    expect(doorsFrom().map((door) => door.route)).not.toContain('/404');
  });
});

describe('an address this site does not have', () => {
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TitleStrategy, useExisting: PageHeadStrategy },
        { provide: UrlSerializer, useClass: TrailingSlashUrlSerializer },
      ],
    });

    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => http.verify());

  it('answers with the not-found page instead of the landing', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/talent');

    expect(component).toBeInstanceOf(NotFound);
  });

  // The address bar must keep what was asked for: rewriting it to `/` hides the
  // typo from the only person who can fix it.
  it('keeps the address the visitor actually asked for', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/privacidadd');

    expect(router.url).toBe('/privacidadd');
  });

  it('tells a crawler not to index it, on that same address', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/x/y/z');

    const robots = document.querySelector('meta[name="robots"]');
    expect(robots?.getAttribute('content')).toBe('noindex, nofollow');
  });

  it('still sends a real address to its real page', async () => {
    const harness = await RouterTestingHarness.create();

    expect(await harness.navigateByUrl('/')).toBeInstanceOf(Landing);
  });
});

describe('a real address with a trailing slash', () => {
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UrlSerializer, useClass: TrailingSlashUrlSerializer },
      ],
    });

    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => http.verify());

  // A trailing slash is not a typo -- chat apps and address bars add it on their
  // own -- and it used to parse as two segments and miss the route.
  it('reaches the page it names, not the catch-all', async () => {
    const harness = await RouterTestingHarness.create();

    expect(await harness.navigateByUrl('/talento/')).toBeInstanceOf(Talent);
  });

  it('corrects the address bar instead of leaving a URL that disagrees', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/talento/');

    expect(router.url).toBe('/talento');
  });

  it('does the same for the privacy notice, in both languages', async () => {
    const harness = await RouterTestingHarness.create();

    expect(await harness.navigateByUrl('/privacy/')).toBeInstanceOf(Privacy);
    expect(await harness.navigateByUrl('/privacidad/')).toBeInstanceOf(Privacy);
  });
});
