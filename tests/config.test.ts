/**
 * Tests for NetworkConfig and ClusterConfig
 */

import { NetworkConfig, ClusterConfig } from '../src/config';

describe('NetworkConfig', () => {
    const requiredArgs = {
        projectId: 'test-project',
        region: 'us-central1',
        env: 'dev',
        prefix: 'myapp',
    };

    describe('constructor', () => {
        it('should create with required args only', () => {
            const config = new NetworkConfig(requiredArgs);

            expect(config.projectId).toBe('test-project');
            expect(config.region).toBe('us-central1');
            expect(config.env).toBe('dev');
            expect(config.prefix).toBe('myapp');
        });

        it('should use default values for optional args', () => {
            const config = new NetworkConfig(requiredArgs);

            expect(config.cidr).toBe('10.0.0.0/16');
            expect(config.podCidr).toBe('10.11.0.0/21');
            expect(config.serviceCidr).toBe('10.12.0.0/21');
            expect(config.podRangeName).toBe('pod-ranges');
            expect(config.serviceRangeName).toBe('service-ranges');
        });

        it('should allow overriding optional args', () => {
            const config = new NetworkConfig({
                ...requiredArgs,
                cidr: '10.1.0.0/16',
                podCidr: '10.21.0.0/21',
            });

            expect(config.cidr).toBe('10.1.0.0/16');
            expect(config.podCidr).toBe('10.21.0.0/21');
        });
    });

    describe('computed properties', () => {
        it('should generate correct vpcName', () => {
            const config = new NetworkConfig(requiredArgs);
            expect(config.vpcName).toBe('myapp-dev-vpc');
        });

        it('should generate correct subnetName', () => {
            const config = new NetworkConfig(requiredArgs);
            expect(config.subnetName).toBe('myapp-dev-subnet');
        });
    });
});

describe('ClusterConfig', () => {
    const requiredArgs = {
        projectId: 'test-project',
        region: 'us-central1',
        env: 'prod',
        prefix: 'myapp',
    };

    describe('constructor', () => {
        it('should create with required args only', () => {
            const config = new ClusterConfig(requiredArgs);

            expect(config.projectId).toBe('test-project');
            expect(config.region).toBe('us-central1');
            expect(config.env).toBe('prod');
            expect(config.prefix).toBe('myapp');
        });

        it('should use default values for optional args', () => {
            const config = new ClusterConfig(requiredArgs);

            expect(config.zone).toBe('us-central1-a');
            expect(config.machineType).toBe('e2-medium');
            expect(config.nodeCount).toBe(1);
            expect(config.minNodes).toBe(1);
            expect(config.maxNodes).toBe(3);
            expect(config.diskSize).toBe(50);
            expect(config.spotInstances).toBe(true);
            expect(config.masterCidr).toBe('172.16.0.0/28');
        });

        it('should allow overriding optional args', () => {
            const config = new ClusterConfig({
                ...requiredArgs,
                machineType: 'n2-standard-4',
                maxNodes: 10,
                spotInstances: false,
            });

            expect(config.machineType).toBe('n2-standard-4');
            expect(config.maxNodes).toBe(10);
            expect(config.spotInstances).toBe(false);
        });
    });

    describe('validation', () => {
        it('should throw error if minNodes > maxNodes', () => {
            expect(() => {
                new ClusterConfig({
                    ...requiredArgs,
                    minNodes: 5,
                    maxNodes: 3,
                });
            }).toThrow('minNodes (5) cannot be greater than maxNodes (3)');
        });

        it('should allow minNodes equal to maxNodes', () => {
            const config = new ClusterConfig({
                ...requiredArgs,
                minNodes: 3,
                maxNodes: 3,
            });

            expect(config.minNodes).toBe(3);
            expect(config.maxNodes).toBe(3);
        });
    });

    describe('computed properties', () => {
        it('should generate correct clusterName', () => {
            const config = new ClusterConfig(requiredArgs);
            expect(config.clusterName).toBe('myapp-prod-cluster');
        });

        it('should generate correct workloadPool', () => {
            const config = new ClusterConfig(requiredArgs);
            expect(config.workloadPool).toBe('test-project.svc.id.goog');
        });

        it('should use custom zone if provided', () => {
            const config = new ClusterConfig({
                ...requiredArgs,
                zone: 'us-central1-c',
            });
            expect(config.effectiveZone).toBe('us-central1-c');
        });

        it('should auto-generate zone if not provided', () => {
            const config = new ClusterConfig(requiredArgs);
            expect(config.effectiveZone).toBe('us-central1-a');
        });
    });
});
