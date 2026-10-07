import { TestBed } from '@angular/core/testing';

import { CONSENT_STORAGE_KEY, isValidMeasurementId } from './consent';
import { ConsentService } from './consent.service';

function create(): ConsentService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return TestBed.inject(ConsentService);
}

describe('ConsentService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('with nothing stored', () => {
    it('starts unset, so the banner has something to ask', () => {
      expect(create().state()).toBe('unset');
    });

    it('is not decided and not granted', () => {
      const service = create();
      expect(service.decided()).toBe(false);
      expect(service.granted()).toBe(false);
    });
  });

  describe('granting', () => {
    it('flips state, decided and granted together', () => {
      const service = create();
      service.grant();
      expect(service.state()).toBe('granted');
      expect(service.decided()).toBe(true);
      expect(service.granted()).toBe(true);
    });

    it('persists so the banner does not come back next visit', () => {
      create().grant();
      expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('granted');
      expect(create().state()).toBe('granted');
    });
  });

  describe('denying', () => {
    it('is decided but not granted', () => {
      const service = create();
      service.deny();
      expect(service.decided()).toBe(true);
      expect(service.granted()).toBe(false);
    });

    it('persists, so a rejection is not re-asked on every page load', () => {
      create().deny();
      expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('denied');
      expect(create().state()).toBe('denied');
    });
  });

  describe('reset', () => {
    it('clears the stored choice and brings the banner back', () => {
      const service = create();
      service.grant();
      service.reset();
      expect(service.state()).toBe('unset');
      expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
    });
  });

  describe('a stored value that is not ours', () => {
    it('is ignored instead of trusted', () => {
      localStorage.setItem(CONSENT_STORAGE_KEY, 'yes-please');
      expect(create().state()).toBe('unset');
    });
  });
});

describe('isValidMeasurementId', () => {
  it('accepts a real GA4 id', () => {
    expect(isValidMeasurementId('G-ABC1234567')).toBe(true);
  });

  it('rejects an empty id, which is what an unconfigured build has', () => {
    expect(isValidMeasurementId('')).toBe(false);
  });

  it('rejects the placeholder shapes someone would paste by mistake', () => {
    expect(isValidMeasurementId('G-XXXXXXX-1')).toBe(false);
    expect(isValidMeasurementId('UA-12345678-1')).toBe(false);
    expect(isValidMeasurementId('G-abc1234567')).toBe(false);
    expect(isValidMeasurementId('G-123')).toBe(false);
  });

  it('rejects a missing id instead of throwing', () => {
    expect(isValidMeasurementId(undefined)).toBe(false);
    expect(isValidMeasurementId(null)).toBe(false);
  });
});
