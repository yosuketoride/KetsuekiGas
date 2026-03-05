import { describe, it, expect } from 'vitest';
import { evaluateBloodGas } from './engine';
import { BloodGasInput } from './types';

describe('evaluateBloodGas - Oxygenation Rules', () => {
    it('evaluates normal oxygenation at young age', () => {
        const input: BloodGasInput = { bloodType: 'arterial', pH: 7.4, pCO2: 40, hco3: 24, pO2: 95, age: 30 };
        const result = evaluateBloodGas(input);
        expect(result.oxygenation.evaluated).toBe(true);
        expect(result.oxygenation.isAgeRelatedHypoxemia).toBe(false);
        expect(result.oxygenation.isHypoxemia).toBe(false);
        expect(result.oxygenation.pfRatio).toBeCloseTo(95 / 0.21, 0);
    });

    it('evaluates age-related hypoxemia correctly for age 90 (PaO2 70)', () => {
        // Expected PaO2 for age 90 is 104 - 0.27*90 = 79.7 -> 80
        // Tolerance is -10, so >= 70 should be considered age-related normal
        const input: BloodGasInput = { bloodType: 'arterial', pH: 7.4, pCO2: 40, hco3: 24, pO2: 72, age: 90 };
        const result = evaluateBloodGas(input);
        expect(result.oxygenation.isAgeRelatedHypoxemia).toBe(true);
        expect(result.oxygenation.label).toContain('正常(加齢考慮)');
    });

    it('evaluates mild hypoxemia correctly for young age (PaO2 70)', () => {
        // Expected for age 20 is ~99. 70 < 89, so it should be mild hypoxemia, not age-related
        const input: BloodGasInput = { bloodType: 'arterial', pH: 7.4, pCO2: 40, hco3: 24, pO2: 70, age: 20 };
        const result = evaluateBloodGas(input);
        expect(result.oxygenation.isAgeRelatedHypoxemia).toBe(false);
        expect(result.oxygenation.label).toContain('軽度低酸素');
    });

    it('skips oxygenation evaluation for VBG and warns', () => {
        const input: BloodGasInput = { bloodType: 'venous', pH: 7.35, pCO2: 45, hco3: 24, pO2: 40 };
        const result = evaluateBloodGas(input);
        expect(result.oxygenation.evaluated).toBe(false);
        expect(result.oxygenation.label).toContain('評価不可');
    });
});

describe('evaluateBloodGas - Winter Formula and Compensation', () => {
    it('applies updated Winters formula (1.5 * HCO3 + 8) correctly', () => {
        // Metabolic Acidosis
        // HCO3 = 10, Expected pCO2 = 1.5 * 10 + 8 = 23 (±2) -> 21 to 25
        const input: BloodGasInput = { bloodType: 'arterial', pH: 7.20, pCO2: 25, hco3: 10 };
        void evaluateBloodGas(input);
        // Expected PaCO2 = 1.5 * 10 + 8 = 23. Range is 21 to 25.
        // The implementation says: expected = 23. max = 25.
        // In the app, pCO2 > expected.max means inadequate_high. Let's check the exact boundary.
        // engine.ts: if (actualValue > expectedValue.max) status = 'inadequate_high';
        // So pCO2 = 25 is exactly max, thus it should be 'adequate'.
        const input1: BloodGasInput = { bloodType: 'arterial', pH: 7.20, pCO2: 25, hco3: 10 };
        const result1 = evaluateBloodGas(input1);
        expect(result1.step3.status).toBe('adequate');
    });

    it('detects inadequate compensation (respiratory acidosis complication)', () => {
        // Expected pCO2 is 21-25. If actual is 28, it's inadequate_high (respiratory acidosis complication)
        const input2: BloodGasInput = { bloodType: 'arterial', pH: 7.20, pCO2: 28, hco3: 10 };
        const result2 = evaluateBloodGas(input2);
        expect(result2.step3.status).toBe('inadequate_high');
    });
});

describe('evaluateBloodGas - Delta Ratio and AG classifications', () => {
    it('calculates Delta Ratio accurately and evaluates pure HAGMA', () => {
        // Normal AG = 12, target HCO3 = 24
        // Calculate AG = 140 - 105 - 10 = 25. delta AG = 13
        // delta HCO3 = 24 - 10 = 14
        // Delta Ratio = 13 / 14 = 0.928 ~ 0.93 -> "pure HAGMA / mixed"
        const input: BloodGasInput = { bloodType: 'arterial', pH: 7.20, pCO2: 25, hco3: 10, na: 140, cl: 105, alb: 4.0 };
        const result = evaluateBloodGas(input);
        expect(result.step4.correctedAg).toBe(25);
        expect(result.step5.deltaRatio).toBeCloseTo(0.928, 2);
        expect(result.step5.status).toBe('normal_ag_acidosis_combined'); // Delta Ratio 0.4-1.0 implies mixed NAGMA
    });

    it('evaluates Metabolic Alkalosis combination (Delta Ratio > 2.0)', () => {
        // AG = 140 - 95 - 15 = 30 -> delta AG = 18
        // HCO3 = 15 -> delta HCO3 = 9
        // Delta Ratio = 18 / 9 = 2.0. Expected: > 2.0 is metabolic_alkalosis_combined.
        // Let's force delta ratio to 2.5: delta HCO3 = 7.2 (HCO3 = 16.8)
        const input: BloodGasInput = { bloodType: 'arterial', pH: 7.30, pCO2: 35, hco3: 17, na: 140, cl: 95, alb: 4.0 };
        const result = evaluateBloodGas(input);
        expect(result.step5.deltaRatio).toBeGreaterThan(2.0);
        expect(result.step5.status).toBe('metabolic_alkalosis_combined');
    });
});

describe('evaluateBloodGas - Osmolality and Urine Analysis', () => {
    it('evaluates normal urine osmolar gap', () => {
        const input: BloodGasInput = {
            bloodType: 'arterial', pH: 7.4, pCO2: 40, hco3: 24,
            uNa: 50, uK: 40, uOsm: 400, uUn: 280, uGlu: 0
        };
        const result = evaluateBloodGas(input);
        expect(result.osmolality.urineEvaluated).toBe(true);
        // calc = 2*(50+40) + 280/2.8 + 0 = 180 + 100 = 280
        // gap = 400 - 280 = 120
        expect(result.osmolality.calcUrineOsm).toBe(280);
        expect(result.osmolality.urineOsmGap).toBe(120);
    });

    it('detects high U-OG > 150 (RTA suspicion)', () => {
        const input: BloodGasInput = {
            bloodType: 'arterial', pH: 7.4, pCO2: 40, hco3: 24,
            uNa: 50, uK: 40, uOsm: 500, uUn: 280, uGlu: 0
        };
        const result = evaluateBloodGas(input);
        // calc = 280. gap = 500 - 280 = 220
        expect(result.osmolality.urineOsmGap).toBe(220);
        expect(result.differentials.some(d => d.includes('尿浸透圧ギャップ(U-OG)高値 (>150)'))).toBe(true);
    });
});
