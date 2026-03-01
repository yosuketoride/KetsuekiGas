import type { BloodGasResult } from '../types';

interface Props {
    result: BloodGasResult;
}

export default function NomogramMap({ result }: Props) {
    const { pH, hco3 } = result.correctedInput;

    // SVG Drawing Box settings
    const width = 450;
    const height = 350;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Axis bounds
    // x: pH 7.00 to 7.80
    // y: HCO3 0 to 60
    const xMin = 7.00;
    const xMax = 7.80;
    const yMin = 0;
    const yMax = 60;

    // Coordinate mapping functions
    const xScale = (p: number) => {
        const clamped = Math.max(xMin, Math.min(xMax, p));
        return ((clamped - xMin) / (xMax - xMin)) * innerWidth;
    };

    const yScale = (h: number) => {
        const clamped = Math.max(yMin, Math.min(yMax, h));
        // Y-axis is inverted in SVG (0 is top)
        return innerHeight - ((clamped - yMin) / (yMax - yMin)) * innerHeight;
    };

    // Patient Point
    const px = xScale(pH);
    const py = yScale(hco3);

    return (
        <div className="nomogram-container">
            <div className="section-divider-title">酸塩基平衡ノモグラム表示</div>

            <div className="svg-wrapper" style={{ position: 'relative', width: '100%', maxWidth: '100%', aspectRatio: '450/350', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '10px' }}>
                <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>

                    <g transform={`translate(${margin.left},${margin.top})`}>
                        {/* Background Zones */}

                        {/* 代謝性アシドーシス (Metabolic Acidosis) */}
                        <path d={`M ${xScale(7.36)} ${yScale(22)} C ${xScale(7.20)} ${yScale(12)} ${xScale(7.10)} ${yScale(6)} ${xScale(7.00)} ${yScale(4)} L ${xScale(7.00)} ${yScale(1.5)} C ${xScale(7.20)} ${yScale(5)} ${xScale(7.30)} ${yScale(10)} ${xScale(7.42)} ${yScale(20)} Z`} fill="rgba(239, 68, 68, 0.15)" stroke="rgba(239, 68, 68, 0.5)" strokeWidth="1" />

                        {/* 急性呼吸性アシドーシス (Acute Resp Acidosis) */}
                        <path d={`M ${xScale(7.38)} ${yScale(25.5)} L ${xScale(7.15)} ${yScale(28)} L ${xScale(7.05)} ${yScale(28.5)} L ${xScale(7.05)} ${yScale(25)} L ${xScale(7.20)} ${yScale(24.5)} L ${xScale(7.38)} ${yScale(23.5)} Z`} fill="rgba(168, 85, 247, 0.2)" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="1" />

                        {/* 慢性呼吸性アシドーシス (Chronic Resp Acidosis) */}
                        <path d={`M ${xScale(7.41)} ${yScale(26.5)} L ${xScale(7.30)} ${yScale(40)} L ${xScale(7.20)} ${yScale(49)} L ${xScale(7.10)} ${yScale(47)} L ${xScale(7.20)} ${yScale(36)} L ${xScale(7.38)} ${yScale(24.5)} Z`} fill="rgba(168, 85, 247, 0.4)" stroke="rgba(168, 85, 247, 0.6)" strokeWidth="1" />

                        {/* 代謝性アルカローシス (Metabolic Alkalosis) */}
                        <path d={`M ${xScale(7.44)} ${yScale(26)} C ${xScale(7.50)} ${yScale(36)} ${xScale(7.55)} ${yScale(46)} ${xScale(7.62)} ${yScale(60)} L ${xScale(7.76)} ${yScale(60)} C ${xScale(7.62)} ${yScale(44)} ${xScale(7.55)} ${yScale(34)} ${xScale(7.46)} ${yScale(24)} Z`} fill="rgba(56, 189, 248, 0.2)" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="1" />

                        {/* 急性呼吸性アルカローシス (Acute Resp Alkalosis) */}
                        <path d={`M ${xScale(7.42)} ${yScale(22.5)} L ${xScale(7.60)} ${yScale(18.5)} L ${xScale(7.80)} ${yScale(16)} L ${xScale(7.80)} ${yScale(20)} L ${xScale(7.60)} ${yScale(20.5)} L ${xScale(7.40)} ${yScale(24)} Z`} fill="rgba(34, 197, 94, 0.15)" stroke="rgba(34, 197, 94, 0.4)" strokeWidth="1" />

                        {/* 慢性呼吸性アルカローシス (Chronic Resp Alkalosis) */}
                        <path d={`M ${xScale(7.39)} ${yScale(21)} L ${xScale(7.55)} ${yScale(12)} L ${xScale(7.70)} ${yScale(8)} L ${xScale(7.80)} ${yScale(8)} L ${xScale(7.80)} ${yScale(13)} L ${xScale(7.60)} ${yScale(16)} L ${xScale(7.42)} ${yScale(23.5)} Z`} fill="rgba(34, 197, 94, 0.35)" stroke="rgba(34, 197, 94, 0.6)" strokeWidth="1" />

                        {/* 正常範囲 (Normal) */}
                        <ellipse cx={xScale(7.40)} cy={yScale(24)} rx={xScale(7.44) - xScale(7.40)} ry={yScale(22) - yScale(24)} fill="rgba(250, 204, 21, 0.4)" stroke="rgba(250, 204, 21, 0.9)" strokeWidth="1.5" />

                        {/* Grid Lines */}
                        <line x1={0} y1={yScale(24)} x2={innerWidth} y2={yScale(24)} stroke="var(--text-muted)" strokeDasharray="3,3" opacity="0.3" />
                        <line x1={xScale(7.40)} y1={0} x2={xScale(7.40)} y2={innerHeight} stroke="var(--text-muted)" strokeDasharray="3,3" opacity="0.3" />

                        {/* Axes */}
                        <line x1={0} y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="var(--text-secondary)" strokeWidth="1.5" />
                        <line x1={0} y1={0} x2={0} y2={innerHeight} stroke="var(--text-secondary)" strokeWidth="1.5" />

                        {/* X-Axis Ticks & Labels */}
                        {[7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8].map((tick) => (
                            <g key={`x-${tick}`} transform={`translate(${xScale(tick)}, ${innerHeight})`}>
                                <line y2="5" stroke="var(--text-secondary)" />
                                <text y="15" textAnchor="middle" fontSize="10" fill="var(--text-secondary)">{tick.toFixed(2)}</text>
                            </g>
                        ))}
                        <text x={innerWidth / 2} y={innerHeight + 30} textAnchor="middle" fontSize="12" fill="var(--text-secondary)" fontWeight="bold">動脈血 pH</text>

                        {/* Y-Axis Ticks & Labels */}
                        {[0, 10, 20, 30, 40, 50, 60].map((tick) => (
                            <g key={`y-${tick}`} transform={`translate(0, ${yScale(tick)})`}>
                                <line x1="-5" stroke="var(--text-secondary)" />
                                <text x="-8" y="4" textAnchor="end" fontSize="10" fill="var(--text-secondary)">{tick}</text>
                            </g>
                        ))}
                        <text x="-35" y={innerHeight / 2} textAnchor="middle" transform={`rotate(-90, -35, ${innerHeight / 2})`} fontSize="12" fill="var(--text-secondary)" fontWeight="bold">
                            HCO₃⁻ (mEq/L)
                        </text>

                        {/* PaCO2 Isobars */}
                        {[20, 30, 40, 50, 60, 70, 80].map(pco2 => {
                            let d = '';
                            let labelX = 0;
                            let labelY = 0;
                            let lastHco3 = 0;
                            for (let phStep = 7.0; phStep <= 7.8; phStep += 0.05) {
                                const hco3Val = 0.03 * pco2 * Math.pow(10, phStep - 6.1);
                                if (hco3Val <= 60 && hco3Val >= 0) {
                                    const x = xScale(phStep);
                                    const y = yScale(hco3Val);
                                    d += (d === '' ? `M ${x} ${y} ` : `L ${x} ${y} `);
                                    labelX = x;
                                    labelY = y;
                                    lastHco3 = hco3Val;
                                }
                            }
                            return (
                                <g key={`pco2-isobar-${pco2}`}>
                                    <path d={d} fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
                                    {/* Place label near the top edge or right edge */}
                                    {lastHco3 > 5 && (
                                        <text x={labelX} y={labelY - 5} fill="var(--text-muted)" fontSize="9" opacity="0.6">{pco2}</text>
                                    )}
                                </g>
                            )
                        })}

                        {/* Zone Labels */}
                        <g style={{ paintOrder: 'stroke fill', stroke: 'var(--bg-card)', strokeWidth: '3px', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                            <text x={xScale(7.15)} y={yScale(8)} fill="rgba(239, 68, 68, 0.9)" fontSize="10" fontWeight="bold" transform={`rotate(10, ${xScale(7.15)}, ${yScale(8)})`}>代謝性アシドーシス</text>
                            <text x={xScale(7.53)} y={yScale(47)} fill="rgba(14, 165, 233, 0.9)" fontSize="10" fontWeight="bold" transform={`rotate(-72, ${xScale(7.53)}, ${yScale(47)})`}>代謝性アルカローシス</text>

                            <text x={xScale(7.18)} y={yScale(42)} fill="rgb(147, 51, 234)" fontSize="9.5" fontWeight="bold" transform={`rotate(-56, ${xScale(7.18)}, ${yScale(42)})`}>慢性呼吸性アシドーシス</text>
                            <text x={xScale(7.14)} y={yScale(26)} fill="rgb(168, 85, 247)" fontSize="9" fontWeight="bold" transform={`rotate(4, ${xScale(7.14)}, ${yScale(26)})`}>急性呼吸性アシドーシス</text>

                            <text x={xScale(7.70)} y={yScale(8.5)} fill="rgb(22, 163, 74)" fontSize="8.5" fontWeight="bold" transform={`rotate(-35, ${xScale(7.70)}, ${yScale(8.5)})`}>慢性呼吸性アルカローシス</text>
                            <text x={xScale(7.33)} y={yScale(18)} fill="rgb(34, 197, 94)" fontSize="8.5" fontWeight="bold" transform={`rotate(-13, ${xScale(7.33)}, ${yScale(18)})`}>急性呼吸性アルカローシス</text>
                        </g>

                        {/* Plotted Patient Data Point (Blinking Dot) */}
                        <circle cx={px} cy={py} r="5" fill="var(--color-primary)" opacity="0.6">
                            <animate attributeName="r" values="5; 14; 5" dur="1.5s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.8; 0; 0.8" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                        {/* Static Center Core */}
                        <circle cx={px} cy={py} r="4" fill="var(--color-primary)" />
                        <circle cx={px} cy={py} r="2" fill="white" />

                        {/* Tooltip coordinates */}
                        <g transform={`translate(${px > innerWidth / 2 ? px - 70 : px + 10}, ${py < 30 ? py + 20 : py - 10})`}>
                            <rect width="65" height="15" rx="3" fill="var(--bg-body)" opacity="0.8" />
                            <text x="32.5" y="11" textAnchor="middle" fontSize="9" fill="var(--text-primary)" fontWeight="bold">
                                {pH.toFixed(2)}, {hco3.toFixed(1)}
                            </text>
                        </g>

                    </g>
                </svg>
            </div>

            <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <strong>※ 点滅している青い丸</strong> が現在入力されている患者のデータ点（現在地）です。<br />
                図: ヘンダーソン・ハッセルバルヒの酸塩基平衡ノモグラム。各ゾーンに色付けしています。
            </div>

            <div style={{
                marginTop: '12px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '8px',
                fontSize: '11px',
                color: 'var(--text-secondary)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(239, 68, 68, 0.4)', borderRadius: '2px' }}></div>
                    <span>代謝性アシドーシス</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.5)', borderRadius: '2px' }}></div>
                    <span>急性呼吸性アシドーシス</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(168, 85, 247, 0.4)', border: '1px solid rgba(168, 85, 247, 0.6)', borderRadius: '2px' }}></div>
                    <span>慢性呼吸性アシドーシス</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.5)', borderRadius: '2px' }}></div>
                    <span>代謝性アルカローシス</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: '2px' }}></div>
                    <span>急性呼吸性アルカローシス</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(34, 197, 94, 0.35)', border: '1px solid rgba(34, 197, 94, 0.6)', borderRadius: '2px' }}></div>
                    <span>慢性呼吸性アルカローシス</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(250, 204, 21, 0.4)', borderRadius: '2px' }}></div>
                    <span>正常範囲 (Normal)</span>
                </div>
            </div>
        </div>
    );
}
