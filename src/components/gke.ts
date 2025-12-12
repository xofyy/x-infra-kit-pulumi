/**
 * Standard GKE Cluster component with best practices.
 *
 * Features:
 * - Private cluster with private nodes
 * - VPC-native (Alias IPs)
 * - Workload Identity enabled
 * - Autoscaling node pool
 */

import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { ClusterConfig } from '../config';

export interface StandardClusterArgs {
    /** Cluster configuration */
    config: ClusterConfig;
    /** VPC network ID */
    networkId: pulumi.Input<string>;
    /** Subnet ID */
    subnetId: pulumi.Input<string>;
    /** Optional resource labels for cost tracking */
    labels?: Record<string, string>;
}

export class StandardCluster extends pulumi.ComponentResource {
    /** The GKE cluster */
    public readonly cluster: gcp.container.Cluster;
    /** The node pool */
    public readonly nodePool: gcp.container.NodePool;

    constructor(name: string, args: StandardClusterArgs, opts?: pulumi.ComponentResourceOptions) {
        super('x-infra-kit:compute:StandardCluster', name, {}, opts);

        const { config, networkId, subnetId, labels = {} } = args;

        // Merge default labels with custom labels
        const resourceLabels = {
            environment: config.env,
            'managed-by': 'pulumi',
            ...labels,
        };

        // GKE Cluster
        this.cluster = new gcp.container.Cluster(
            `${name}-cluster`,
            {
                name: config.clusterName,
                location: config.effectiveZone,
                network: networkId,
                subnetwork: subnetId,
                removeDefaultNodePool: true,
                initialNodeCount: 1,
                deletionProtection: config.env === 'prod',
                resourceLabels: resourceLabels,

                // VPC-Native: Use secondary ranges from config
                ipAllocationPolicy: {
                    clusterSecondaryRangeName: config.podRangeName,
                    servicesSecondaryRangeName: config.serviceRangeName,
                },

                // Private Cluster: Nodes have no public IPs
                privateClusterConfig: {
                    enablePrivateNodes: true,
                    enablePrivateEndpoint: false,
                    masterIpv4CidrBlock: config.masterCidr,
                },

                // Workload Identity: Secure pod-to-GCP auth
                workloadIdentityConfig: {
                    workloadPool: config.workloadPool,
                },
            },
            { parent: this }
        );

        // Managed Node Pool
        this.nodePool = new gcp.container.NodePool(
            `${name}-pool`,
            {
                name: `${config.clusterName}-pool`,
                location: config.effectiveZone,
                cluster: this.cluster.name,
                initialNodeCount: config.nodeCount,
                autoscaling: {
                    minNodeCount: config.minNodes,
                    maxNodeCount: config.maxNodes,
                    locationPolicy: 'ANY',
                },
                nodeConfig: {
                    machineType: config.machineType,
                    diskSizeGb: config.diskSize,
                    diskType: 'pd-standard',
                    spot: config.spotInstances,
                    labels: resourceLabels,
                    tags: ['gke-node', `${config.clusterName}-gke`],
                    oauthScopes: ['https://www.googleapis.com/auth/cloud-platform'],
                },
            },
            { parent: this, dependsOn: [this.cluster] }
        );

        // Register outputs
        this.registerOutputs({
            clusterName: this.cluster.name,
            clusterEndpoint: this.cluster.endpoint,
            nodePoolName: this.nodePool.name,
        });
    }

    /** Get the cluster name */
    get clusterName(): pulumi.Output<string> {
        return this.cluster.name;
    }

    /** Get the cluster endpoint */
    get clusterEndpoint(): pulumi.Output<string> {
        return this.cluster.endpoint;
    }
}
