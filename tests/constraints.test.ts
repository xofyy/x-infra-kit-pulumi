/**
 * Tests for Constraints validation
 */

import {
    validateEnvironment,
    validateRegion,
    validateMachineType,
    validateMaxNodes,
    validateDiskSize,
    validateNodeCount,
    validateMasterCidr,
    ALLOWED_ENVIRONMENTS,
    ALLOWED_REGIONS,
    ALLOWED_MACHINE_TYPES,
    CONSTRAINTS,
} from '../src/config/constraints';

describe('Environment Validation', () => {
    it('should accept valid environments', () => {
        expect(() => validateEnvironment('dev')).not.toThrow();
        expect(() => validateEnvironment('staging')).not.toThrow();
        expect(() => validateEnvironment('prod')).not.toThrow();
    });

    it('should reject invalid environments', () => {
        expect(() => validateEnvironment('production')).toThrow("Invalid environment 'production'");
        expect(() => validateEnvironment('test')).toThrow("Invalid environment 'test'");
        expect(() => validateEnvironment('local')).toThrow("Invalid environment 'local'");
    });

    it('should have correct allowed values', () => {
        expect(ALLOWED_ENVIRONMENTS).toEqual(['dev', 'staging', 'prod']);
    });
});

describe('Region Validation', () => {
    it('should accept valid regions', () => {
        expect(() => validateRegion('europe-west1')).not.toThrow();
        expect(() => validateRegion('europe-west3')).not.toThrow();
        expect(() => validateRegion('us-central1')).not.toThrow();
    });

    it('should reject invalid regions', () => {
        expect(() => validateRegion('asia-east1')).toThrow("Invalid region 'asia-east1'");
        expect(() => validateRegion('us-west2')).toThrow("Invalid region 'us-west2'");
        expect(() => validateRegion('random-region')).toThrow("Invalid region 'random-region'");
    });

    it('should have correct allowed values', () => {
        expect(ALLOWED_REGIONS).toContain('europe-west1');
        expect(ALLOWED_REGIONS).toContain('us-central1');
    });
});

describe('Machine Type Validation', () => {
    it('should accept valid machine types', () => {
        expect(() => validateMachineType('e2-medium')).not.toThrow();
        expect(() => validateMachineType('n2-standard-4')).not.toThrow();
        expect(() => validateMachineType('e2-standard-2')).not.toThrow();
    });

    it('should reject invalid machine types', () => {
        expect(() => validateMachineType('n1-standard-1')).toThrow("Invalid machine type 'n1-standard-1'");
        expect(() => validateMachineType('custom-8-16384')).toThrow('Invalid machine type');
    });

    it('should have correct allowed values', () => {
        expect(ALLOWED_MACHINE_TYPES).toContain('e2-medium');
        expect(ALLOWED_MACHINE_TYPES).toContain('n2-standard-4');
    });
});

describe('Numeric Constraints', () => {
    describe('maxNodes', () => {
        it('should accept valid values', () => {
            expect(() => validateMaxNodes(1)).not.toThrow();
            expect(() => validateMaxNodes(50)).not.toThrow();
            expect(() => validateMaxNodes(25)).not.toThrow();
        });

        it('should reject values outside range', () => {
            expect(() => validateMaxNodes(0)).toThrow('maxNodes must be between 1 and 50');
            expect(() => validateMaxNodes(51)).toThrow('maxNodes must be between 1 and 50');
            expect(() => validateMaxNodes(100)).toThrow('maxNodes must be between 1 and 50');
        });

        it('should have correct limits', () => {
            expect(CONSTRAINTS.maxNodes.min).toBe(1);
            expect(CONSTRAINTS.maxNodes.max).toBe(50);
        });
    });

    describe('diskSize', () => {
        it('should accept valid values', () => {
            expect(() => validateDiskSize(30)).not.toThrow();
            expect(() => validateDiskSize(200)).not.toThrow();
            expect(() => validateDiskSize(100)).not.toThrow();
        });

        it('should reject values outside range', () => {
            expect(() => validateDiskSize(10)).toThrow('diskSize must be between 30GB and 200GB');
            expect(() => validateDiskSize(201)).toThrow('diskSize must be between 30GB and 200GB');
        });

        it('should have correct limits', () => {
            expect(CONSTRAINTS.diskSize.min).toBe(30);
            expect(CONSTRAINTS.diskSize.max).toBe(200);
        });
    });

    describe('nodeCount', () => {
        it('should accept valid values', () => {
            expect(() => validateNodeCount(1)).not.toThrow();
            expect(() => validateNodeCount(20)).not.toThrow();
        });

        it('should reject values outside range', () => {
            expect(() => validateNodeCount(0)).toThrow('nodeCount must be between 1 and 20');
            expect(() => validateNodeCount(21)).toThrow('nodeCount must be between 1 and 20');
        });

        it('should have correct limits', () => {
            expect(CONSTRAINTS.nodeCount.min).toBe(1);
            expect(CONSTRAINTS.nodeCount.max).toBe(20);
        });
    });
});

describe('Master CIDR Validation', () => {
    describe('valid CIDRs', () => {
        it('should accept default CIDR', () => {
            expect(() => validateMasterCidr('172.16.0.0/28')).not.toThrow();
        });

        it('should accept valid /28 private CIDRs', () => {
            expect(() => validateMasterCidr('10.0.0.0/28')).not.toThrow();
            expect(() => validateMasterCidr('10.1.0.16/28')).not.toThrow();
            expect(() => validateMasterCidr('172.16.0.32/28')).not.toThrow();
            expect(() => validateMasterCidr('172.31.255.240/28')).not.toThrow();
            expect(() => validateMasterCidr('192.168.0.0/28')).not.toThrow();
            expect(() => validateMasterCidr('192.168.1.48/28')).not.toThrow();
        });
    });

    describe('invalid subnet mask', () => {
        it('should reject non-/28 masks', () => {
            expect(() => validateMasterCidr('172.16.0.0/24')).toThrow('/28 CIDR block');
            expect(() => validateMasterCidr('172.16.0.0/16')).toThrow('/28 CIDR block');
            expect(() => validateMasterCidr('172.16.0.0/32')).toThrow('/28 CIDR block');
            expect(() => validateMasterCidr('172.16.0.0/29')).toThrow('/28 CIDR block');
        });
    });

    describe('invalid format', () => {
        it('should reject invalid formats', () => {
            expect(() => validateMasterCidr('invalid')).toThrow('/28 CIDR block');
            expect(() => validateMasterCidr('172.16.0.0')).toThrow('/28 CIDR block');
            expect(() => validateMasterCidr('172.16.0/28')).toThrow('/28 CIDR block');
        });
    });

    describe('non-private ranges', () => {
        it('should reject public IP ranges', () => {
            expect(() => validateMasterCidr('8.8.8.0/28')).toThrow('RFC 1918 private range');
            expect(() => validateMasterCidr('1.2.3.0/28')).toThrow('RFC 1918 private range');
            expect(() => validateMasterCidr('203.0.113.0/28')).toThrow('RFC 1918 private range');
        });

        it('should reject 172.x outside 16-31 range', () => {
            expect(() => validateMasterCidr('172.15.0.0/28')).toThrow('RFC 1918 private range');
            expect(() => validateMasterCidr('172.32.0.0/28')).toThrow('RFC 1918 private range');
        });
    });

    describe('/28 alignment', () => {
        it('should reject misaligned CIDRs', () => {
            expect(() => validateMasterCidr('172.16.0.1/28')).toThrow('must be aligned');
            expect(() => validateMasterCidr('172.16.0.15/28')).toThrow('must be aligned');
            expect(() => validateMasterCidr('172.16.0.17/28')).toThrow('must be aligned');
            expect(() => validateMasterCidr('10.0.0.5/28')).toThrow('must be aligned');
        });

        it('should accept aligned CIDRs', () => {
            expect(() => validateMasterCidr('172.16.0.0/28')).not.toThrow();
            expect(() => validateMasterCidr('172.16.0.16/28')).not.toThrow();
            expect(() => validateMasterCidr('172.16.0.32/28')).not.toThrow();
            expect(() => validateMasterCidr('172.16.0.48/28')).not.toThrow();
            expect(() => validateMasterCidr('172.16.0.64/28')).not.toThrow();
        });
    });
});

