
import test from 'tape';
import * as sinon from 'sinon';

import { PatientController } from '../../../src/controllers/patient.controller';
import { PatientService } from '../../../src/services/patient.service';

// =====================================================
// HELPERS : fonctions utilitaires pour les tests
// =====================================================

// Crée un objet response simulé.
// On utilise un stub Sinon pour remplacer res.send()
// et pouvoir vérifier les appels et les arguments envoyés.
const createResponse = () => ({
    send: sinon.stub()
});

// Données fictives utilisées comme référence dans les tests.
// Cela évite de recréer un patient dans chaque scénario.
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

// TEST 1 : Vérifier la récupération de tous les patients.
test('PatientController - getAll', async (t) => {

    // Crée un sandbox pour regrouper les simulations Sinon.
    const sandbox = sinon.createSandbox();

    // Crée une fausse réponse HTTP.
    const res = createResponse();

    try {
        // Remplace temporairement getAllPatients() par un stub.
        // resolves() simule une Promise réussie contenant un patient.
        sandbox.stub(PatientService.prototype, 'getAllPatients')
            .resolves([patient] as any);

        // Appelle directement le contrôleur avec une requête simulée.
        await PatientController.getAll({} as any, res as any);

        // Vérifie que le contrôleur a envoyé une seule réponse.
        t.ok(
            res.send.calledOnce,
            'Should send the response once'
        );

        // Vérifie les arguments transmis à res.send().
        // On attend la liste des patients et le statut HTTP 200.
        t.deepEqual(
            res.send.firstCall.args,
            [[patient], 200],
            'Should return all patients with status 200'
        );

    } finally {
        // Restaure les vraies méthodes pour ne pas affecter les autres tests.
        sandbox.restore();

        // Indique à Tape que le test est terminé.
        t.end();
    }
});


// TEST 2 : Vérifier la gestion d'une erreur provenant du service.
test('PatientController - getAll should handle service errors', async (t) => {

    const sandbox = sinon.createSandbox();
    const res = createResponse();

    try {
        // Simule un échec du service.
        // rejects() représente une Promise rejetée avec une erreur.
        sandbox.stub(PatientService.prototype, 'getAllPatients')
            .rejects(new Error('Database error'));

        // Appelle le contrôleur.
        await PatientController.getAll({} as any, res as any);

        // Vérifie que le contrôleur intercepte l'erreur
        // et retourne une réponse HTTP 500.
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

// TEST 3 : Vérifier la validation des champs obligatoires.
test('PatientController - create should return 400 when required fields are missing', async (t) => {

    const res = createResponse();

    // Envoie une requête incomplète :
    // seul firstName est fourni.
    await PatientController.create(
        { body: { firstName: 'John' } } as any,
        res as any
    );

    // Vérifie que le contrôleur détecte les champs manquants
    // et retourne une erreur HTTP 400 (Bad Request).
    t.deepEqual(
        res.send.firstCall.args,
        [{
            error: 'Missing required fields: lastName, firstName, admissionDate, department'
        }, 400],
        'Should reject incomplete patient data'
    );

    t.end();
});


// TEST 4 : Vérifier la création réussie d'un patient.
test('PatientController - create should create a patient successfully', async (t) => {

    const sandbox = sinon.createSandbox();
    const res = createResponse();

    // Données envoyées par le client pour créer un patient.
    const input = {
        lastName: 'Doe',
        firstName: 'John',
        admissionDate: '2026-11-16',
        department: 'CARDIOLOGY'
    };

    try {
        // Simule createPatient() pour éviter un accès réel à la base.
        // La méthode retourne le patient fictif préparé plus haut.
        const createStub = sandbox.stub(
            PatientService.prototype,
            'createPatient'
        ).resolves(patient as any);

        // Appelle le contrôleur avec les données de création.
        await PatientController.create(
            { body: input } as any,
            res as any
        );

        // Vérifie que le service de création a été appelé une seule fois.
        t.ok(createStub.calledOnce, 'Should call createPatient once');

        // Vérifie que les bonnes données ont été transmises au service.
        t.deepEqual(
            createStub.firstCall.args[0],
            input,
            'Should pass patient data to the service'
        );

        // Vérifie que le patient créé est retourné avec HTTP 201.
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


// TEST 5 : Vérifier la gestion d'une erreur pendant la création.
test('PatientController - create should handle service errors', async (t) => {

    const sandbox = sinon.createSandbox();
    const res = createResponse();

    try {
        // Simule un échec de la méthode createPatient().
        sandbox.stub(PatientService.prototype, 'createPatient')
            .rejects(new Error('Creation failed'));

        // Envoie des données valides, mais le service échoue.
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

        // Vérifie que l'erreur est interceptée et renvoyée au client.
        // Attention : le statut 400 doit être confirmé dans le contrôleur.
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

// TEST 6 : Vérifier la modification réussie d'un patient.
test('PatientController - update should return 200 when successful', async (t) => {

    const sandbox = sinon.createSandbox();
    const res = createResponse();

    try {
        // Simule updatePatient().
        // true signifie que la modification a réussi.
        const updateStub = sandbox.stub(
            PatientService.prototype,
            'updatePatient'
        ).resolves(true);

        // Données à modifier.
        const input = { lastName: 'Updated' };

        // Simule une requête HTTP avec :
        // params.id : identifiant du patient dans l'URL.
        // body : nouvelles données du patient.
        await PatientController.update(
            {
                params: { id: 'patient-123' },
                body: input
            } as any,
            res as any
        );

        // Vérifie que le service a été appelé une seule fois.
        t.ok(updateStub.calledOnce, 'Should call updatePatient once');

        // Vérifie que le contrôleur transmet le bon identifiant
        // ainsi que les données de modification.
        t.deepEqual(
            updateStub.firstCall.args,
            ['patient-123', input],
            'Should pass patient ID and update data'
        );

        // Vérifie le message de succès et le statut HTTP 200.
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


// TEST 7 : Vérifier le comportement lorsque le patient n'existe pas.
test('PatientController - update should return 404 when patient does not exist', async (t) => {

    const sandbox = sinon.createSandbox();
    const res = createResponse();

    try {
        // Simule une modification impossible.
        // false indique que le patient n'a pas été trouvé.
        sandbox.stub(PatientService.prototype, 'updatePatient')
            .resolves(false);

        // Envoie une requête avec un identifiant inconnu.
        await PatientController.update(
            {
                params: { id: 'unknown-id' },
                body: { lastName: 'Updated' }
            } as any,
            res as any
        );

        // Vérifie que le contrôleur retourne HTTP 404 (Not Found).
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

// TEST 8 : Vérifier la suppression réussie d'un patient.
test('PatientController - remove should delete a patient successfully', async (t) => {

    const sandbox = sinon.createSandbox();
    const res = createResponse();

    try {
        // Simule deletePatient().
        // true signifie que le patient a bien été supprimé.
        const deleteStub = sandbox.stub(
            PatientService.prototype,
            'deletePatient'
        ).resolves(true);

        // Appelle le contrôleur avec l'identifiant du patient.
        await PatientController.remove(
            { params: { id: 'patient-123' } } as any,
            res as any
        );

        // Vérifie que le service de suppression a été appelé une fois.
        t.ok(deleteStub.calledOnce, 'Should call deletePatient once');

        // Vérifie que le bon identifiant a été transmis.
        t.equal(
            deleteStub.firstCall.args[0],
            'patient-123',
            'Should pass the correct patient ID'
        );

        // Vérifie le message de succès et le statut HTTP 200.
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


// TEST 9 : Vérifier la suppression d'un patient inexistant.
test('PatientController - remove should return 404 when patient does not exist', async (t) => {

    const sandbox = sinon.createSandbox();
    const res = createResponse();

    try {
        // Simule un échec de suppression parce que le patient n'existe pas.
        sandbox.stub(PatientService.prototype, 'deletePatient')
            .resolves(false);

        // Appelle le contrôleur avec un identifiant inconnu.
        await PatientController.remove(
            { params: { id: 'unknown-id' } } as any,
            res as any
        );

        // Vérifie que le contrôleur retourne HTTP 404.
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
