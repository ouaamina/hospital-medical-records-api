import { db } from '../config/database';
import { PatientRecord, CreatePatientInput } from '../types/patient';

export class PatientService {
    /**
     * Retrieves all patient medical records with their department details
     */
    async getAllPatients(): Promise<PatientRecord[]> {
        const patients = await db('patients').select('*');

        const result: PatientRecord[] = [];

        for (const p of patients) {
            const record: PatientRecord = {
                id: p.id,
                lastName: p.last_name,
                firstName: p.first_name,
                admissionDate: p.admission_date,
                department: p.department,
                createdAt: p.created_at,
                updatedAt: p.updated_at,
            };

            if (p.department === 'EMERGENCY') {
                const details = await db('emergency_details').where({ patient_id: p.id }).first();
                if (details) {
                    record.emergency = {
                        arrivalTime: details.arrival_time,
                        triageLevel: details.triage_level,
                        initialSeverity: details.initial_severity,
                    };
                }
            } else if (p.department === 'ONCOLOGY') {
                const details = await db('oncology_details').where({ patient_id: p.id }).first();
                if (details) {
                    record.oncology = {
                        tumorType: details.tumor_type,
                        stage: details.stage,
                        currentTreatment: details.current_treatment,
                    };
                }
            } else if (p.department === 'CARDIOLOGY') {
                const details = await db('cardiology_details').where({ patient_id: p.id }).first();
                if (details) {
                    record.cardiology = {
                        ecgResults: details.ecg_results,
                        restingHeartRate: details.resting_heart_rate,
                        bloodPressure: details.blood_pressure,
                    };
                }
            }

            result.push(record);
        }

        return result;
    }

    /**
     * Creates a new patient medical record
     */
    async createPatient(input: CreatePatientInput): Promise<PatientRecord> {
        return await db.transaction(async (trx) => {
            const [insertedPatient] = await trx('patients')
                .insert({
                    last_name: input.lastName,
                    first_name: input.firstName,
                    admission_date: input.admissionDate,
                    department: input.department,
                })
                .returning('*');

            const patientId = insertedPatient.id;

            if (input.department === 'EMERGENCY' && input.emergency) {
                await trx('emergency_details').insert({
                    patient_id: patientId,
                    arrival_time: input.emergency.arrivalTime,
                    triage_level: input.emergency.triageLevel,
                    initial_severity: input.emergency.initialSeverity,
                });
            } else if (input.department === 'ONCOLOGY' && input.oncology) {
                await trx('oncology_details').insert({
                    patient_id: patientId,
                    tumor_type: input.oncology.tumorType,
                    stage: input.oncology.stage,
                    current_treatment: input.oncology.currentTreatment,
                });
            } else if (input.department === 'CARDIOLOGY' && input.cardiology) {
                await trx('cardiology_details').insert({
                    patient_id: patientId,
                    ecg_results: input.cardiology.ecgResults,
                    resting_heart_rate: input.cardiology.restingHeartRate,
                    blood_pressure: input.cardiology.bloodPressure,
                });
            }

            return {
                id: patientId,
                lastName: insertedPatient.last_name,
                firstName: insertedPatient.first_name,
                admissionDate: insertedPatient.admission_date,
                department: insertedPatient.department,
                emergency: input.emergency,
                oncology: input.oncology,
                cardiology: input.cardiology,
            };
        });
    }

    /**
     * Updates an existing patient record and department details
     */
    async updatePatient(id: string, input: Partial<CreatePatientInput>): Promise<boolean> {
        return await db.transaction(async (trx) => {
            const existingPatient = await trx('patients').where({ id }).first();
            if (!existingPatient) {
                return false;
            }

            // 1. Mise à jour de la table principale patients
            const updatePayload: Record<string, any> = {
                updated_at: db.fn.now()
            };
            if (input.lastName) updatePayload.last_name = input.lastName;
            if (input.firstName) updatePayload.first_name = input.firstName;
            if (input.admissionDate) updatePayload.admission_date = input.admissionDate;
            if (input.department) updatePayload.department = input.department;

            await trx('patients').where({ id }).update(updatePayload);

            const department = input.department || existingPatient.department;

            // 2. Mise à jour des détails spécifiques selon le service
            if (department === 'EMERGENCY' && input.emergency) {
                await trx('emergency_details')
                    .where({ patient_id: id })
                    .update({
                        arrival_time: input.emergency.arrivalTime,
                        triage_level: input.emergency.triageLevel,
                        initial_severity: input.emergency.initialSeverity,
                    });
            } else if (department === 'ONCOLOGY' && input.oncology) {
                await trx('oncology_details')
                    .where({ patient_id: id })
                    .update({
                        tumor_type: input.oncology.tumorType,
                        stage: input.oncology.stage,
                        current_treatment: input.oncology.currentTreatment,
                    });
            } else if (department === 'CARDIOLOGY' && input.cardiology) {
                await trx('cardiology_details')
                    .where({ patient_id: id })
                    .update({
                        ecg_results: input.cardiology.ecgResults,
                        resting_heart_rate: input.cardiology.restingHeartRate,
                        blood_pressure: input.cardiology.bloodPressure,
                    });
            }

            return true;
        });
    }

    /**
     * Deletes a medical record by ID
     */
    async deletePatient(id: string): Promise<boolean> {
        const deletedCount = await db('patients').where({ id }).del();
        return deletedCount > 0;
    }
}