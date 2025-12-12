/**
 * Configuration types for x-infra-kit.
 */

export { NetworkConfig, NetworkConfigArgs } from './network';
export { ClusterConfig, ClusterConfigArgs } from './cluster';
export {
    // Types
    AllowedEnvironment,
    AllowedRegion,
    AllowedMachineType,
    // Constants
    ALLOWED_ENVIRONMENTS,
    ALLOWED_REGIONS,
    ALLOWED_MACHINE_TYPES,
    CONSTRAINTS,
    // Validators
    validateEnvironment,
    validateRegion,
    validateMachineType,
    validateMaxNodes,
    validateDiskSize,
    validateNodeCount,
    validateMasterCidr,
} from './constraints';
