import { describe, it, expect } from 'vitest';
import { DEMO_COMPANY, DEMO_ACTIVITIES } 
  from '../src/demoResponses';
import { calculateEmissions } 
  from '../src/lib/emissions';

describe('DEMO_COMPANY', () => {

  it('has all required company fields', () => {
    expect(DEMO_COMPANY).toHaveProperty('name');
    expect(DEMO_COMPANY).toHaveProperty('industrySector');
    expect(DEMO_COMPANY).toHaveProperty('employeeCount');
    expect(DEMO_COMPANY).toHaveProperty('reportingYear');
    expect(DEMO_COMPANY).toHaveProperty('facilities');
  });

  it('has a non-empty name and sector', () => {
    expect(DEMO_COMPANY.name.length).toBeGreaterThan(0);
    expect(DEMO_COMPANY.industrySector.length).toBeGreaterThan(0);
  });

  it('has at least one facility', () => {
    expect(DEMO_COMPANY.facilities.length).toBeGreaterThan(0);
  });

  it('facilities have required fields', () => {
    DEMO_COMPANY.facilities.forEach((facility) => {
      expect(facility).toHaveProperty('id');
      expect(facility).toHaveProperty('name');
      expect(facility).toHaveProperty('type');
    });
  });

});

describe('DEMO_ACTIVITIES', () => {

  it('has exactly 5 activities', () => {
    expect(DEMO_ACTIVITIES).toHaveLength(5);
  });

  it('every activity has required fields', () => {
    DEMO_ACTIVITIES.forEach((act) => {
      expect(act).toHaveProperty('id');
      expect(act).toHaveProperty('date');
      expect(act).toHaveProperty('facilityId');
      expect(act).toHaveProperty('category');
      expect(act).toHaveProperty('subType');
      expect(act).toHaveProperty('value');
      expect(act).toHaveProperty('unit');
      expect(act).toHaveProperty('emissions');
    });
  });

  it('covers both Scope 1 and Scope 2', () => {
    const hasScope1 = DEMO_ACTIVITIES.some(
      (act) => act.subType === 'diesel' 
             || act.subType === 'petrol' 
             || act.subType === 'natural_gas'
    );
    const hasScope2 = DEMO_ACTIVITIES.some(
      (act) => act.subType === 'electricity'
    );
    expect(hasScope1).toBe(true);
    expect(hasScope2).toBe(true);
  });

  it('uses only valid sub-types', () => {
    const validSubTypes = ['electricity', 'diesel', 'petrol', 'natural_gas'];
    DEMO_ACTIVITIES.forEach((act) => {
      expect(validSubTypes).toContain(act.subType);
    });
  });

  it('has matching unit for each sub-type', () => {
    const expectedUnits: Record<string, string> = {
      electricity: 'kWh',
      natural_gas: 'kWh',
      diesel: 'litres',
      petrol: 'litres',
    };
    DEMO_ACTIVITIES.forEach((act) => {
      expect(act.unit).toBe(expectedUnits[act.subType]);
    });
  });

  it('all values are non-negative numbers', () => {
    DEMO_ACTIVITIES.forEach((act) => {
      expect(typeof act.value).toBe('number');
      expect(act.value).toBeGreaterThanOrEqual(0);
    });
  });

  it('emissions match calculateEmissions for each activity', () => {
    DEMO_ACTIVITIES.forEach((act) => {
      const expected = calculateEmissions(act.value, act.subType);
      expect(act.emissions).toBeCloseTo(expected, 1);
    });
  });

  it('all facilityIds reference an existing facility', () => {
    const facilityIds = DEMO_COMPANY.facilities.map((f) => f.id);
    DEMO_ACTIVITIES.forEach((act) => {
      expect(facilityIds).toContain(act.facilityId);
    });
  });

  it('all ids are unique', () => {
    const ids = DEMO_ACTIVITIES.map((act) => act.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

});
