import { useState, useCallback, useMemo } from 'react';
import type { BloodGasInput, BloodGasResult } from '../types';
import { evaluateBloodGas } from '../engine';
import AcidBaseGrid from './AcidBaseGrid';
import NomogramMap from './NomogramMap';
import DifferentialWizard from './DifferentialWizard';

interface FieldConfig {
    key: keyof BloodGasInput;
    label: string;
    unit: string;
    placeholder: string;
    normalRange: string;
    step: string;
    min: string;
    max: string;
    optional?: boolean;
}

const FIELD_CONFIGS: FieldConfig[] = [
    { key: 'pH', label: 'pH', unit: '', placeholder: '7.40', normalRange: '7.35〜7.45', step: '0.01', min: '6.5', max: '8.0' },
    { key: 'pCO2', label: 'PaCO₂', unit: 'mmHg', placeholder: '40', normalRange: '35〜45', step: '0.5', min: '1', max: '150' },
    { key: 'pO2', label: 'PaO₂', unit: 'Torr', placeholder: '90', normalRange: '80〜100', step: '1', min: '10', max: '600' },
    { key: 'hco3', label: 'HCO₃⁻', unit: 'mEq/L', placeholder: '24', normalRange: '22〜26', step: '0.5', min: '1', max: '60' },
    { key: 'ag', label: 'AG', unit: 'mEq/L', placeholder: '12', normalRange: '12±2', step: '0.1', min: '0', max: '50' },
    { key: 'fio2', label: 'FiO₂', unit: '%', placeholder: '21', normalRange: '室内気: 21', step: '1', min: '21', max: '100' },
    { key: 'na', label: 'Na⁺', unit: 'mEq/L', placeholder: '140', normalRange: '136〜145', step: '1', min: '100', max: '180', optional: true },
    { key: 'cl', label: 'Cl⁻', unit: 'mEq/L', placeholder: '104', normalRange: '98〜108', step: '1', min: '60', max: '140', optional: true },
    { key: 'alb', label: 'Alb', unit: 'g/dL', placeholder: '4.0', normalRange: 'AG補正用', step: '0.1', min: '0.5', max: '6.0', optional: true },
    // LacとGluは隠れHAGMA検出に不可欠なため常時表示（診断前から入力できる必要がある）
    { key: 'lac', label: 'Lac', unit: 'mmol/L', placeholder: '1.0', normalRange: '0.5〜1.5', step: '0.1', min: '0', max: '30' },
    { key: 'glu', label: 'Glu', unit: 'mg/dL', placeholder: '100', normalRange: '70〜110', step: '1', min: '20', max: '1500' },
    { key: 'uCl', label: 'U-Cl', unit: 'mEq/L', placeholder: '15', normalRange: '代謝性アルカローシス結別用', step: '1', min: '0', max: '200', optional: true },
];

function isAbnormal(key: string, value: number): boolean {
    switch (key) {
        case 'pH': return value < 7.35 || value > 7.45;
        case 'pCO2': return value < 35 || value > 45;
        case 'pO2': return value < 80;
        case 'hco3': return value < 22 || value > 26;
        case 'ag': return value > 14;
        case 'na': return value < 136 || value > 145;
        case 'cl': return value < 98 || value > 108;
        default: return false;
    }
}

type BadgeVariant = 'acidemia' | 'alkalemia' | 'normal' | 'warning' | 'purple' | 'info' | 'skip';

function getBadgeVariant(type: string): BadgeVariant {
    if (type === 'acidemia') return 'acidemia';
    if (type === 'alkalemia') return 'alkalemia';
    if (type === 'normal') return 'normal';
    if (type === 'adequate') return 'normal';
    if (type === 'insufficient' || type === 'excessive') return 'warning';
    if (type === 'na') return 'skip';
    return 'info';
}

function StepCard({
    stepNum,
    title,
    badgeText,
    badgeVariant,
    explanation,
    defaultExpanded = false,
}: {
    stepNum: string;
    title: string;
    badgeText: string;
    badgeVariant: BadgeVariant;
    explanation: string;
    defaultExpanded?: boolean;
}) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    return (
        <div className={`step-card ${expanded ? 'expanded' : ''}`}>
            <div className="step-card-header" onClick={() => setExpanded(e => !e)}>
                <span className="step-num">{stepNum}</span>
                <span className="step-title">{title}</span>
                <span className={`step-badge ${badgeVariant}`}>{badgeText}</span>
                <span className="step-chevron">›</span>
            </div>
            {expanded && (
                <div className="step-body">
                    <div className="step-body-inner">{explanation}</div>
                </div>
            )}
        </div>
    );
}

interface Props {
    bloodType: BloodGasInput['bloodType'];
    onResetAll: () => void;
}

export default function EvaluationScreen({ bloodType, onResetAll }: Props) {
    const [values, setValues] = useState<Record<string, string>>({});

    const handleChange = useCallback((key: string, val: string) => {
        setValues(prev => ({ ...prev, [key]: val }));
    }, []);

    // Evaluate result in real-time
    const result: BloodGasResult | null = useMemo(() => {
        const isReady = ['pH', 'pCO2', 'hco3'].every(k => {
            const v = parseFloat(values[k] ?? '');
            return !isNaN(v) && v > 0;
        });

        if (!isReady) return null;

        const input: BloodGasInput = {
            bloodType,
            pH: parseFloat(values['pH']),
            pCO2: parseFloat(values['pCO2']),
            hco3: parseFloat(values['hco3']),
            pO2: values['pO2'] ? parseFloat(values['pO2']) : undefined,
            fio2: values['fio2'] ? parseFloat(values['fio2']) : undefined,
            ag: values['ag'] ? parseFloat(values['ag']) : undefined,
            na: values['na'] ? parseFloat(values['na']) : undefined,
            cl: values['cl'] ? parseFloat(values['cl']) : undefined,
            alb: values['alb'] ? parseFloat(values['alb']) : undefined,
            lac: values['lac'] ? parseFloat(values['lac']) : undefined,
            glu: values['glu'] ? parseFloat(values['glu']) : undefined,
            uCl: values['uCl'] ? parseFloat(values['uCl']) : undefined,
        };

        return evaluateBloodGas(input);
    }, [values, bloodType]);

    const visibleFields = FIELD_CONFIGS.filter(config => {
        if (!config.optional) return true;
        if (!result) return false;

        const { primaryDisorder } = result.step2;
        const isMetAcidosis = primaryDisorder.includes('metabolic_acidosis') || primaryDisorder === 'mixed_acidosis';
        const isMetAlkalosis = primaryDisorder.includes('metabolic_alkalosis') || primaryDisorder === 'mixed_alkalosis';

        if (['na', 'cl', 'alb', 'lac', 'glu'].includes(config.key as string)) {
            return isMetAcidosis;
        }
        if (config.key === 'uCl') {
            return isMetAlkalosis;
        }
        // If there are other optionals, default to false or handle them
        return false;
    });

    return (
        <div className="evaluation-screen">
            {/* Sticky Summary Banner appearing as soon as we have a result */}
            <div className={`sticky-summary-wrap ${result ? 'visible' : ''}`}>
                {result && (
                    <div className={`summary-banner compact ${result.step1.type}`}>
                        <div className="summary-main">{result.step1.label}</div>
                        <div className="summary-sub">
                            {result.step2.primaryDisorder !== 'normal'
                                ? `一次性: ${result.step2.label}`
                                : '酸塩基平衡の明らかな一次性障害なし'}
                        </div>
                    </div>
                )}
            </div>

            <div className="input-section">
                {/* Blood Type Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 16px',
                        backgroundColor: bloodType === 'arterial' ? 'var(--color-acidemia-bg)' : 'var(--color-alkalemia-bg)',
                        border: `1.5px solid ${bloodType === 'arterial' ? 'var(--color-acidemia-border)' : 'var(--color-alkalemia-border)'}`,
                        borderRadius: 'var(--radius-lg)',
                        fontWeight: '700',
                        fontSize: '15px',
                        color: bloodType === 'arterial' ? 'var(--color-acidemia)' : 'var(--color-alkalemia)'
                    }}>
                        {bloodType === 'arterial' ? '🔴 動脈血 (Arterial)' : '🔵 静脈血 (Venous)'}
                    </div>
                    <button
                        onClick={onResetAll}
                        style={{
                            padding: '6px 12px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: 'var(--text-secondary)'
                        }}
                    >
                        変更する
                    </button>
                </div>

                <div className="input-group-title">必須項目 (pH, PaCO₂, HCO₃⁻)</div>
                <div className="input-grid">
                    {visibleFields.filter(f => !f.optional).map(field => {
                        const val = values[field.key as string] ?? '';
                        const num = parseFloat(val);
                        const abnorm = !isNaN(num) && isAbnormal(field.key as string, num);
                        return (
                            <div key={field.key as string} className="input-field">
                                <div className="input-label">
                                    {field.label}
                                    {field.unit && <span className="unit">{field.unit}</span>}
                                </div>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step={field.step}
                                    min={field.min}
                                    max={field.max}
                                    placeholder={field.placeholder}
                                    value={val}
                                    onChange={e => handleChange(field.key as string, e.target.value)}
                                    autoComplete="off"
                                />
                                <div className={`input-range ${abnorm ? 'abnormal' : ''}`}>
                                    {abnorm ? '⚠️ 正常範囲外' : `正常: ${field.normalRange}`}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {visibleFields.filter(f => f.optional).length > 0 && (
                    <>
                        <div className="input-group-title">追加情報項目 (診断パターンに応じて出現)</div>
                        <div className="input-grid optional-grid">
                            {visibleFields.filter(f => f.optional).map(field => {
                                const val = values[field.key as string] ?? '';
                                return (
                                    <div key={field.key as string} className="input-field compact-input">
                                        <div className="input-label">
                                            {field.label}
                                            {field.unit && <span className="unit">{field.unit}</span>}
                                            <span className="optional-tag">
                                                {field.key === 'alb' ? '省略可 (デフォ 4.0)' : '省略可'}
                                            </span>
                                        </div>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            step={field.step}
                                            min={field.min}
                                            max={field.max}
                                            placeholder={field.placeholder}
                                            value={val}
                                            onChange={e => handleChange(field.key as string, e.target.value)}
                                            autoComplete="off"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Results Section directly below inputs */}
            {result ? (
                <div className="result-section">
                    <div className="section-divider-title">評価結果</div>

                    {/* Urgent */}
                    {result.step1.urgent && (
                        <div className="urgent-banner">
                            <span className="urgent-banner-icon">🚨</span>
                            <span className="urgent-banner-text">
                                pH {result.correctedInput.pH.toFixed(2)} — 緊急対応が必要です！
                                直ちに原因検索と対応を行ってください。
                            </span>
                        </div>
                    )}

                    {/* Oxygenation Alert */}
                    {result.oxygenation.evaluated && (result.oxygenation.isHypoxemia || result.oxygenation.isArdsRisk) && (
                        <div className="urgent-banner" style={{ background: result.oxygenation.isHypoxemia ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: result.oxygenation.isHypoxemia ? '#b91c1c' : '#b45309' }}>
                            <span className="urgent-banner-icon">{result.oxygenation.isHypoxemia ? '🚨' : '⚠️'}</span>
                            <span className="urgent-banner-text">
                                <b>{result.oxygenation.label}</b>
                                <div style={{ fontSize: '0.85rem', marginTop: '4px', opacity: 0.9 }}>
                                    {result.oxygenation.explanation.split('\n').map((line, i) => (
                                        <div key={i}>{line}</div>
                                    ))}
                                </div>
                            </span>
                        </div>
                    )}

                    {/* VBG correction note */}
                    {result.correctedInput.bloodType === 'venous' && (
                        <div className="vbg-correction-note">
                            🔄 静脈血→動脈血相当値 自動補正済み
                            （pH+0.035 / PaCO₂−7.5 / HCO₃⁻−2 を適用して評価）
                        </div>
                    )}

                    <AcidBaseGrid result={result} />

                    <NomogramMap result={result} />

                    {/* Lactate Tip for Metabolic Acidosis */}
                    {result.step2.primaryDisorder.includes('metabolic_acidosis') && (
                        <div className="lactate-tip-banner">
                            <span className="lactate-icon">💡</span>
                            <span className="lactate-text">
                                <span className="lactate-title">ワンポイント（乳酸値の確認）</span>
                                ショック患者等ではAG開大の有無に関わらず、<b>乳酸値(Lac)</b>を確認してください。Lac高値で乳酸アシドーシスと一発診断可能です。
                            </span>
                        </div>
                    )}

                    <div className="step-cards-container">
                        {result.oxygenation.evaluated && (
                            <StepCard
                                stepNum="O₂"
                                title="酸素化の評価"
                                badgeText={result.oxygenation.label}
                                badgeVariant={result.oxygenation.isHypoxemia ? 'acidemia' : (result.oxygenation.isArdsRisk ? 'warning' : 'info')}
                                explanation={result.oxygenation.explanation}
                                defaultExpanded={false}
                            />
                        )}

                        <StepCard
                            stepNum="一次評価"
                            title="アシデミア/アルカレミア"
                            badgeText={result.step1.label}
                            badgeVariant={getBadgeVariant(result.step1.type)}
                            explanation={result.step1.explanation}
                            defaultExpanded={false}
                        />

                        <StepCard
                            stepNum="一次評価"
                            title="原発性異常の判定"
                            badgeText={result.step2.label}
                            badgeVariant={
                                result.step2.primaryDisorder === 'normal' ? 'normal' :
                                    result.step2.primaryDisorder.includes('acidosis') ? 'acidemia' : 'alkalemia'
                            }
                            explanation={result.step2.explanation}
                            defaultExpanded={result.step2.primaryDisorder !== 'normal'}
                        />

                        <StepCard
                            stepNum="代償判定"
                            title="予測代償範囲の評価"
                            badgeText={result.step3.status === 'na' ? '評価対象外' : result.step3.status === 'adequate' ? '適切な代償' : '⚠️ 合併を疑う'}
                            badgeVariant={getBadgeVariant(result.step3.status)}
                            explanation={`${result.step3.label}\n\n${result.step3.explanation}`}
                            defaultExpanded={result.step3.status !== 'adequate' && result.step3.status !== 'na'}
                        />

                        <StepCard
                            stepNum="AG評価"
                            title="アニオンギャップ (AG) 評価"
                            badgeText={
                                !result.step4.applicable ? '未評価' :
                                    result.step4.hiddenHagma ? `⚠️ 隠れHAGMA検出` :
                                        result.step4.agElevated ? `AG開大 (${result.step4.correctedAg.toFixed(0)})` :
                                            `AG正常 (${result.step4.correctedAg.toFixed(0)})`
                            }
                            badgeVariant={
                                !result.step4.applicable ? 'skip' :
                                    result.step4.hiddenHagma ? 'warning' :
                                        result.step4.agElevated ? 'warning' : 'normal'
                            }
                            explanation={result.step4.explanation}
                            defaultExpanded={result.step4.hiddenHagma || (result.step4.agElevated === true)}
                        />

                        <StepCard
                            stepNum="補正・合併評価"
                            title="補正HCO₃⁻（AG開大時）"
                            badgeText={
                                !result.step5.applicable ? 'スキップ' :
                                    result.step5.status === 'normal' ? `合併なし (${result.step5.correctedHco3.toFixed(0)})` :
                                        result.step5.status === 'metabolic_alkalosis_combined' ? `代謝性アルカローシス合併` :
                                            `AG正常型アシドーシス合併`
                            }
                            badgeVariant={
                                !result.step5.applicable ? 'skip' :
                                    result.step5.status === 'normal' ? 'normal' : 'warning'
                            }
                            explanation={result.step5.explanation}
                            defaultExpanded={result.step5.applicable && result.step5.status !== 'normal'}
                        />
                    </div>

                    {/* Differentials */}
                    {result.differentials.length > 0 && (
                        <div className="differentials-card">
                            <div className="differentials-title">
                                🔍 鑑別診断のヒント
                            </div>
                            <ul className="diff-list">
                                {result.differentials.map((d, i) => (
                                    <li key={i}>{d}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <DifferentialWizard result={result} />
                </div>
            ) : (
                <div className="waiting-for-input">
                    必須項目 (pH, PaCO₂, HCO₃⁻) を入力すると、ここに評価結果が自動で表示されます。
                </div>
            )
            }

            <button className="reset-btn" onClick={onResetAll}>
                血種選択からやり直す
            </button>
        </div >
    );
}
