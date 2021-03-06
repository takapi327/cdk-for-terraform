import { Construct } from 'constructs';
import { Vpc, InternetGateway, NatGateway, RouteTable, RouteTableAssociation, Subnet } from '../../../.gen/providers/aws';

export namespace RouteTableModule {

  export function association(
    scope:      Construct,
    routeTable: RouteTable,
    subnet:     Subnet,
    id:         string
  ): RouteTableAssociation {
    return new RouteTableAssociation(scope, id, {
      routeTableId: routeTable.id,
      subnetId:     subnet.id
    });
  }

  /**
   * Public Route Table
   */
  export function createPublic(scope: Construct, vpc: Vpc, internetGateway: InternetGateway): RouteTable {
    return new RouteTable(scope, 'rtb-public', {
      vpcId: vpc.id,
      route: [{
        cidrBlock:              '0.0.0.0/0',
        gatewayId:              internetGateway.id,
        ipv6CidrBlock:          '',
        egressOnlyGatewayId:    '',
        instanceId:             '',
        natGatewayId:           '',
        networkInterfaceId:     '',
        transitGatewayId:       '',
        vpcPeeringConnectionId: ''
      }],
      tags: {
        'Name': 'rtb-public'
      }
    });
  }

  /**
   * Private Route Table
   */
  export function createPrivate(scope: Construct, vpc: Vpc, natGateway: NatGateway): RouteTable {
    return new RouteTable(scope, 'rtb-private', {
      vpcId: vpc.id,
      route: [{
        cidrBlock:              '0.0.0.0/0',
        gatewayId:              '',
        ipv6CidrBlock:          '',
        egressOnlyGatewayId:    '',
        instanceId:             '',
        natGatewayId:           natGateway.id,
        networkInterfaceId:     '',
        transitGatewayId:       '',
        vpcPeeringConnectionId: ''
      }],
      tags: {
        'Name': 'rtb-private'
      }
    });
  }
}
