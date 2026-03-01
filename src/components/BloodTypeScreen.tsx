
import type { BloodGasInput } from '../types';

interface Props {
    onSelect: (type: BloodGasInput['bloodType']) => void;
}

export default function BloodTypeScreen({ onSelect }: Props) {
    return (
        <div className="blood-type-screen">
            <div>
                <div className="screen-lead">血液の種類を選択</div>
                <div className="screen-desc">
                    まず採血した血液の種類を選んでください。
                </div>
            </div>

            <div className="blood-type-cards">
                <button
                    className="blood-type-card arterial"
                    onClick={() => onSelect('arterial')}
                >
                    <div className="blood-type-icon">🔴</div>
                    <div className="blood-type-info">
                        <div className="blood-type-abbr">ABG — Arterial Blood Gas</div>
                        <div className="blood-type-name">動脈血ガス</div>
                        <div className="blood-type-desc">
                            pH / PaCO₂ / HCO₃⁻ など全ての項目を評価できます。
                        </div>
                    </div>
                    <div className="blood-type-arrow">›</div>
                </button>

                <button
                    className="blood-type-card venous"
                    onClick={() => onSelect('venous')}
                >
                    <div className="blood-type-icon">🔵</div>
                    <div className="blood-type-info">
                        <div className="blood-type-abbr">VBG — Venous Blood Gas</div>
                        <div className="blood-type-name">静脈血ガス</div>
                        <div className="blood-type-desc">
                            採血が容易で現場でよく使用。pO₂は評価対象外。
                            動脈血基準値への自動補正を行います。
                        </div>
                    </div>
                    <div className="blood-type-arrow">›</div>
                </button>
            </div>

            <div className="vbg-notice">
                <strong>💡 静脈血ガスの自動補正について</strong>
                静脈血では動脈血に比べてpHが約0.035低く、PaCO₂が約7.5 mmHg高く、
                HCO₃⁻が約2 mEq/L高い値を示します。
                本アプリは静脈血選択時にこれらを自動補正して評価を行います。
            </div>
        </div>
    );
}
