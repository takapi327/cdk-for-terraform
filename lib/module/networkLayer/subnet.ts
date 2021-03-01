import { Construct }   from 'constructs';
import { Vpc, Subnet } from '../../../.gen/providers/aws';

export namespace SubnetModule {
  export function create1(scope: Construct, vpc: Vpc): Subnet {
    return new Subnet(scope, 'subnet-for-cdktf', {
      vpcId:               vpc.id,
      availabilityZone:    'ap-northeast-1a',
      cidrBlock:           '10.0.0.0/24',
      mapPublicIpOnLaunch: true,
      tags:                { ['Name']: 'ECS subnet-for-cdktf Public Subnet1' }
    });
  }

  export function create2(scope: Construct, vpc: Vpc): Subnet {
    return new Subnet(scope, 'subnet-for-cdktf2', {
      vpcId:               vpc.id,
      availabilityZone:    'ap-northeast-1c',
      cidrBlock:           '10.0.1.0/24',
      mapPublicIpOnLaunch: true,
      tags:                { ['Name']: 'ECS subnet-for-cdktf Public Subnet2' }
    });
  }
}
