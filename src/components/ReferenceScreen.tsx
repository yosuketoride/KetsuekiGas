export default function ReferenceScreen({ onBack }: { onBack: () => void }) {
    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={onBack} className="header-back-btn" style={{ fontSize: '1rem', padding: '8px 12px' }}>
                    ← 戻る / Back
                </button>
            </div>

            <h1 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>📚 参考文献・引用元 (References & Citations)</h1>
            <p style={{ marginBottom: '24px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                本アプリケーションの計算アルゴリズムおよび鑑別リストは、以下の標準的な医学書および集中治療ガイドラインに基づき設計されています。（v2.6.3基準）
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '8px', color: '#60a5fa' }}>1. 全体フロー・鑑別アルゴリズム基盤</h2>
                    <p style={{ margin: 0, lineHeight: 1.5 }}>
                        山川一馬 著『レジデントのための血液ガスハンター』（中外医学社）などの国内標準的な臨床・救急マニュアル。<br/>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>※アニオンギャップのAlb補正や、NAGMAのU-AG/U-OG/尿pHを用いた鑑別フローのベースとしています。</span>
                    </p>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '8px', color: '#60a5fa' }}>2. 代謝性アシドーシスの呼吸性代償（Winter's 式）</h2>
                    <p style={{ margin: 0, lineHeight: 1.5 }}>
                        Albert MS, Dell RB, Winters RW. <i>Quantitative displacement of acid-base equilibrium in metabolic acidosis.</i> Ann Intern Med. 1967;66(2):312-322.
                    </p>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '8px', color: '#60a5fa' }}>3. 隠れた混合性障害の評価（Delta Ratio / Δ比）</h2>
                    <p style={{ margin: 0, lineHeight: 1.5 }}>
                        Wrenn K. <i>The delta (delta) gap: an approach to mixed acid-base disorders.</i> Ann Emerg Med. 1990;19(11):1310-1313.<br/>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>※補正HCO3およびΔ比のカットオフ（&lt;0.4, 0.4-1.0, 1.0-2.0, &gt;2.0）の標準的な評価基準。</span>
                    </p>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '8px', color: '#60a5fa' }}>4. 隠れHAGMAと乳酸（Lactate）の評価</h2>
                    <p style={{ margin: 0, lineHeight: 1.5 }}>
                        <i>Surviving Sepsis Campaign Guidelines</i> 等に基づく、敗血症性ショック・循環不全における乳酸値（Lac ≥ 2.0 mmol/L）のクライテリア。<br/>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>※本アプリでは正常上限境界での誤発動を避けるためLac≧2.5を隠れHAGMA警告フラグとしています。</span>
                    </p>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '8px', color: '#60a5fa' }}>5. 尿浸透圧ギャップ（U-OG）のカットオフ</h2>
                    <p style={{ margin: 0, lineHeight: 1.5 }}>
                        集中治療・腎臓内科領域におけるNAGMA鑑別指標（UAGの限界とUOGへの移行、閾値150 mOsm/kg等）に関する最新のリファレンスやUpToDateの知見。
                    </p>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '8px', color: '#60a5fa' }}>6. VBG（静脈血ガス）の限界と動脈血（ABG）との解離</h2>
                    <p style={{ margin: 0, lineHeight: 1.5 }}>
                        循環不全・ショック状態における静脈血と動脈血のpH・pCO2解離、および酸素化評価（P/F比等）におけるVBGの不適合性に関する集中治療医学のコンセンサス。
                    </p>
                </div>
            </div>
            
            <div style={{ marginTop: '30px', padding: '15px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', borderRadius: '4px' }}>
                <p style={{ margin: 0, color: '#ef4444', fontWeight: 'bold' }}>⚠️ Not for Clinical Use (臨床判断に使用しないでください)</p>
                <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    これらの文献や計算式は教育および学習の補助を目的として提供されています。臨床における最終的な診断や治療方針の決定は、必ず医師等の専門的な知見と患者の個別状況に基づいて行ってください。
                </p>
            </div>
        </div>
    );
}
