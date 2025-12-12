/**
 * Tests for StandardPlatform Composite Component
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

import { StandardPlatform } from '../src/composites/platform';

describe('StandardPlatform', () => {
    const baseArgs = {
        projectId: 'test-project',
        region: 'us-central1',
        env: 'dev',
        prefix: 'myapp',
    };

    describe('basic creation', () => {
        it('should create platform with required args only', async () => {
            const platform = new StandardPlatform('test-platform', baseArgs);

            expect(platform.vpc).toBeDefined();
            expect(platform.cluster).toBeDefined();
            expect(platform.projectId).toBe('test-project');
            expect(platform.region).toBe('us-central1');
            expect(platform.env).toBe('dev');
            expect(platform.prefix).toBe('myapp');
        });

        it('should have hasSecrets false when no secrets', async () => {
            const platform = new StandardPlatform('test-platform', baseArgs);
            expect(platform.hasSecrets).toBe(false);
        });

        it('should have hasIdentity false when no identity', async () => {
            const platform = new StandardPlatform('test-platform', baseArgs);
            expect(platform.hasIdentity).toBe(false);
        });
    });

    describe('with secrets', () => {
        it('should create secrets when secretIds provided', async () => {
            const platform = new StandardPlatform('test-platform', {
                ...baseArgs,
                secretIds: ['db-password', 'api-key'],
            });

            expect(platform.hasSecrets).toBe(true);
            expect(platform.secrets).toBeDefined();
        });
    });

    describe('with workload identity', () => {
        it('should create identity when workloadIdentity provided', async () => {
            const platform = new StandardPlatform('test-platform', {
                ...baseArgs,
                workloadIdentity: {
                    saId: 'workload-identity-sa',
                    k8sNamespace: 'default',
                    k8sSaName: 'app-sa',
                    roles: ['roles/secretmanager.secretAccessor'],
                },
            });

            expect(platform.hasIdentity).toBe(true);
            expect(platform.identity).toBeDefined();
        });

        it('should throw error if workloadIdentity is incomplete', async () => {
            await expect(async () => {
                new StandardPlatform('test-platform', {
                    ...baseArgs,
                    workloadIdentity: {
                        saId: 'workload-sa',
                        k8sNamespace: '',
                        k8sSaName: 'app-sa',
                    },
                });
            }).rejects.toThrow("workloadIdentity must contain 'saId', 'k8sNamespace', and 'k8sSaName'");
        });
    });

    describe('safe access properties', () => {
        it('should throw error when accessing secrets without configuration', async () => {
            const platform = new StandardPlatform('test-platform', baseArgs);

            expect(() => {
                platform.secrets;
            }).toThrow("Secrets not configured");
        });

        it('should throw error when accessing identity without configuration', async () => {
            const platform = new StandardPlatform('test-platform', baseArgs);

            expect(() => {
                platform.identity;
            }).toThrow("Workload Identity not configured");
        });

        it('should throw error when accessing identityEmail without configuration', async () => {
            const platform = new StandardPlatform('test-platform', baseArgs);

            expect(() => {
                platform.identityEmail;
            }).toThrow("Workload Identity not configured");
        });
    });

    describe('environment profiles', () => {
        it('should use DevProfile for dev env', async () => {
            const platform = new StandardPlatform('test-platform', {
                ...baseArgs,
                env: 'dev',
            });

            expect(platform.env).toBe('dev');
        });

        it('should use StagingProfile for staging env', async () => {
            const platform = new StandardPlatform('test-platform', {
                ...baseArgs,
                env: 'staging',
            });

            expect(platform.env).toBe('staging');
        });

        it('should use ProdProfile for prod env', async () => {
            const platform = new StandardPlatform('test-platform', {
                ...baseArgs,
                env: 'prod',
            });

            expect(platform.env).toBe('prod');
        });
    });

    describe('cluster overrides', () => {
        it('should pass cluster overrides', async () => {
            const platform = new StandardPlatform('test-platform', {
                ...baseArgs,
                clusterOverrides: {
                    maxNodes: 20,
                    machineType: 'n2-standard-8',
                },
            });

            expect(platform.cluster).toBeDefined();
        });
    });

    describe('convenience properties', () => {
        it('should expose clusterName', async () => {
            const platform = new StandardPlatform('test-platform', baseArgs);
            expect(platform.clusterName).toBeDefined();
        });

        it('should expose clusterEndpoint', async () => {
            const platform = new StandardPlatform('test-platform', baseArgs);
            expect(platform.clusterEndpoint).toBeDefined();
        });

        it('should expose networkId', async () => {
            const platform = new StandardPlatform('test-platform', baseArgs);
            expect(platform.networkId).toBeDefined();
        });

        it('should expose subnetId', async () => {
            const platform = new StandardPlatform('test-platform', baseArgs);
            expect(platform.subnetId).toBeDefined();
        });
    });
});
