import { Construct } from 'constructs';
import {
  IamRole,
  IamPolicy,
  IamRolePolicyAttachment
} from '../../../.gen/providers/aws';

export namespace LambdaExecutionRoleModule {
  export function createRole(scope: Construct): IamRole {
    return new IamRole(scope , 'lambdaExecutionRole',{
      name: 'lambdaExecutionRole_for_cdktf',
      assumeRolePolicy: `{
        "Version":   "2012-10-17",
        "Statement": [
          {
            "Action": "sts:AssumeRole",
            "Principal": {
              "Service": [
                "lambda.amazonaws.com",
                "ecs-tasks.amazonaws.com"
              ]
            },
            "Effect": "Allow",
            "Sid":    ""
          }
        ]
      }`
    });
  }

  export function createPolicy(scope: Construct): IamPolicy {
    return new IamPolicy(scope, 'lambda_logging', {
      name:        'lambda_logging',
      description: 'IAM policy for logging from a lambda',
      policy: `{
        "Version":   "2012-10-17",
        "Statement": [
          {
            "Action": [
              "iam:PassRole",
              "ecs:RegisterTaskDefinition",
              "ecs:UpdateService",
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents"
            ],
            "Resource": [
              "*",
              "arn:aws:logs:*:*:*",
              "arn:aws:ecs:*:*:*",
              "arn:aws:iam::445682127642:role/ecsTaskExecutionRole_for_cdktf"
            ],
            "Effect": "Allow"
          }
        ]
      }`
    });
  }

  export function attachmentRole(scope: Construct, role: IamRole, policy: IamPolicy): IamRolePolicyAttachment {
    return new IamRolePolicyAttachment(scope, 'lambda_policy_attach', {
      role:      role.name,
      policyArn: policy.arn
    });
  }
}
