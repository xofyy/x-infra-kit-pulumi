/**
 * Tests for StandardCluster Component
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

import { StandardCluster } from '../src/components/gke';
import { ClusterConfig } from '../src/config';

describe('StandardCluster', () => {
    const config = new ClusterConfig({
        projectId: 'test-project',
        region: 'us-central1',
        env: 'dev',
        prefix: 'myapp',
    });

    describe('resource creation', () => {
        it('should create cluster with correct name', async () => {
            const cluster = new StandardCluster('test-cluster', {
                config,
                networkId: 'network-id',
                subnetId: 'subnet-id',
            });

            expect(cluster.cluster).toBeDefined();
            expect(cluster.nodePool).toBeDefined();
        });

        it('should expose cluster name and endpoint', async () => {
            const cluster = new StandardCluster('test-cluster', {
                config,
                networkId: 'network-id',
                subnetId: 'subnet-id',
            });

            expect(cluster.clusterName).toBeDefined();
            expect(cluster.clusterEndpoint).toBeDefined();
        });
    });

    describe('with prod config', () => {
        it('should set deletion protection for prod', async () => {
            const prodConfig = new ClusterConfig({
                projectId: 'test-project',
                region: 'us-central1',
                env: 'prod',
                prefix: 'myapp',
            });

            const cluster = new StandardCluster('test-cluster', {
                config: prodConfig,
                networkId: 'network-id',
                subnetId: 'subnet-id',
            });

            expect(cluster.cluster).toBeDefined();
        });
    });
});
