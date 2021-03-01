import { Construct } from 'constructs';
import {
  Alb,
  AlbTargetGroup,
  AlbListener,
  AlbListenerRule,
  Vpc,
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

  export function createTargetGroup(scope: Construct, vpc: Vpc): AlbTargetGroup {
    return new AlbTargetGroup(scope, 'cdktf_for_alb_target_group', {
      name:       'cdktf-for-alb-target-group',
      port:       9000,
      protocol:   'HTTP',
      targetType: 'ip',
      vpcId:      vpc.id,
      healthCheck: [{
        interval:           30,
        path:               '/',
        port:               'traffic-port',
        protocol:           'HTTP',
        timeout:            5,
        unhealthyThreshold: 2
      }]
    });
  }
}
