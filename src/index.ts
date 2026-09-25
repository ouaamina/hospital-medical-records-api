import restana from 'restana';
import bodyParser from 'body-parser';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { PatientController } from './controllers/patient.controller';
import { AuthController } from './controllers/auth.controller';

// Clé secrète JWT (à placer idéalement dans tes variables d'environnement .env)
const JWT_SECRET = process.env.JWT_SECRET || 'votre_cle_secrete_super_securisee';

// Initialisation du serveur Restana
const server = restana();

// Middlewares globaux
server.use(cors());
server.use(bodyParser.json());

// 🔒 MIDDLEWARE DE VÉRIFICATION JWT POUR RESTANA
const authMiddleware = (req: any, res: any, next: () => void) => {
    // 1. Récupérer le header Authorization (ex: "Bearer <token>")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // 2. Si pas de token, bloquer avec une erreur 401 Unauthorized
    if (!token) {
        res.send({ message: 'Accès non autorisé : Token manquant' }, 401);
        return;
    }

    // 3. Vérifier le token
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            res.send({ message: 'Accès interdit : Token invalide ou expiré' }, 403);
            return;
        }

        // Attacher les données de l'utilisateur à la requête
        req.user = user;
        next();
    });
};

// 1. Route Publique d'Authentification
server.post('/api/auth/login', AuthController.login);

// 2. Routes Protégées pour les Patients (Chaque route passe par authMiddleware)
server.get('/api/auth/me', authMiddleware, AuthController.me);

server.get('/api/patients', authMiddleware, PatientController.getAll);
server.post('/api/patients', authMiddleware, PatientController.create);
server.put('/api/patients/:id', authMiddleware, PatientController.update);
server.delete('/api/patients/:id', authMiddleware, PatientController.remove);

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