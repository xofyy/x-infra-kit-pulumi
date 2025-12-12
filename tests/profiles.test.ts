/**
 * Tests for Platform Profiles
 */

import { DevProfile, StagingProfile, ProdProfile } from '../src/profiles';

describe('DevProfile', () => {
    const profile = new DevProfile('test-project', 'us-central1', 'dev', 'myapp');

    describe('getNetworkConfig', () => {
        it('should return correct network config', () => {
            const config = profile.getNetworkConfig();

            expect(config.projectId).toBe('test-project');
            expect(config.region).toBe('us-central1');
            expect(config.env).toBe('dev');
            expect(config.prefix).toBe('myapp');
        });

        it('should allow overrides', () => {
            const config = profile.getNetworkConfig({ cidr: '10.1.0.0/16' });
            expect(config.cidr).toBe('10.1.0.0/16');
        });
    });

    describe('getClusterConfig', () => {
        it('should return dev-optimized defaults', () => {
            const config = profile.getClusterConfig();

            expect(config.machineType).toBe('e2-medium');
            expect(config.minNodes).toBe(1);
            expect(config.maxNodes).toBe(3);
            expect(config.spotInstances).toBe(true);
            expect(config.diskSize).toBe(50);
        });

        it('should allow overrides', () => {
            const config = profile.getClusterConfig({ maxNodes: 5 });
            expect(config.maxNodes).toBe(5);
        });
    });
});

describe('StagingProfile', () => {
    const profile = new StagingProfile('test-project', 'us-central1', 'staging', 'myapp');

    describe('getClusterConfig', () => {
        it('should return staging defaults', () => {
            const config = profile.getClusterConfig();

            expect(config.machineType).toBe('n2-standard-2');
            expect(config.minNodes).toBe(2);
            expect(config.maxNodes).toBe(5);
            expect(config.spotInstances).toBe(true);
            expect(config.diskSize).toBe(75);
        });
    });
});

describe('ProdProfile', () => {
    const profile = new ProdProfile('test-project', 'us-central1', 'prod', 'myapp');

    describe('getClusterConfig', () => {
        it('should return prod-optimized defaults', () => {
            const config = profile.getClusterConfig();

            expect(config.machineType).toBe('n2-standard-4');
            expect(config.minNodes).toBe(3);
            expect(config.maxNodes).toBe(10);
            expect(config.spotInstances).toBe(false);
            expect(config.diskSize).toBe(100);
        });

        it('should allow overrides while keeping prod defaults', () => {
            const config = profile.getClusterConfig({ maxNodes: 20 });

            expect(config.maxNodes).toBe(20);
            expect(config.spotInstances).toBe(false); // Still prod default
        });
    });

    describe('commonLabels', () => {
        it('should return correct labels', () => {
            const labels = profile.commonLabels;

            expect(labels.environment).toBe('prod');
            expect(labels['managed-by']).toBe('pulumi');
            expect(labels.project).toBe('test-project');
        });
    });
});
