import { describe, it, expect } from 'vitest';
import {
  detectLanguage,
  classifyIntent,
  classifyConcern,
  analyzeSentiment,
  analyzeMessage,
} from '@/lib/ai/classifiers';

describe('detectLanguage', () => {
  it('detects Hindi from Devanagari script', () => {
    expect(detectLanguage('मुझे नौकरी चाहिए।')).toBe('HI');
  });

  it('detects Hindi written in Roman script', () => {
    expect(detectLanguage('mera bachche ka kya hoga')).toBe('HI');
  });

  it('defaults to English', () => {
    expect(detectLanguage('What career should I choose?')).toBe('EN');
  });

  it('does not classify a single stray Devanagari character as Hindi', () => {
    expect(detectLanguage('What is a ₹ stipend')).toBe('EN');
  });
});

describe('classifyIntent', () => {
  it('matches escalation requests', () => {
    expect(classifyIntent('I want to talk to a counsellor please')).toBe('ESCALATION_REQUEST');
  });

  it('matches salary queries', () => {
    expect(classifyIntent('How much is the salary after the course?')).toBe('SALARY_QUERY');
  });

  it('falls back to a general query when no pattern applies', () => {
    expect(classifyIntent('My child likes working with machines')).toBe('GENERAL_QUERY');
  });
});

describe('classifyConcern', () => {
  it('classifies low-salary objections', () => {
    expect(classifyConcern('The salary is far too low for this work').concern).toBe('LOW_SALARY');
  });

  it('classifies job-security objections', () => {
    expect(classifyConcern('There is no guarantee of a job after training').concern).toBe(
      'JOB_SECURITY',
    );
  });

  it('classifies the desire for a traditional degree', () => {
    expect(classifyConcern('Everyone expects a college degree, not this').concern).toBe(
      'TRADITIONAL_DEGREE',
    );
  });

  it('weights Hindi script slightly above English hits', () => {
    const hindi = classifyConcern('इसकी वेतन की कमी है');
    expect(hindi.concern).toBe('LOW_SALARY');
    expect(hindi.confidence).toBeGreaterThan(0.55);
  });

  // Regressions found against the running app — both were real misses that
  // silently downgraded a Hindi objection to OTHER.
  it('matches "नौकरी की सुरक्षा" rather than falling through to SAFETY', () => {
    expect(classifyConcern('मुझे नौकरी की सुरक्षा की चिंता है').concern).toBe('JOB_SECURITY');
    expect(classifyConcern('रोज़गार सुरक्षा का सवाल है').concern).toBe('JOB_SECURITY');
  });

  it('matches both "तनख्वाह" and the nukta spelling "तनख़ा"', () => {
    expect(classifyConcern('इस ट्रेड की तनख्वाह बहुत कम है').concern).toBe('LOW_SALARY');
    expect(classifyConcern('इसकी तनख़ा कम है').concern).toBe('LOW_SALARY');
    expect(classifyConcern('कमाई कितनी होगी').concern).toBe('LOW_SALARY');
  });

  it('still separates a genuine safety concern from job security', () => {
    expect(classifyConcern('लड़की के लिए सुरक्षा की चिंता है').concern).toBe('SAFETY');
  });

  it('returns OTHER with low confidence when nothing matches', () => {
    const res = classifyConcern('xyzzy plugh');
    expect(res.concern).toBe('OTHER');
    expect(res.confidence).toBeLessThan(0.5);
  });

  it('always reports a confidence between 0 and 1', () => {
    const res = classifyConcern('salary and job security and fees are a problem');
    expect(res.confidence).toBeGreaterThanOrEqual(0);
    expect(res.confidence).toBeLessThanOrEqual(1);
  });
});

describe('analyzeSentiment', () => {
  it('labels positive text', () => {
    expect(analyzeSentiment('this is very good and helpful').label).toBe('POSITIVE');
  });

  it('labels strongly negative text', () => {
    expect(analyzeSentiment('this is bad and useless, a total waste').label).toBe('NEGATIVE');
  });

  it('labels a single negative signal as mixed', () => {
    expect(analyzeSentiment('i am worried about this').label).toBe('MIXED');
  });

  it('normalises the score into [-1, 1]', () => {
    const { score } = analyzeSentiment('bad bad bad bad bad bad bad');
    expect(score).toBeGreaterThanOrEqual(-1);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe('analyzeMessage', () => {
  it('returns every signal for an English objection', () => {
    const r = analyzeMessage('My father says the salary is too low and there is no job guarantee.');
    expect(r.language).toBe('EN');
    expect(r.concern).toBeTruthy();
    expect(typeof r.concernConfidence).toBe('number');
    expect(r.wantsHuman).toBe(false);
  });

  it('flags an explicit request for a human counsellor', () => {
    expect(analyzeMessage('Please let me talk to a counsellor').wantsHuman).toBe(true);
  });

  it('detects a Hindi message and classifies its concern', () => {
    const r = analyzeMessage('मुझे नौकरी की सुरक्षा की चिंता है।');
    expect(r.language).toBe('HI');
    expect(r.concern).toBe('JOB_SECURITY');
  });
});
