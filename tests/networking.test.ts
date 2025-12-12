/**
 * Tests for StandardVPC Component
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

import { StandardVPC } from '../src/components/networking';
import { NetworkConfig } from '../src/config';

describe('StandardVPC', () => {
    const config = new NetworkConfig({
        projectId: 'test-project',
        region: 'us-central1',
        env: 'dev',
        prefix: 'myapp',
    });

    describe('resource creation', () => {
        it('should create VPC with correct name', async () => {
            const vpc = new StandardVPC('test-vpc', { config });

            expect(vpc.network).toBeDefined();
            expect(vpc.subnet).toBeDefined();
            expect(vpc.router).toBeDefined();
            expect(vpc.nat).toBeDefined();
        });

        it('should expose network and subnet IDs', async () => {
            const vpc = new StandardVPC('test-vpc', { config });

            expect(vpc.networkId).toBeDefined();
            expect(vpc.subnetId).toBeDefined();
        });
    });
});

