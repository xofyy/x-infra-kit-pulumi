# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-11

### Added

- **Core Configuration Types**
  - `NetworkConfig` - VPC and subnet configuration with smart defaults
  - `ClusterConfig` - GKE cluster configuration with validation

- **Infrastructure Components**
  - `StandardVPC` - VPC with subnet, Cloud Router, and Cloud NAT
  - `StandardCluster` - Private GKE cluster with autoscaling node pool
  - `StandardSecrets` - Secret Manager secret containers
  - `StandardIdentity` - Workload Identity setup for K8s-to-GCP auth

- **Composite Components**
  - `StandardPlatform` - Complete platform infrastructure in one component

- **Environment Profiles**
  - `DevProfile` - Cost-optimized settings (spot instances, small nodes)
  - `StagingProfile` - Production-like but cost-conscious
  - `ProdProfile` - HA-focused settings (no spot, larger nodes)

- **Policy Constraints**
  - Environment validation (dev, staging, prod only)
  - Region whitelist (5 allowed regions)
  - Machine type whitelist (11 allowed types)
  - Numeric limits (maxNodes: 1-50, diskSize: 30-200GB, nodeCount: 1-20)
  - Master CIDR validation (/28, RFC 1918, aligned)

- **Resource Labels**
  - Automatic labels on GKE resources (environment, managed-by)
  - Custom label support for cost tracking

- **Testing**
  - 83 unit tests with Pulumi mocking
  - Configuration validation tests
  - Profile behavior tests
  - Component creation tests

- **CI/CD**
  - GitHub Actions workflow (lint, test, build, publish)
  - Multi-node version testing (18, 20, 22)
  - Automatic NPM publishing on version tags
  - Dependabot for dependency updates

### Technical Details

- Built with TypeScript 5.3+ and Pulumi 3.x
- Peer dependencies: @pulumi/pulumi ^3.0.0, @pulumi/gcp ^7.0.0
- ESLint + Prettier for code quality
- Jest for testing with ts-jest

---

## [Unreleased]

### Planned
- Integration tests with Pulumi Automation API
- Additional GCP regions support
- Firewall rule components
- Cloud SQL integration
