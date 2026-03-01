import { useState } from 'react';

interface Props {
    onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
    const [step, setStep] = useState(0);

    const slides = [
        {
            title: "直感的にわかる酸塩基平衡",
            description: "血ガスハンターは、複雑な血液ガス分析を\n誰でも簡単に、視覚的に評価できるアプリです。",
            icon: "🩸"
        },
        {
            title: "隠れHAGMAも見逃さない",
            description: "代謝性アルカローシス合併時など、\n見逃しやすいアニオンギャップの開大も\n自動で計算・警告します。",
            icon: "🔍"
        },
        {
            title: "動脈・静脈の両方に対応",
            description: "静脈血(VBG)の入力でも、\n動脈血相当に自動補正して評価が可能です。",
            icon: "⚖️"
        },
        {
            title: "⚠️ ご利用上の注意",
            description: "本アプリは教育・学習を目的とした\n医療補助ツールです。\n\n実際の患者の確定診断や治療方針の決定には\n使用せず、現場での総合的な臨床判断を\n常に優先してください。",
            icon: "🏥"
        }
    ];

    const handleNext = () => {
        if (step < slides.length - 1) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '24px',
            backgroundColor: 'var(--bg-card)',
            textAlign: 'center'
        }}>
            <div style={{ fontSize: '4rem', marginBottom: '24px' }}>
                {slides[step].icon}
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary)' }}>
                {slides[step].title}
            </h2>

            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '40px', whiteSpace: 'pre-wrap' }}>
                {slides[step].description}
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
                {slides.map((_, idx) => (
                    <div key={idx} style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        backgroundColor: idx === step ? '#3b82f6' : 'var(--border-color)',
                        transition: 'background-color 0.3s'
                    }} />
                ))}
            </div>

            <button
                onClick={handleNext}
                style={{
                    backgroundColor: '#3b82f6', // force exact primary blue to ensure contrast
                    color: '#ffffff', // exact white
                    padding: '16px 32px',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    border: 'none',
                    width: '100%',
                    maxWidth: '300px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
            >
                {step < slides.length - 1 ? '次へ' : 'はじめる'}
            </button>
        </div>
    );
}
