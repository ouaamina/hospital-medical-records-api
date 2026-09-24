import { db } from '../config/database';

export class AuthController {
    static async login(req: any, res: any): Promise<void> {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.send({ error: 'Email and password are required' }, 400);
                return;
            }

            const user = await db('users').where({ email }).first();

            if (!user || password !== 'admin123') {
                res.send({ error: 'Invalid credentials' }, 401);
                return;
            }

            res.send({
                message: 'Login successful',
                token: 'fake-jwt-token-for-demo',
                user: { id: user.id, email: user.email }
            }, 200);
        } catch (error) {
            res.send({ error: (error as Error).message }, 500);
        }
    }
}