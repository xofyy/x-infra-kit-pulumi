/**
 * Complete platform infrastructure in a single component.
 *
 * Creates: VPC + Subnet + NAT + GKE Cluster + (optional) Secrets + (optional) Workload Identity
 *
 * This is the recommended way to use x-infra-kit for most use cases.
 *
 * @example
 * ```typescript
 * // Minimal usage
 * const platform = new StandardPlatform('myapp', {
 *   projectId: 'my-project',
 *   region: 'europe-west1',
 *   env: 'dev',
 *   prefix: 'myapp',
 * });
 *
 * // Full usage with all options
 * const platform = new StandardPlatform('myapp', {
 *   projectId: 'my-project',
 *   region: 'europe-west1',
 *   env: 'prod',
 *   prefix: 'myapp',
 *   secretIds: ['db-password', 'api-key'],
 *   workloadIdentity: {
 *     saId: 'workload-sa',
 *     k8sNamespace: 'default',
 *     k8sSaName: 'app-sa',
 *     roles: ['roles/secretmanager.secretAccessor'],
 *   },
 *   clusterOverrides: {
 *     maxNodes: 20,
 *     machineType: 'n2-standard-8',
 *   },
 * });
 * ```
 */

import * as pulumi from '@pulumi/pulumi';
import { ClusterConfigArgs } from '../config';
import { StandardVPC, StandardCluster, StandardSecrets, StandardIdentity } from '../components';
import { PlatformProfile, DevProfile, StagingProfile, ProdProfile } from '../profiles';

export interface WorkloadIdentityConfig {
    /** Service account ID (6-30 chars) */
    saId: string;
    /** Kubernetes namespace */
    k8sNamespace: string;
    /** Kubernetes ServiceAccount name */
    k8sSaName: string;
    /** IAM roles to grant */
    roles?: string[];
}

export interface StandardPlatformArgs {
    /** GCP project ID (required) */
    projectId: string;
    /** GCP region (required) */
    region: string;
    /** Environment: dev, staging, prod (required) */
    env: string;
    /** Resource naming prefix (required) */
    prefix: string;
    /** List of secret IDs to create in Secret Manager (optional) */
    secretIds?: string[];
    /** Workload Identity configuration (optional) */
    workloadIdentity?: WorkloadIdentityConfig;
    /** Override any ClusterConfig parameter (optional) */
    clusterOverrides?: Partial<ClusterConfigArgs>;
    /** Resource labels for cost tracking (optional) */
    labels?: Record<string, string>;
}

export class StandardPlatform extends pulumi.ComponentResource {
    /** The VPC component */
    public readonly vpc: StandardVPC;
    /** The GKE cluster component */
    public readonly cluster: StandardCluster;
    /** The secrets component (if configured) */
    private _secrets?: StandardSecrets;
    /** The identity component (if configured) */
    private _identity?: StandardIdentity;

    // Store metadata
    public readonly projectId: string;
    public readonly region: string;
    public readonly env: string;
    public readonly prefix: string;

    constructor(name: string, args: StandardPlatformArgs, opts?: pulumi.ComponentResourceOptions) {
        super('x-infra-kit:composites:StandardPlatform', name, {}, opts);

        const { projectId, region, env, prefix, secretIds, workloadIdentity, clusterOverrides = {}, labels = {} } = args;

        // Store metadata
        this.projectId = projectId;
        this.region = region;
        this.env = env;
        this.prefix = prefix;

        // 1. Select profile based on environment
        let profile: PlatformProfile;
        if (env === 'prod') {
            profile = new ProdProfile(projectId, region, env, prefix);
        } else if (env === 'staging') {
            profile = new StagingProfile(projectId, region, env, prefix);
        } else {
            profile = new DevProfile(projectId, region, env, prefix);
        }

        // 2. Create VPC and Networking
        const networkConfig = profile.getNetworkConfig();
        this.vpc = new StandardVPC(
            `${name}-networking`,
            { config: networkConfig },
            { parent: this }
        );

        // 3. Create GKE Cluster (with optional overrides)
        const clusterConfig = profile.getClusterConfig({
            podRangeName: networkConfig.podRangeName,
            serviceRangeName: networkConfig.serviceRangeName,
            ...clusterOverrides,
        });
        this.cluster = new StandardCluster(
            `${name}-compute`,
            {
                config: clusterConfig,
                networkId: this.vpc.network.id,
                subnetId: this.vpc.subnet.id,
                labels: labels,
            },
            { parent: this }
        );

        // 4. Create Secrets (optional)
        if (secretIds && secretIds.length > 0) {
            this._secrets = new StandardSecrets(
                `${name}-secrets`,
                { secretIds },
                { parent: this }
            );
        }

        // 5. Create Workload Identity (optional)
        if (workloadIdentity) {
            const { saId, k8sNamespace, k8sSaName, roles = [] } = workloadIdentity;

            if (!saId || !k8sNamespace || !k8sSaName) {
                throw new Error(
                    "workloadIdentity must contain 'saId', 'k8sNamespace', and 'k8sSaName'"
                );
            }

            this._identity = new StandardIdentity(
                `${name}-identity`,
                {
                    projectId,
                    saId,
                    k8sNamespace,
                    k8sSaName,
                    roles,
                },
                { parent: this }
            );
        }

        // Register outputs
        this.registerOutputs({
            vpcId: this.vpc.network.id,
            subnetId: this.vpc.subnet.id,
            clusterName: this.cluster.cluster.name,
            clusterEndpoint: this.cluster.cluster.endpoint,
        });
    }

    // --- Safe Access Properties ---

    /** Check if secrets were configured */
    get hasSecrets(): boolean {
        return this._secrets !== undefined;
    }

    /** Check if workload identity was configured */
    get hasIdentity(): boolean {
        return this._identity !== undefined;
    }

    /**
     * Get the StandardSecrets instance.
     * @throws Error if secrets were not configured
     */
    get secrets(): StandardSecrets {
        if (!this._secrets) {
            throw new Error(
                "Secrets not configured. Provide 'secretIds' parameter to StandardPlatform."
            );
        }
        return this._secrets;
    }

    /**
     * Get the StandardIdentity instance.
     * @throws Error if workload identity was not configured
     */
    get identity(): StandardIdentity {
        if (!this._identity) {
            throw new Error(
                "Workload Identity not configured. Provide 'workloadIdentity' parameter to StandardPlatform."
            );
        }
        return this._identity;
    }

    // --- Convenience Properties ---

    /** Get the GKE cluster name */
    get clusterName(): pulumi.Output<string> {
        return this.cluster.cluster.name;
    }

    /** Get the GKE cluster endpoint */
    get clusterEndpoint(): pulumi.Output<string> {
        return this.cluster.cluster.endpoint;
    }

    /** Get the VPC network ID */
    get networkId(): pulumi.Output<string> {
        return this.vpc.network.id;
    }

    /** Get the subnet ID */
    get subnetId(): pulumi.Output<string> {
        return this.vpc.subnet.id;
    }

    /** Get the workload identity service account email */
    get identityEmail(): pulumi.Output<string> {
        return this.identity.email;
    }
}
