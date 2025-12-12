/**
 * Staging Profile: Production-like but cost-conscious.
 *
 * Features:
 * - Similar to prod for testing
 * - Slightly smaller resources
 * - Spot instances allowed
 */

import { ClusterConfig, ClusterConfigArgs } from '../config';
import { PlatformProfile } from './base';

export class StagingProfile extends PlatformProfile {
    /**
     * Get staging cluster configuration.
     *
     * Default settings:
     * - machineType: n2-standard-2 (smaller than prod)
     * - minNodes: 2
     * - maxNodes: 5
     * - spotInstances: true (cost savings)
     * - diskSize: 75GB
     */
    getClusterConfig(overrides?: Partial<ClusterConfigArgs>): ClusterConfig {
        return new ClusterConfig({
            projectId: this.projectId,
            region: this.region,
            env: this.env,
            prefix: this.prefix,
            machineType: 'n2-standard-2',
            nodeCount: 2,
            minNodes: 2,
            maxNodes: 5,
            spotInstances: true,
            diskSize: 75,
            ...overrides,
        });
    }
}
