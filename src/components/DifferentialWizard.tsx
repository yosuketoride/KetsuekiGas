import { useState, useMemo } from 'react';
import type { BloodGasResult } from '../types';

interface WizardNode {
    id: string;
    text?: string;
    yesNext?: string;
    noNext?: string;
    resultText?: string;
    resultDesc?: string;
    isResult?: boolean;
}

const WIZARD_TREES: Record<string, WizardNode[]> = {
    // ----------------------------------------------------------------
    // AG開大性代謝性アシドーシス (AGMA)
    // 外傷・手術後の患者は最優先コンテキストとして先頭で確認する
    // ----------------------------------------------------------------
    'AGMA': [
        { id: 'q0', text: '🚑 外傷直後・手術直後・大量出血後の患者ですか？', yesNext: 'r_trauma_lactic', noNext: 'q1' },
        { id: 'q1', text: '🚨 腎不全（BUN/Cr上昇）や明らかな尿量減少はありますか？', yesNext: 'r_uremia', noNext: 'q2' },
        { id: 'q2', text: '🩸 糖尿病の既往、著明な高血糖、または尿ケトン陽性ですか？', yesNext: 'r_dka', noNext: 'q3' },
        { id: 'q3', text: '📉 ショック、循環不全、敗血症、極度の低酸素、またはLac>2ですか？', yesNext: 'r_lactic', noNext: 'q4' },
        { id: 'q4', text: '☠️ 重度のアルコール飲酒歴、または中毒（メタノール、エチレングリコール、サリチル酸等）の疑いはありますか？', yesNext: 'r_toxin', noNext: 'r_unknown' },

        { id: 'r_trauma_lactic', isResult: true, resultText: '外傷性乳酸アシドーシス（組織低灌流）', resultDesc: '外傷・出血・手術による組織虚血で嫌気性代謝が亢進し乳酸が産生されます。出血コントロール・輸血・循環改善が最優先です。Lac値の推移を追ってください。' },
        { id: 'r_uremia', isResult: true, resultText: '尿毒症性アシドーシス (Uremia)', resultDesc: '高度の腎機能低下による酸の排泄障害です。原疾患の治療・透析導入を検討します。' },
        { id: 'r_dka', isResult: true, resultText: '糖尿病性ケトアシドーシス (DKA) / AKA', resultDesc: 'インスリン不足に伴うケトン体蓄積が原因です。生理食塩水の大量輸液とインスリン持続静注を開始してください。' },
        { id: 'r_lactic', isResult: true, resultText: '乳酸アシドーシス (Lactic acidosis)', resultDesc: '組織低灌流（ショック等）に起因します。原因（敗血症、出血等）の除去と循環動態の改善が最優先です。' },
        { id: 'r_toxin', isResult: true, resultText: '中毒性アシドーシス', resultDesc: 'メタノール、エチレングリコール等の摂取が疑われます。浸透圧ギャップの測定や特異的治療を検討してください。' },
        { id: 'r_unknown', isResult: true, resultText: '原因不明のAG開大性代謝性アシドーシス', resultDesc: 'MUDPILESの各項目（サリチル酸、アセトアミノフェン等）を再評価してください。' }
    ],

    // ----------------------------------------------------------------
    // AG正常型代謝性アシドーシス (NAGMA)
    // 外傷後の大量生食投与・隠れHAGMA合併を最初に確認する
    // ----------------------------------------------------------------
    'NAGMA': [
        { id: 'q0', text: '🚑 外傷直後・手術後・大量輸液（生食）を実施した患者ですか？（Lac高値も確認してください）', yesNext: 'r_trauma_dilutional', noNext: 'q1' },
        { id: 'q1', text: '🚽 激しい下痢や、腸瘻・ドレナージ等による消化管液の継続的な喪失はありますか？', yesNext: 'r_diarrhea', noNext: 'q2' },
        { id: 'q2', text: '💧 大量の生理食塩水（または細胞外液補充液）の急速・大量投与を行いましたか？', yesNext: 'r_saline', noNext: 'q3' },
        { id: 'q3', text: '🧪 尿アニオンギャップ(U-AG)は正ですか？ または原因不明の低カリウム血症がありますか？', yesNext: 'r_rta', noNext: 'r_unknown' },

        { id: 'r_trauma_dilutional', isResult: true, resultText: '外傷/手術後の高Cl性（希釈性）アシドーシス ± 乳酸アシドーシス合併', resultDesc: '【NAGMA成分】大量生食輸液によりCl⁻が上昇し、見かけ上HCO₃⁻が低下する「希釈性アシドーシス（高Cl性）」が起きます。\n\n【隠れHAGMA成分】Lac≥2の場合は同時に外傷性ショックによる乳酸アシドーシスが合併しており、高Cl血症がAGを偽正常化させている可能性があります（隠れHAGMA）。\n\n→ ショックの制御・出血コントロールと並行し、乳酸値の改善を追ってください。' },
        { id: 'r_diarrhea', isResult: true, resultText: '消化管からのHCO₃⁻喪失 (下痢など)', resultDesc: '腸管液には大量の重炭酸イオンが含まれており、これの喪失が原因です。補液による脱水補正を行ってください。' },
        { id: 'r_saline', isResult: true, resultText: '希釈性アシドーシス（高クロール性）', resultDesc: '大量の生食投与により細胞外液中のHCO₃⁻濃度が低下したため生じたものです。' },
        { id: 'r_rta', isResult: true, resultText: '尿細管性アシドーシス (RTA)', resultDesc: '腎臓からのH⁺排泄障害、またはHCO₃⁻再吸収障害によるものです。精査（尿pH、カリウム値等）が必要です。' },
        { id: 'r_unknown', isResult: true, resultText: '原因不明のAG正常型代謝性アシドーシス', resultDesc: 'HARDUP（アジソン病、尿管S状結腸吻合等）を再確認し、U-AGやK値を精査してください。' }
    ],

    // ----------------------------------------------------------------
    // 代謝性アルカローシス（変更なし）
    // ----------------------------------------------------------------
    'MetAlk': [
        { id: 'q1', text: '🤮 著明な嘔吐、または経鼻胃管などによる胃液の吸引・喪失がありますか？', yesNext: 'r_vomit', noNext: 'q2' },
        { id: 'q2', text: '💊 最近、利尿薬（ループ利尿薬やサイアザイド系）を使用しましたか？', yesNext: 'r_diuretic', noNext: 'q3' },
        { id: 'q3', text: '🧂 尿中Clは 20 mEq/L 未満ですか？ (細胞外液量は低下傾向ですか？)', yesNext: 'r_salt_responsive', noNext: 'q4' },
        { id: 'q4', text: '📈 高血圧を伴っていますか？', yesNext: 'r_aldo', noNext: 'r_bartter' },

        { id: 'r_vomit', isResult: true, resultText: '胃液喪失に伴う代謝性アルカローシス', resultDesc: 'H⁺とCl⁻の喪失によるものです。生理食塩水の投与（食塩反応性）が著効します。' },
        { id: 'r_diuretic', isResult: true, resultText: '利尿薬使用に伴う代謝性アルカローシス', resultDesc: '尿中へのCl⁻排泄増加と体液量減少による「収縮性アルカローシス」です。' },
        { id: 'r_salt_responsive', isResult: true, resultText: '食塩反応性アルカローシス', resultDesc: '脱水・Cl欠乏が主体です。生理食塩水による体液補充とCl補充で改善します。' },
        { id: 'r_aldo', isResult: true, resultText: '原発性アルドステロン症 / クッシング症候群', resultDesc: '食塩不応性です。アルドステロン過剰により遠位尿細管でのH⁺およびK⁺排泄が促進されています。' },
        { id: 'r_bartter', isResult: true, resultText: '食塩不応性アルカローシス (Bartter/Gitelman症候群等)', resultDesc: '利尿薬非使用下での低カリウム血症、正常血圧を伴う場合、これらの尿細管疾患を疑います。' }
    ],

    // ----------------------------------------------------------------
    // 呼吸性アシドーシス
    // 外傷性脳損傷（TBI）による呼吸中枢障害を最初に確認する
    // ----------------------------------------------------------------
    'RespAcidosis': [
        { id: 'q0', text: '🧠 頭部外傷（TBI）や脳卒中など、中枢神経障害の直後ですか？', yesNext: 'r_tbi', noNext: 'q1' },
        { id: 'q1', text: '🫁 COPD、肺気腫、喘息などの慢性閉塞性肺疾患や、著明な気道狭窄はありますか？', yesNext: 'r_copd', noNext: 'q2' },
        { id: 'q2', text: '💊 鎮静薬、オピオイド、睡眠薬などの過量内服や使用歴がありますか？', yesNext: 'r_drug', noNext: 'q3' },
        { id: 'q3', text: '🔬 神経筋疾患（ALS、GBS、重症筋無力症など）または進行する意識障害はありますか？', yesNext: 'r_neuro', noNext: 'r_unknown' },

        { id: 'r_tbi', isResult: true, resultText: '外傷性脳損傷（TBI）による換気不全・呼吸中枢障害', resultDesc: '頭部外傷により脳幹の呼吸中枢が障害され、換気量の低下（hypoventilation）とCO₂貯留が起きます。GCS評価・頭部CT確認と気道確保（必要に応じ挿管と調節換気）が最優先です。' },
        { id: 'r_copd', isResult: true, resultText: 'COPD増悪 / 呼吸器疾患による換気低下', resultDesc: '気道閉塞や肺胞低換気によるCO₂蓄積です。NPPV等の換気補助を検討します。' },
        { id: 'r_drug', isResult: true, resultText: '薬剤性呼吸抑制', resultDesc: '呼吸中枢の抑制による換気低下です。拮抗薬（ナロキソン、フルマゼニル等）や気道確保が必要です。' },
        { id: 'r_neuro', isResult: true, resultText: '中枢神経・神経筋疾患による換気不全', resultDesc: '呼吸筋力の低下や中枢性の呼吸障害です。進行する場合は人工呼吸管理が必要です。' },
        { id: 'r_unknown', isResult: true, resultText: 'その他の換気障害', resultDesc: '肺水腫、肥満低換気症候群、高度の胸郭異常などの可能性があります。' }
    ],

    // ----------------------------------------------------------------
    // 呼吸性アルカローシス（変更なし）
    // ----------------------------------------------------------------
    'RespAlkalosis': [
        { id: 'q1', text: '😨 精神的な動揺、激しい不安、疼痛に伴う明らかな過換気状態ですか？', yesNext: 'r_hvs', noNext: 'q2' },
        { id: 'q2', text: '🦠 発熱、頻脈などがあり、敗血症（SIRS）の初期兆候（または重症感染症）が疑われますか？', yesNext: 'r_sepsis', noNext: 'q3' },
        { id: 'q3', text: '📉 肺炎、肺塞栓症(PE)、心不全などによる「低酸素血症」が存在しますか？', yesNext: 'r_hypoxia', noNext: 'r_unknown' },

        { id: 'r_hvs', isResult: true, resultText: '過換気症候群 / 疼痛による頻呼吸', resultDesc: '精神的または身体的ストレスによるものです。基本は精神的安静や疼痛コントロールです。' },
        { id: 'r_sepsis', isResult: true, resultText: '敗血症の初期 (SIRS)', resultDesc: 'SIRSの初期では、代償性ではなく直接的な呼吸中枢刺激により過換気となることがあります。感染フォーカスの検索が必要です。' },
        { id: 'r_hypoxia', isResult: true, resultText: '低酸素血症誘発性の過換気', resultDesc: '肺塞栓や重症肺炎など、低酸素血症を改善させるための代償的な過換気です。酸素投与や原疾患治療が必要です。' },
        { id: 'r_unknown', isResult: true, resultText: 'その他の呼吸性アルカローシス', resultDesc: 'サリチル酸中毒の初期、肝不全、妊娠、中枢神経疾患などが考えられます。' }
    ],
};

// エンジン結果からウィザードツリーキーを決定する
// hiddenHagma がある場合も NAGMA ツリーに入るが、最初の外傷質問で適切に誘導される
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
    const nodes = treeKey ? WIZARD_TREES[treeKey] : [];

    // 回答履歴: { id, answer: 'yes' | 'no', text }
    const [history, setHistory] = useState<{ id: string, answer: 'yes' | 'no', text?: string }[]>([]);

    // 現在のノードは履歴から導出する
    const currentNode = useMemo(() => {
        if (!nodes || nodes.length === 0) return null;
        if (history.length === 0) return nodes[0];

        const lastAns = history[history.length - 1];
        const lastNode = nodes.find(n => n.id === lastAns.id);
        if (!lastNode) return null;

        const nextId = lastAns.answer === 'yes' ? lastNode.yesNext : lastNode.noNext;
        return nodes.find(n => n.id === nextId) || null;
    }, [nodes, history]);

    if (!treeKey || !currentNode) return null;

    const handleAnswer = (answer: 'yes' | 'no') => {
        setHistory(prev => [...prev, { id: currentNode.id, answer, text: currentNode.text }]);
    };

    const handleReset = () => {
        setHistory([]);
    };

    return (
        <div className="wizard-container">
            <div className="section-divider-title" style={{ marginTop: '2rem' }}>
                STEP 2: 原因疾患の特定 (対話型ウィザード)
            </div>

            {/* 回答履歴の表示 */}
            {history.length > 0 && (
                <div className="wizard-history">
                    {history.map((item, idx) => (
                        <div key={idx} className="wizard-history-item">
                            <div className="wizard-q">{item.text}</div>
                            <div className={`wizard-a ${item.answer}`}>{item.answer === 'yes' ? 'はい' : 'いいえ'}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* 現在の質問 or 結果カード */}
            <div className="wizard-card current">
                {currentNode.isResult ? (
                    <div className="wizard-result">
                        <div className="wizard-result-label">最も疑われる原因:</div>
                        <div className="wizard-result-title">{currentNode.resultText}</div>
                        <div className="wizard-result-desc">{currentNode.resultDesc}</div>
                        <button className="wizard-reset-btn" onClick={handleReset}>最初からやり直す</button>
                    </div>
                ) : (
                    <div className="wizard-question">
                        <div className="wizard-q-text">{currentNode.text}</div>
                        <div className="wizard-actions">
                            <button className="wizard-btn yes" onClick={() => handleAnswer('yes')}>はい</button>
                            <button className="wizard-btn no" onClick={() => handleAnswer('no')}>いいえ</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
