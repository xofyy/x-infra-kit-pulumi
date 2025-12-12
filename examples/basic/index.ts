/**
 * Basic Example: Using x-infra-kit StandardPlatform
 *
 * This example demonstrates how to create a complete GCP platform
 * with VPC, GKE cluster, secrets, and workload identity in just a few lines.
 *
 * Prerequisites:
 * 1. GCP Project with billing enabled
 * 2. Required APIs enabled (compute, container, secretmanager, iam)
 * 3. Pulumi CLI installed and configured
 * 4. GCP credentials configured (gcloud auth application-default login)
 *
 * Usage:
 *   cd examples/basic
 *   npm install
 *   pulumi config set gcp:project YOUR_PROJECT_ID
 *   pulumi up
 */

import * as pulumi from '@pulumi/pulumi';
import { StandardPlatform } from '@xofyy/x-infra-kit';

// Get configuration
const config = new pulumi.Config();
const gcpConfig = new pulumi.Config('gcp');

const projectId = gcpConfig.require('project');
const region = gcpConfig.get('region') || 'europe-west1';
const env = config.get('env') || 'dev';

// Create the complete platform infrastructure
const platform = new StandardPlatform('myapp', {
    projectId: projectId,
    region: region,
    env: env,
    prefix: 'myapp',

    // Optional: Create secrets in Secret Manager
    secretIds: ['db-password', 'api-key'],

    // Optional: Set up Workload Identity
    workloadIdentity: {
        saId: 'myapp-workload-sa',
        k8sNamespace: 'default',
        k8sSaName: 'myapp-sa',
        roles: ['roles/secretmanager.secretAccessor'],
    },

    // Optional: Override cluster defaults
    clusterOverrides: {
        maxNodes: 5,
    },

    // Optional: Add custom labels for cost tracking
    labels: {
        team: 'platform',
        'cost-center': 'engineering',
    },
});

// Export useful values
export const vpcName = platform.vpc.network.name;
export const subnetName = platform.vpc.subnet.name;
export const clusterName = platform.clusterName;
export const clusterEndpoint = platform.clusterEndpoint;

// Conditional exports based on configuration
export const workloadIdentityEmail = platform.hasIdentity
    ? platform.identityEmail
    : pulumi.output('Not configured');

export const secretIds = platform.hasSecrets
    ? platform.secrets.secretIds
    : [];
