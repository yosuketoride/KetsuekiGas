import type { BloodGasResult } from '../types';

interface Props {
    result: BloodGasResult;
}

export default function AcidBaseGrid({ result }: Props) {
    const { primaryDisorder } = result.step2;
    const { status: compStatus } = result.step3;
    const { pH } = result.correctedInput;

    // Determine active cells based on primary disorder and compensations
    const isAcidemia = pH < 7.35;
    const isAlkalemia = pH > 7.45;

    const hasMetabolicAcidosis = primaryDisorder.includes('metabolic_acidosis') || primaryDisorder === 'mixed_acidosis';
    const hasRespiratoryAcidosis = primaryDisorder.includes('respiratory_acidosis') || primaryDisorder === 'mixed_acidosis';
    const hasMetabolicAlkalosis = primaryDisorder.includes('metabolic_alkalosis') || primaryDisorder === 'mixed_alkalosis';
    const hasRespiratoryAlkalosis = primaryDisorder.includes('respiratory_alkalosis') || primaryDisorder === 'mixed_alkalosis';

    // Handle mixed from compensation
    const isMixedMetAcidosis = compStatus === 'inadequate_low' && hasRespiratoryAlkalosis;
    const isMixedRespAcidosis = (compStatus === 'inadequate_high' && hasMetabolicAcidosis) || (compStatus === 'inadequate_high' && hasMetabolicAlkalosis);

    // not common to say met alk here, usually inadequate_low with resp acidosis is just uncompensated, but let's cover it if needed
    const isMixedMetAlkalosis = (compStatus === 'inadequate_high' && hasRespiratoryAcidosis);
    const isMixedRespAlkalosis = (compStatus === 'inadequate_low' && hasMetabolicAcidosis);

    const renderCellContent = (label1: string, label2: string, isPrimary: boolean, isMixed: boolean, isAcid: boolean) => {
        if (!isPrimary && !isMixed) return <div style={{ color: 'var(--text-muted)' }}>{label1}<br />{label2}</div>;

        const color = isAcid ? '#f87171' : '#60a5fa';
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ color, fontWeight: 'bold' }}>{label1}<br />{label2}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {isPrimary && <span style={{ fontSize: '10px', padding: '2px 6px', background: color, color: '#fff', borderRadius: '4px', fontWeight: 'bold' }}>1次</span>}
                    {isMixed && <span style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--color-accent, #8b5cf6)', color: '#fff', borderRadius: '4px', fontWeight: 'bold' }}>合併</span>}
                </div>
            </div>
        );
    };

    // Dr. Kouno Grid Style (Refined with Primary/Mixed Badges)
    return (
        <div className="acid-base-grid-container" style={{ margin: '16px 0', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--text-muted)', backgroundColor: 'var(--bg-html)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>
                {/* Header Row */}
                <div style={{ padding: '12px 8px', borderBottom: '1px solid var(--text-muted)', borderRight: '1px solid var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    pH
                </div>
                <div style={{ padding: '12px 8px', borderBottom: '1px solid var(--text-muted)', borderRight: '1px solid var(--text-muted)', color: '#ef4444', backgroundColor: isAcidemia ? 'rgba(239, 68, 68, 0.15)' : 'transparent' }}>
                    低下:アシデミア<br />
                    <span style={{ fontSize: '11px', fontWeight: 'normal' }}>低下病態:アシドーシス</span>
                </div>
                <div style={{ padding: '12px 8px', borderBottom: '1px solid var(--text-muted)', color: '#3b82f6', backgroundColor: isAlkalemia ? 'rgba(59, 130, 246, 0.15)' : 'transparent' }}>
                    上昇:アルカレミア<br />
                    <span style={{ fontSize: '11px', fontWeight: 'normal' }}>上昇病態:アルカローシス</span>
                </div>

                {/* Metabolic Row */}
                <div style={{ padding: '16px 8px', borderBottom: '1px solid var(--text-muted)', borderRight: '1px solid var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    <span>HCO₃⁻</span>
                    <span style={{ fontSize: '11px', fontWeight: 'normal' }}>代謝性</span>
                </div>
                <div style={{ padding: '16px 8px', borderBottom: '1px solid var(--text-muted)', borderRight: '1px solid var(--text-muted)', backgroundColor: (hasMetabolicAcidosis || isMixedMetAcidosis) ? 'rgba(239, 68, 68, 0.15)' : 'transparent', transition: 'background 0.3s' }}>
                    {renderCellContent('代謝性', 'アシドーシス', hasMetabolicAcidosis, isMixedMetAcidosis, true)}
                </div>
                <div style={{ padding: '16px 8px', borderBottom: '1px solid var(--text-muted)', backgroundColor: (hasMetabolicAlkalosis || isMixedMetAlkalosis) ? 'rgba(59, 130, 246, 0.15)' : 'transparent', transition: 'background 0.3s' }}>
                    {renderCellContent('代謝性', 'アルカローシス', hasMetabolicAlkalosis, isMixedMetAlkalosis, false)}
                </div>

                {/* Respiratory Row */}
                <div style={{ padding: '16px 8px', borderRight: '1px solid var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    <span>PaCO₂</span>
                    <span style={{ fontSize: '11px', fontWeight: 'normal' }}>呼吸性</span>
                </div>
                <div style={{ padding: '16px 8px', borderRight: '1px solid var(--text-muted)', backgroundColor: (hasRespiratoryAcidosis || isMixedRespAcidosis) ? 'rgba(239, 68, 68, 0.15)' : 'transparent', transition: 'background 0.3s' }}>
                    {renderCellContent('呼吸性', 'アシドーシス', hasRespiratoryAcidosis, isMixedRespAcidosis, true)}
                </div>
                <div style={{ padding: '16px 8px', backgroundColor: (hasRespiratoryAlkalosis || isMixedRespAlkalosis) ? 'rgba(59, 130, 246, 0.15)' : 'transparent', transition: 'background 0.3s' }}>
                    {renderCellContent('呼吸性', 'アルカローシス', hasRespiratoryAlkalosis, isMixedRespAlkalosis, false)}
                </div>
            </div>
            {/* Mixed / Combined interpretation subtitle */}
            <div style={{ padding: '8px 12px', fontSize: '12px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', textAlign: 'center' }}>
                診断サマリー: <strong style={{ color: 'var(--color-accent)' }}>{result.step2.label}</strong>
                {compStatus !== 'adequate' && compStatus !== 'na' && ' (複合性・代償異常あり)'}
            </div>
        </div>
    );
}
