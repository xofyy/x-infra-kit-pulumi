/**
 * Base class for Platform Profiles (Golden Paths).
 *
 * Enforces naming conventions and provides common configuration patterns.
 */

import { NetworkConfig, NetworkConfigArgs, ClusterConfig, ClusterConfigArgs } from '../config';

export abstract class PlatformProfile {
    constructor(
        protected readonly projectId: string,
        protected readonly region: string,
        protected readonly env: string,
        protected readonly prefix: string
    ) { }

    /** Standard labels applied to all resources */
    get commonLabels(): Record<string, string> {
        return {
            environment: this.env,
            'managed-by': 'pulumi',
            project: this.projectId,
        };
    }

    /**
     * Get network configuration with optional overrides.
     */
    getNetworkConfig(overrides?: Partial<NetworkConfigArgs>): NetworkConfig {
        return new NetworkConfig({
            projectId: this.projectId,
            region: this.region,
            env: this.env,
            prefix: this.prefix,
            ...overrides,
        });
    }

    /**
     * Get cluster configuration with optional overrides.
     * Must be implemented by subclasses.
     */
    abstract getClusterConfig(overrides?: Partial<ClusterConfigArgs>): ClusterConfig;
}
