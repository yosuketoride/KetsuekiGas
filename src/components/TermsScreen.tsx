import { useState } from 'react';

export default function TermsScreen({ onBack }: { onBack: () => void }) {
    const [lang, setLang] = useState<'ja' | 'en'>('ja');

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={onBack} className="header-back-btn" style={{ fontSize: '1rem', padding: '8px 12px' }}>
                    ← 戻る / Back
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setLang('ja')} style={{ fontWeight: lang === 'ja' ? 'bold' : 'normal', background: 'none', border: lang === 'ja' ? '1px solid currentColor' : 'none', padding: '4px 8px', borderRadius: '4px', color: 'inherit' }}>日本語</button>
                    <button onClick={() => setLang('en')} style={{ fontWeight: lang === 'en' ? 'bold' : 'normal', background: 'none', border: lang === 'en' ? '1px solid currentColor' : 'none', padding: '4px 8px', borderRadius: '4px', color: 'inherit' }}>English</button>
                </div>
            </div>

            {lang === 'ja' ? (
                <>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>利用規約 (Terms of Use)</h1>
                    <p>制定日: 2026年3月1日</p>

                    <h2 style={{ fontSize: '1.2rem', marginTop: '24px', marginBottom: '8px', color: '#ef4444' }}>⚠️ 医療免責事項 (Medical Disclaimer)</h2>
                    <p style={{ fontWeight: 'bold' }}>本アプリケーションは学習・教育目的でのみ提供されています。</p>
                    <p>本アプリケーションが提供する評価、解釈、鑑別リスト等は、あくまで一般的なアルゴリズムと参考値に基づくものであり、<strong>実際の患者に対する臨床的な診断や治療方針の決定（臨床判断）に使用しないでください。</strong></p>
                    <p>常に臨床現場での総合的な判断、追加検査、専門医へのコンサルテーションを優先してください。本アプリケーションの利用によって生じたいかなる損害・不利益についても、開発者は一切の責任を負いません。</p>

                    <h2 style={{ fontSize: '1.2rem', marginTop: '24px', marginBottom: '8px' }}>1. サービスの利用</h2>
                    <p>本アプリケーションは、無料でご利用いただけます。ただし、通信にかかる費用はユーザーのご負担となります。</p>

                    <h2 style={{ fontSize: '1.2rem', marginTop: '24px', marginBottom: '8px' }}>2. 禁止事項</h2>
                    <p>本アプリケーションのプログラムやデータを不正に解析、改変、または再配布する行為を禁じます。</p>

                    <h2 style={{ fontSize: '1.2rem', marginTop: '24px', marginBottom: '8px' }}>3. 規約の変更</h2>
                    <p>当社は必要と判断した場合、ユーザーに通知することなく本規約を変更できるものとします。</p>
                </>
            ) : (
                <>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Terms of Use</h1>
                    <p>Effective Date: March 1, 2026</p>

                    <h2 style={{ fontSize: '1.2rem', marginTop: '24px', marginBottom: '8px', color: '#ef4444' }}>⚠️ Medical Disclaimer</h2>
                    <p style={{ fontWeight: 'bold' }}>This application is provided strictly for educational and learning purposes only.</p>
                    <p>The evaluations, interpretations, and differential lists provided by this application are based on general algorithms and reference values. <strong>Do NOT use this application for actual clinical diagnosis or medical decision-making.</strong></p>
                    <p>Always prioritize comprehensive clinical judgment, additional testing, and expert consultation in real-world settings. The developer assumes no responsibility or liability for any damages or adverse outcomes resulting from the use of this application.</p>

                    <h2 style={{ fontSize: '1.2rem', marginTop: '24px', marginBottom: '8px' }}>1. Use of Service</h2>
                    <p>This application is free to use. However, you are responsible for any data/internet connection costs incurred.</p>

                    <h2 style={{ fontSize: '1.2rem', marginTop: '24px', marginBottom: '8px' }}>2. Prohibited Actions</h2>
                    <p>Unauthorized analysis, modification, or redistribution of this application's code and data is strictly prohibited.</p>

                    <h2 style={{ fontSize: '1.2rem', marginTop: '24px', marginBottom: '8px' }}>3. Changes to Terms</h2>
                    <p>We reserve the right to modify these terms at any time without prior notice.</p>
                </>
            )}
        </div>
    );
}
