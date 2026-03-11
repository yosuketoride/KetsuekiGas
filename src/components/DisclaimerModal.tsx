import { useState, useEffect } from 'react';

const DISCLAIMER_KEY = 'ketsueki_disclaimer_agreed';

export function useDisclaimer() {
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    useEffect(() => {
        const agreed = localStorage.getItem(DISCLAIMER_KEY);
        if (!agreed) {
            setShowDisclaimer(true);
        }
    }, []);

    const agree = () => {
        localStorage.setItem(DISCLAIMER_KEY, 'true');
        setShowDisclaimer(false);
    };

    return { showDisclaimer, agree };
}

interface DisclaimerModalProps {
    onAgree: () => void;
}

export default function DisclaimerModal({ onAgree }: DisclaimerModalProps) {
    const [checked, setChecked] = useState(false);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
        }}>
            <div style={{
                background: '#1a1f2e',
                border: '1px solid #2d3748',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '420px',
                width: '100%',
                color: '#e8eaf6',
            }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🩺</div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#90caf9', margin: 0 }}>
                        ご利用前にご確認ください
                    </h2>
                </div>

                <div style={{
                    background: 'rgba(255,160,0,0.1)',
                    border: '1px solid rgba(255,160,0,0.3)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    fontSize: '0.85rem',
                    lineHeight: 1.7,
                    color: '#e8eaf6',
                }}>
                    <p style={{ margin: '0 0 0.75rem' }}>
                        本アプリは<strong>医療従事者向けの教育・学習ツール</strong>です。血液ガス分析の学習・補助を目的として設計されています。
                    </p>
                    <p style={{ margin: '0 0 0.75rem' }}>
                        ⚠️ <strong>Not for Clinical Use (臨床判断に使用不可)</strong>: 本アプリが提示する内容は参考情報であり、実際の診療現場における診断・治療方針の最終決定には使用しないでください。必ず担当医師が臨床情報を総合して判断してください。
                    </p>
                    <p style={{ margin: 0 }}>
                        本アプリの使用により生じたいかなる損害についても、開発者は責任を負いません。
                    </p>
                </div>

                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <input 
                        type="checkbox" 
                        id="disclaimer-check" 
                        checked={checked}
                        onChange={(e) => setChecked(e.target.checked)}
                        style={{ marginTop: '4px', cursor: 'pointer', width: '18px', height: '18px' }}
                    />
                    <label htmlFor="disclaimer-check" style={{ fontSize: '0.85rem', cursor: 'pointer', lineHeight: 1.5 }}>
                        本アプリが臨床診断用ではなく教育ツールであることを理解し、診断結果の最終判断は医師が総合的に行うことに同意します。
                    </label>
                </div>

                <button
                    disabled={!checked}
                    onClick={onAgree}
                    style={{
                        width: '100%',
                        padding: '0.875rem',
                        background: checked ? 'linear-gradient(135deg, #1565c0, #1976d2)' : '#374151',
                        color: checked ? '#fff' : '#9ca3af',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        cursor: checked ? 'pointer' : 'not-allowed',
                        letterSpacing: '0.02em',
                        transition: 'all 0.2s',
                    }}
                >
                    同意して始める
                </button>

                <p style={{
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    color: '#64748b',
                    marginTop: '0.75rem',
                    marginBottom: 0,
                }}>
                    次回以降は表示されません
                </p>
            </div>
        </div>
    );
}
