import { useState } from 'react';

export default function PrivacyScreen({ onBack }: { onBack: () => void }) {
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
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>プライバシーポリシー (Privacy Policy)</h1>
                    <p>制定日: 2026年3月1日</p>

                    <h2 style={{ fontSize: '1.2rem', marginTop: '24px', marginBottom: '8px' }}>1. 収集するデータについて</h2>
                    <p>本アプリケーション「血液ガスStep評価」は、ユーザーの個人情報や入力された検査値をサーバーに送信・保存することは一切ありません。すべての計算および評価は、お客様のブラウザ（端末）上でローカルに処理されます。</p>

                    <h2 style={{ fontSize: '1.2rem', marginTop: '24px', marginBottom: '8px' }}>2. アクセス解析・広告について</h2>
                    <p>本アプリケーションでは、サービス向上のためのアクセス解析（Google Analytics等）や広告配信（Google AdSense等）を利用する場合があります。これにより、Cookie等の技術を用いて匿名のトラフィックデータが収集されることがありますが、これによって個人を特定することはありません。</p>

                    <h2 style={{ fontSize: '1.2rem', marginTop: '24px', marginBottom: '8px' }}>3. プライバシーポリシーの変更</h2>
                    <p>本ポリシーの内容は、事前の通知なく変更される場合があります。変更後のプライバシーポリシーは、本ページに掲載された時点で効力を生じるものとします。</p>
                </>
            ) : (
                <>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Privacy Policy</h1>
                    <p>Effective Date: March 1, 2026</p>

                    <h2 style={{ fontSize: '1.2rem', marginTop: '24px', marginBottom: '8px' }}>1. Data Collection</h2>
                    <p>This application ("Blood Gas Step Evaluation") does not transmit or store any personal information or entered laboratory values on our servers. All calculations and evaluations are processed locally on your browser/device.</p>

                    <h2 style={{ fontSize: '1.2rem', marginTop: '24px', marginBottom: '8px' }}>2. Analytics and Advertising</h2>
                    <p>This application may use analytics services (such as Google Analytics) and advertising services (such as Google AdSense) to improve our service. These services may use cookies and similar technologies to collect anonymous traffic data, which does not personally identify you.</p>

                    <h2 style={{ fontSize: '1.2rem', marginTop: '24px', marginBottom: '8px' }}>3. Changes to this Policy</h2>
                    <p>We may update this Privacy Policy from time to time without prior notice. Any changes will become effective immediately upon posting on this page.</p>
                </>
            )}
        </div>
    );
}
