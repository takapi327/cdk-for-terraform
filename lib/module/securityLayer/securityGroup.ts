import { Construct }   from 'constructs';
import { Vpc, SecurityGroup, SecurityGroupRule } from '../../../.gen/providers/aws';

export namespace SecurityModule {
  export function create(scope: Construct, vpc: Vpc): SecurityGroup {
    return new SecurityGroup(scope, 'security-for-cdktf', {
      name:  'security-for-cdktf',
      vpcId: vpc.id,
      tags:  {
        'Name': 'ECS security-for-cdktf'
      }
    });
  }

  export function ingressRule(scope: Construct, vpc: Vpc, security: SecurityGroup): SecurityGroupRule {
    return new SecurityGroupRule(scope, 'security-ingress-for-cdktf', {
      cidrBlocks:      [vpc.cidrBlock],
      fromPort:        9000,
      protocol:        'tcp',
      securityGroupId: security.id,
      toPort:          9000,
      type:            'ingress'
    });
  }

  export function egressRule(scope: Construct, security: SecurityGroup): SecurityGroupRule {
    return new SecurityGroupRule(scope, 'security-egress-for-cdktf', {
      cidrBlocks:      ['0.0.0.0/0'],
      fromPort:        0,
      protocol:        'all',
      securityGroupId: security.id,
      toPort:          0,
      type:            'egress'
    });
  }
}
