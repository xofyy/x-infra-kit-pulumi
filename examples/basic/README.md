# Basic Example

This example demonstrates how to use `@xofyy/x-infra-kit` to create a complete GCP platform infrastructure.

## What it Creates

- VPC with private subnet
- Cloud Router and NAT
- Private GKE cluster with autoscaling
- Secret Manager secrets (optional)
- Workload Identity binding (optional)

## Prerequisites

1. **GCP Project** with billing enabled
2. **Required APIs** enabled:
   ```bash
   gcloud services enable compute.googleapis.com --project=YOUR_PROJECT
   gcloud services enable container.googleapis.com --project=YOUR_PROJECT
   gcloud services enable secretmanager.googleapis.com --project=YOUR_PROJECT
   gcloud services enable iam.googleapis.com --project=YOUR_PROJECT
   ```
3. **Pulumi CLI** installed
4. **GCP credentials** configured:
   ```bash
   gcloud auth application-default login
   ```

## Usage

```bash
# Install dependencies
npm install

# Configure GCP project
pulumi config set gcp:project YOUR_PROJECT_ID

# Optional: Change environment (default: dev)
pulumi config set env staging

# Preview changes
pulumi preview

# Deploy
pulumi up

# Destroy when done
pulumi destroy
```

## Configuration

| Config | Default | Description |
|--------|---------|-------------|
| `gcp:project` | (required) | GCP Project ID |
| `gcp:region` | `europe-west1` | GCP Region |
| `env` | `dev` | Environment (dev/staging/prod) |

## Outputs

| Output | Description |
|--------|-------------|
| `vpcName` | VPC network name |
| `subnetName` | Subnet name |
| `clusterName` | GKE cluster name |
| `clusterEndpoint` | GKE API endpoint |
| `workloadIdentityEmail` | Service account email |
| `secretIds` | Created secret IDs |

## Connecting to the Cluster

```bash
gcloud container clusters get-credentials CLUSTER_NAME --zone ZONE --project PROJECT_ID
kubectl get nodes
```
