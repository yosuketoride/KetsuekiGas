import { useState } from 'react';
import type { BloodGasResult } from '../types';

interface ChecklistItem {
    id: string;
    label: string;        // 短い見出し「激しい下痢」
    resultText: string;
    resultDesc: string;
}

const CHECKLIST_ITEMS: Record<string, ChecklistItem[]> = {
    'AGMA': [
        {
            id: 'renal',
            label: '末期腎不全（eGFR著明低下・透析歴）',
            resultText: '腎性アシドーシス（高度腎機能低下）',
            resultDesc: '高度の腎機能低下により酸の排泄が障害されます。硫酸・リン酸などの有機酸が蓄積しAGが開大します。原疾患治療・必要に応じ透析導入を検討してください。',
        },
        {
            id: 'lactate',
            label: '乳酸上昇（Lac ≥ 2 mmol/L）',
            resultText: '乳酸アシドーシス（Type A / Type B）',
            resultDesc: '【主な原因】\n▶ 敗血症・感染性ショック（最多）\n▶ 循環不全・心原性ショック・出血性ショック\n▶ 腸管虚血（腸間膜動脈閉塞）\n▶ てんかん重積発作後\n▶ ビタミンB1（チアミン）欠乏\n\n組織低灌流の是正（輸液・昇圧剤）と原因検索を最優先にしてください。',
        },
        {
            id: 'ketone',
            label: 'ケトン体上昇（尿/血清ケトン陽性・高血糖）',
            resultText: 'ケトアシドーシス',
            resultDesc: '【原因の分類】\n▶ 糖尿病性ケトアシドーシス（DKA）：インスリン不足・高血糖を伴う。大量輸液＋インスリン持続静注が必要。\n▶ アルコール性ケトアシドーシス（AKA）：血糖は正常〜低値のことがある。グルコース＋チアミン補充。\n▶ 飢餓性ケトアシドーシス：長期絶食。補液・糖質投与で改善。',
        },
        {
            id: 'toxin',
            label: '薬物・中毒疑い（飲酒歴・薬物摂取歴・浸透圧ギャップ上昇）',
            resultText: '中毒性アシドーシス',
            resultDesc: '【主な原因】\n▶ メタノール中毒：視力障害を伴うことあり。ホメピゾール・透析。\n▶ エチレングリコール中毒：シュウ酸カルシウム尿（尿蓚酸塩）。ホメピゾール・透析。\n▶ サリチル酸中毒：呼吸性アルカローシスとの混合が特徴。活性炭・透析。\n▶ プロピレングリコール（持続鎮静薬の溶媒）\n\n浸透圧ギャップ（OG）= 実測浸透圧 − 計算浸透圧（2×Na + Glu/18 + BUN/2.8）。OG >10 で中毒性アルコール類を疑います。',
        },
    ],
    'NAGMA': [
        { id: 'trauma_dilutional', label: '外傷・手術後・大量輸液（生食）', resultText: '外傷/手術後の高Cl性（希釈性）アシドーシス', resultDesc: '大量生食輸液によりCl⁻が上昇し、見かけ上HCO₃⁻が低下する事が原因です。※Lac高値時は「隠れHAGMA」にも注意してください。' },
        { id: 'diarrhea', label: '激しい下痢・腸瘻・ドレナージ', resultText: '消化管からのHCO₃⁻喪失 (下痢など)', resultDesc: '腸管液には大量の重炭酸イオンが含まれており、これの喪失が原因です。補液による脱水補正を行ってください。' },
        { id: 'saline', label: '大量補液（生食・細胞外液）', resultText: '希釈性アシドーシス（高クロール性）', resultDesc: '大量の生食投与により細胞外液中のHCO₃⁻濃度が低下したため生じたものです。' },
        { id: 'rta', label: 'U-AG正・原因不明の低カリウム血症', resultText: '尿細管性アシドーシス (RTA)', resultDesc: '腎臓からのH⁺排泄障害、またはHCO₃⁻再吸収障害によるものです。精査（尿pH、カリウム値等）が必要です。' },
    ],
    'MetAlk': [
        { id: 'vomit', label: '著明な嘔吐・胃液吸引', resultText: '胃液喪失に伴う代謝性アルカローシス', resultDesc: 'H⁺とCl⁻の喪失によるものです。生理食塩水の投与（食塩反応性）が著効します。' },
        { id: 'diuretic', label: 'ループ/サイアザイド利尿薬使用', resultText: '利尿薬使用に伴う代謝性アルカローシス', resultDesc: '尿中へのCl⁻排泄増加と体液量減少による「収縮性アルカローシス」です。' },
        { id: 'salt_responsive', label: '尿Cl < 20 mEq/L・脱水傾向', resultText: '食塩反応性アルカローシス', resultDesc: '脱水・Cl欠乏が主体です。生理食塩水による体液補充とCl補充で改善します。' },
        { id: 'aldo', label: '高血圧を伴う', resultText: '原発性アルドステロン症 / クッシング症候群', resultDesc: '食塩不応性です。アルドステロン過剰により遠位尿細管でのH⁺およびK⁺排泄が促進されています。' },
        { id: 'bartter', label: '正常血圧・利尿薬なし・低K血症', resultText: '食塩不応性アルカローシス (Bartter/Gitelman)', resultDesc: 'これらの尿細管疾患を疑います。' },
    ],
    'RespAcidosis': [
        { id: 'tbi', label: '頭部外傷・脳卒中（中枢神経障害）', resultText: '外傷性脳損傷(TBI)等による換気不全', resultDesc: '頭部外傷により脳幹の呼吸中枢が障害されCO₂貯留が起きます。気道確保（必要に応じ挿管と調節換気）が最優先です。' },
        { id: 'copd', label: 'COPD・肺気腫・喘息', resultText: 'COPD増悪 / 呼吸器疾患による換気低下', resultDesc: '気道閉塞や肺胞低換気によるCO₂蓄積です。NPPV等の換気補助を検討します。' },
        { id: 'drug', label: '鎮静薬・オピオイド過量', resultText: '薬剤性呼吸抑制', resultDesc: '呼吸中枢の抑制による換気低下です。拮抗薬（ナロキソン、フルマゼニル等）や気道確保が必要です。' },
        { id: 'neuro', label: '神経筋疾患（ALS・GBS・重症筋無力症）', resultText: '中枢神経・神経筋疾患による換気不全', resultDesc: '呼吸筋力の低下や中枢性の呼吸障害です。進行する場合は人工呼吸管理が必要です。' },
    ],
    'RespAlkalosis': [
        { id: 'hvs', label: '不安・疼痛による過換気', resultText: '過換気症候群 / 疼痛による頻呼吸', resultDesc: '精神的または身体的ストレスによるものです。基本は精神的安静や疼痛コントロールです。' },
        { id: 'sepsis', label: '発熱・頻脈（敗血症初期）疑い', resultText: '敗血症の初期 (SIRS)', resultDesc: 'SIRSの初期では直接的な呼吸中枢刺激により過換気となることがあります。感染フォーカスの検索が必要です。' },
        { id: 'hypoxia', label: '低酸素血症（肺炎・PE・心不全）', resultText: '低酸素血症誘発性の過換気', resultDesc: '低酸素血症を改善させるための代償的な過換気です。酸素投与や原疾患治療が必要です。' },
    ],
};

function getTreeKey(result: BloodGasResult): string | null {
    const { primaryDisorder } = result.step2;
    const { step4 } = result;

    if (primaryDisorder.includes('metabolic_acidosis') || primaryDisorder === 'mixed_acidosis') {
        if (step4.applicable && step4.agElevated) return 'AGMA';
        return 'NAGMA';
    }
    if (primaryDisorder.includes('metabolic_alkalosis') || primaryDisorder === 'mixed_alkalosis') {
        return 'MetAlk';
    }
    if (primaryDisorder.includes('respiratory_acidosis')) {
        return 'RespAcidosis';
    }
    if (primaryDisorder.includes('respiratory_alkalosis')) {
        return 'RespAlkalosis';
    }
    return null;
}

// あり/なし の状態
type ToggleState = 'unset' | 'yes' | 'no';

export default function DifferentialWizard({ result }: { result: BloodGasResult }) {
    const treeKey = getTreeKey(result);
    const items = treeKey ? CHECKLIST_ITEMS[treeKey] : [];

    // 各項目の「あり/なし」状態を管理
    const [states, setStates] = useState<Record<string, ToggleState>>({});
    const [showResults, setShowResults] = useState(false);

    if (!treeKey || items.length === 0) return null;

    const setToggle = (id: string, val: ToggleState) => {
        setStates(prev => ({ ...prev, [id]: val }));
        setShowResults(false);
    };

    const handleEvaluate = () => setShowResults(true);
    const handleReset = () => {
        setStates({});
        setShowResults(false);
    };

    const selectedItems = items.filter(item => states[item.id] === 'yes');
    const allAnswered = items.every(item => states[item.id] === 'yes' || states[item.id] === 'no');

    return (
        <div className="dw-container">
            <div className="dw-header">
                <span className="dw-step-label">STEP 2</span>
                <span className="dw-title">原因疾患の特定</span>
            </div>

            <div className="dw-body">
                {!showResults ? (
                    <>
                        <p className="dw-instruction">当てはまる所見を選んでください</p>
                        <div className="dw-list">
                            {items.map(item => {
                                const state = states[item.id] ?? 'unset';
                                return (
                                    <div key={item.id} className={`dw-item ${state !== 'unset' ? 'dw-item--answered' : ''}`}>
                                        <span className="dw-item-label">{item.label}</span>
                                        <div className="dw-toggle">
                                            <button
                                                className={`dw-toggle-btn dw-toggle-yes ${state === 'yes' ? 'active' : ''}`}
                                                onClick={() => setToggle(item.id, state === 'yes' ? 'unset' : 'yes')}
                                            >
                                                あり
                                            </button>
                                            <button
                                                className={`dw-toggle-btn dw-toggle-no ${state === 'no' ? 'active' : ''}`}
                                                onClick={() => setToggle(item.id, state === 'no' ? 'unset' : 'no')}
                                            >
                                                なし
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            className="dw-evaluate-btn"
                            onClick={handleEvaluate}
                            disabled={!allAnswered}
                        >
                            鑑別リストを生成
                        </button>
                        {!allAnswered && (
                            <p className="dw-hint">すべての項目に「あり/なし」を選択してください</p>
                        )}
                    </>
                ) : (
                    <div className="dw-results">
                        <div className="dw-results-title">
                            {selectedItems.length > 0 ? '🩺 疑われる原因' : '⚠️ 特異的な原因なし'}
                        </div>

                        {selectedItems.length === 0 && (
                            <div className="dw-no-result">
                                {treeKey === 'AGMA' ? (
                                    <>
                                        <div style={{ marginBottom: '8px', fontWeight: 600 }}>⚗️ 浸透圧ギャップ（OG）を測定してください</div>
                                        <div style={{ fontSize: '0.85em', lineHeight: 1.6 }}>
                                            腎機能・乳酸・ケトン体・中毒の明らかな原因が見当たりません。<br />
                                            <strong>OG = 実測浸透圧 − 計算浸透圧（2×Na + Glu/18 + BUN/2.8）</strong><br />
                                            OG &gt; 10 → 毒性アルコール中毒（メタノール、エチレングリコール等）を疑う<br />
                                            OG 正常 → その他の稀な原因を検索してください
                                        </div>
                                    </>
                                ) : (
                                    'その他の潜在的な原因を考慮し、追加検査を検討してください。'
                                )}
                            </div>
                        )}

                        <div className="dw-result-list">
                            {selectedItems.map((item, index) => (
                                <div key={item.id} className="dw-result-card">
                                    <div className="dw-result-num">{index + 1}</div>
                                    <div>
                                        <div className="dw-result-name">{item.resultText}</div>
                                        <div className="dw-result-desc">{item.resultDesc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="dw-reset-btn" onClick={handleReset}>
                            ← やり直す
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
