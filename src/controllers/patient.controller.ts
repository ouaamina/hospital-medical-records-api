import { PatientService } from '../services/patient.service';

const patientService = new PatientService();

export class PatientController {
    static async getAll(req: any, res: any): Promise<void> {
        try {
            const patients = await patientService.getAllPatients();
            res.send(patients, 200);
        } catch (error) {
            res.send({ error: (error as Error).message }, 500);
        }
    }

    static async create(req: any, res: any): Promise<void> {
        try {
            const body = req.body;
            if (!body.lastName || !body.firstName || !body.admissionDate || !body.department) {
                res.send({ error: 'Missing required fields: lastName, firstName, admissionDate, department' }, 400);
                return;
            }
            const newPatient = await patientService.createPatient(body);
            res.send(newPatient, 201);
        } catch (error) {
            res.send({ error: (error as Error).message }, 400);
        }
    }

    static async update(req: any, res: any): Promise<void> {
        try {
            const { id } = req.params;
            const success = await patientService.updatePatient(id, req.body);
            if (!success) {
                res.send({ error: 'Patient not found' }, 404);
                return;
            }
            res.send({ message: 'Patient record updated successfully' }, 200);
        } catch (error) {
            res.send({ error: (error as Error).message }, 400);
        }
    }

    static async remove(req: any, res: any): Promise<void> {
        try {
            const { id } = req.params;
            const success = await patientService.deletePatient(id);
            if (!success) {
                res.send({ error: 'Patient not found' }, 404);
                return;
            }
            res.send({ message: 'Patient record deleted successfully' }, 200);
        } catch (error) {
            res.send({ error: (error as Error).message }, 500);
        }
    }
}