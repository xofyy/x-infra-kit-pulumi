/**
 * Production Profile: High Availability, Performance, Stability.
 *
 * Features:
 * - Higher node counts for HA
 * - No spot instances (stability)
 * - Larger machine types
 * - Higher disk sizes
 */

import { ClusterConfig, ClusterConfigArgs } from '../config';
import { PlatformProfile } from './base';

export class ProdProfile extends PlatformProfile {
    /**
     * Get production-optimized cluster configuration.
     *
     * Default settings:
     * - machineType: n2-standard-4 (balanced performance)
     * - minNodes: 3 (HA guarantee)
     * - maxNodes: 10 (scaling headroom)
     * - spotInstances: false (stability)
     * - diskSize: 100GB
     */
    getClusterConfig(overrides?: Partial<ClusterConfigArgs>): ClusterConfig {
        return new ClusterConfig({
            projectId: this.projectId,
            region: this.region,
            env: this.env,
            prefix: this.prefix,
            machineType: 'n2-standard-4',
            nodeCount: 3,
            minNodes: 3,
            maxNodes: 10,
            spotInstances: false,
            diskSize: 100,
            ...overrides,
        });
    }
}
