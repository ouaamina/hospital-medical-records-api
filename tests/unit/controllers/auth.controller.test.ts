import test from 'tape';
import * as sinon from 'sinon';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import proxyquire from 'proxyquire';

// =====================================================
// AUTHENTICATION - LOGIN TEST
// =====================================================

// TEST 1: Verify successful login with mocked credentials.
test('AUTH - Login with mocked credentials', async (t) => {

    // Create a Sinon sandbox to manage and restore all stubs.
    const sandbox = sinon.createSandbox();

    // Fake user returned by the mocked database.
    const fakeUser = {
        id: 1,
        email: 'fake@example.com',
        password_hash: 'fake-hash'
    };

    // Simulate the first() method returning a user.
    const firstStub = sandbox.stub().resolves(fakeUser);

    // Simulate the where() method used to search for a user by email.
    const whereStub = sandbox.stub().returns({
        first: firstStub
    });

    // Mock the database connection to avoid accessing the real database.
    const dbStub = sandbox.stub().returns({
        where: whereStub
    });

    // Mock bcrypt.compare() to simulate a successful password validation.
    const bcryptStub = sandbox.stub(bcrypt, 'compare')
        .resolves(true);

    // Mock JWT generation and return a fake authentication token.
    const jwtStub = sandbox.stub(jwt, 'sign')
        .returns('fake-token' as any);

    // Create a mocked HTTP response to verify the controller output.
    const res: any = {
        send: sandbox.stub()
    };

    try {
        // Replace the real database module with the mocked version
        // before loading the authentication controller.
        const { AuthController: MockAuthController } = proxyquire(
            '../../../src/controllers/auth.controller',
            {
                '../config/database': {
                    db: dbStub
                }
            }
        );

        // Simulate an HTTP request containing the user's credentials.
        const req: any = {
            body: {
                email: 'fake@example.com',
                password: 'fake-password'
            }
        };

        // Execute the login controller with the mocked request and response.
        await MockAuthController.login(req, res);

        // Verify that the database was called exactly once.
        t.ok(dbStub.calledOnce, 'Should call the mocked database');

        // Verify that the controller queries the users table.
        t.equal(
            dbStub.firstCall.args[0],
            'users',
            'Should query the users table'
        );

        // Verify that the user is searched by email.
        t.deepEqual(
            whereStub.firstCall.args[0],
            { email: 'fake@example.com' },
            'Should search for the user by email'
        );

        // Verify that the password comparison was performed.
        t.ok(bcryptStub.calledOnce, 'Should compare the password');

        // Verify that a JWT token was generated.
        t.ok(jwtStub.calledOnce, 'Should generate a JWT');

        // Verify that the controller returns the expected response
        // containing the success message, token, user information and HTTP 200.
        t.deepEqual(
            res.send.firstCall.args,
            [{
                message: 'Login successful',
                token: 'fake-token',
                user: {
                    id: 1,
                    email: 'fake@example.com'
                }
            }, 200],
            'Should return a successful login response'
        );

    } catch (error) {
        // Mark the test as failed if an unexpected error occurs.
        t.fail(String(error));

    } finally {
        // Restore all Sinon stubs after the test.
        sandbox.restore();
    }
});

test('AUTH - Login with non-existing user', async (t) => {
    const sandbox = sinon.createSandbox();

    const firstStub = sandbox.stub().resolves(undefined);

    const whereStub = sandbox.stub().returns({
        first: firstStub
    });

    const dbStub = sandbox.stub().returns({
        where: whereStub
    });

    const res: any = {
        send: sandbox.stub()
    };

    try {
        const { AuthController: MockAuthController } = proxyquire(
            '../../../src/controllers/auth.controller',
            {
                '../config/database': {
                    db: dbStub
                }
            }
        );

        const req: any = {
            body: {
                email: 'unknown@example.com',
                password: 'fake-password'
            }
        };

        await MockAuthController.login(req, res);

        t.ok(dbStub.calledOnce, 'Should call the database');

        t.ok(
            res.send.calledOnce,
            'Should send an error response'
        );

    
    } catch (error) {
        t.fail(String(error));
    } finally {
        sandbox.restore();
    }
});

test('AUTH - Login with incorrect password', async (t) => {
    const sandbox = sinon.createSandbox();

    const fakeUser = {
        id: 1,
        email: 'fake@example.com',
        password_hash: 'fake-hash'
    };

    const firstStub = sandbox.stub().resolves(fakeUser);

    const whereStub = sandbox.stub().returns({
        first: firstStub
    });

    const dbStub = sandbox.stub().returns({
        where: whereStub
    });

    const bcryptStub = sandbox.stub(bcrypt, 'compare')
        .resolves(false);

    const jwtStub = sandbox.stub(jwt, 'sign');

    const res: any = {
        send: sandbox.stub()
    };

    try {
        const { AuthController: MockAuthController } = proxyquire(
            '../../../src/controllers/auth.controller',
            {
                '../config/database': {
                    db: dbStub
                }
            }
        );

        const req: any = {
            body: {
                email: 'fake@example.com',
                password: 'wrong-password'
            }
        };

        await MockAuthController.login(req, res);

        t.ok(
            bcryptStub.calledOnce,
            'Should compare the password'
        );

        t.notOk(
            jwtStub.called,
            'Should not generate a JWT'
        );

        t.equal(
            res.send.firstCall.args[1],
            401,
            'Should return HTTP 401'
        );

    } catch (error) {
        t.fail(String(error));
    } finally {
        sandbox.restore();
    }
});

