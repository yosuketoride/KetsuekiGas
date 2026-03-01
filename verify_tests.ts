import fs from 'node:fs';
import path from 'node:path';
import { evaluateBloodGas } from './src/engine.js';
import type { BloodGasInput } from './src/types.js';

// ─── ANSI カラーコード ─────────────────────────────────────────────
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

interface TestResult {
    id: string;
    passed: boolean;
    expected: string[];
    actual: string[];
    missingKeywords: string[];
}

// ─── キーワードマッチング判定 ─────────────────────────────────────
// 期待テキストから重要な診断用語を抽出してエンジン出力と照合する
// 判定ルール：
//   - 期待リストの各行から診断用語（3文字以上）を抽出
//   - 先頭2行の"主要キーワード"が出力に含まれることを確認
//   - キーワードが長い自由記述の場合は日本語単語に分割してOR条件でマッチ
// 代替候補として含まれる診断用語のリスト（優先度順）
const diagTerms = [
    '混合性アシドーシス', '混合性アルカローシス', '混合性障害',
    '急性呼吸性アシドーシス', '慢性呼吸性アシドーシス', '呼吸性アシドーシス',
    '急性呼吸性アルカローシス', '慢性呼吸性アルカローシス', '呼吸性アルカローシス',
    '代謝性アシドーシス', '代謝性アルカローシス',
    'AG開大性代謝性アシドーシス', 'AG正常型代謝性アシドーシス',
    '乳酸アシドーシス', 'ケトアシドーシス', '尿毒症',
    '隠れHAGMA', 'hiddenHagma', 'hiddenHAGMA',
    '食塩反応性', '食塩不応性',
    '代謝性アシドーシス合併', '代謝性アルカローシス合併',
    '呼吸性アシドーシス合併', '呼吸性アルカローシス合併',
    '酸塩基平衡正常', '三管区性',
];

function extractCoreWords(text: string): string[] {
    // テキスト内に含まれる診断用語を返す（OR用）
    const found: string[] = diagTerms.filter(term => text.includes(term));
    if (found.length > 0) return found;

    // 診断用語が見つからない場合は元テキストのコア部分を返す
    const cleaned = text
        .replace(/（.+?）/g, '').replace(/\(.+?\)/g, '')
        .replace(/※.+/g, '').replace(/【.+?】/g, '')
        .replace(/\d+\.?\d*/g, '').trim();

    return cleaned.length >= 3 ? [cleaned] : [];
}

function checkPass(expected: string[], result: ReturnType<typeof evaluateBloodGas>): { passed: boolean; missingKeywords: string[] } {
    const allOutputTexts = [
        result.step1.label,
        result.step2.label,
        result.step3.label,
        result.step4.label,
        result.step5.label,
        ...result.differentials,
    ].join(' ');

    // 期待文字列のうち、diagTermsに含まれる語彙が存在するもの（＝診断に対する記述）のみをテスト対象とする
    // あるいは最初の2つを見る
    const primaryExpected = expected.slice(0, 2).filter(text => extractCoreWords(text).some(w => diagTerms.includes(w)));

    // もし抽出後空になってしまったら、元々の最初の要素だけは検査する
    if (primaryExpected.length === 0 && expected.length > 0) {
        primaryExpected.push(expected[0]);
    }

    const missingKeywords: string[] = [];

    for (const expectText of primaryExpected) {
        if (expectText.includes('なし')) continue;

        const coreWords = extractCoreWords(expectText);
        // いずれかのコアワードが出力に含まれればOK (OR条件)
        const matched = coreWords.some(word => word.length >= 3 && allOutputTexts.includes(word));
        if (!matched) {
            missingKeywords.push(expectText);
        }
    }

    return { passed: missingKeywords.length === 0, missingKeywords };
}

// ─── テスト実行 ────────────────────────────────────────────────────
function runTestSuite(
    tests: Array<{
        problem_id?: string;
        q1_data?: Record<string, unknown>;
        poct_blood_gas?: Record<string, unknown>;
        expected_outputs?: { q2_interpretation: string[] };
        q2_interpretation?: string[];
        _comment?: string;
    }>,
    suiteName: string,
    isRawFormat: boolean
): TestResult[] {
    const results: TestResult[] = [];

    for (const t of tests) {
        let input: BloodGasInput;
        let expected: string[];
        let id: string;

        if (isRawFormat) {
            // test1-4.json / test4-16.json 形式
            const bg = t.poct_blood_gas as Record<string, unknown>;
            if (!bg) continue;
            input = {
                bloodType: (bg['type'] as string) === 'ABG' ? 'arterial' : 'venous',
                pH: bg['pH'] as number,
                pCO2: bg['PCO2_Torr'] as number,
                hco3: bg['HCO3_mEq_L'] as number,
                na: bg['Na_mEq_L'] as number,
                cl: bg['Cl_mEq_L'] as number,
                alb: 4.0,
                glu: bg['Glu_mg_dL'] as number | undefined,
                lac: bg['Lac_mmol_L'] as number | undefined,
            };
            expected = (t.expected_outputs?.q2_interpretation as string[]) || [];
            id = (t.problem_id as string) || '?';
        } else {
            // test_comprehensive.json 形式
            const data = t.q1_data as Record<string, unknown>;
            if (!data) continue;
            input = {
                bloodType: (data['bloodType'] as 'arterial' | 'venous') || 'arterial',
                pH: data['pH'] as number,
                pCO2: data['PCO2'] as number,
                hco3: data['HCO3'] as number,
                na: data['Na'] as number | undefined,
                cl: data['Cl'] as number | undefined,
                alb: (data['Alb'] as number | undefined) ?? 4.0,
                glu: data['Glu'] as number | undefined,
                lac: data['Lac'] as number | undefined,
                uCl: data['U-Cl'] as number | undefined,
            };
            expected = (t.q2_interpretation as string[]) || [];
            id = (t._comment as string)?.split(':')[0]?.trim() || `Case`;
        }

        const result = evaluateBloodGas(input);
        const { passed, missingKeywords } = checkPass(expected, result);

        results.push({ id, passed, expected, actual: result.differentials, missingKeywords });
    }

    return results;
}

// ─── サマリー出力 ──────────────────────────────────────────────────
function printResults(results: TestResult[], suiteName: string): number {
    console.log(`\n${BOLD}${CYAN}┌──────────────────────────────────────────────┐${RESET}`);
    console.log(`${BOLD}${CYAN}│ ${suiteName.padEnd(44)} │${RESET}`);
    console.log(`${BOLD}${CYAN}└──────────────────────────────────────────────┘${RESET}`);

    let failCount = 0;
    for (const r of results) {
        if (r.passed) {
            console.log(`  \x1b[32m✅ PASS\x1b[0m ${r.id}`);
        } else {
            console.log(`  \x1b[31m❌ FAIL\x1b[0m \x1b[1m${r.id}\x1b[0m`);
            for (const missing of r.missingKeywords) {
                console.log(`         \x1b[33mMissing: "${missing}"\x1b[0m`);
            }
            console.log(`         \x1b[36mActual differentials:\x1b[0m\n         ${r.actual.join('\n         ')}`);
            failCount++;
        }
    }

    const passCount = results.length - failCount;
    const emoji = failCount === 0 ? '🎉' : '⚠️';
    console.log(`\n  ${emoji} ${BOLD}${passCount}/${results.length} passed${RESET}${failCount > 0 ? ` ${RED}(${failCount} failed)${RESET}` : ''}`);
    return failCount;
}

// ─── メイン ────────────────────────────────────────────────────────
const raw1 = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'Text/test1-4.json'), 'utf-8'));
const raw4 = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'Text/test4-16.json'), 'utf-8'));
const synthetic = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'Text/test_comprehensive.json'), 'utf-8'));

const results1 = runTestSuite(raw1, 'test1-4 (練習問題1〜3)', true);
const results4 = runTestSuite(raw4, 'test4-16 (練習問題4〜16)', true);
const resultsSyn = runTestSuite(synthetic, 'test_comprehensive (55ケース)', false);

const fail1 = printResults(results1, '【test1-4.json】練習問題1〜3');
const fail4 = printResults(results4, '【test4-16.json】練習問題4〜16');
const failSyn = printResults(resultsSyn, '【test_comprehensive.json】55ケース');

const totalFail = fail1 + fail4 + failSyn;
const totalTests = results1.length + results4.length + resultsSyn.length;
const totalPass = totalTests - totalFail;

console.log(`\n${BOLD}${'═'.repeat(50)}${RESET}`);
console.log(`${BOLD}TOTAL: ${totalPass}/${totalTests} PASSED${totalFail > 0 ? ` | ${RED}${totalFail} FAILED${RESET}` : ` ${GREEN}🎉 ALL PASS${RESET}`}${RESET}`);
console.log(`${'═'.repeat(50)}\n`);

// CI 環境では失敗があればエラー終了
process.exit(totalFail > 0 ? 1 : 0);
