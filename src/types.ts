// Blood gas input types
export type BloodType = 'arterial' | 'venous';

export interface BloodGasInput {
    bloodType: BloodType;
    pH: number;
    pCO2: number;   // mmHg
    hco3: number;   // mEq/L
    na?: number;     // mEq/L (optional)
    cl?: number;     // mEq/L (optional)
    ag?: number;     // mEq/L (Anion Gap direct input, optional)
    alb?: number;   // g/dL (optional, default 4.0)
    glu?: number;   // mg/dL (optional)
    lac?: number;   // mmol/L (optional)
    be?: number;    // mmol/L (Base Excess, optional)
    uCl?: number;   // mEq/L (Urine Cl, optional)
    pO2?: number;   // mmHg (optional)
    fio2?: number;  // % e.g. 21 to 100 (optional)
}

// Step evaluation results
export type Acidemia = 'acidemia' | 'alkalemia' | 'normal';

export type Pattern13 =
    | 'normal'
    | 'acute_respiratory_acidosis'
    | 'chronic_respiratory_acidosis'
    | 'metabolic_acidosis'
    | 'acute_respiratory_alkalosis'
    | 'chronic_respiratory_alkalosis'
    | 'metabolic_alkalosis'
    | 'mixed_acidosis'
    | 'mixed_alkalosis'
    | 'mixed_contrasting'
    | 'indeterminate';

export type PrimaryDisorder = Pattern13;

export type CompensationStatus = 'adequate' | 'inadequate_high' | 'inadequate_low' | 'na';
export type RespCompensationType = 'acute' | 'chronic' | 'na';

export interface Step1Result {
    label: string;          // アシデミア / アルカレミア / 正常
    type: Acidemia;
    urgent: boolean;        // pH ≤7.15 or ≥7.60
    explanation: string;
}

export interface OxygenationResult {
    evaluated: boolean;
    pfRatio?: number;     // PaO2 / FiO2
    aado2?: number;       // A-aDO2
    isHypoxemia?: boolean; // PaO2 < 60
    isArdsRisk?: boolean;  // P/F < 300
    label: string;
    explanation: string;
}

export interface Step2Result {
    primaryDisorder: PrimaryDisorder;
    label: string;
    explanation: string;
}

export interface Step3Result {
    compensationType: RespCompensationType;
    expectedValue: { min: number; max: number };
    actualValue: number;
    status: CompensationStatus;
    label: string;
    explanation: string;
}

export interface Step4Result {
    applicable: boolean;
    ag: number;
    correctedAg: number;
    agElevated: boolean;
    hiddenHagma: boolean;          // AG正常だが乳酸・ケトン高値により隠れHAGMAが存在する場合 true
    hiddenHagmaExplanation: string; // 隠れHAGMAの詳細説明文
    albUsed: number;
    label: string;
    explanation: string;
}

export interface Step5Result {
    applicable: boolean;
    correctedHco3: number;
    deltaAg: number;
    status: 'metabolic_alkalosis_combined' | 'normal' | 'normal_ag_acidosis_combined';
    label: string;
    explanation: string;
}

export interface BloodGasResult {
    correctedInput: BloodGasInput; // VBG-corrected values used for calc
    oxygenation: OxygenationResult;
    step1: Step1Result;
    step2: Step2Result;
    step3: Step3Result;
    step4: Step4Result;
    step5: Step5Result;
    differentials: string[];
}
