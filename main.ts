import { Construct }                  from 'constructs';
import { App, TerraformStack, Token } from 'cdktf';
import {
  AwsProvider,
  IamRole,
  Vpc,
  Subnet,
  EcsCluster,
  EcsService,
  EcrRepository,
  EcsTaskDefinition
} from './.gen/providers/aws';

class FargateStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AwsProvider(this, 'Aws-cdk-for-terraform', {
      region: 'ap-northeast-1'
    });

    const ecstaskrole = new IamRole(this , 'ecsTaskRole',{
      name: 'ecsTaskRole_for_CDKTF',
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
      name: 'ecsTaskExecutionRole_for_CDKTF',
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

    const vpc = new Vpc(this, 'Vpc-cdk-for-terraform', {
      cidrBlock: '10.0.0.0/16',
      tags:      { ['Name']: 'ECS cdk-for-terraform' }
    });

    const subnet = new Subnet(this, 'Subnet-cdk-for-terraform', {
      vpcId:            Token.asString(vpc.id),
      availabilityZone: 'ap-northeast-1a',
      cidrBlock:        '10.0.0.0/24',
      tags:             { ['Name']: 'ECS cdk-for-terraform' }
    });

    const ecsCluster = new EcsCluster(this, 'cluster-cdk-for-terraform', {
      name: 'cluster-cdk-for-terraform'
    });

    const imageName:      string = 'project/repository_cdk_for_terraform'
    const imageVersion:   string = 'latest'
    const taskDefinition: string = `[
      {
        "essential":    true,
        "name":         "cdk-for-terraform",
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
            "awslogs-group":         "ecs/cdk-for-terraform",
            "awslogs-stream-prefix": "ecs",
            "awslogs-region":        "ap-northeast-1"
          }
        }
      }
    ]`

    const ecsTaskDefinition = new EcsTaskDefinition(this, 'cdk-for-terraform', {
      containerDefinitions:    taskDefinition,
      family:                  'cdk-for-terraform',
      networkMode:             'awsvpc',
      executionRoleArn:        ecsTaskExecutionRole.arn,
      taskRoleArn:             ecstaskrole.arn,
      cpu:                     '256',
      memory:                  '512',
      requiresCompatibilities: ['FARGATE']
    });

    new EcsService(this, 'container-cdk-for-terraform-service', {
      cluster:                         ecsCluster.id,
      deploymentMaximumPercent:        200,
      deploymentMinimumHealthyPercent: 100,
      desiredCount:                    1,
      launchType:                      'FARGATE',
      name:                            'container-cdk-for-terraform-service',
      platformVersion:                 'LATEST',
      taskDefinition:                  ecsTaskDefinition.id,
      networkConfiguration:            [{
        subnets: [subnet.id]
      }]
    });

    new EcrRepository(this, 'project/repository_cdk_for_terraform', {
      name: 'project/repository_cdk_for_terraform'
    });
  }
}

const app = new App();
new FargateStack(app, 'cdk-for-terraform');
app.synth();
