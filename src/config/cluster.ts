/**
 * GKE Cluster Configuration.
 *
 * @example
 * ```typescript
 * const config = new ClusterConfig({
 *   projectId: 'my-project',
 *   region: 'europe-west1',
 *   env: 'prod',
 *   prefix: 'myapp',
 *   maxNodes: 10,
 * });
 * console.log(config.clusterName); // 'myapp-prod-cluster'
 * ```
 */

import {
    validateEnvironment,
    validateRegion,
    validateMachineType,
    validateMaxNodes,
    validateDiskSize,
    validateNodeCount,
    validateMasterCidr,
    AllowedEnvironment,
    AllowedRegion,
    AllowedMachineType,
} from './constraints';

export interface ClusterConfigArgs {
    /** GCP project ID (required) */
    projectId: string;
    /** GCP region (required) - must be in allowed list */
    region: string;
    /** Environment: dev, staging, prod (required) */
    env: string;
    /** Resource naming prefix (required) */
    prefix: string;
    /** GCP zone (default: {region}-a) */
    zone?: string;
    /** Node machine type (default: e2-medium) - must be in allowed list */
    machineType?: string;
    /** Initial node count (default: 1) */
    nodeCount?: number;
    /** Autoscaler minimum (default: 1) */
    minNodes?: number;
    /** Autoscaler maximum (default: 3) - max 50 */
    maxNodes?: number;
    /** Node disk size in GB (default: 50) - 30-200GB */
    diskSize?: number;
    /** Use spot/preemptible VMs (default: true) */
    spotInstances?: boolean;
    /** Private cluster master CIDR (default: 172.16.0.0/28) */
    masterCidr?: string;
    /** Pod secondary range name */
    podRangeName?: string;
    /** Service secondary range name */
    serviceRangeName?: string;
}

export class ClusterConfig {
    readonly projectId: string;
    readonly region: AllowedRegion;
    readonly env: AllowedEnvironment;
    readonly prefix: string;
    readonly zone: string;
    readonly machineType: AllowedMachineType;
    readonly nodeCount: number;
    readonly minNodes: number;
    readonly maxNodes: number;
    readonly diskSize: number;
    readonly spotInstances: boolean;
    readonly masterCidr: string;
    readonly podRangeName: string;
    readonly serviceRangeName: string;

    constructor(args: ClusterConfigArgs) {
        // Policy Validations
        validateEnvironment(args.env);
        validateRegion(args.region);

        const machineType = args.machineType ?? 'e2-medium';
        validateMachineType(machineType);

        const maxNodes = args.maxNodes ?? 3;
        validateMaxNodes(maxNodes);

        const diskSize = args.diskSize ?? 50;
        validateDiskSize(diskSize);

        const nodeCount = args.nodeCount ?? 1;
        validateNodeCount(nodeCount);

        // Min/Max validation
        const minNodes = args.minNodes ?? 1;
        if (minNodes > maxNodes) {
            throw new Error(
                `minNodes (${minNodes}) cannot be greater than maxNodes (${maxNodes})`
            );
        }

        this.projectId = args.projectId;
        this.region = args.region as AllowedRegion;
        this.env = args.env as AllowedEnvironment;
        this.prefix = args.prefix;
        this.zone = args.zone ?? `${args.region}-a`;
        this.machineType = machineType as AllowedMachineType;
        this.nodeCount = nodeCount;
        this.minNodes = minNodes;
        this.maxNodes = maxNodes;
        this.diskSize = diskSize;
        this.spotInstances = args.spotInstances ?? true;

        const masterCidr = args.masterCidr ?? '172.16.0.0/28';
        validateMasterCidr(masterCidr);
        this.masterCidr = masterCidr;

        this.podRangeName = args.podRangeName ?? 'pod-ranges';
        this.serviceRangeName = args.serviceRangeName ?? 'service-ranges';
    }

    /** Standard naming: {prefix}-{env}-cluster */
    get clusterName(): string {
        return `${this.prefix}-${this.env}-cluster`;
    }

    /** Workload Identity pool: {project_id}.svc.id.goog */
    get workloadPool(): string {
        return `${this.projectId}.svc.id.goog`;
    }

    /** Effective zone (same as constructor zone) */
    get effectiveZone(): string {
        return this.zone;
    }
}
