import { Construct }   from 'constructs';
import {
  SnsTopic,
  SnsTopicSubscription,
  SnsTopicPolicy,
  LambdaFunction
} from '../../../.gen/providers/aws';

export namespace SnsModule {
  export function createTopic(scope: Construct): SnsTopic {
    return new SnsTopic(scope, 'cdktf_for_sns', {
      name: 'cdktf_for_sns'
    });
  }

  export function createSubscription(scope: Construct, lambdaForSns: LambdaFunction, snsTopic: SnsTopic): SnsTopicSubscription {
    return new SnsTopicSubscription(scope, 'cdktf_for_sns_subscription', {
      endpoint: lambdaForSns.arn,
      protocol: 'lambda',
      topicArn: snsTopic.arn
    });
  }

  export function createPolicy(scope: Construct, snsTopic: SnsTopic): SnsTopicPolicy {
    return new SnsTopicPolicy(scope, 'cdktf_for_sns_policy', {
      arn: snsTopic.arn,
      policy: `{
        "Version":   "2012-10-17",
        "Statement": {
          "Effect": "Allow",
          "Sid":    "",
          "Principal": {
            "Service": "events.amazonaws.com"
          },
          "Action": [
            "SNS:Publish"
          ],
          "Resource": [
            "*"
          ]
        }
      }`
    });
  }
}
