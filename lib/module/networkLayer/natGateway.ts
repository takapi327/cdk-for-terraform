import { Construct } from 'constructs';
import { Eip, Subnet, NatGateway } from '../../../.gen/providers/aws';

export namespace NatGatewayModule {
  export function create(scope: Construct, eip: Eip, subnet: Subnet): NatGateway {
    return new NatGateway(scope,'cdktf-nat-gateway', {
      allocationId: eip.allocationId,
      subnetId:     subnet.id,
      tags:         {
        'Name': 'cdktf nat-gateway'
      }
    })
  }

  export function eip(scope: Construct): Eip {
    return new Eip(scope, 'eip-for-nat-gateway', {
      vpc: true
    })
  }
}
