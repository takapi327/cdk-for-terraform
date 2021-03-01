import { Construct } from 'constructs';
import { Vpc, InternetGateway, RouteTable, RouteTableAssociation, Subnet } from '../../../.gen/providers/aws';

export namespace RouteTableModule {
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
}
