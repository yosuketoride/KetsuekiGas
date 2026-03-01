import type {
    BloodGasInput,
    BloodGasResult,
    Step1Result,
    Step2Result,
    Step3Result,
    Step4Result,
    Step5Result,
    Acidemia,
    PrimaryDisorder,
    OxygenationResult,
} from './types';

// ─── VBG Correction ────────────────────────────────────────────────────────────
function applyVBGCorrection(input: BloodGasInput): BloodGasInput {
    if (input.bloodType === 'arterial') return input;
    return {
        ...input,
        pH: Math.round((input.pH + 0.035) * 1000) / 1000,
        pCO2: Math.round((input.pCO2 - 7.5) * 10) / 10,
        hco3: Math.round((input.hco3 - 2) * 10) / 10,
    };
}

// ─── Oxygenation ─────────────────────────────────────────────────────────────────
function evaluateOxygenation(po2?: number, fio2_input?: number, pco2?: number): OxygenationResult {
    if (po2 === undefined) {
        return {
            evaluated: false,
            label: '酸素化未評価',
            explanation: 'pO₂が入力されていません。'
        };
    }

    // Default room air to ~21%, let fio2_input be either 21, 0.21, etc.
    let fio2 = fio2_input ?? 21;
    if (fio2 > 1.0) {
        fio2 = fio2 / 100.0; // convert 21% -> 0.21
    }

    const pfRatio = po2 / fio2;
    const isHypoxemia = po2 < 60;
    const isArdsRisk = pfRatio < 300;

    // Simplified A-aDO2 for room air if standard ATM (713 * FiO2 - PCO2/0.8)
    const pAO2 = 713 * fio2 - (pco2 ?? 40) / 0.8;
    const aado2 = pAO2 - po2;

    let explanation = `P / F比: ${(pfRatio).toFixed(0)} (PaO₂ ${po2} ÷ FiO₂ ${(fio2 * 100).toFixed(0)}%) \n`;
    explanation += `A - aDO₂ (推定): ${aado2.toFixed(1)} mmHg\n`;

    let label = `P / F比 ${pfRatio.toFixed(0)} `;
    if (isHypoxemia) {
        label = `🚨 低酸素血症(${label})`;
        explanation += `🚨 PaO₂ <60 Torr: 急性の低酸素血症です。直ちに酸素投与や原因検索が必要です。`;
    } else if (isArdsRisk) {
        label = `⚠️ 酸素化低下(${label})`;
        explanation += `⚠️ P / F < 300: 急性肺障害などの酸素化低下の基準を満たしています。`;
    } else {
        label = `正常な酸素化(${label})`;
        explanation += `酸素化は保たれています。`;
    }

    return {
        evaluated: true,
        pfRatio,
        aado2,
        isHypoxemia,
        isArdsRisk,
        label,
        explanation
    };
}

// ─── Step 1: pH ────────────────────────────────────────────────────────────────
function evaluateStep1(pH: number): Step1Result {
    const urgent = pH <= 7.15 || pH >= 7.60;
    let type: Acidemia;
    let label: string;
    let explanation: string;

    if (pH < 7.35) {
        type = 'acidemia';
        label = 'アシデミア';
        explanation = `pH ${pH.toFixed(2)} <7.35 → 血液が酸性に傾いています。`;
    } else if (pH > 7.45) {
        type = 'alkalemia';
        label = 'アルカレミア';
        explanation = `pH ${pH.toFixed(2)} > 7.45 → 血液がアルカリ性に傾いています。`;
    } else {
        type = 'normal';
        label = '正常範囲';
        explanation = `pH ${pH.toFixed(2)} は正常範囲(7.35〜7.45) 内ですが、混合性酸塩基平衡異常が潜在する場合があります。AGは必ず確認してください。`;
    }

    if (urgent) {
        explanation += '　⚠️ 緊急対応が必要です！';
    }

    return { label, type, urgent, explanation };
}

// ─── Step 2: Primary Disorder (Otsuka Step 1-3) ──────────────────────────────
function evaluateStep2(pH: number, pCO2: number, be: number): Step2Result {
    // Normal Check
    const isNormal = (pH >= 7.35 && pH <= 7.45) && (pCO2 >= 35 && pCO2 <= 45) && (be >= -2 && be <= 2);
    if (isNormal) {
        return {
            primaryDisorder: 'normal',
            label: '酸塩基平衡正常',
            explanation: `pH(${pH}), PaCO₂(${pCO2}), BE(${be}) 全て基準範囲内です。`
        };
    }

    let primaryDisorder: PrimaryDisorder = 'indeterminate';
    let label = '';
    let explanation = '';

    const isAcidosis = pH < 7.40;
    let respCause = false;
    let metCause = false;

    if (isAcidosis) {
        respCause = pCO2 > 45;
        metCause = be < -2;

        if (respCause && metCause) {
            primaryDisorder = 'mixed_acidosis';
            label = '混合性アシドーシス';
            explanation = `pH < 7.40(アシドーシス) に対して、PaCO₂上昇(${pCO2} > 45)とBE低下(${be} < -2)の双方が原因となっています。代償は働きません。`;
        } else if (respCause) {
            // 慣性化の判断: BE ≥ +3 を「慣性」の目安とする
            // BE > +2 だと境界値附近で誤判定リスクが高いため +3 に引き上げ
            const isChronic = be > 3;
            primaryDisorder = isChronic ? 'chronic_respiratory_acidosis' : 'acute_respiratory_acidosis';
            label = isChronic ? '慢性呼吸性アシドーシス' : '急性呼吸性アシドーシス';
            explanation = `pH < 7.40(アシドーシス) に対して、PaCO₂上昇(${pCO2} > 45)が原因です。`;
        } else if (metCause) {
            primaryDisorder = 'metabolic_acidosis';
            label = '代謝性アシドーシス';
            explanation = `pH < 7.40(アシドーシス) に対して、BE低下(${be} < -2)が原因です。`;
        } else {
            primaryDisorder = 'indeterminate';
            label = '判定不能 (アシドーシス側)';
            explanation = `異常値ですが、PaCO₂(${pCO2})・BE(${be}) 共にアシドーシス側への明確な逸脱がありません。`;
        }
    } else { // Alkalosis
        respCause = pCO2 < 35;
        metCause = be > 2;

        if (respCause && metCause) {
            primaryDisorder = 'mixed_alkalosis';
            label = '混合性アルカローシス';
            explanation = `pH≧7.40(アルカローシス) に対して、PaCO₂低下(${pCO2} < 35)とBE上昇(${be} > 2)の双方が原因となっています。代償は働きません。`;
        } else if (respCause) {
            // 【重要】BE が大幅低下（< -5）している場合、これは実際には
            // 「代謝性アシドーシス＋呼吸性アルカローシスの混合」である可能性が高い。
            // 例：サリチル酸中毒（pH正常〜アルカレミア + PCO2低下 + HCO3/BE大幅低下）
            // この場合は慢性と判定せず mixed_contrasting として扱う。
            if (be < -5) {
                primaryDisorder = 'mixed_contrasting';
                label = '混合性障害（代謝性アシドーシス＋呼吸性アルカローシス）';
                explanation = `pH≧7.40(アルカローシス顕性) ですが、PCO₂低下(${pCO2}<35)とBE大幅低下(${be}<-5)の両方があります。代謝性アシドーシスに呼吸性アルカローシスが重なった混合性障害を強く疑います（サリチル酸中毒等）。`;
            } else {
                // 慢性化の判断: BE ≤ -3 を「慢性」の目安とする
                const isChronic = be < -3;
                primaryDisorder = isChronic ? 'chronic_respiratory_alkalosis' : 'acute_respiratory_alkalosis';
                label = isChronic ? '慢性呼吸性アルカローシス' : '急性呼吸性アルカローシス';
                explanation = `pH≧7.40(アルカローシス) に対して、PaCO₂低下(${pCO2} < 35)が原因です。`;
            }
        } else if (metCause) {
            primaryDisorder = 'metabolic_alkalosis';
            label = '代謝性アルカローシス';
            explanation = `pH≧7.40(アルカローシス) に対して、BE上昇(${be} > 2)が原因です。`;
        } else {
            primaryDisorder = 'mixed_contrasting';
            label = '混合性障害 (代償性変化の可能性)';
            explanation = `pH(${pH})によりアルカローシス側と判定されましたが、PaCO₂とBEの逸脱が合致しません。`;
        }
    }

    return { primaryDisorder, label, explanation };
}

// ─── Step 3: Compensation (Otsuka Step 4 + Advanced Formulas) ───────────────
function evaluateStep3(
    primaryDisorder: PrimaryDisorder,
    pCO2: number,
    be: number,
    hco3: number
): Step3Result {
    const normalHco3 = 24;
    const normalPco2 = 40;

    if (primaryDisorder === 'normal' || primaryDisorder === 'indeterminate' || primaryDisorder === 'mixed_contrasting') {
        return {
            compensationType: 'na',
            expectedValue: { min: 0, max: 0 },
            actualValue: 0,
            status: 'na',
            label: '評価対象外',
            explanation: '単一の一次性変化がないため、代償性変化の評価は行いません。',
        };
    }

    let status: Step3Result['status'] = 'na';
    let label = '';
    let explanation = '';

    let expectedMin = 0;
    let expectedMax = 0;
    let actualValue = 0;

    const isMetAcidosis = ['metabolic_acidosis', 'mixed_acidosis'].includes(primaryDisorder);
    const isMetAlkalosis = ['metabolic_alkalosis', 'mixed_alkalosis'].includes(primaryDisorder);
    const isRespAcidosis = ['acute_respiratory_acidosis', 'chronic_respiratory_acidosis', 'mixed_acidosis'].includes(primaryDisorder);
    const isRespAlkalosis = ['acute_respiratory_alkalosis', 'chronic_respiratory_alkalosis', 'mixed_alkalosis'].includes(primaryDisorder);

    if (primaryDisorder === 'mixed_acidosis' || primaryDisorder === 'mixed_alkalosis') {
        label = `代償不可(混合性障害)`;
        explanation = `呼吸性・代謝性の両因子が同方向に寄与しているため、代償機能は働きません。`;
    } else if (isMetAcidosis) {
        // Otsuka label
        const otsukaLabel = pCO2 < 35 ? "代償あり(PaCO₂ < 35)" : "代償なし(PaCO₂ ≧ 35)";

        // Winter's formula
        const expectedPco2 = hco3 + 15;
        expectedMin = expectedPco2 - 1.0;
        expectedMax = expectedPco2 + 1.0;
        actualValue = pCO2;
        label = `予想PaCO₂ = HCO₃⁻ + 15 = ${expectedPco2.toFixed(1)} mmHg`;

        const diff = pCO2 - expectedPco2;

        if (diff < -1) {
            status = 'inadequate_low';
            explanation = `【${otsukaLabel}】\nPaCO₂実測値が予測より低い（差分 ${diff.toFixed(1)} <-1）ため、呼吸性アルカローシスの合併があります。\n予測値: ${expectedPco2.toFixed(1)} / 実測値: ${pCO2.toFixed(1)} mmHg`;
        } else if (diff >= -1 && diff <= 1) {
            status = 'adequate';
            explanation = `【${otsukaLabel}】\nPaCO₂の低下は適切です（差分 ${diff.toFixed(1)}）。混合障害なし。\n予測値: ${expectedPco2.toFixed(1)} / 実測値: ${pCO2.toFixed(1)} mmHg`;
        } else {
            status = 'inadequate_high';
            explanation = `【${otsukaLabel}】\nPaCO₂実測値が高い（差分 +${diff.toFixed(1)}）ため、呼吸性アシドーシスの合併があります。\n予測値: ${expectedPco2.toFixed(1)} / 実測値: ${pCO2.toFixed(1)} mmHg`;
        }
    } else if (isMetAlkalosis) {
        const otsukaLabel = pCO2 > 45 ? "代償あり(PaCO₂ > 45)" : "代償なし(PaCO₂ ≦ 45)";
        const expectedPco2 = hco3 + 15;
        expectedMin = expectedPco2 - 2;
        expectedMax = Math.min(expectedPco2 + 2, 60);
        actualValue = pCO2;
        label = `予想PaCO₂ = HCO₃⁻ + 15 = ${expectedPco2.toFixed(0)} ± 2 mmHg（上限60）`;

        if (pCO2 >= expectedMin && pCO2 <= expectedMax) {
            status = 'adequate';
            explanation = `【${otsukaLabel}】\n代謝性アルカローシスの代償として適切です。\n予測値: ${expectedMin.toFixed(0)}〜${expectedMax.toFixed(0)} / 実測値: ${pCO2.toFixed(0)} mmHg`;
        } else if (pCO2 > expectedMax) {
            status = 'inadequate_high';
            explanation = `【${otsukaLabel}】\n実測PaCO₂が予測より高いため、呼吸性アシドーシスの合併があります。\n予測値: ${expectedMin.toFixed(0)}〜${expectedMax.toFixed(0)} / 実測値: ${pCO2.toFixed(0)} mmHg`;
        } else {
            status = 'inadequate_low';
            explanation = `【${otsukaLabel}】\n実測PaCO₂が予測より低いため、呼吸性アルカローシスの合併があります。\n予測値: ${expectedMin.toFixed(0)}〜${expectedMax.toFixed(0)} / 実測値: ${pCO2.toFixed(0)} mmHg`;
        }
    } else if (isRespAcidosis) {
        const otsukaLabel = be > 2 ? "代償あり(BE > 2)" : "代償なし(BE ≦ 2)";
        const deltaPco2 = pCO2 - normalPco2;
        const acuteExpected = normalHco3 + 0.1 * deltaPco2;
        const chronicExpected = normalHco3 + 0.4 * deltaPco2;

        const isChronicFit = primaryDisorder.startsWith('chronic_');

        if (!isChronicFit) {
            expectedMin = acuteExpected - 2.5;
            expectedMax = Math.min(acuteExpected + 2.5, 30);
            label = `急性：予想HCO₃⁻ = 24 + 0.1×ΔPCO₂ = ${acuteExpected.toFixed(1)} mEq/L`;
        } else {
            expectedMin = chronicExpected - 2.5;
            expectedMax = Math.min(chronicExpected + 2.5, 45);
            label = `慢性：予想HCO₃⁻ = 24 + 0.4×ΔPCO₂ = ${chronicExpected.toFixed(1)} mEq/L`;
        }

        if (hco3 >= expectedMin && hco3 <= expectedMax) {
            status = 'adequate';
            explanation = `【${otsukaLabel}】\n代償は適切です。\n予測値: ${expectedMin.toFixed(1)}〜${expectedMax.toFixed(1)} / 実測値: ${hco3.toFixed(1)} mEq/L`;
        } else if (hco3 > expectedMax) {
            status = 'inadequate_high';
            explanation = `【${otsukaLabel}】\n実測HCO₃⁻が予測より高いため、代謝性アルカローシスの合併があります。\n予測値: ${expectedMin.toFixed(1)}〜${expectedMax.toFixed(1)} / 実測値: ${hco3.toFixed(1)} mEq/L`;
        } else {
            status = 'inadequate_low';
            explanation = `【${otsukaLabel}】\n実測HCO₃⁻が予測より低いため、代謝性アシドーシスの合併があります。\n予測値: ${expectedMin.toFixed(1)}〜${expectedMax.toFixed(1)} / 実測値: ${hco3.toFixed(1)} mEq/L`;
        }
    } else if (isRespAlkalosis) {
        const otsukaLabel = be < -2 ? "代償あり(BE < -2)" : "代償なし(BE ≧ -2)";
        const deltaPco2 = normalPco2 - pCO2;
        const acuteExpected = normalHco3 - 0.2 * deltaPco2;
        const chronicExpected = normalHco3 - 0.5 * deltaPco2;

        const isChronicFit = primaryDisorder.startsWith('chronic_');

        if (!isChronicFit) {
            expectedMin = Math.max(acuteExpected - 2.5, 18);
            expectedMax = acuteExpected + 2.5;
            label = `急性：予想HCO₃⁻ = 24 − 0.2×ΔPCO₂ = ${acuteExpected.toFixed(1)} mEq/L`;
        } else {
            expectedMin = Math.max(chronicExpected - 2.5, 12);
            expectedMax = chronicExpected + 2.5;
            label = `慢性：予想HCO₃⁻ = 24 − 0.5×ΔPCO₂ = ${chronicExpected.toFixed(1)} mEq/L`;
        }

        if (hco3 >= expectedMin && hco3 <= expectedMax) {
            status = 'adequate';
            explanation = `【${otsukaLabel}】\n代償は適切です。\n予測値: ${expectedMin.toFixed(1)}〜${expectedMax.toFixed(1)} / 実測値: ${hco3.toFixed(1)} mEq/L`;
        } else if (hco3 > expectedMax) {
            status = 'inadequate_high';
            explanation = `【${otsukaLabel}】\n実測HCO₃⁻が予測より高いため、代謝性アルカローシスの合併があります。\n予測値: ${expectedMin.toFixed(1)}〜${expectedMax.toFixed(1)} / 実測値: ${hco3.toFixed(1)} mEq/L`;
        } else {
            status = 'inadequate_low';
            explanation = `【${otsukaLabel}】\n実測HCO₃⁻が予測より低いため、代謝性アシドーシスの合併があります。\n予測値: ${expectedMin.toFixed(1)}〜${expectedMax.toFixed(1)} / 実測値: ${hco3.toFixed(1)} mEq/L`;
        }
    }

    return {
        compensationType: 'na',
        expectedValue: { min: expectedMin, max: expectedMax },
        actualValue,
        status,
        label,
        explanation,
    };
}

// ─── Step 4: Anion Gap ────────────────────────────────────────────────────────
// lacとgluを追加引数として受け取り、AG正常でも「隠れHAGMA」を検出できるようにする
// primaryDisorderを受け取り、代謝性アシドーシス系の場合のみhiddenHagmaを検出する
// （呼吸性疾患が一次疾患の場合はLac上昇があってもhiddenHagmaとは判定しない）
function evaluateStep4(
    na: number | undefined,
    cl: number | undefined,
    hco3: number,
    alb: number,
    primaryDisorder: string,
    inputAg?: number,
    lac?: number,
    glu?: number
): Step4Result {
    let ag = 0;
    let baseExplanation = "";

    if (inputAg !== undefined) {
        ag = inputAg;
        baseExplanation = `AG = ${ag.toFixed(1)} (直接入力値)\n`;
    } else if (na !== undefined && cl !== undefined) {
        ag = na - (cl + hco3);
        baseExplanation = `AG = Na⁺ − (Cl⁻ + HCO₃⁻) = ${na} − (${cl} + ${hco3.toFixed(1)}) = ${ag.toFixed(1)}\n`;
    } else {
        return {
            applicable: false,
            ag: 0,
            correctedAg: 0,
            agElevated: false,
            hiddenHagma: false,
            hiddenHagmaExplanation: '',
            albUsed: alb,
            label: 'AG未入力 (Na⁺, Cl⁻も未入力)',
            explanation: 'アニオンギャップ（AG）の計算には、AG実測値またはNa⁺とCl⁻の入力が必要です。',
        };
    }
    const albCorrection = (4.0 - alb) * 2.5;
    const correctedAg = ag + albCorrection;
    const agElevated = correctedAg > 12;

    // ── 隠れHAGMA検出 ──────────────────────────────────────────────
    // AG値が正常（≤12）に見えても、Cl⁻高値等でAGが打ち消されている場合がある。
    // Lactate ≥ 2.5 mmol/L または Glucose > 250 mg/dL が存在すれば
    // 実態としてHAGMAが隠れていると判断しユーザーに警告する。
    // 閖値を 2.5 に設定する理由：2.0は正常上限の境界値で誤発動リスクが高いため
    const lacHagma = lac !== undefined && lac >= 2.5;
    const gluHagma = glu !== undefined && glu > 250;
    // hiddenHagma は代謝性アシドーシス系の一次疾患の場合のみ検出する
    // 呼吸性疾患が一次疾患の場合のLac高値は過換気等による二次的なものの可能性が高い
    const isMetabolicAcidosisPrimary = primaryDisorder === 'metabolic_acidosis' || primaryDisorder === 'mixed_acidosis';
    const hiddenHagma = !agElevated && isMetabolicAcidosisPrimary && (lacHagma || gluHagma);
    let hiddenHagmaExplanation = '';
    if (hiddenHagma) {
        hiddenHagmaExplanation = '⚠️ 【隠れHAGMA警告】計算上AG≤12（正常）ですが、';
        if (lacHagma) hiddenHagmaExplanation += `Lac ${lac!.toFixed(1)} mmol/L（高乳酸血症）、`;
        if (gluHagma) hiddenHagmaExplanation += `Glu ${glu} mg/dL（高血糖）、`;
        hiddenHagmaExplanation = hiddenHagmaExplanation.replace(/、$/, '');
        hiddenHagmaExplanation += 'が存在します。高Cl血症等によりAGが見かけ上正常になっている可能性があります（隠れHAGMA）。';
    }

    const label = `AG = ${ag.toFixed(1)} → 補正AG = ${correctedAg.toFixed(1)} (Alb補正: ${albCorrection >= 0 ? '+' : ''}${albCorrection.toFixed(1)})${hiddenHagma ? ' ⚠️隠れHAGMA' : ''}`;
    let explanation = baseExplanation;

    if (alb !== 4.0) {
        explanation += `アルブミン補正: 補正AG = ${ag.toFixed(1)} + (4.0 − ${alb.toFixed(1)}) × 2.5 = ${correctedAg.toFixed(1)}\n`;
    }

    if (agElevated) {
        explanation += `✅ 補正AG ${correctedAg.toFixed(1)} > 12 → AG（参考値）開大あり。AG開大性代謝性アシドーシスを含めて評価します。Step 5へ進みます。`;
    } else {
        explanation += `AG ${correctedAg.toFixed(1)} ≦ 12 → AG（参考値）開大なし。`;
    }
    if (hiddenHagma) {
        explanation += `\n\n${hiddenHagmaExplanation}`;
    }

    return { applicable: true, ag, correctedAg, agElevated, hiddenHagma, hiddenHagmaExplanation, albUsed: alb, label, explanation };
}

// ─── Step 5: Corrected HCO3 ───────────────────────────────────────────────────
function evaluateStep5(hco3: number, correctedAg: number, applicable: boolean): Step5Result {
    if (!applicable) {
        return {
            applicable: false,
            correctedHco3: 0,
            deltaAg: 0,
            status: 'normal',
            label: 'AG非開大のためスキップ',
            explanation: 'AG開大がないため補正HCO₃⁻の計算は不要です。',
        };
    }

    const deltaAg = correctedAg - 12;
    const correctedHco3 = hco3 + deltaAg;

    let status: Step5Result['status'];
    let label: string;
    let explanation = `補正HCO₃⁻ = 実測HCO₃⁻ + (補正AG − 12) = ${hco3.toFixed(1)} + ${deltaAg.toFixed(1)} = ${correctedHco3.toFixed(1)} mEq/L\n`;

    if (correctedHco3 > 26) {
        status = 'metabolic_alkalosis_combined';
        label = `補正HCO₃⁻ = ${correctedHco3.toFixed(1)} → 代謝性アルカローシス合併`;
        explanation += `✅ 補正HCO₃⁻ > 26 → AG開大性代謝性アシドーシスに加え、代謝性アルカローシスが合併しています（嘔吐・利尿薬等を疑う）。`;
    } else if (correctedHco3 < 22) {
        status = 'normal_ag_acidosis_combined';
        label = `補正HCO₃⁻ = ${correctedHco3.toFixed(1)} → AG正常型代謝性アシドーシス合併`;
        explanation += `✅ 補正HCO₃⁻ < 22 → AG開大性代謝性アシドーシスに加え、AG正常型代謝性アシドーシスが合併しています（下痢・RTA等を疑う）。`;
    } else {
        status = 'normal';
        label = `補正HCO₃⁻ = ${correctedHco3.toFixed(1)} → 追加の代謝性障害なし`;
        // changed from "22〜26" to display accurately, also allowing exact edge cases if needed.
        explanation += `補正HCO₃⁻ 22〜26 → 追加の代謝性障害の合併なし。`;
    }

    return { applicable: true, correctedHco3, deltaAg, status, label, explanation };
}

// ─── Differentials ────────────────────────────────────────────────────────────
// hiddenHagma: Step4で検出したAG見かけ正常だが実質HAGMAのフラグ
function getDifferentials(
    primaryDisorder: PrimaryDisorder,
    agEvaluated: boolean,
    agElevated: boolean,
    step3Status: Step3Result['status'] | string,
    step5Status: string,
    glu?: number,
    lac?: number,
    uCl?: number,
    hiddenHagma?: boolean
): string[] {
    const diffs: string[] = [];

    const hasMetabolicAcidosis = [
        'metabolic_acidosis', 'mixed_acidosis'
    ].includes(primaryDisorder);

    const hasMetabolicAlkalosis = [
        'metabolic_alkalosis', 'mixed_alkalosis'
    ].includes(primaryDisorder);

    const hasRespiratoryAcidosis = [
        'acute_respiratory_acidosis', 'chronic_respiratory_acidosis', 'mixed_acidosis'
    ].includes(primaryDisorder);

    const hasRespiratoryAlkalosis = [
        'acute_respiratory_alkalosis', 'chronic_respiratory_alkalosis', 'mixed_alkalosis'
    ].includes(primaryDisorder);

    if (hasMetabolicAcidosis) {
        if (agEvaluated) {
            if (agElevated) {
                diffs.push('🔴 AG開大性代謝性アシドーシス');
                diffs.push('  【KUDMELS / MUDPILES に基づく鑑別】');

                let foundSpecific = false;
                if (lac !== undefined && lac >= 2.0) {
                    diffs.push('  📌 乳酸アシドーシス（敗血症・ショック・虚血等）※Lac高値が見られます');
                    foundSpecific = true;
                }
                if (glu !== undefined && glu > 250) {
                    diffs.push('  📌 糖尿病性ケトアシドーシス(DKA)等 ※Glu高値が見られます');
                    foundSpecific = true;
                }

                if (!foundSpecific) {
                    diffs.push('  ・乳酸アシドーシス (Lactic acidosis)');
                    diffs.push('  ・ケトアシドーシス (DKA, AKA, 飢餓)');
                }
                diffs.push('  ・尿毒症 (Uremia) ※BUN/Crをご確認ください');
                diffs.push('  ・その他中毒 (メタノール, エチレングリコール, サリチル酸等)');
            } else {
                diffs.push('🟠 AG正常型代謝性アシドーシス (NAGMA)');
                // 隠れHAGMAが検出されていれば、NAGMAに加えHAGMAも合併していることを警告する
                if (hiddenHagma) {
                    diffs.push('  ⚠️⚠️ 【隠れHAGMA合併の強い疑い】');
                    diffs.push('  計算AGは正常ですが乳酸値/血糖値の高値があります。');
                    diffs.push('  高Cl血症等によりAGが偽正常化している可能性があります。');
                    diffs.push('  → NAGMA（高Cl性）+ HAGMA（乳酸アシドーシス/ケトアシドーシス）の三管区性障害を強く疑ってください。');
                    if (lac !== undefined && lac >= 2.0) {
                        diffs.push(`  📌 乳酸アシドーシス疑い（Lac ${lac.toFixed(1)} mmol/L）: 敗血症・ショック・虚血・外傷等`);
                    }
                    if (glu !== undefined && glu > 250) {
                        diffs.push(`  📌 ケトアシドーシス疑い（Glu ${glu} mg/dL）: DKA・AKA等`);
                    }
                } else {
                    diffs.push('  ※NAGMAであっても、まずはAGMA（乳酸・ケトアシドーシス等）を否定してください。');
                }
                diffs.push('  【HARDUP に基づく鑑別（K値やU-AGによる細分化）】');
                diffs.push('  血清K値を確認してください：');
                diffs.push('  ・K低下：下痢(最多), 尿細管性アシドーシス(RTA) 1型/2型');
                diffs.push('  ・K上昇：腎機能障害(初期), RTA 4型, アルドステロン低下');
                diffs.push('  ※下痢とRTAの鑑別には尿アニオンギャップ(U-AG)が有用です。');
                diffs.push('  （負なら下痢・消化管喪失、正ならRTAを疑います）');
            }
        } else {
            diffs.push('🟠 代謝性アシドーシス (AG未評価)');
            diffs.push('  ※NaとClを入力すると鑑別がさらに絞れます');
        }
    }
    if (hasMetabolicAlkalosis) {
        diffs.push('🔵 代謝性アルカローシス');

        if (uCl !== undefined) {
            if (uCl < 20) {
                diffs.push('  【細胞外液量低下 / 食塩反応性 (U-Cl < 20)】');
                diffs.push('  ・嘔吐・胃液吸引によるH⁺/Cl⁻喪失');
                diffs.push('  ・過去の利尿薬使用');
                diffs.push('  ・嚢胞性線維症');
                diffs.push('  ※生理食塩水の投与が有効です。');
            } else {
                diffs.push('  【細胞外液量正常〜増加 / 食塩不応性 (U-Cl ≧ 20)】');
                diffs.push('  💡血圧(BP)を評価してください：');
                diffs.push('  ・BP高値：原発性アルドステロン症, クッシング症候群, Liddle症候群 等');
                diffs.push('  ・BP正常/低値：現在の利尿薬使用, Bartter症候群, Gitelman症候群 等');
            }
        } else {
            diffs.push('  ※任意項目「U-Cl (尿中Cl)」を入力すると、食塩反応性/不応性の鑑別分岐が自動計算されます。');
            diffs.push('  【主な原因】');
            diffs.push('  ① 嘔吐・胃液吸引 (食塩反応性)');
            diffs.push('  ② 薬剤性（利尿薬・ステロイド・甘草）');
            diffs.push('  ③ 原発性アルドステロン症等の内分泌疾患 (食塩不応性)');
        }
    }
    if (hasRespiratoryAcidosis) {
        diffs.push('🟣 呼吸性アシドーシス');
        diffs.push('  COPD急性増悪');
        diffs.push('  重症喘息');
        diffs.push('  神経筋疾患（GBS・重症筋無力症）');
        diffs.push('  鎮静薬過量（ベンゾジアゼピン・オピオイド）');
        diffs.push('  肺水腫');
    }
    if (hasRespiratoryAlkalosis) {
        diffs.push('🟢 呼吸性アルカローシス');
        diffs.push('  過換気症候群（疼痛・不安）');
        diffs.push('  敗血症（初期）');
        diffs.push('  肺炎・肺塞栓');
        diffs.push('  サリチル酸中毒（呼吸性アルカローシス + 代謝性アシドーシス）');
    }

    // Step 3 Complications (using Winter's / Sanuki rules)
    if (step3Status === 'inadequate_high') {
        if (hasMetabolicAcidosis || hasMetabolicAlkalosis) {
            diffs.push('⚡ 呼吸性アシドーシス合併の疑い（換気低下、COPD、鎮静・疲弊）');
        } else {
            diffs.push('⚡ 代謝性アルカローシス合併の疑い（利尿薬・嘔吐）');
        }
    } else if (step3Status === 'inadequate_low') {
        if (hasMetabolicAcidosis || hasMetabolicAlkalosis) {
            diffs.push('⚡ 呼吸性アルカローシス合併の疑い（過換気・敗血症兆候）');
        } else {
            diffs.push('⚡ 代謝性アシドーシス合併の疑い（乳酸上昇・腎機能低下など）');
        }
    }

    if (agElevated && !hasMetabolicAcidosis) {
        diffs.push('⚡ AG開大性代謝性アシドーシスの合併（乳酸上昇・ケトアシドーシス等を確認）');
    }

    if (!hasMetabolicAcidosis || !agEvaluated || (!agElevated && !hiddenHagma)) {
        if (lac !== undefined && lac >= 2.0) {
            diffs.push(`⚡ 乳酸アシドーシス合併疑い（Lac ${lac.toFixed(1)} mmol/L）: 敗血症・ショック・虚血等`);
        }
        if (glu !== undefined && glu > 250) {
            diffs.push(`⚡ ケトアシドーシス合併疑い（Glu ${glu} mg/dL）: DKA・AKA等`);
        }
    }

    if (step5Status === 'metabolic_alkalosis_combined' && !hasMetabolicAlkalosis) {
        diffs.push('⚡ Step5合併：代謝性アルカローシス（嘔吐・利尿薬等を疑う）');
    }
    if (step5Status === 'normal_ag_acidosis_combined' && (!hasMetabolicAcidosis || (agElevated && !diffs.includes('🟠 AG正常型代謝性アシドーシス (NAGMA)')))) {
        diffs.push('⚡ Step5合併：AG正常型代謝性アシドーシス（下痢・RTA等を疑う）');
    }

    return diffs;
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────
export function evaluateBloodGas(input: BloodGasInput): BloodGasResult {
    const alb = input.alb ?? 4.0;

    // Apply VBG correction first
    const corrected = applyVBGCorrection({ ...input, alb });

    // Compute BE if missing using standard formula
    // BE = 0.93 * (HCO3 - 24.4 + 14.83 * (pH - 7.4))
    const beParam = corrected.be !== undefined
        ? corrected.be
        : Math.round(0.93 * (corrected.hco3 - 24.4 + 14.83 * (corrected.pH - 7.4)) * 10) / 10;

    corrected.be = beParam;

    const oxygenation = evaluateOxygenation(corrected.pO2, corrected.fio2, corrected.pCO2);
    const step1 = evaluateStep1(corrected.pH);
    const step2 = evaluateStep2(corrected.pH, corrected.pCO2, beParam);
    const step3 = evaluateStep3(step2.primaryDisorder, corrected.pCO2, beParam, corrected.hco3);
    // lac と glu を渡すことで、AG正常でも隠れHAGMAを検出できる
    // step2.primaryDisorderを渡してhiddenHagmaを代謝性アシドーシス時のみ発動させる
    const step4 = evaluateStep4(corrected.na, corrected.cl, corrected.hco3, corrected.alb ?? 4.0, step2.primaryDisorder, corrected.ag, corrected.lac, corrected.glu);
    const step5 = evaluateStep5(corrected.hco3, step4.correctedAg, step4.applicable && step4.agElevated);
    const differentials = getDifferentials(step2.primaryDisorder, step4.applicable, step4.agElevated, step3.status, step5.status, corrected.glu, corrected.lac, corrected.uCl, step4.hiddenHagma);

    return {
        correctedInput: corrected,
        oxygenation,
        step1,
        step2,
        step3,
        step4,
        step5,
        differentials,
    };
}
