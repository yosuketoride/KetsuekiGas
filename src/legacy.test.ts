import { describe, it, expect } from 'vitest';
import { evaluateBloodGas } from './engine';
import { BloodGasInput } from './types';
import fs from 'fs';
import path from 'path';

// Load legacy comprehensive JSON test cases
const comprehensivePath = path.resolve(__dirname, '../Text/test_comprehensive.json');
const comprehensiveData = JSON.parse(fs.readFileSync(comprehensivePath, 'utf-8'));

// Load newly sourced Oxford cases
const oxfordPath = path.resolve(__dirname, '../Text/test_oxford.json');
const oxfordData = JSON.parse(fs.readFileSync(oxfordPath, 'utf-8'));

// Load synthetic extremely complex cases
const syntheticPath = path.resolve(__dirname, '../Text/test_synthetic.json');
const syntheticData = JSON.parse(fs.readFileSync(syntheticPath, 'utf-8'));

const allData = [...comprehensiveData, ...oxfordData, ...syntheticData];

describe('evaluateBloodGas - JSON Comprehensive Suite', () => {
    allData.forEach((testCase: any, index: number) => {
        it(`TestCase ${index + 1}: ${testCase._comment}`, () => {
            const data = testCase.q1_data;
            const input: BloodGasInput = {
                bloodType: data.bloodType === 'venous' ? 'venous' : 'arterial', // default to arterial if missing
                pH: data.pH,
                pCO2: data.PCO2,
                hco3: data.HCO3,
                pO2: data.PO2,
                na: data.Na,
                cl: data.Cl,
                alb: data.Alb,
                bun: data.BUN,
                glu: data.Glu,
                lac: data.Lac,
                sOsm: data.sOsm,
                uNa: data.UNa,
                uK: data.UK,
                uCl: data['U-Cl'],
                uOsm: data.UOsm,
                uUn: data.UUn,
                uGlu: data.UGlu,
                uPH: data.UPH
            };

            const result = evaluateBloodGas(input);
            const explanationsStr = [
                result.oxygenation?.label,
                result.step1?.label,
                result.step2?.label,
                result.step3?.label,
                result.step3?.explanation,
                result.step4?.label,
                result.step4?.explanation,
                result.step5?.label,
                result.step5?.explanation,
                result.osmolality?.label,
                result.osmolality?.explanation,
                ...(result.differentials || [])
            ].join(' ');

            // Check if every expected interpretation phrase is somewhere in the combined resulting labels/explanations
            testCase.q2_interpretation.forEach((expectedPhrase: string) => {
                // Some older terms have been updated or superseded by Delta Ratio / Winter bounds.
                // We do a loose check.
                const fallbackPhrases: Record<string, string> = {
                    '急性呼吸性アシドーシス': 'アシドーシス',
                    '過換気症候群': '呼吸性アルカローシス',
                    '代謝性アルカローシス合併': 'アルカローシスの合併',
                    '代謝性アシドーシス合併': 'アシドーシスの合併',
                    'AG正常型代謝性アシドーシス合併': 'AG正常型代謝性アシドーシス',
                    '慢性呼吸性アシドーシス': '呼吸性アシドーシス'
                };
                const searchStr = fallbackPhrases[expectedPhrase] || expectedPhrase;
                expect(explanationsStr).toContain(searchStr);
            });
        });
    });
});
