import { Construct } from 'constructs';
import {
  IamRole,
  IamPolicy,
  IamRolePolicyAttachment
} from '../../../.gen/providers/aws';

export namespace EcsTaskRoleModule {
  export function createRole(scope: Construct): IamRole {
    return new IamRole(scope, 'ecsTaskRole', {
      name: 'ecsTaskRole_for_cdktf',
      assumeRolePolicy: `{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Action": "sts:AssumeRole",
            "Principal": {
              "Service": "ecs-tasks.amazonaws.com"
          },
          "Effect": "Allow",
          "Sid": ""
          }
        ]
      }`
    });
  }

  export function createPolicy(scope: Construct): IamPolicy {
    return new IamPolicy(scope, 'ecs_task_policy', {
      name:        'ecs_task_policy',
      description: 'Policy for updating ECS tasks',
      policy: `{
        "Version":   "2012-10-17",
        "Statement": [
          {
            "Action": [
              "ecs:DescribeServices",
              "ecs:CreateTaskSet",
              "ecs:UpdateServicePrimaryTaskSet",
              "ecs:DeleteTaskSet",
              "elasticloadbalancing:DescribeTargetGroups",
              "elasticloadbalancing:DescribeListeners",
              "elasticloadbalancing:ModifyListener",
              "elasticloadbalancing:DescribeRules",
              "elasticloadbalancing:ModifyRule",
              "lambda:InvokeFunction",
              "cloudwatch:DescribeAlarms",
              "sns:Publish",
              "s3:GetObject",
              "s3:GetObjectVersion"
            ],
            "Resource": [
              "*"
            ],
            "Effect": "Allow"
          }
        ]
      }`
    });
  }

  export function attachmentRole(scope: Construct, role: IamRole, policy: IamPolicy): IamRolePolicyAttachment {
    return new IamRolePolicyAttachment(scope, 'ecs_task_policy_attach', {
      role:      role.name,
      policyArn: policy.arn
    });
  }
}
