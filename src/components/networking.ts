/**
 * Standard VPC networking component with best practices.
 *
 * Creates:
 * - Custom VPC (no auto-subnets)
 * - Subnet with secondary ranges for GKE pods/services
 * - Cloud Router + NAT for private node internet access
 */

import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { NetworkConfig } from '../config';

export interface StandardVPCArgs {
    /** Network configuration */
    config: NetworkConfig;
}

export class StandardVPC extends pulumi.ComponentResource {
    /** The VPC network */
    public readonly network: gcp.compute.Network;
    /** The subnet */
    public readonly subnet: gcp.compute.Subnetwork;
    /** The Cloud Router */
    public readonly router: gcp.compute.Router;
    /** The Cloud NAT */
    public readonly nat: gcp.compute.RouterNat;

    constructor(name: string, args: StandardVPCArgs, opts?: pulumi.ComponentResourceOptions) {
        super('x-infra-kit:networking:StandardVPC', name, {}, opts);

        const { config } = args;

        // VPC Network (VPC doesn't support labels directly)
        this.network = new gcp.compute.Network(
            `${name}-vpc`,
            {
                name: config.vpcName,
                autoCreateSubnetworks: false,
                description: `Standard VPC for ${config.prefix}-${config.env}`,
            },
            { parent: this }
        );

        // Subnet with secondary ranges for GKE (supports labels)
        this.subnet = new gcp.compute.Subnetwork(
            `${name}-subnet`,
            {
                name: config.subnetName,
                region: config.region,
                network: this.network.id,
                ipCidrRange: config.cidr,
                privateIpGoogleAccess: true,
                secondaryIpRanges: [
                    {
                        rangeName: config.podRangeName,
                        ipCidrRange: config.podCidr,
                    },
                    {
                        rangeName: config.serviceRangeName,
                        ipCidrRange: config.serviceCidr,
                    },
                ],
            },
            { parent: this }
        );

        // Cloud Router (required for NAT)
        this.router = new gcp.compute.Router(
            `${name}-router`,
            {
                name: `${config.vpcName}-router`,
                region: config.region,
                network: this.network.id,
            },
            { parent: this }
        );

        // Cloud NAT (allows private nodes to access internet)
        this.nat = new gcp.compute.RouterNat(
            `${name}-nat`,
            {
                name: `${config.vpcName}-nat`,
                router: this.router.name,
                region: config.region,
                natIpAllocateOption: 'AUTO_ONLY',
                sourceSubnetworkIpRangesToNat: 'ALL_SUBNETWORKS_ALL_IP_RANGES',
            },
            { parent: this }
        );

        // Register outputs
        this.registerOutputs({
            networkId: this.network.id,
            networkName: this.network.name,
            subnetId: this.subnet.id,
            subnetName: this.subnet.name,
        });
    }

    /** Get the VPC network ID */
    get networkId(): pulumi.Output<string> {
        return this.network.id;
    }

    /** Get the subnet ID */
    get subnetId(): pulumi.Output<string> {
        return this.subnet.id;
    }
}
