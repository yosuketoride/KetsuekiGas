import { useState, useCallback, useEffect } from 'react';
import type { BloodGasInput } from './types';
import BloodTypeScreen from './components/BloodTypeScreen';
import EvaluationScreen from './components/EvaluationScreen';
import PrivacyScreen from './components/PrivacyScreen';
import TermsScreen from './components/TermsScreen';
import AdBlock from './components/AdBlock';

type AppScreen = 'blood-type' | 'evaluation' | 'privacy' | 'terms';

export default function App() {
    const [screen, setScreen] = useState<AppScreen>('blood-type');
    const [bloodType, setBloodType] = useState<BloodGasInput['bloodType']>('arterial');
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Initial AdSense Script Injection
    useEffect(() => {
        const adSenseId = (import.meta as any).env.VITE_ADSENSE_ID;
        if (adSenseId && !document.getElementById('adsense-script')) {
            const script = document.createElement('script');
            script.id = 'adsense-script';
            script.async = true;
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseId}`;
            script.crossOrigin = 'anonymous';
            document.head.appendChild(script);
        }
    }, []);

    // Apply theme on mount and when it changes
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }, [isDarkMode]);

    // Handle routing based on pathname
    useEffect(() => {
        const handleLocationChange = () => {
            const path = window.location.pathname;
            if (path === '/privacy') {
                setScreen('privacy');
            } else if (path === '/terms') {
                setScreen('terms');
            } else {
                setScreen('blood-type');
            }
        };

        handleLocationChange();
        window.addEventListener('popstate', handleLocationChange);
        return () => window.removeEventListener('popstate', handleLocationChange);
    }, []);

    const navigateTo = (path: string, nextScreen: AppScreen) => {
        window.history.pushState({}, '', path);
        setScreen(nextScreen);
    };

    const handleSelectBloodType = useCallback((type: BloodGasInput['bloodType']) => {
        setBloodType(type);
        setScreen('evaluation');
    }, []);

    const handleReset = useCallback(() => {
        navigateTo('/', 'blood-type');
    }, []);

    return (
        <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <header className="app-header">
                <div className="app-header-icon">
                    <img src="/favicon.png" alt="App Icon" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                </div>
                <div>
                    <div className="app-title">血液ガスStep評価</div>
                    <div className="app-subtitle">
                        動脈血・静脈血 対応
                        <span style={{ marginLeft: '8px', fontSize: '0.8em', backgroundColor: '#3b82f6', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>v2.6.1</span>
                    </div>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            color: 'var(--text-primary)'
                        }}
                        title={isDarkMode ? "ライトモードに切り替え" : "ダークモードに切り替え"}
                    >
                        {isDarkMode ? '☀️' : '🌙'}
                    </button>

                    {(screen === 'evaluation' || screen === 'privacy' || screen === 'terms') && (
                        <button
                            className="header-back-btn"
                            onClick={handleReset}
                        >
                            ← トップ
                        </button>
                    )}
                </div>
            </header>

            <main style={{ flex: 1 }}>
                {screen === 'blood-type' && (
                    <>
                        <BloodTypeScreen onSelect={handleSelectBloodType} />
                        <AdBlock slot="home-bottom" />
                    </>
                )}
                {screen === 'evaluation' && (
                    <>
                        <EvaluationScreen
                            bloodType={bloodType}
                            onResetAll={handleReset}
                        />
                        <AdBlock slot="eval-bottom" />
                    </>
                )}
                {screen === 'privacy' && (
                    <PrivacyScreen onBack={handleReset} />
                )}
                {screen === 'terms' && (
                    <TermsScreen onBack={handleReset} />
                )}
            </main>

            <footer style={{ padding: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <a href="/terms" onClick={(e) => { e.preventDefault(); navigateTo('/terms', 'terms'); }} style={{ color: 'inherit', margin: '0 10px', textDecoration: 'underline' }}>利用規約</a>
                |
                <a href="/privacy" onClick={(e) => { e.preventDefault(); navigateTo('/privacy', 'privacy'); }} style={{ color: 'inherit', margin: '0 10px', textDecoration: 'underline' }}>プライバシーポリシー</a>
            </footer>
        </div>
    );
}
