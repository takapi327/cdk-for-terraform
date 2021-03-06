import { Construct } from 'constructs';
import {
  EcsCluster,
  EcrRepository,
  EcsTaskDefinition,
  EcsService,
  IamRole,
  SecurityGroup,
  AlbTargetGroup,
  Subnet
} from '../../../.gen/providers/aws';

export namespace EcsModule {
  export function createCluster(scope: Construct): EcsCluster {
    return new EcsCluster(scope, 'cluster-for-cdktf', {
      name: 'cluster-for-cdktf'
    });
  }

  export function createRepository(scope: Construct): EcrRepository {
    return new EcrRepository(scope, 'project/repository_for_cdktf', {
      name: 'project/repository_for_cdktf'
    });
  }

  export function createEcsTask(
    scope:                Construct,
    ecsRepository:        EcrRepository,
    ecsTaskRole:          IamRole,
    ecsTaskExecutionRole: IamRole
  ): EcsTaskDefinition {
    const containerDefinition: string = `[
      {
        "essential":    true,
        "name":         "container-for-cdktf",
        "image":        "${ecsRepository.repositoryUrl}:latest",
        "portMappings": [
          {
            "hostPort":      9000,
            "protocol":      "tcp",
            "containerPort": 9000
          }
        ],
        "logConfiguration": {
          "logDriver": "awslogs",
          "options": {
            "awslogs-group":         "/aws/ecs/task-for-cdktf",
            "awslogs-stream-prefix": "ecs",
            "awslogs-region":        "ap-northeast-1"
          }
        }
      }
    ]`

    return new EcsTaskDefinition(scope, 'task-for-cdktf', {
      containerDefinitions:    containerDefinition,
      family:                  'task-for-cdktf',
      networkMode:             'awsvpc',
      executionRoleArn:        ecsTaskExecutionRole.arn,
      taskRoleArn:             ecsTaskRole.arn,
      cpu:                     '512',
      memory:                  '1024',
      requiresCompatibilities: [ 'FARGATE' ]
    });
  }

  export function createService(
    scope:             Construct,
    ecsCluster:        EcsCluster,
    ecsTaskDefinition: EcsTaskDefinition,
    security:          SecurityGroup,
    subnet:            Subnet,
    albTargetGroup:    AlbTargetGroup
  ): EcsService {
    return new EcsService(scope, 'container-for-cdktf-service', {
      cluster:                         ecsCluster.id,
      deploymentMaximumPercent:        200,
      deploymentMinimumHealthyPercent: 100,
      desiredCount:                    1,
      launchType:                      'FARGATE',
      name:                            'container-for-cdktf-service',
      platformVersion:                 'LATEST',
      taskDefinition:                  ecsTaskDefinition.id,
      networkConfiguration:            [{
        assignPublicIp: true,
        securityGroups: [security.id],
        subnets:        [subnet.id]
      }],
      loadBalancer: [{
        containerName:  'container-for-cdktf',
        containerPort:  9000,
        targetGroupArn: albTargetGroup.arn
      }]
    });
  }
}
