# x-infra-kit

Reusable Pulumi Infrastructure Components for Google Cloud Platform.

[![npm version](https://badge.fury.io/js/@xofyy%2Fx-infra-kit.svg)](https://www.npmjs.com/package/@xofyy/x-infra-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **StandardPlatform**: Complete GKE + VPC infrastructure in one component
- **Building Blocks**: Modular components for custom architectures
- **Environment Profiles**: Dev, Staging, and Production presets
- **Type Safety**: Full TypeScript support with strict types
- **Best Practices**: Private clusters, Workload Identity, NAT, etc.

## Quick Start

### 1. Install

```bash
npm install @xofyy/x-infra-kit @pulumi/pulumi @pulumi/gcp
```

### 2. Create Infrastructure

```typescript
import * as pulumi from '@pulumi/pulumi';
import { StandardPlatform } from '@xofyy/x-infra-kit';

const platform = new StandardPlatform('myapp', {
  projectId: 'my-gcp-project',
  region: 'europe-west1',
  env: 'dev',
  prefix: 'myapp',
});

export const clusterName = platform.clusterName;
export const clusterEndpoint = platform.clusterEndpoint;
export const vpcName = platform.vpc.network.name;
```

### 3. Deploy

```bash
pulumi up
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     StandardPlatform                         │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ StandardVPC │  │StandardCluster│ │StandardSecrets│       │
│  │             │  │             │  │(optional)    │         │
│  │ • VPC       │  │ • GKE       │  │             │         │
│  │ • Subnet    │  │ • Node Pool │  ├─────────────┤         │
│  │ • Router    │  │             │  │StandardIdentity│       │
│  │ • NAT       │  │             │  │(optional)    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### StandardPlatform (Recommended)

Complete infrastructure in one component:

```typescript
const platform = new StandardPlatform('prod', {
  projectId: 'my-project',
  region: 'europe-west1',
  env: 'prod',
  prefix: 'myapp',
  secretIds: ['db-password', 'api-key'],
  workloadIdentity: {
    saId: 'workload-sa',
    k8sNamespace: 'default',
    k8sSaName: 'app-sa',
    roles: ['roles/secretmanager.secretAccessor'],
  },
  clusterOverrides: {
    maxNodes: 20,
    machineType: 'n2-standard-8',
  },
});
```

### Building Blocks Approach

For custom architectures:

```typescript
import { DevProfile, StandardVPC, StandardCluster } from '@xofyy/x-infra-kit';

const profile = new DevProfile('my-project', 'us-central1', 'dev', 'myapp');

const vpc = new StandardVPC('networking', {
  config: profile.getNetworkConfig(),
});

const cluster = new StandardCluster('compute', {
  config: profile.getClusterConfig({ maxNodes: 10 }),
  networkId: vpc.network.id,
  subnetId: vpc.subnet.id,
});
```

## Profiles

| Profile | Machine Type | Nodes | Spot | Disk |
|---------|--------------|-------|------|------|
| **DevProfile** | e2-medium | 1-3 | Yes | 50GB |
| **StagingProfile** | n2-standard-2 | 2-5 | Yes | 75GB |
| **ProdProfile** | n2-standard-4 | 3-10 | No | 100GB |

## Prerequisites

Enable required GCP APIs:

```bash
gcloud services enable compute.googleapis.com --project=YOUR_PROJECT
gcloud services enable container.googleapis.com --project=YOUR_PROJECT
gcloud services enable secretmanager.googleapis.com --project=YOUR_PROJECT
gcloud services enable iam.googleapis.com --project=YOUR_PROJECT
```

## API Reference

### StandardPlatform

| Property | Type | Description |
|----------|------|-------------|
| `vpc` | StandardVPC | VPC component |
| `cluster` | StandardCluster | GKE cluster component |
| `clusterName` | Output<string> | Cluster name |
| `clusterEndpoint` | Output<string> | Cluster API endpoint |
| `hasSecrets` | boolean | Whether secrets are configured |
| `hasIdentity` | boolean | Whether identity is configured |

### StandardVPC

| Property | Type | Description |
|----------|------|-------------|
| `network` | gcp.compute.Network | VPC network |
| `subnet` | gcp.compute.Subnetwork | Subnet |
| `router` | gcp.compute.Router | Cloud Router |
| `nat` | gcp.compute.RouterNat | Cloud NAT |

### StandardCluster

| Property | Type | Description |
|----------|------|-------------|
| `cluster` | gcp.container.Cluster | GKE cluster |
| `nodePool` | gcp.container.NodePool | Node pool |

## License

MIT
