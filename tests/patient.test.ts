import request from 'supertest';
import server from '../src/index';
import { db } from '../src/config/database';

describe('Patient & Auth API Endpoints', () => {
    let createdPatientId: string;

    // Fermer la connexion Knex à la fin des tests
    afterAll(async () => {
        await db.destroy();
    });

    // ----------------------------------------------------
    // 1. Tests Authentification
    // ----------------------------------------------------
    describe('POST /api/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const res = await request(server.getServer())
                .post('/api/auth/login')
                .send({
                    email: 'admin@hospital.com',
                    password: 'admin123'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('message', 'Login successful');
        });

        it('should return 400 if email or password is missing', async () => {
            const res = await request(server.getServer())
                .post('/api/auth/login')
                .send({ email: 'admin@hospital.com' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should return 401 for invalid credentials', async () => {
            const res = await request(server.getServer())
                .post('/api/auth/login')
                .send({ email: 'admin@hospital.com', password: 'wrongpassword' });

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error', 'Invalid credentials');
        });
    });

    // ----------------------------------------------------
    // 2. Tests CRUD Patients
    // ----------------------------------------------------
    describe('GET /api/patients', () => {
        it('should return a list of patients', async () => {
            const res = await request(server.getServer()).get('/api/patients');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('POST /api/patients', () => {
        it('should create a new Cardiology patient', async () => {
            const newPatient = {
                lastName: 'Test',
                firstName: 'Unit',
                admissionDate: '2026-09-24',
                department: 'CARDIOLOGY',
                cardiology: {
                    ecgResults: 'Sinus rhythm',
                    restingHeartRate: 75,
                    bloodPressure: '120/80'
                }
            };

            const res = await request(server.getServer())
                .post('/api/patients')
                .send(newPatient);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.lastName).toBe('Test');

            createdPatientId = res.body.id;
        });

        it('should create an Emergency department patient', async () => {
            const emergencyPatient = {
                lastName: 'Doe',
                firstName: 'John',
                admissionDate: '2026-09-24',
                department: 'EMERGENCY',
                emergency: {
                    arrivalTime: '14:00',
                    triageLevel: 2,
                    initialSeverity: 'MODERATE'
                }
            };

            const res = await request(server.getServer())
                .post('/api/patients')
                .send(emergencyPatient);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.department).toBe('EMERGENCY');
        });

        it('should create an Oncology department patient', async () => {
            const oncologyPatient = {
                lastName: 'Curie',
                firstName: 'Marie',
                admissionDate: '2026-09-24',
                department: 'ONCOLOGY',
                oncology: {
                    tumorType: 'Breast Cancer',
                    stage: 'Stage II',
                    currentTreatment: 'Chemotherapy'
                }
            };

            const res = await request(server.getServer())
                .post('/api/patients')
                .send(oncologyPatient);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.department).toBe('ONCOLOGY');
        });

        it('should return 400 if required fields are missing', async () => {
            const res = await request(server.getServer())
                .post('/api/patients')
                .send({ firstName: 'Incomplete' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('PUT /api/patients/:id', () => {
        it('should update an existing patient', async () => {
            const updateData = {
                lastName: 'TestUpdated',
                firstName: 'Unit',
                admissionDate: '2026-09-24',
                department: 'CARDIOLOGY',
                cardiology: {
                    ecgResults: 'Arrhythmia detected',
                    restingHeartRate: 85,
                    bloodPressure: '130/85'
                }
            };

            const res = await request(server.getServer())
                .put(`/api/patients/${createdPatientId}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Patient record updated successfully');
        });

        it('should return 404 when updating non-existent patient', async () => {
            const res = await request(server.getServer())
                .put('/api/patients/00000000-0000-0000-0000-000000000000')
                .send({ lastName: 'Nobody' });

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /api/patients/:id', () => {
        it('should delete the created patient', async () => {
            const res = await request(server.getServer())
                .delete(`/api/patients/${createdPatientId}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Patient record deleted successfully');
        });

        it('should return 404 when deleting non-existent patient', async () => {
            const res = await request(server.getServer())
                .delete('/api/patients/00000000-0000-0000-0000-000000000000');

            expect(res.status).toBe(404);
        });
    });
});