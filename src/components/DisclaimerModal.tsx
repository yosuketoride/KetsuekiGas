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
                        本アプリは<strong>医療従事者向けの参考ツール</strong>です。血液ガス分析の学習・補助を目的として設計されています。
                    </p>
                    <p style={{ margin: '0 0 0.75rem' }}>
                        ⚠️ 診断・治療方針の最終決定は、必ず担当医師が臨床情報を総合して判断してください。本アプリの結果のみに基づく臨床判断は行わないでください。
                    </p>
                    <p style={{ margin: 0 }}>
                        本アプリの使用により生じたいかなる損害についても、開発者は責任を負いません。
                    </p>
                </div>

                <button
                    onClick={onAgree}
                    style={{
                        width: '100%',
                        padding: '0.875rem',
                        background: 'linear-gradient(135deg, #1565c0, #1976d2)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        letterSpacing: '0.02em',
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
