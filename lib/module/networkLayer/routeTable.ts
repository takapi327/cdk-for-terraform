import { Construct } from 'constructs';
import { Vpc, InternetGateway, RouteTable, RouteTableAssociation, Subnet } from '../../../.gen/providers/aws';

export namespace RouteTableModule {
  /** 不要になったら消す */
  export function create(scope: Construct, vpc: Vpc, internetGateway: InternetGateway): RouteTable {
    return new RouteTable(scope, 'route-for-cdktf', {
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
        'Name': 'ECS route-table-for-cdktf'
      }
    });
  }

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
  export function createPrivate(scope: Construct, vpc: Vpc): RouteTable {
    return new RouteTable(scope, 'rtb-private', {
      vpcId: vpc.id,
      route: [{
        cidrBlock:              '0.0.0.0/0',
        gatewayId:              '',
        ipv6CidrBlock:          '',
        egressOnlyGatewayId:    '',
        instanceId:             '',
        natGatewayId:           '',
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
