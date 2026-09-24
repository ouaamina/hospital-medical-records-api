import restana from 'restana';
import bodyParser from 'body-parser';
import cors from 'cors';
import { PatientController } from './controllers/patient.controller';
import { AuthController } from './controllers/auth.controller';

// Initialisation du serveur Restana
const server = restana();

// Middlewares globaux
server.use(cors());
server.use(bodyParser.json());

// 1. Route d'Authentification
server.post('/api/auth/login', AuthController.login);

// 2. Routes CRUD pour la Gestion des Dossiers Médicaux
server.get('/api/patients', PatientController.getAll);
server.post('/api/patients', PatientController.create);
server.put('/api/patients/:id', PatientController.update);
server.delete('/api/patients/:id', PatientController.remove);

// Port d'écoute
const PORT = Number(process.env.PORT) || 3000;

// Ne lance le serveur que hors environnement de test Jest
if (process.env.NODE_ENV !== 'test') {
    server.start(PORT).then(() => {
        console.log(`🚀 Serveur Restana démarré sur http://localhost:${PORT}`);
    });
}

// Export pour l'utilisation dans les tests unitaires (Supertest)
export default server;