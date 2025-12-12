/**
 * Security components for Secret Manager and Workload Identity.
 */

import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';

// ============================================
// StandardSecrets
// ============================================

export interface StandardSecretsArgs {
    /** List of secret IDs to create */
    secretIds: string[];
}

/**
 * Creates Secret Manager secrets with automatic replication.
 *
 * Note: This creates the secret containers only, not the secret values.
 * Secret values should be added manually or via CI/CD.
 */
export class StandardSecrets extends pulumi.ComponentResource {
    /** List of created secret IDs */
    public readonly secretIds: string[];
    /** Map of secret ID to Secret resource */
    private readonly secrets: Map<string, gcp.secretmanager.Secret>;

    constructor(name: string, args: StandardSecretsArgs, opts?: pulumi.ComponentResourceOptions) {
        super('x-infra-kit:security:StandardSecrets', name, {}, opts);

        const { secretIds } = args;

        if (!secretIds || secretIds.length === 0) {
            throw new Error('secretIds cannot be empty');
        }

        this.secretIds = secretIds;
        this.secrets = new Map();

        for (const secretId of secretIds) {
            if (!secretId || !secretId.trim()) {
                throw new Error('secretId cannot be empty or whitespace');
            }

            const secret = new gcp.secretmanager.Secret(
                `${name}-${secretId}`,
                {
                    secretId: secretId,
                    replication: {
                        auto: {},
                    },
                },
                { parent: this }
            );

            this.secrets.set(secretId, secret);
        }

        // Register outputs
        this.registerOutputs({
            secretIds: this.secretIds,
        });
    }

    /** Get a specific secret by ID */
    getSecret(secretId: string): gcp.secretmanager.Secret {
        const secret = this.secrets.get(secretId);
        if (!secret) {
            throw new Error(
                `Secret '${secretId}' not found. Available: ${Array.from(this.secrets.keys()).join(', ')}`
            );
        }
        return secret;
    }
}

// ============================================
// StandardIdentity
// ============================================

export interface StandardIdentityArgs {
    /** GCP project ID */
    projectId: string;
    /** Service account ID (6-30 chars, lowercase, hyphens allowed) */
    saId: string;
    /** Kubernetes namespace where the SA exists */
    k8sNamespace: string;
    /** Kubernetes ServiceAccount name */
    k8sSaName: string;
    /** Optional list of IAM roles to grant */
    roles?: string[];
}

/**
 * Sets up Workload Identity for Kubernetes-to-GCP authentication.
 *
 * Creates:
 * 1. Google Service Account (GSA)
 * 2. IAM role bindings for the GSA
 * 3. Workload Identity binding (K8s SA → GSA)
 */
export class StandardIdentity extends pulumi.ComponentResource {
    /** The created Google Service Account */
    public readonly gsa: gcp.serviceaccount.Account;
    /** The IAM role bindings */
    private readonly roleBindings: gcp.projects.IAMMember[];
    /** The Workload Identity binding */
    public readonly workloadIdentityBinding: gcp.serviceaccount.IAMBinding;

    constructor(name: string, args: StandardIdentityArgs, opts?: pulumi.ComponentResourceOptions) {
        super('x-infra-kit:security:StandardIdentity', name, {}, opts);

        const { projectId, saId, k8sNamespace, k8sSaName, roles = [] } = args;

        // Validation
        if (!projectId) {
            throw new Error('projectId is required');
        }
        if (!saId || saId.length < 6 || saId.length > 30) {
            throw new Error('saId must be 6-30 characters');
        }
        if (!k8sNamespace) {
            throw new Error('k8sNamespace is required');
        }
        if (!k8sSaName) {
            throw new Error('k8sSaName is required');
        }

        // 1. Create Google Service Account (GSA)
        this.gsa = new gcp.serviceaccount.Account(
            `${name}-sa`,
            {
                accountId: saId,
                displayName: `Workload Identity SA for ${saId}`,
            },
            { parent: this }
        );

        // 2. Grant GSA Access to specified roles
        this.roleBindings = [];
        for (let i = 0; i < roles.length; i++) {
            const role = roles[i];
            const binding = new gcp.projects.IAMMember(
                `${name}-role-${i}`,
                {
                    project: projectId,
                    role: role,
                    member: pulumi.interpolate`serviceAccount:${this.gsa.email}`,
                },
                { parent: this }
            );
            this.roleBindings.push(binding);
        }

        // 3. Bind K8s SA to GSA (Workload Identity)
        this.workloadIdentityBinding = new gcp.serviceaccount.IAMBinding(
            `${name}-wi-binding`,
            {
                serviceAccountId: this.gsa.name,
                role: 'roles/iam.workloadIdentityUser',
                members: [`serviceAccount:${projectId}.svc.id.goog[${k8sNamespace}/${k8sSaName}]`],
            },
            { parent: this }
        );

        // Register outputs
        this.registerOutputs({
            email: this.gsa.email,
        });
    }

    /** Get the service account email address */
    get email(): pulumi.Output<string> {
        return this.gsa.email;
    }
}
