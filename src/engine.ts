import type {
    BloodType,
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
    OsmolalityResult,
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
function evaluateOxygenation(po2?: number, fio2_input?: number, pco2?: number, age?: number, bloodType?: BloodType): OxygenationResult {
    if (bloodType === 'venous') {
        return {
            evaluated: false,
            label: '静脈血(VBG)酸素化評価不可',
            explanation: '⚠️ VBGのpO₂は動脈血酸素化の評価に使用できません。\n循環状態や末梢組織の酸素消費量に大きく左右されるため、正確なP/F比やA-aDO₂の算出にはABGが必要です。'
        };
    }

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

    // Age-based expected PaO2 (Supine approximation: 104 - 0.27 * Age)
    let expectedPaO2: number | undefined;
    if (age !== undefined) {
        expectedPaO2 = Math.round(104 - 0.27 * age);
    }

    let isAgeRelatedHypoxemia = false;
    let isMildHypoxemia = false;

    if (po2 < 80 && po2 >= 60 && !isArdsRisk) {
        // Allow a broader margin of error (-10 Torr) for the supine approximation in clinical practice
        if (age !== undefined && po2 >= expectedPaO2! - 10) {
            isAgeRelatedHypoxemia = true;
        } else {
            isMildHypoxemia = true;
        }
    }

    let explanation = `P / F比: ${(pfRatio).toFixed(0)} (PaO₂ ${po2} ÷ FiO₂ ${(fio2 * 100).toFixed(0)}%) \n`;
    explanation += `A - aDO₂ (推定): ${aado2.toFixed(1)} Torr\n`;

    if (expectedPaO2 !== undefined) {
        explanation += `年齢(${age}歳)予測PaO₂: 約 ${expectedPaO2} Torr\n`;
    }

    let label = `P/F比 ${pfRatio.toFixed(0)}`;
    if (isHypoxemia) {
        label = `🚨 呼吸不全(${label})`;
        explanation += `🚨 PaO₂ <60 Torr: 急性の低酸素血症（呼吸不全）です。直ちに酸素投与や原因検索が必要です。`;
    } else if (isArdsRisk) {
        label = `⚠️ 酸素化低下(${label})`;
        explanation += `⚠️ P / F < 300: 急性肺障害などの酸素化低下の基準を満たしています。`;
    } else if (isMildHypoxemia) {
        label = `⚠️ 軽度低酸素(${label})`;
        if (age !== undefined) {
            explanation += `⚠️ PaO₂ <80 Torr: 年齢から予測されるPaO₂(${expectedPaO2} Torr)を下回っており、軽度の低酸素血症があります。`;
        } else {
            explanation += `⚠️ PaO₂ <80 Torr: 軽度の低酸素血症があります。年齢を入力すると加齢の影響を評価できます。`;
        }
    } else if (isAgeRelatedHypoxemia) {
        label = `正常(加齢考慮) (${label})`;
        explanation += `💡 PaO₂ は80未満ですが、年齢相応の予測値(${expectedPaO2} Torr付近)を満たしており、加齢に伴う生理的な低下と考えられます。`;
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
        isAgeRelatedHypoxemia,
        expectedPaO2,
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

        // Winter's formula (正確な式: 1.5 × HCO3 + 8 ± 2)
        const expectedPco2 = 1.5 * hco3 + 8;
        expectedMin = expectedPco2 - 2.0;
        expectedMax = expectedPco2 + 2.0;
        actualValue = pCO2;
        label = `Winter's式 予想PaCO₂ = 1.5×HCO₃⁻ + 8 = ${expectedPco2.toFixed(1)} ± 2 mmHg`;


        const diff = pCO2 - expectedPco2;

        if (diff < -2) {
            status = 'inadequate_low';
            explanation = `【${otsukaLabel}】\nPaCO₂実測値が予測より低い（差分 ${diff.toFixed(1)} <-2）ため、呼吸性アルカローシスの合併があります。\n予測値: ${expectedPco2.toFixed(1)} / 実測値: ${pCO2.toFixed(1)} mmHg`;
        } else if (diff >= -2 && diff <= 2) {
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

// ─── Step 5: Corrected HCO3 & Delta Ratio ──────────────────────────────────────
function evaluateStep5(hco3: number, correctedAg: number, applicable: boolean): Step5Result {
    if (!applicable) {
        return {
            applicable: false,
            correctedHco3: 0,
            deltaAg: 0,
            deltaRatio: 0,
            status: 'normal',
            label: 'AG非開大のためスキップ',
            explanation: 'AG開大がないため補正HCO₃⁻およびDelta Ratioの計算は不要です。',
        };
    }

    const deltaAg = correctedAg - 12;
    const correctedHco3 = hco3 + deltaAg;
    const deltaHco3 = 24 - hco3;

    // Delta Ratio = ΔAG / ΔHCO3
    let deltaRatio: number | undefined;
    if (deltaHco3 !== 0) {
        deltaRatio = deltaAg / deltaHco3;
    }

    let status: Step5Result['status'];
    let label: string;
    let explanation = `補正HCO₃⁻ = 実測HCO₃⁻ + (補正AG − 12) = ${hco3.toFixed(1)} + ${deltaAg.toFixed(1)} = ${correctedHco3.toFixed(1)} mEq/L\n`;

    if (deltaRatio !== undefined) {
        explanation += `Delta Ratio (ΔAG/ΔHCO₃⁻) = ${deltaAg.toFixed(1)} / ${deltaHco3.toFixed(1)} = ${deltaRatio.toFixed(2)}\n`;
    }

    // Determine status primarily by Delta Ratio if available, fallback to correctedHco3
    if (deltaRatio !== undefined) {
        if (deltaRatio < 0.4) {
            status = 'normal_ag_acidosis_combined';
            label = `Delta Ratio = ${deltaRatio.toFixed(2)} (< 0.4) → 純粋なNAGMAに近い、又は高度なNAGMA合併`;
            explanation += `✅ Delta Ratio < 0.4 → 高度なAG正常型代謝性アシドーシス(NAGMA)の合併（下痢・RTA等）を強く疑います。`;
        } else if (deltaRatio < 1.0) {
            status = 'normal_ag_acidosis_combined';
            label = `Delta Ratio = ${deltaRatio.toFixed(2)} (0.4 - 1.0) → HAGMAとNAGMAの混合`;
            explanation += `✅ Delta Ratio 0.4〜1.0 → AG開大性代謝性アシドーシス(HAGMA)に、正常AG性代謝性アシドーシス(NAGMA)が合併しています。`;
        } else if (deltaRatio <= 2.0) {
            status = 'normal';
            label = `Delta Ratio = ${deltaRatio.toFixed(2)} (1.0 - 2.0) → 単純なHAGMA`;
            explanation += `✅ Delta Ratio 1.0〜2.0 → 単独のHAGMAとして矛盾しません（乳酸アシドーシスは約1.6、ケトアシドーシスは約1.0が典型）。`;
        } else {
            status = 'metabolic_alkalosis_combined';
            label = `Delta Ratio = ${deltaRatio.toFixed(2)} (> 2.0) → 代謝性アルカローシスの合併`;
            explanation += `✅ Delta Ratio > 2.0 → AG増加に比べてHCO₃⁻の低下が軽度です。代謝性アルカローシスが合併しています（嘔吐・利尿薬等を疑う）。`;
        }
    } else {
        // Fallback to correctedHco3 if deltaHco3 is 0 (i.e. HCO3 is 24 exactly)
        if (correctedHco3 > 26) {
            status = 'metabolic_alkalosis_combined';
            label = `補正HCO₃⁻ = ${correctedHco3.toFixed(1)} → 代謝性アルカローシス合併`;
            explanation += `✅ 補正HCO₃⁻ > 26 → 代謝性アルカローシスが合併しています（嘔吐・利尿薬等を疑う）。`;
        } else if (correctedHco3 < 22) {
            status = 'normal_ag_acidosis_combined';
            label = `補正HCO₃⁻ = ${correctedHco3.toFixed(1)} → NAGMA合併`;
            explanation += `✅ 補正HCO₃⁻ < 22 → AG正常型代謝性アシドーシスが合併しています（下痢・RTA等を疑う）。`;
        } else {
            status = 'normal';
            label = `補正HCO₃⁻ = ${correctedHco3.toFixed(1)} → 追加の代謝性障害なし`;
            explanation += `補正HCO₃⁻ 22〜26 → 追加の代謝性障害の合併なし。`;
        }
    }

    return { applicable: true, correctedHco3, deltaAg, deltaRatio, status, label, explanation };
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
    hiddenHagma?: boolean,
    osmolality?: OsmolalityResult,
    uPH?: number,
    deltaRatio?: number
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
                diffs.push('🔴 AG開大性代謝性アシドーシス（HAGMA）');
                diffs.push('  ─ 以下の順に原因を確認してください ─');

                // Delta Ratio Interpretation
                if (deltaRatio !== undefined) {
                    if (deltaRatio < 0.4) {
                        diffs.push(`  📌 Delta Ratio = ${deltaRatio.toFixed(2)} (< 0.4): 純粋なNAGMAに近い、又は高度なNAGMA合併`);
                        diffs.push('    → HAGMAに加え、AG正常型代謝性アシドーシス（下痢・RTA等）の合併を強く疑います。');
                    } else if (deltaRatio < 1.0) {
                        diffs.push(`  📌 Delta Ratio = ${deltaRatio.toFixed(2)} (0.4 - 1.0): HAGMAとNAGMAの混合`);
                        diffs.push('    → HAGMAに加え、AG正常型代謝性アシドーシス（下痢・RTA等）が合併しています。');
                    } else if (deltaRatio <= 2.0) {
                        diffs.push(`  📌 Delta Ratio = ${deltaRatio.toFixed(2)} (1.0 - 2.0): 単純なHAGMA`);
                        diffs.push('    → 単独のHAGMAとして矛盾しません（乳酸アシドーシスは約1.6、ケトアシドーシスは約1.0が典型）。');
                    } else { // deltaRatio > 2.0
                        diffs.push(`  📌 Delta Ratio = ${deltaRatio.toFixed(2)} (> 2.0): 代謝性アルカローシスの合併`);
                        diffs.push('    → HAGMAに加え、代謝性アルカローシス（嘔吐・利尿薬等）が合併しています。');
                    }
                } else {
                    diffs.push('  ※Delta Ratioを計算すると、HAGMAに合併する他の代謝性障害の有無を評価できます。');
                }


                // ① 末期腎不全
                diffs.push('  ① 末期腎不全（eGFR著明低下・透析歴）');
                diffs.push('    → 腎性アシドーシス（硫酸・リン酸の蓄積によるAG開大）');

                // ② 乳酸上昇
                if (lac !== undefined && lac >= 2.0) {
                    diffs.push(`  ② 乳酸上昇あり（Lac ${lac.toFixed(1)} mmol/L）📌`);
                } else {
                    diffs.push('  ② 乳酸上昇（Lac ≥ 2 mmol/L）');
                }
                diffs.push('    → 敗血症・感染性ショック（最多）');
                diffs.push('    → 循環不全（心原性・出血性ショック）');
                diffs.push('    → 腸管虚血（腸間膜動脈閉塞）');
                diffs.push('    → てんかん重積発作後');
                diffs.push('    → ビタミンB1（チアミン）欠乏');

                // ③ ケトン体上昇
                if (glu !== undefined && glu > 250) {
                    diffs.push(`  ③ ケトン体上昇（Glu ${glu} mg/dL 高血糖あり）📌`);
                } else {
                    diffs.push('  ③ ケトン体上昇（尿/血清ケトン陽性・高血糖）');
                }
                diffs.push('    → 糖尿病性ケトアシドーシス（DKA）：高血糖+ケトン体');
                diffs.push('    → アルコール性ケトアシドーシス（AKA）：血糖正常〜低値のこともある');
                diffs.push('    → 飢餓性ケトアシドーシス：長期絶食歴');

                // ④ 薬物・中毒
                diffs.push('  ④ 薬物・中毒（飲酒歴・薬物摂取歴・浸透圧ギャップ上昇）');
                diffs.push('    → サリチル酸中毒（呼吸性アルカローシスとの混合が特徴）');
                diffs.push('    → アセトアミノフェン、D-乳酸アシドーシス など');
                diffs.push('  ※①〜④で原因が不明な場合、血清浸透圧ギャップ（OG）を確認してください');
                diffs.push('    （OG = 実測血清浸透圧 − 計算血清浸透圧 [2×Na + Glu/18 + BUN/2.8]）');
                if (osmolality?.serumEvaluated) {
                    if (osmolality.serumOsmGap !== undefined && osmolality.serumOsmGap > 10) {
                        diffs.push(`    → 📌 血清OG高値 (>10): 毒性アルコール中毒（メタノール、エチレングリコール等）を強く疑う`);
                    } else {
                        diffs.push(`    → 血清OG基準値内: アセトアミノフェン、サリチル酸、D-乳酸などの他の原因を考慮`);
                    }
                } else {
                    diffs.push('    → 血清OG高値 (>10)なら毒性アルコール中毒（メタノール、エチレングリコール等）疑い');
                }
            } else {
                diffs.push('🟠 AG正常型代謝性アシドーシス (NAGMA / 高Cl血性)');
                if (hiddenHagma) {
                    diffs.push('  ⚠️⚠️ 【隠れHAGMA合併の強い疑い】');
                    diffs.push('  計算AGは正常ですが乳酸値/血糖値の高値があります。');
                    diffs.push('  → NAGMA（高Cl性）+ HAGMA（乳酸アシドーシス/ケトアシドーシス）の混合性障害を強く疑ってください。');
                    if (lac !== undefined && lac >= 2.0) diffs.push(`  📌 乳酸アシドーシス疑い（Lac ${lac.toFixed(1)} mmol/L）`);
                    if (glu !== undefined && glu > 250) diffs.push(`  📌 ケトアシドーシス疑い（Glu ${glu} mg/dL）`);
                } else {
                    diffs.push('  ※まずはHAGMA（乳酸・ケトアシドーシス等）を否定してください。');
                }

                diffs.push('  ─ 実測データに基づく鑑別 ─');
                if (osmolality?.urineAgEvaluated && osmolality.urineAg !== undefined) {
                    const uag = osmolality.urineAg;
                    if (uag < 0) {
                        diffs.push(`  ✅ 尿アニオンギャップ (U-AG) < 0 (${uag.toFixed(0)} mEq/L)`);
                        diffs.push('     → 尿中NH4+排泄は保たれています。');
                        diffs.push('     → 📌 原因: 下痢（上部消化管由来）、小児・先天性Cl下痢症、回腸導管、一部の絨毛腺腫など');
                    } else {
                        diffs.push(`  ✅ 尿アニオンギャップ (U-AG) > 0 (${uag.toFixed(0)} mEq/L)`);
                        diffs.push('     → 尿中NH4+排泄低下 または 測定されない陰イオン増加。');

                        if (osmolality.urineEvaluated && osmolality.urineOsmGap !== undefined) {
                            if (osmolality.urineOsmGap > 150) {
                                diffs.push(`     ✅ 尿浸透圧ギャップ (U-OG) > 150 (${osmolality.urineOsmGap.toFixed(0)} mOsm/L)`);
                                diffs.push('        → 📌 原因: DMケトアシドーシス回復期、トルエン中毒、D乳酸アシドーシス等');
                            } else {
                                diffs.push(`     ✅ 尿浸透圧ギャップ (U-OG) ≦ 150 (${osmolality.urineOsmGap.toFixed(0)} mOsm/L)`);
                                diffs.push('        → 📌 原因: 保存期CKD、尿細管性アシドーシス(RTA)');
                                if (uPH !== undefined) {
                                    if (uPH > 6.0) {
                                        diffs.push(`        → 🚨 尿pH > 6 (${uPH.toFixed(1)}): 遠位RTA (1型)を強く疑います`);
                                    } else {
                                        diffs.push(`        → 尿pH ≦ 6 (${uPH.toFixed(1)}): 近位RTA (2型) や 保存期CKDの可能性`);
                                    }
                                } else {
                                    diffs.push('        ※尿pHを入力すると遠位RTAと近位RTAの鑑別が可能です');
                                }
                            }
                        } else {
                            diffs.push('     ※尿浸透圧(U-Osm)等を入力して尿OGを計算すると、細分類が可能です');
                            diffs.push('     ・尿OG > 150: トルエン中毒、DKA回復期');
                            diffs.push('     ・尿OG ≦ 150: 保存期CKD、尿細管性アシドーシス(RTA)');
                        }
                    }
                } else {
                    diffs.push('  ※尿Na, 尿K, 尿Clを入力すると 尿アニオンギャップ(U-AG) による鑑別分岐が可能です');
                    diffs.push('  【古典的鑑別(HARDUP/血清K値による)】');
                    diffs.push('  ・血清K低下：下痢(最多), 尿細管性アシドーシス(RTA) 1型/2型');
                    diffs.push('  ・血清K上昇：腎機能障害(初期), RTA 4型, アルドステロン低下');
                }
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

    if (osmolality?.serumEvaluated && osmolality.serumOsmGap !== undefined && osmolality.serumOsmGap > 10) {
        diffs.push('⚡ 血清浸透圧ギャップ(OG)開大 (>10): エタノール、毒性アルコール(メタノール等)の中毒を疑う');
    }

    if (osmolality?.urineEvaluated && osmolality.urineOsmGap !== undefined) {
        if (osmolality.urineOsmGap > 150) {
            diffs.push('⚡ 尿浸透圧ギャップ(U-OG)高値 (>150): 尿中NH4+排泄不良（腎細管性アシドーシス(RTA)の疑い）');
        } else if (osmolality.urineOsmGap < 0) {
            diffs.push('⚡ 尿浸透圧ギャップ(U-OG)低値 (<0): 尿中NH4+排泄良好（下痢等の腎外喪失の存在）');
        }
    }

    return diffs;
}

// ─── Osmolality ───────────────────────────────────────────────────────────────
function evaluateOsmolality(input: BloodGasInput): OsmolalityResult {
    const { na, bun, glu, sOsm, uNa, uK, uCl, uUn, uGlu, uOsm } = input;

    let serumEvaluated = false;
    let calcSerumOsm: number | undefined;
    let serumOsmGap: number | undefined;
    let serumText = '';

    if (sOsm !== undefined && na !== undefined && bun !== undefined && glu !== undefined) {
        serumEvaluated = true;
        calcSerumOsm = Number((2 * na + bun / 2.8 + glu / 18).toFixed(1));
        serumOsmGap = Number((sOsm - calcSerumOsm).toFixed(1));
        serumText = `血清浸透圧ギャップ: ${serumOsmGap} mOsm/kg\n(実測 ${sOsm} - 計算 ${calcSerumOsm})`;
    } else if (sOsm !== undefined || bun !== undefined) {
        serumText = '血清OGの計算には、Na, BUN, Glu, 実測血清浸透圧が全て必要です。';
    }

    let urineEvaluated = false;
    let calcUrineOsm: number | undefined;
    let urineOsmGap: number | undefined;
    let urineText = '';

    if (uOsm !== undefined && uNa !== undefined && uK !== undefined) {
        urineEvaluated = true;
        const unVal = uUn !== undefined ? uUn : 0;
        const ugVal = uGlu !== undefined ? uGlu : 0;
        calcUrineOsm = Number((2 * (uNa + uK) + unVal / 2.8 + ugVal / 18).toFixed(1));
        urineOsmGap = Number((uOsm - calcUrineOsm).toFixed(1));
        urineText = `尿浸透圧ギャップ: ${urineOsmGap} mOsm/kg\n(実測 ${uOsm} - 計算 ${calcUrineOsm})`;
        if (uUn === undefined && uGlu === undefined) {
            urineText += '\n※尿素窒素・尿糖が未入力のため、2×(尿Na+尿K)で簡易計算しています。';
        }
    } else if (uOsm !== undefined || uNa !== undefined || uK !== undefined) {
        urineText = '尿OGの計算には、尿Na, 尿K, 実測尿浸透圧が全て必要です。';
    }

    let urineAgEvaluated = false;
    let urineAg: number | undefined;
    if (uNa !== undefined && uK !== undefined && uCl !== undefined) {
        urineAgEvaluated = true;
        urineAg = Number((uNa + uK - uCl).toFixed(1));
        if (urineText) urineText += `\n尿アニオンギャップ(U-AG): ${urineAg} mEq/L (Na + K - Cl)`;
        else urineText = `尿アニオンギャップ(U-AG): ${urineAg} mEq/L\n(尿OG計算は未評価)`;
    }

    let label = '尿/血清 浸透圧・AG評価';
    let explanation = '';

    if (serumEvaluated || urineEvaluated || urineAgEvaluated) {
        explanation = [serumText, urineText].filter(Boolean).join('\n\n');

        let warnings = [];
        if (serumEvaluated && serumOsmGap! > 10) warnings.push('血清OG開大');
        if (urineAgEvaluated && urineAg! < 0) warnings.push('U-AG負');
        else if (urineAgEvaluated && urineAg! > 0) warnings.push('U-AG正');
        if (urineEvaluated && urineOsmGap! > 150) warnings.push('尿OG高値');

        if (warnings.length > 0) {
            label = warnings.join(' / ');
        } else {
            label = '浸透圧ギャップ 等計算完了';
        }
    } else {
        label = '浸透圧/尿AG 未評価';
        explanation = '必要な項目（Na, BUN, Glu, 浸透圧実測値など）が入力されていません。';
    }

    return {
        serumEvaluated,
        calcSerumOsm,
        serumOsmGap,
        urineEvaluated,
        calcUrineOsm,
        urineOsmGap,
        urineAgEvaluated,
        urineAg,
        label,
        explanation
    };
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

    const oxygenation = evaluateOxygenation(corrected.pO2, corrected.fio2, corrected.pCO2, corrected.age, corrected.bloodType);
    const step1 = evaluateStep1(corrected.pH);
    const step2 = evaluateStep2(corrected.pH, corrected.pCO2, beParam);
    const step3 = evaluateStep3(step2.primaryDisorder, corrected.pCO2, beParam, corrected.hco3);
    // lac と glu を渡すことで、AG正常でも隠れHAGMAを検出できる
    // step2.primaryDisorderを渡してhiddenHagmaを代謝性アシドーシス時のみ発動させる
    const step4 = evaluateStep4(corrected.na, corrected.cl, corrected.hco3, corrected.alb ?? 4.0, step2.primaryDisorder, corrected.ag, corrected.lac, corrected.glu);
    const step5 = evaluateStep5(corrected.hco3, step4.correctedAg, step4.applicable && step4.agElevated);
    const osmolality = evaluateOsmolality(corrected);
    const differentials = getDifferentials(step2.primaryDisorder, step4.applicable, step4.agElevated, step3.status, step5.status, corrected.glu, corrected.lac, corrected.uCl, step4.hiddenHagma, osmolality, corrected.uPH);

    return {
        correctedInput: corrected,
        oxygenation,
        step1,
        step2,
        step3,
        step4,
        step5,
        osmolality,
        differentials,
    };
}
