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

  /**
   * Public Subnet
   */
  export function createPublic1a(scope: Construct, vpc: Vpc): Subnet {
    return new Subnet(scope, 'public-subnet1-az1a-cdktf', {
      vpcId:               vpc.id,
      availabilityZone:    'ap-northeast-1a',
      cidrBlock:           '10.0.0.0/20',
      mapPublicIpOnLaunch: true,
      tags:                { ['Name']: 'Public1 AZ1a cdktf' }
    });
  }

  export function createPublic2c(scope: Construct, vpc: Vpc): Subnet {
    return new Subnet(scope, 'public-subnet1-az1c-cdktf', {
      vpcId:               vpc.id,
      availabilityZone:    'ap-northeast-1c',
      cidrBlock:           '10.0.16.0/20',
      mapPublicIpOnLaunch: true,
      tags:                { ['Name']: 'Public2 AZ1c cdktf' }
    });
  }

  /**
   * Private Subnet
   */
  export function createPrivate1a(scope: Construct, vpc: Vpc): Subnet {
    return new Subnet(scope, 'private-subnet1-az1a-cdktf', {
      vpcId:               vpc.id,
      availabilityZone:    'ap-northeast-1a',
      cidrBlock:           '10.0.128.0/20',
      mapPublicIpOnLaunch: true,
      tags:                { ['Name']: 'Private1 AZ1a cdktf' }
    });
  }

  export function createPrivate2c(scope: Construct, vpc: Vpc): Subnet {
    return new Subnet(scope, 'private-subnet1-az1c-cdktf', {
      vpcId:               vpc.id,
      availabilityZone:    'ap-northeast-1c',
      cidrBlock:           '10.0.144.0/20',
      mapPublicIpOnLaunch: true,
      tags:                { ['Name']: 'Private2 AZ1c cdktf' }
    });
  }
}
