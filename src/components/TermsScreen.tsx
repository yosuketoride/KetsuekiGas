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

                    <h2 style={{ fontSize: '1.2rem', marginTop: '24px', marginBottom: '8px', color: '#ef4444' }}>⚠️ 医療免責事項 (Medical Disclaimer) - Not for Clinical Use</h2>
                    <p style={{ fontWeight: 'bold', color: '#ef4444' }}>本アプリケーションは医療機器（プログラム医療機器）ではありません。医療従事者および学生の皆様への教育・トレーニング・学習を目的として提供されている参照ツールです。</p>
                    <p>本アプリケーションが提示する評価、解釈、および鑑別リストは、診断を確定するものではありません。実際の診療現場においては、本ツールの結果のみに依存せず、医師や医療従事者の皆様ご自身の専門的な知見、患者の個別状況、追加検査の結果等を総合して、<b>必ずご自身の責任のもとで最終的な臨床判断を行っていただきますようお願いいたします。</b></p>
                    <p>本アプリケーションの利用により生じたいかなる損害や不利益（診断の誤り、治療の遅れ等を含む）についても、開発者は一切の責任を負いかねますので、あらかじめご了承ください。</p>

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

                    <h2 style={{ fontSize: '1.2rem', marginTop: '24px', marginBottom: '8px', color: '#ef4444' }}>⚠️ Medical Disclaimer - Not for Clinical Use</h2>
                    <p style={{ fontWeight: 'bold', color: '#ef4444' }}>This application is NOT a medical device. It was developed strictly as a reference tool for educational, training, and learning purposes for healthcare professionals and students.</p>
                    <p>The evaluations, interpretations, and differential lists provided by this application do not constitute a definitive medical diagnosis. In actual clinical practice, please do not rely solely on the results of this tool. Healthcare professionals must make their own final clinical decisions by integrating their expert judgment, the individual circumstances of the patient, and the results of further clinical assessments.</p>
                    <p>Please note that the developer shall not be held liable for any damages, adverse outcomes, or clinical errors arising from the use of this application.</p>

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
