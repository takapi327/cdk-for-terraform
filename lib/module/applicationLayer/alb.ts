import { Construct } from 'constructs';
import {
  Alb,
  AlbTargetGroup,
  AlbListener,
  AlbListenerRule,
  SecurityGroup
} from '../../../.gen/providers/aws';

export namespace AlbModule {
  export function createAlb(scope: Construct, security: SecurityGroup, subnets: string[]): Alb {
    return new Alb(scope, 'cdktf_for_alb', {
      name:             'cdktf-for-alb',
      internal:         false,
      loadBalancerType: 'application',
      securityGroups:   [security.id],
      subnets:          subnets,
      ipAddressType:    'ipv4',
      enableHttp2:      true
    });
  }
}
