/**
 * Development Profile: Cost-optimized, relaxed availability.
 *
 * Features:
 * - Single zone deployment
 * - Spot/Preemptible instances enabled
 * - Smaller machine types
 * - Lower node count limits
 */

import { ClusterConfig, ClusterConfigArgs } from '../config';
import { PlatformProfile } from './base';

export class DevProfile extends PlatformProfile {
    /**
     * Get dev-optimized cluster configuration.
     *
     * Default settings:
     * - machineType: e2-medium (cost-effective)
     * - maxNodes: 3 (limited scaling)
     * - spotInstances: true (cost savings)
     * - diskSize: 50GB
     */
    getClusterConfig(overrides?: Partial<ClusterConfigArgs>): ClusterConfig {
        return new ClusterConfig({
            projectId: this.projectId,
            region: this.region,
            env: this.env,
            prefix: this.prefix,
            machineType: 'e2-medium',
            nodeCount: 1,
            minNodes: 1,
            maxNodes: 3,
            spotInstances: true,
            diskSize: 50,
            ...overrides,
        });
    }
}
