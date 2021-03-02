import { Construct } from 'constructs';
import {
  CloudwatchLogGroup,
  CloudwatchEventRule,
  CloudwatchEventTarget,
  SnsTopic
} from '../../../.gen/providers/aws';

export namespace CloudwatchModule {

  export function createLogGroup(scope: Construct, id: string, name: string): CloudwatchLogGroup {
    return new CloudwatchLogGroup(scope, id, {
      name: name
    });
  }

  export function createEventRule(scope: Construct): CloudwatchEventRule {
    return new CloudwatchEventRule(scope, 'cdktf_for_event_rule', {
      name:        'capture_aws_ecr_update',
      description: 'Capture each AWS ECR Update',
      eventPattern: `{
        "source": ["aws.ecr"],
        "detail-type": ["ECR Image Action"],
        "detail": {
          "action-type": ["PUSH"],
          "result": ["SUCCESS"]
        }
      }`
    });
  }

  export function createEventTarget(scope: Construct, snsTopic: SnsTopic, eventRule: CloudwatchEventRule): CloudwatchEventTarget {
    return new CloudwatchEventTarget(scope, 'cdktf_for_event_target', {
      arn:      snsTopic.arn,
      rule:     eventRule.name,
      targetId: 'SendToSNS'
    });
  }
}
