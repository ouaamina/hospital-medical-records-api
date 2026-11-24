
import test from 'tape';
import * as sinon from 'sinon';
import bcrypt from 'bcrypt';
import { db } from '../../../src/config/database';
import jwt from 'jsonwebtoken';

import { PatientController } from '../../../src/controllers/patient.controller';
import { PatientService } from '../../../src/services/patient.service';
import { AuthController } from '../../../src/controllers/auth.controller';

// =====================================================
// HELPERS: Utility functions for the tests
// =====================================================

// Creates a mocked response object.
// A Sinon stub is used to replace res.send()
// so we can verify the calls and the arguments passed.
const createResponse = () => ({
    send: sinon.stub()
});

// Mock data used as a reference in the tests.
// This avoids recreating a patient in every test scenario.
const patient = {
    id: 'patient-123',
    lastName: 'Doe',
    firstName: 'John',
    admissionDate: '2026-11-16',
    department: 'CARDIOLOGY',
    cardiology: {
        ecgResults: 'Sinus rhythm',
        restingHeartRate: 75,
        bloodPressure: '120/80'
    }
};


// =====================================================
// GET ALL PATIENTS
// =====================================================

// TEST 1: Verify that all patients are retrieved successfully.
test('PatientController - getAll', async (t) => {

    // Create a sandbox to group Sinon mocks and stubs.
    const sandbox = sinon.createSandbox();

    // Create a mocked HTTP response.
    const res = createResponse();

    try {
        // Temporarily replace getAllPatients() with a stub.
        // resolves() simulates a successful Promise containing a patient.
        sandbox.stub(PatientService.prototype, 'getAllPatients')
            .resolves([patient] as any);

        // Directly call the controller with a mocked request.
        await PatientController.getAll({} as any, res as any);

        // Verify that the controller sends the response only once.
        t.ok(
            res.send.calledOnce,
            'Should send the response once'
        );

        // Verify the arguments passed to res.send().
        // We expect the list of patients and HTTP status code 200.
        t.deepEqual(
            res.send.firstCall.args,
            [[patient], 200],
            'Should return all patients with status 200'
        );

    } finally {
        // Restore the original methods to avoid affecting other tests.
        sandbox.restore();

        // Notify Tape that the test has finished.
        t.end();
    }
});


// TEST 2: Verify error handling when the service fails.
test('PatientController - getAll should handle service errors', async (t) => {

    const sandbox = sinon.createSandbox();
    const res = createResponse();

    try {
        // Simulate a service failure.
        // rejects() represents a rejected Promise containing an error.
        sandbox.stub(PatientService.prototype, 'getAllPatients')
            .rejects(new Error('Database error'));

        // Call the controller.
        await PatientController.getAll({} as any, res as any);

        // Verify that the controller catches the error
        // and returns an HTTP 500 response.
        t.deepEqual(
            res.send.firstCall.args,
            [{ error: 'Database error' }, 500],
            'Should return status 500 when service fails'
        );

    } finally {
        sandbox.restore();
        t.end();
    }
});


// =====================================================
// CREATE PATIENT
// =====================================================

// TEST 3: Verify validation of required fields.
test('PatientController - create should return 400 when required fields are missing', async (t) => {

    const res = createResponse();

    // Send an incomplete request:
    // only firstName is provided.
    await PatientController.create(
        { body: { firstName: 'John' } } as any,
        res as any
    );

    // Verify that the controller detects the missing fields
    // and returns an HTTP 400 error (Bad Request).
    t.deepEqual(
        res.send.firstCall.args,
        [{
            error: 'Missing required fields: lastName, firstName, admissionDate, department'
        }, 400],
        'Should reject incomplete patient data'
    );

    t.end();
});


// TEST 4: Verify that a patient is created successfully.
test('PatientController - create should create a patient successfully', async (t) => {

    const sandbox = sinon.createSandbox();
    const res = createResponse();

    // Data sent by the client to create a patient.
    const input = {
        lastName: 'Doe',
        firstName: 'John',
        admissionDate: '2026-11-16',
        department: 'CARDIOLOGY'
    };

    try {
        // Mock createPatient() to avoid accessing the actual database.
        // The method returns the mock patient defined above.
        const createStub = sandbox.stub(
            PatientService.prototype,
            'createPatient'
        ).resolves(patient as any);

        // Call the controller with the patient creation data.
        await PatientController.create(
            { body: input } as any,
            res as any
        );

        // Verify that the creation service was called exactly once.
        t.ok(createStub.calledOnce, 'Should call createPatient once');

        // Verify that the correct data was passed to the service.
        t.deepEqual(
            createStub.firstCall.args[0],
            input,
            'Should pass patient data to the service'
        );

        // Verify that the created patient is returned with HTTP 201.
        t.deepEqual(
            res.send.firstCall.args,
            [patient, 201],
            'Should return the created patient with status 201'
        );

    } finally {
        sandbox.restore();
        t.end();
    }
});


// TEST 5: Verify error handling when patient creation fails.
test('PatientController - create should handle service errors', async (t) => {

    const sandbox = sinon.createSandbox();
    const res = createResponse();

    try {
        // Simulate a failure in the createPatient() method.
        sandbox.stub(PatientService.prototype, 'createPatient')
            .rejects(new Error('Creation failed'));

        // Send valid data, but the service returns an error.
        await PatientController.create(
            {
                body: {
                    lastName: 'Doe',
                    firstName: 'John',
                    admissionDate: '2026-11-16',
                    department: 'CARDIOLOGY'
                }
            } as any,
            res as any
        );

        // Verify that the error is caught and returned to the client.
        // Note: The status code 400 should be confirmed in the controller.
        t.deepEqual(
            res.send.firstCall.args,
            [{ error: 'Creation failed' }, 400],
            'Should handle patient creation errors'
        );

    } finally {
        sandbox.restore();
        t.end();
    }
});


// =====================================================
// UPDATE PATIENT
// =====================================================

// TEST 6: Verify that a patient is updated successfully.
test('PatientController - update should return 200 when successful', async (t) => {

    const sandbox = sinon.createSandbox();
    const res = createResponse();

    try {
        // Mock updatePatient().
        // true indicates that the update was successful.
        const updateStub = sandbox.stub(
            PatientService.prototype,
            'updatePatient'
        ).resolves(true);

        // Data to be updated.
        const input = { lastName: 'Updated' };

        // Simulate an HTTP request containing:
        // params.id: the patient ID provided in the URL.
        // body: the updated patient data.
        await PatientController.update(
            {
                params: { id: 'patient-123' },
                body: input
            } as any,
            res as any
        );

        // Verify that the service was called exactly once.
        t.ok(updateStub.calledOnce, 'Should call updatePatient once');

        // Verify that the controller passes the correct patient ID
        // along with the updated data.
        t.deepEqual(
            updateStub.firstCall.args,
            ['patient-123', input],
            'Should pass patient ID and update data'
        );

        // Verify the success message and HTTP status code 200.
        t.deepEqual(
            res.send.firstCall.args,
            [{ message: 'Patient record updated successfully' }, 200],
            'Should return status 200'
        );

    } finally {
        sandbox.restore();
        t.end();
    }
});


// TEST 7: Verify the behavior when the patient does not exist.
test('PatientController - update should return 404 when patient does not exist', async (t) => {

    const sandbox = sinon.createSandbox();
    const res = createResponse();

    try {
        // Simulate an unsuccessful update.
        // false indicates that the patient was not found.
        sandbox.stub(PatientService.prototype, 'updatePatient')
            .resolves(false);

        // Send a request with an unknown patient ID.
        await PatientController.update(
            {
                params: { id: 'unknown-id' },
                body: { lastName: 'Updated' }
            } as any,
            res as any
        );

        // Verify that the controller returns HTTP 404 (Not Found).
        t.deepEqual(
            res.send.firstCall.args,
            [{ error: 'Patient not found' }, 404],
            'Should return 404 for a missing patient'
        );

    } finally {
        sandbox.restore();
        t.end();
    }
});


// =====================================================
// DELETE PATIENT
// =====================================================

// TEST 8: Verify that a patient is deleted successfully.
test('PatientController - remove should delete a patient successfully', async (t) => {

    const sandbox = sinon.createSandbox();
    const res = createResponse();

    try {
        // Mock deletePatient().
        // true indicates that the patient was successfully deleted.
        const deleteStub = sandbox.stub(
            PatientService.prototype,
            'deletePatient'
        ).resolves(true);

        // Call the controller with the patient ID.
        await PatientController.remove(
            { params: { id: 'patient-123' } } as any,
            res as any
        );

        // Verify that the deletion service was called exactly once.
        t.ok(deleteStub.calledOnce, 'Should call deletePatient once');

        // Verify that the correct patient ID was passed.
        t.equal(
            deleteStub.firstCall.args[0],
            'patient-123',
            'Should pass the correct patient ID'
        );

        // Verify the success message and HTTP status code 200.
        t.deepEqual(
            res.send.firstCall.args,
            [{ message: 'Patient record deleted successfully' }, 200],
            'Should return status 200'
        );

    } finally {
        sandbox.restore();
        t.end();
    }
});


// TEST 9: Verify deletion behavior when the patient does not exist.
test('PatientController - remove should return 404 when patient does not exist', async (t) => {

    const sandbox = sinon.createSandbox();
    const res = createResponse();

    try {
        // Simulate a deletion failure because the patient does not exist.
        sandbox.stub(PatientService.prototype, 'deletePatient')
            .resolves(false);

        // Call the controller with an unknown patient ID.
        await PatientController.remove(
            { params: { id: 'unknown-id' } } as any,
            res as any
        );

        // Verify that the controller returns HTTP 404.
        t.deepEqual(
            res.send.firstCall.args,
            [{ error: 'Patient not found' }, 404],
            'Should return 404 for a missing patient'
        );

    } finally {
        sandbox.restore();
        t.end();
    }
});