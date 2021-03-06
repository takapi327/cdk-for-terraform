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
  export function createAlb(scope: Construct, vpc: Vpc, security: SecurityGroup, subnets: string[]): Alb {
    return new Alb(scope, 'cdktf_for_alb', {
      name:             'cdktf-for-alb',
      internal:         false,
      loadBalancerType: 'application',
      securityGroups:   [security.id, vpc.defaultSecurityGroupId],
      subnets:          subnets,
      ipAddressType:    'ipv4',
      enableHttp2:      true
    });
  }

  export function createTargetGroup(scope: Construct, vpc: Vpc): AlbTargetGroup {
    return new AlbTargetGroup(scope, 'cdktf_for_alb_target_group', {
      name:       'cdktf-for-alb-target-group',
      port:       80,
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

  export function createAlbListenerHTTP(scope: Construct, alb: Alb, albTargetGroup: AlbTargetGroup): AlbListener {
    return new AlbListener(scope, 'cdktf_for_alb_listener', {
      loadBalancerArn: alb.arn,
      port:            80,
      protocol:        'HTTP',
      defaultAction:   [{
        targetGroupArn: albTargetGroup.arn,
        type:           'forward'
      }]
    });
  }

  export function createAlbListenerHTTPS(scope: Construct, alb: Alb, albTargetGroup: AlbTargetGroup): AlbListener {
    return new AlbListener(scope, 'cdktf_for_alb_listener_https', {
      loadBalancerArn: alb.arn,
      port:            443,
      protocol:        'HTTPS',
      defaultAction:   [{
        targetGroupArn: albTargetGroup.arn,
        type:           'forward'
      }]
    });
  }

  export function createAlbListenerRule(scope: Construct, albListener: AlbListener, albTargetGroup: AlbTargetGroup): AlbListenerRule {
    return new AlbListenerRule(scope, 'cdktf_for_alb_listener_rule', {
      listenerArn: albListener.arn,
      priority:    100,
      action:      [{
        type:          'forward',
        targetGroupArn: albTargetGroup.arn
      }],
      condition: [{
        field: 'path-pattern',
        values: ['*']
      }]
    });
  }
}
