/**
 * Tests for Security Components (StandardSecrets, StandardIdentity)
 * 
 * These tests validate the input validation logic of the security components.
 * Pulumi resource creation is mocked.
 */

import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi before importing components
pulumi.runtime.setMocks({
    newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: Record<string, unknown> } => {
        return {
            id: `${args.name}-id`,
            state: args.inputs,
        };
    },
    call: (args: pulumi.runtime.MockCallArgs) => {
        return args.inputs;
    },
});

// Import after mocking
import { StandardSecrets, StandardIdentity } from '../src/components/security';

describe('StandardSecrets', () => {
    describe('validation', () => {
        it('should throw error if secretIds is empty', async () => {
            await expect(async () => {
                new StandardSecrets('test-secrets', { secretIds: [] });
            }).rejects.toThrow('secretIds cannot be empty');
        });

        it('should throw error if secretId is empty string', async () => {
            await expect(async () => {
                new StandardSecrets('test-secrets', { secretIds: ['valid', ''] });
            }).rejects.toThrow('secretId cannot be empty or whitespace');
        });

        it('should throw error if secretId is whitespace', async () => {
            await expect(async () => {
                new StandardSecrets('test-secrets', { secretIds: ['valid', '   '] });
            }).rejects.toThrow('secretId cannot be empty or whitespace');
        });

        it('should create secrets with valid secretIds', async () => {
            const secrets = new StandardSecrets('test-secrets', {
                secretIds: ['db-password', 'api-key'],
            });

            expect(secrets.secretIds).toEqual(['db-password', 'api-key']);
        });
    });

    describe('getSecret', () => {
        it('should return secret by ID', async () => {
            const secrets = new StandardSecrets('test-secrets', {
                secretIds: ['db-password'],
            });

            const secret = secrets.getSecret('db-password');
            expect(secret).toBeDefined();
        });

        it('should throw error for non-existent secret', async () => {
            const secrets = new StandardSecrets('test-secrets', {
                secretIds: ['db-password'],
            });

            expect(() => {
                secrets.getSecret('non-existent');
            }).toThrow("Secret 'non-existent' not found");
        });
    });
});

describe('StandardIdentity', () => {
    const validArgs = {
        projectId: 'test-project',
        saId: 'test-sa-account',
        k8sNamespace: 'default',
        k8sSaName: 'test-k8s-sa',
    };

    describe('validation', () => {
        it('should throw error if projectId is empty', async () => {
            await expect(async () => {
                new StandardIdentity('test-identity', {
                    ...validArgs,
                    projectId: '',
                });
            }).rejects.toThrow('projectId is required');
        });

        it('should throw error if saId is too short', async () => {
            await expect(async () => {
                new StandardIdentity('test-identity', {
                    ...validArgs,
                    saId: 'abc',
                });
            }).rejects.toThrow('saId must be 6-30 characters');
        });

        it('should throw error if saId is too long', async () => {
            await expect(async () => {
                new StandardIdentity('test-identity', {
                    ...validArgs,
                    saId: 'a'.repeat(31),
                });
            }).rejects.toThrow('saId must be 6-30 characters');
        });

        it('should throw error if k8sNamespace is empty', async () => {
            await expect(async () => {
                new StandardIdentity('test-identity', {
                    ...validArgs,
                    k8sNamespace: '',
                });
            }).rejects.toThrow('k8sNamespace is required');
        });

        it('should throw error if k8sSaName is empty', async () => {
            await expect(async () => {
                new StandardIdentity('test-identity', {
                    ...validArgs,
                    k8sSaName: '',
                });
            }).rejects.toThrow('k8sSaName is required');
        });

        it('should create identity with valid args', async () => {
            const identity = new StandardIdentity('test-identity', validArgs);
            expect(identity.gsa).toBeDefined();
        });

        it('should create identity with roles', async () => {
            const identity = new StandardIdentity('test-identity', {
                ...validArgs,
                roles: ['roles/secretmanager.secretAccessor'],
            });
            expect(identity.gsa).toBeDefined();
        });
    });
});
