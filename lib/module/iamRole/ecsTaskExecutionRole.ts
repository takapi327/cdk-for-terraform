import { Construct } from 'constructs';
import {
  IamRole,
  IamPolicy,
  IamRolePolicyAttachment
} from '../../../.gen/providers/aws';

export namespace EcsTaskExecutionRoleModule {
  export function createRole(scope: Construct): IamRole {
    return new IamRole(scope , 'ecsTaskExecutionRole',{
      name: 'ecsTaskExecutionRole_for_cdktf',
      assumeRolePolicy: `{
        "Version":   "2012-10-17",
        "Statement": [
          {
            "Action":    "sts:AssumeRole",
            "Principal": {
              "Service": "ecs-tasks.amazonaws.com"
            },
            "Effect": "Allow",
            "Sid":    ""
          }
        ]
      }`
    });
  }

  export function createPolicy(scope: Construct): IamPolicy {
    return new IamPolicy(scope, 'ecs_task_execution_policy', {
      name:        'ecs_task_execution_policy',
      description: 'Policy for updating ECS tasks',
      policy: `{
        "Version":   "2012-10-17",
        "Statement": [
          {
            "Action": [
              "ecr:GetAuthorizationToken",
              "ecr:BatchCheckLayerAvailability",
              "ecr:GetDownloadUrlForLayer",
              "ecr:BatchGetImage",
              "logs:CreateLogStream",
              "logs:PutLogEvents"
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
    return new IamRolePolicyAttachment(scope, 'ecs_task_attach', {
      role:      role.name,
      policyArn: policy.arn
    });
  }
}
