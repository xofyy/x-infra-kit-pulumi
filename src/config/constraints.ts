/**
 * Company Policy Constraints
 *
 * These constants define the allowed values for various parameters
 * to enforce company standards and prevent misconfigurations.
 */

// ============================================
// Environment Constraints
// ============================================

/** Allowed environment values */
export const ALLOWED_ENVIRONMENTS = ['dev', 'staging', 'prod'] as const;
export type AllowedEnvironment = (typeof ALLOWED_ENVIRONMENTS)[number];

// ============================================
// Region Constraints
// ============================================

/** Allowed GCP regions (add more as needed) */
export const ALLOWED_REGIONS = [
    'europe-west1',    // Belgium
    'europe-west3',    // Frankfurt
    'europe-west4',    // Netherlands
    'us-central1',     // Iowa
    'us-east1',        // South Carolina
] as const;
export type AllowedRegion = (typeof ALLOWED_REGIONS)[number];

// ============================================
// Machine Type Constraints
// ============================================

/** Allowed machine types for GKE nodes */
export const ALLOWED_MACHINE_TYPES = [
    // Cost-effective (Dev/Staging)
    'e2-micro',
    'e2-small',
    'e2-medium',
    'e2-standard-2',
    'e2-standard-4',
    // Performance (Prod)
    'n2-standard-2',
    'n2-standard-4',
    'n2-standard-8',
    'n2-highmem-2',
    'n2-highmem-4',
] as const;
export type AllowedMachineType = (typeof ALLOWED_MACHINE_TYPES)[number];

// ============================================
// Numeric Constraints
// ============================================

export const CONSTRAINTS = {
    /** Maximum allowed nodes per cluster */
    maxNodes: {
        min: 1,
        max: 50,
    },
    /** Disk size limits (GB) */
    diskSize: {
        min: 30,
        max: 200,
    },
    /** Node count limits */
    nodeCount: {
        min: 1,
        max: 20,
    },
} as const;

// ============================================
// Validation Functions
// ============================================

export function validateEnvironment(env: string): asserts env is AllowedEnvironment {
    if (!ALLOWED_ENVIRONMENTS.includes(env as AllowedEnvironment)) {
        throw new Error(
            `Invalid environment '${env}'. Allowed: ${ALLOWED_ENVIRONMENTS.join(', ')}`
        );
    }
}

export function validateRegion(region: string): asserts region is AllowedRegion {
    if (!ALLOWED_REGIONS.includes(region as AllowedRegion)) {
        throw new Error(
            `Invalid region '${region}'. Allowed: ${ALLOWED_REGIONS.join(', ')}`
        );
    }
}

export function validateMachineType(machineType: string): asserts machineType is AllowedMachineType {
    if (!ALLOWED_MACHINE_TYPES.includes(machineType as AllowedMachineType)) {
        throw new Error(
            `Invalid machine type '${machineType}'. Allowed: ${ALLOWED_MACHINE_TYPES.join(', ')}`
        );
    }
}

export function validateMaxNodes(maxNodes: number): void {
    if (maxNodes < CONSTRAINTS.maxNodes.min || maxNodes > CONSTRAINTS.maxNodes.max) {
        throw new Error(
            `maxNodes must be between ${CONSTRAINTS.maxNodes.min} and ${CONSTRAINTS.maxNodes.max} (got ${maxNodes})`
        );
    }
}

export function validateDiskSize(diskSize: number): void {
    if (diskSize < CONSTRAINTS.diskSize.min || diskSize > CONSTRAINTS.diskSize.max) {
        throw new Error(
            `diskSize must be between ${CONSTRAINTS.diskSize.min}GB and ${CONSTRAINTS.diskSize.max}GB (got ${diskSize}GB)`
        );
    }
}

export function validateNodeCount(nodeCount: number): void {
    if (nodeCount < CONSTRAINTS.nodeCount.min || nodeCount > CONSTRAINTS.nodeCount.max) {
        throw new Error(
            `nodeCount must be between ${CONSTRAINTS.nodeCount.min} and ${CONSTRAINTS.nodeCount.max} (got ${nodeCount})`
        );
    }
}

// ============================================
// Master CIDR Validation
// ============================================

/**
 * Validates GKE master CIDR block.
 * 
 * Requirements:
 * - Must be a /28 network (GKE requirement - 16 IPs)
 * - Must be in RFC 1918 private range
 * - Must be valid CIDR format
 * 
 * @example
 * validateMasterCidr('172.16.0.0/28'); // OK
 * validateMasterCidr('172.16.0.0/24'); // Error: must be /28
 * validateMasterCidr('8.8.8.0/28');    // Error: must be private
 */
export function validateMasterCidr(cidr: string): void {
    // Check format: x.x.x.x/28
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/28$/;
    if (!cidrRegex.test(cidr)) {
        throw new Error(
            `masterCidr must be a /28 CIDR block (e.g., '172.16.0.0/28'). Got: '${cidr}'`
        );
    }

    // Extract IP part
    const ip = cidr.split('/')[0];
    const octets = ip.split('.').map(Number);

    // Validate octet values
    if (octets.some((o) => o < 0 || o > 255)) {
        throw new Error(`Invalid IP address in masterCidr: '${ip}'`);
    }

    // Check if in RFC 1918 private range
    const isPrivate =
        // 10.0.0.0/8
        octets[0] === 10 ||
        // 172.16.0.0/12
        (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
        // 192.168.0.0/16
        (octets[0] === 192 && octets[1] === 168);

    if (!isPrivate) {
        throw new Error(
            `masterCidr must be in RFC 1918 private range (10.x.x.x, 172.16-31.x.x, or 192.168.x.x). Got: '${ip}'`
        );
    }

    // Validate /28 alignment (last octet should be multiple of 16)
    if (octets[3] % 16 !== 0) {
        throw new Error(
            `masterCidr /28 block must be aligned (last octet must be 0, 16, 32, 48, ...). Got: '${ip}'`
        );
    }
}
