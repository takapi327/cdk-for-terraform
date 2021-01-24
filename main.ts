import { Construct }                  from 'constructs';
import { App, TerraformStack, Token } from 'cdktf';
import {
  AwsProvider,
  IamRole,
  Vpc,
  Subnet,
  S3Bucket,
  EcsCluster,
  EcsService,
  EcrRepository,
  EcsTaskDefinition
} from './.gen/providers/aws';

class CdktfStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AwsProvider(this, 'aws-for-cdktf', {
      region: 'ap-northeast-1'
    });

    const ecstaskrole = new IamRole(this , 'ecsTaskRole',{
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

    const ecsTaskExecutionRole = new IamRole(this , 'ecsTaskExecutionRole',{
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

    const vpc = new Vpc(this, 'vpc-for-cdktf', {
      cidrBlock: '10.0.0.0/16',
      tags:      { ['Name']: 'ECS vpc-for-cdktf' }
    });

    const subnet = new Subnet(this, 'subnet-for-cdktf', {
      vpcId:            Token.asString(vpc.id),
      availabilityZone: 'ap-northeast-1a',
      cidrBlock:        '10.0.0.0/24',
      tags:             { ['Name']: 'ECS subnet-for-cdktf' }
    });

    const ecsCluster = new EcsCluster(this, 'cluster-for-cdktf', {
      name: 'cluster-for-cdktf'
    });

    const imageName:      string = 'project/repository_for_cdktf'
    const imageVersion:   string = 'latest'
    const taskDefinition: string = `[
      {
        "essential":    true,
        "name":         "task-for-cdktf",
        "image":        "${imageName}:${imageVersion}",
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
            "awslogs-group":         "ecs/task-for-cdktf",
            "awslogs-stream-prefix": "ecs",
            "awslogs-region":        "ap-northeast-1"
          }
        }
      }
    ]`

    const ecsTaskDefinition = new EcsTaskDefinition(this, 'task-for-cdktf', {
      containerDefinitions:    taskDefinition,
      family:                  'task-for-cdktf',
      networkMode:             'awsvpc',
      executionRoleArn:        ecsTaskExecutionRole.arn,
      taskRoleArn:             ecstaskrole.arn,
      cpu:                     '256',
      memory:                  '512',
      requiresCompatibilities: ['FARGATE']
    });

    new EcsService(this, 'container-for-cdktf-service', {
      cluster:                         ecsCluster.id,
      deploymentMaximumPercent:        200,
      deploymentMinimumHealthyPercent: 100,
      desiredCount:                    1,
      launchType:                      'FARGATE',
      name:                            'container-for-cdktf-service',
      platformVersion:                 'LATEST',
      taskDefinition:                  ecsTaskDefinition.id,
      networkConfiguration:            [{
        subnets: [subnet.id]
      }]
    });

    new EcrRepository(this, 'project/repository_for_cdktf', {
      name: 'project/repository_for_cdktf'
    });

    new S3Bucket(this, 's3-for-cdktf', {
      bucket: 's3-for-cdktf',
      region: 'ap-northeast-1'
    });

  }
}

const app = new App();
new CdktfStack(app, 'cdktf');
app.synth();
