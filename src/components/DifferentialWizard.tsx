import { useState } from 'react';
import type { BloodGasResult } from '../types';

interface ChecklistItem {
    id: string;
    text: string;
    resultText: string;
    resultDesc: string;
}

const CHECKLIST_ITEMS: Record<string, ChecklistItem[]> = {
    'AGMA': [
        { id: 'trauma_lactic', text: '🚑 外傷直後・手術直後・大量出血後の患者ですか？', resultText: '外傷性乳酸アシドーシス（組織低灌流）', resultDesc: '外傷・出血・手術による組織虚血で嫌気性代謝が亢進し乳酸が産生されます。出血コントロール・輸血・循環改善が最優先です。' },
        { id: 'uremia', text: '🚨 高度の腎機能低下（eGFR著明低下）や透析歴はありますか？', resultText: '腎機能低下に伴うアシドーシス（酸排泄障害）', resultDesc: '高度の腎機能低下による酸の排泄障害です。原疾患の治療・必要に応じ透析導入を検討します。' },
        { id: 'dka', text: '🩸 糖尿病の既往、著明な高血糖、または尿ケトン陽性ですか？', resultText: '糖尿病性ケトアシドーシス (DKA) / AKA', resultDesc: 'インスリン不足に伴うケトン体蓄積が原因です。生理食塩水の大量輸液とインスリン持続静注を開始してください。' },
        { id: 'lactic', text: '📉 ショック、循環不全、敗血症、極度の低酸素、またはLac>2ですか？', resultText: '乳酸アシドーシス (Lactic acidosis)', resultDesc: '組織低灌流（ショック等）に起因します。原因（敗血症、出血等）の除去と循環動態の改善が最優先です。' },
        { id: 'toxin', text: '☠️ 重度のアルコール飲酒歴、または中毒（メタノール、サリチル酸等）の疑いはありますか？', resultText: '中毒性アシドーシス', resultDesc: 'メタノール、エチレングリコール等の摂取が疑われます。浸透圧ギャップの測定や特異的治療を検討してください。' }
    ],
    'NAGMA': [
        { id: 'trauma_dilutional', text: '🚑 外傷直後・手術後・大量輸液（生食）を実施した患者ですか？', resultText: '外傷/手術後の高Cl性（希釈性）アシドーシス', resultDesc: '大量生食輸液によりCl⁻が上昇し、見かけ上HCO₃⁻が低下する事が原因です。※Lac高値時は「隠れHAGMA」にも注意してください。' },
        { id: 'diarrhea', text: '🚽 激しい下痢や、腸瘻・ドレナージ等による消化管液の継続的な喪失はありますか？', resultText: '消化管からのHCO₃⁻喪失 (下痢など)', resultDesc: '腸管液には大量の重炭酸イオンが含まれており、これの喪失が原因です。補液による脱水補正を行ってください。' },
        { id: 'saline', text: '💧 大量の生理食塩水（または細胞外液補充液）の急速・大量投与を行いましたか？', resultText: '希釈性アシドーシス（高クロール性）', resultDesc: '大量の生食投与により細胞外液中のHCO₃⁻濃度が低下したため生じたものです。' },
        { id: 'rta', text: '🧪 尿アニオンギャップ(U-AG)は正ですか？ または原因不明の低カリウム血症がありますか？', resultText: '尿細管性アシドーシス (RTA)', resultDesc: '腎臓からのH⁺排泄障害、またはHCO₃⁻再吸収障害によるものです。精査（尿pH、カリウム値等）が必要です。' }
    ],
    'MetAlk': [
        { id: 'vomit', text: '🤮 著明な嘔吐、または経鼻胃管などによる胃液の吸引・喪失がありますか？', resultText: '胃液喪失に伴う代謝性アルカローシス', resultDesc: 'H⁺とCl⁻の喪失によるものです。生理食塩水の投与（食塩反応性）が著効します。' },
        { id: 'diuretic', text: '💊 最近、利尿薬（ループ利尿薬やサイアザイド系）を使用しましたか？', resultText: '利尿薬使用に伴う代謝性アルカローシス', resultDesc: '尿中へのCl⁻排泄増加と体液量減少による「収縮性アルカローシス」です。' },
        { id: 'salt_responsive', text: '🧂 尿中Clは 20 mEq/L 未満ですか？ (細胞外液量は低下傾向ですか？)', resultText: '食塩反応性アルカローシス', resultDesc: '脱水・Cl欠乏が主体です。生理食塩水による体液補充とCl補充で改善します。' },
        { id: 'aldo', text: '📈 高血圧を伴っていますか？', resultText: '原発性アルドステロン症 / クッシング症候群', resultDesc: '食塩不応性です。アルドステロン過剰により遠位尿細管でのH⁺およびK⁺排泄が促進されています。' },
        { id: 'bartter', text: '📉 正常血圧かつ利尿薬非使用下で低カリウム血症がありますか？', resultText: '食塩不応性アルカローシス (Bartter/Gitelman症候群等)', resultDesc: 'これらの尿細管疾患を疑います。' }
    ],
    'RespAcidosis': [
        { id: 'tbi', text: '🧠 頭部外傷（TBI）や脳卒中など、中枢神経障害の直後ですか？', resultText: '外傷性脳損傷（TBI）等による換気不全', resultDesc: '頭部外傷により脳幹の呼吸中枢が障害されCO₂貯留が起きます。気道確保（必要に応じ挿管と調節換気）が最優先です。' },
        { id: 'copd', text: '🫁 COPD、肺気腫、喘息などの慢性閉塞性肺疾患や気道狭窄はありますか？', resultText: 'COPD増悪 / 呼吸器疾患による換気低下', resultDesc: '気道閉塞や肺胞低換気によるCO₂蓄積です。NPPV等の換気補助を検討します。' },
        { id: 'drug', text: '💊 鎮静薬、オピオイド、睡眠薬などの過量内服や使用歴がありますか？', resultText: '薬剤性呼吸抑制', resultDesc: '呼吸中枢の抑制による換気低下です。拮抗薬（ナロキソン、フルマゼニル等）や気道確保が必要です。' },
        { id: 'neuro', text: '🔬 神経筋疾患（ALS、GBS、重症筋無力症など）または進行する意識障害はありますか？', resultText: '中枢神経・神経筋疾患による換気不全', resultDesc: '呼吸筋力の低下や中枢性の呼吸障害です。進行する場合は人工呼吸管理が必要です。' }
    ],
    'RespAlkalosis': [
        { id: 'hvs', text: '😨 精神的な動揺、激しい不安、疼痛に伴う明らかな過換気状態ですか？', resultText: '過換気症候群 / 疼痛による頻呼吸', resultDesc: '精神的または身体的ストレスによるものです。基本は精神的安静や疼痛コントロールです。' },
        { id: 'sepsis', text: '🦠 発熱、頻脈などがあり、敗血症（SIRS）の初期兆候が疑われますか？', resultText: '敗血症の初期 (SIRS)', resultDesc: 'SIRSの初期では直接的な呼吸中枢刺激により過換気となることがあります。感染フォーカスの検索が必要です。' },
        { id: 'hypoxia', text: '📉 肺炎、肺塞栓症(PE)、心不全などによる「低酸素血症」が存在しますか？', resultText: '低酸素血症誘発性の過換気', resultDesc: '低酸素血症を改善させるための代償的な過換気です。酸素投与や原疾患治療が必要です。' }
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

export default function DifferentialWizard({ result }: { result: BloodGasResult }) {
    const treeKey = getTreeKey(result);
    // In case of combined disorders, we could fetch multiple keys, but currently step2 logic categorizes primarily by major disorder.
    const items = treeKey ? CHECKLIST_ITEMS[treeKey] : [];

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showResults, setShowResults] = useState(false);

    if (!treeKey || items.length === 0) return null;

    const toggleItem = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleEvaluate = () => {
        setShowResults(true);
    };

    const handleReset = () => {
        setSelectedIds(new Set());
        setShowResults(false);
    };

    const selectedItems = items.filter(item => selectedIds.has(item.id));

    return (
        <div className="wizard-container" style={{ marginTop: '2rem' }}>
            <div className="section-divider-title">
                STEP 2: 原因疾患の特定 (チェックリスト)
            </div>

            <div className="wizard-card current">
                {!showResults ? (
                    <div>
                        <div style={{ marginBottom: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            患者さんに当てはまる病歴や所見を<span style={{ color: '#ef4444' }}>すべて</span>選択してください（複数選択可）
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                            {items.map(item => (
                                <label
                                    key={item.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '12px',
                                        padding: '16px',
                                        backgroundColor: selectedIds.has(item.id) ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-html)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        border: selectedIds.has(item.id) ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                                        transition: 'all 0.2s',
                                        margin: 0
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(item.id)}
                                        onChange={() => toggleItem(item.id)}
                                        style={{ width: '24px', height: '24px', cursor: 'pointer', marginTop: '2px', accentColor: '#3b82f6' }}
                                    />
                                    <span style={{ color: 'var(--text-primary)', lineHeight: '1.5', fontSize: '1.05rem', fontWeight: selectedIds.has(item.id) ? 'bold' : 'normal' }}>
                                        {item.text}
                                    </span>
                                </label>
                            ))}
                        </div>

                        <button
                            className="wizard-btn yes"
                            style={{ width: '100%', fontSize: '1.1rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            onClick={handleEvaluate}
                        >
                            選択した所見から鑑別リストを生成
                        </button>
                    </div>
                ) : (
                    <div className="wizard-result">
                        <div className="wizard-result-label" style={{ marginBottom: '16px', fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                            {selectedItems.length > 0 ? "🩺 疑われる原因・合併:" : "⚠️ 選択された特異的な原因はありません。"}
                        </div>

                        {selectedItems.length === 0 && (
                            <div style={{ padding: '16px', backgroundColor: 'var(--bg-html)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                                その他の潜在的な原因（MUDPILESやHARDUPなど）を考慮し、追加検査を検討してください。
                            </div>
                        )}

                        {selectedItems.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                {selectedItems.map((item, index) => (
                                    <div key={item.id} style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{
                                            padding: '16px',
                                            backgroundColor: 'var(--bg-html)',
                                            borderLeft: '4px solid #ef4444',
                                            borderRadius: '4px 8px 8px 4px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
                                                {item.resultText}
                                            </div>
                                            <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                                {item.resultDesc}
                                            </div>
                                        </div>
                                        {index < selectedItems.length - 1 && (
                                            <div style={{ color: '#ef4444', fontWeight: 'bold', textAlign: 'center', margin: '8px 0', fontSize: '1.5rem' }}>＋</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            style={{
                                marginTop: '16px', width: '100%', backgroundColor: 'transparent',
                                border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                                padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                            }}
                            onClick={handleReset}
                        >
                            チェックリストをやり直す
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
