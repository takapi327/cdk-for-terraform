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

  export function ingressRuleHTTP(scope: Construct, security: SecurityGroup): SecurityGroupRule {
    return new SecurityGroupRule(scope, 'security-ingress-for-cdktf', {
      cidrBlocks:      ['0.0.0.0/0'],
      fromPort:        80,
      protocol:        'tcp',
      securityGroupId: security.id,
      toPort:          80,
      type:            'ingress'
    });
  }

  export function ingressRuleHTTPS(scope: Construct, security: SecurityGroup): SecurityGroupRule {
    return new SecurityGroupRule(scope, 'security-ingress-https', {
      cidrBlocks:      ['0.0.0.0/0'],
      fromPort:        443,
      protocol:        'tcp',
      securityGroupId: security.id,
      toPort:          443,
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
