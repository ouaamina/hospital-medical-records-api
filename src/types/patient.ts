export type DepartmentType = 'GENERAL' | 'EMERGENCY' | 'ONCOLOGY' | 'CARDIOLOGY';

export interface BasePatient {
    id?: string;
    lastName: string;
    firstName: string;
    admissionDate: string;
    department: DepartmentType;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface EmergencyDetails {
    arrivalTime: string;
    triageLevel: number; // 1 to 5
    initialSeverity: string;
}

export interface OncologyDetails {
    tumorType: string;
    stage: string;
    currentTreatment: string;
}

export interface CardiologyDetails {
    ecgResults: string;
    restingHeartRate: number;
    bloodPressure: string;
}

export interface PatientRecord extends BasePatient {
    emergency?: EmergencyDetails;
    oncology?: OncologyDetails;
    cardiology?: CardiologyDetails;
}

export interface CreatePatientInput {
    lastName: string;
    firstName: string;
    admissionDate: string;
    department: DepartmentType;
    emergency?: EmergencyDetails;
    oncology?: OncologyDetails;
    cardiology?: CardiologyDetails;
}