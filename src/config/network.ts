/**
 * Network Configuration for VPC and Subnet.
 *
 * @example
 * ```typescript
 * const config = new NetworkConfig({
 *   projectId: 'my-project',
 *   region: 'europe-west1',
 *   env: 'prod',
 *   prefix: 'myapp',
 * });
 * console.log(config.vpcName); // 'myapp-prod-vpc'
 * ```
 */

import {
    validateEnvironment,
    validateRegion,
    AllowedEnvironment,
    AllowedRegion,
} from './constraints';

export interface NetworkConfigArgs {
    /** GCP project ID (required) */
    projectId: string;
    /** GCP region (required) - must be in allowed list */
    region: string;
    /** Environment: dev, staging, prod (required) */
    env: string;
    /** Resource naming prefix (required) */
    prefix: string;
    /** Primary subnet CIDR (default: 10.0.0.0/16) */
    cidr?: string;
    /** Secondary range for pods (default: 10.11.0.0/21) */
    podCidr?: string;
    /** Secondary range for services (default: 10.12.0.0/21) */
    serviceCidr?: string;
    /** Name for pod secondary range (default: pod-ranges) */
    podRangeName?: string;
    /** Name for service secondary range (default: service-ranges) */
    serviceRangeName?: string;
}

export class NetworkConfig {
    readonly projectId: string;
    readonly region: AllowedRegion;
    readonly env: AllowedEnvironment;
    readonly prefix: string;
    readonly cidr: string;
    readonly podCidr: string;
    readonly serviceCidr: string;
    readonly podRangeName: string;
    readonly serviceRangeName: string;

    constructor(args: NetworkConfigArgs) {
        // Policy Validations
        validateEnvironment(args.env);
        validateRegion(args.region);

        this.projectId = args.projectId;
        this.region = args.region as AllowedRegion;
        this.env = args.env as AllowedEnvironment;
        this.prefix = args.prefix;
        this.cidr = args.cidr ?? '10.0.0.0/16';
        this.podCidr = args.podCidr ?? '10.11.0.0/21';
        this.serviceCidr = args.serviceCidr ?? '10.12.0.0/21';
        this.podRangeName = args.podRangeName ?? 'pod-ranges';
        this.serviceRangeName = args.serviceRangeName ?? 'service-ranges';
    }

    /** Standard naming: {prefix}-{env}-vpc */
    get vpcName(): string {
        return `${this.prefix}-${this.env}-vpc`;
    }

    /** Standard naming: {prefix}-{env}-subnet */
    get subnetName(): string {
        return `${this.prefix}-${this.env}-subnet`;
    }
}
