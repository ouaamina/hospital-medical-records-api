import { db } from '../config/database';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export class AuthController {
    static async login(req: any, res: any): Promise<void> {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.send({ error: 'Email and password are required' }, 400);
                return;
            }


            const user = await db('users').where({ email }).first();

            if (!user) {
                res.send({ error: 'Invalid credentials' }, 401);
                return;
            }


            // 2. Vérifier le mot de passe haché avec bcrypt.compare
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);

            if (!isPasswordValid) {
                res.send({ error: 'Invalid credentials' }, 401);
                return;
            }

            const JWT_SECRET = process.env.JWT_SECRET || 'votre_cle_secrete_super_securisee';

            const token = jwt.sign(
                { id: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '8h' }
            );

            console.log(`[Backend Auth] ✅ Connexion réussie pour ${email}. Token généré avec succès.`);

            res.send({
                message: 'Login successful',
                token: token,
                user: { id: user.id, email: user.email }
            }, 200);
        } catch (error) {
            console.error('[Backend Auth] 💥 Erreur serveur durant le login :', error);
            res.send({ error: (error as Error).message }, 500);
        }
    }

    static async me(req: any, res: any) {
        // req.user est automatiquement rempli par authMiddleware si le token est valide
        if (!req.user) {
            res.send({ message: 'Non autorisé' }, 401);
            return;
        }

        // Renvoie l'utilisateur connecté
        res.send({
            id: req.user.id,
            email: req.user.email,
            name: req.user.name || 'Administrateur',
            role: 'ADMIN'
        }, 200);
    }
}