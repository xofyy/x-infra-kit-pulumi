/**
 * x-infra-kit - Reusable Pulumi Infrastructure Components for GCP
 *
 * @example Quick Setup with StandardPlatform
 * ```typescript
 * import { StandardPlatform } from '@xofyy/x-infra-kit';
 *
 * const platform = new StandardPlatform('myapp', {
 *   projectId: 'my-gcp-project',
 *   region: 'europe-west1',
 *   env: 'prod',
 *   prefix: 'myapp',
 * });
 *
 * export const clusterName = platform.clusterName;
 * export const clusterEndpoint = platform.clusterEndpoint;
 * ```
 *
 * @example Building Blocks Approach
 * ```typescript
 * import { DevProfile, StandardVPC, StandardCluster } from '@xofyy/x-infra-kit';
 *
 * const profile = new DevProfile('my-project', 'us-central1', 'dev', 'myapp');
 *
 * const vpc = new StandardVPC('networking', {
 *   config: profile.getNetworkConfig(),
 * });
 *
 * const cluster = new StandardCluster('compute', {
 *   config: profile.getClusterConfig({ maxNodes: 10 }),
 *   networkId: vpc.network.id,
 *   subnetId: vpc.subnet.id,
 * });
 * ```
 */

// Configuration
export { NetworkConfig, NetworkConfigArgs, ClusterConfig, ClusterConfigArgs } from './config';

// Profiles
export { PlatformProfile, DevProfile, StagingProfile, ProdProfile } from './profiles';

// Components
export {
    StandardVPC,
    StandardVPCArgs,
    StandardCluster,
    StandardClusterArgs,
    StandardSecrets,
    StandardSecretsArgs,
    StandardIdentity,
    StandardIdentityArgs,
} from './components';

// Composites
export { StandardPlatform, StandardPlatformArgs, WorkloadIdentityConfig } from './composites';
