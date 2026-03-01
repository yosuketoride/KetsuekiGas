import { useEffect } from 'react';

export default function AdBlock({ slot }: { slot?: string }) {
    const adSenseId = (import.meta as any).env.VITE_ADSENSE_ID;

    useEffect(() => {
        if (adSenseId) {
            try {
                // @ts-ignore
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                console.error("AdSense error", e);
            }
        }
    }, [adSenseId]);

    if (!adSenseId) {
        // 開発用・未設定時のプレースホルダー
        return (
            <div style={{ margin: '20px auto', width: '100%', maxWidth: '728px', padding: '20px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', textAlign: 'center', borderRadius: '8px', border: '1px dashed var(--border-color)', fontSize: '0.9rem' }}>
                広告スペース (VITE_ADSENSE_ID未設定)
            </div>
        );
    }

    return (
        <div style={{ margin: '20px auto', textAlign: 'center', overflow: 'hidden', minHeight: '90px' }}>
            <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client={adSenseId}
                data-ad-slot={slot || ""}
                data-ad-format="auto"
                data-full-width-responsive="true"></ins>
        </div>
    );
}
