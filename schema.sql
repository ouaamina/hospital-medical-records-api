-- Cleanup if re-executing
DROP TABLE IF EXISTS cardiology_details CASCADE;
DROP TABLE IF EXISTS oncology_details CASCADE;
DROP TABLE IF EXISTS emergency_details CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (Authentication)
CREATE TABLE users (
                       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       role VARCHAR(50) DEFAULT 'user',
                       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Base Patients Table
CREATE TABLE patients (
                          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                          last_name VARCHAR(100) NOT NULL,
                          first_name VARCHAR(100) NOT NULL,
                          admission_date DATE NOT NULL,
                          department VARCHAR(50) NOT NULL CHECK (department IN ('GENERAL', 'EMERGENCY', 'ONCOLOGY', 'CARDIOLOGY')),
                          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Emergency Details
CREATE TABLE emergency_details (
                                   patient_id UUID PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
                                   arrival_time TIME NOT NULL,
                                   triage_level INT NOT NULL CHECK (triage_level BETWEEN 1 AND 5),
                                   initial_severity VARCHAR(100) NOT NULL
);

-- Oncology Details
CREATE TABLE oncology_details (
                                  patient_id UUID PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
                                  tumor_type VARCHAR(150) NOT NULL,
                                  stage VARCHAR(50) NOT NULL,
                                  current_treatment TEXT NOT NULL
);

-- Cardiology Details
CREATE TABLE cardiology_details (
                                    patient_id UUID PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
                                    ecg_results TEXT NOT NULL,
                                    resting_heart_rate INT NOT NULL,
                                    blood_pressure VARCHAR(20) NOT NULL
);

-- Test Seed Data
INSERT INTO users (email, password_hash)
VALUES ('admin@hospital.com', '$2b$10$e8.s/5E/1P9N2XpW73L9uO9f5Z1A7G7V.eXyZ1W2V3U4T5S6R7Q8P');

-- Insert General Patient
INSERT INTO patients (id, last_name, first_name, admission_date, department)
VALUES ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Smith', 'John', '2026-09-20', 'GENERAL');

-- Insert Emergency Patient
INSERT INTO patients (id, last_name, first_name, admission_date, department)
VALUES ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Doe', 'Jane', '2026-09-24', 'EMERGENCY');
INSERT INTO emergency_details (patient_id, arrival_time, triage_level, initial_severity)
VALUES ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', '08:15:00', 2, 'High - Chest Pain');

-- Insert Oncology Patient
INSERT INTO patients (id, last_name, first_name, admission_date, department)
VALUES ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Brown', 'Michael', '2026-09-15', 'ONCOLOGY');
INSERT INTO oncology_details (patient_id, tumor_type, stage, current_treatment)
VALUES ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Carcinoma', 'Stage II', 'Chemotherapy Cycle 3');

-- Insert Cardiology Patient
INSERT INTO patients (id, last_name, first_name, admission_date, department)
VALUES ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'Wilson', 'Emily', '2026-09-22', 'CARDIOLOGY');
INSERT INTO cardiology_details (patient_id, ecg_results, resting_heart_rate, blood_pressure)
VALUES ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'Normal Sinus Rhythm', 68, '120/80');