import { Construct }                  from 'constructs';
import { App, TerraformStack, Token } from 'cdktf';
import {
  AwsProvider,
  IamRole,
  Vpc,
  Subnet,
  SecurityGroup,
  S3Bucket,
  EcsCluster,
  EcsService,
  EcrRepository,
  EcsTaskDefinition,
  LambdaFunction,
  SnsTopic,
  SnsTopicSubscription
} from './.gen/providers/aws';

class CdktfStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    const REGION:      string = 'ap-northeast-1'
    const LAUNCH_TYPE: string = 'FARGATE'

    new AwsProvider(this, 'aws-for-cdktf', {
      region: REGION
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

    const subnet1 = new Subnet(this, 'subnet-for-cdktf', {
      vpcId:            Token.asString(vpc.id),
      availabilityZone: REGION,
      cidrBlock:        '10.0.0.0/24',
      tags:             { ['Name']: 'ECS subnet-for-cdktf Public Subnet1' }
    });

    const subnet2 = new Subnet(this, 'subnet-for-cdktf2', {
      vpcId:            Token.asString(vpc.id),
      availabilityZone: REGION,
      cidrBlock:        '10.0.0.0/24',
      tags:             { ['Name']: 'ECS subnet-for-cdktf Public Subnet2' }
    });

    const security = new SecurityGroup(this, 'security-for-cdktf', {
      name: 'security-for-cdktf',
      vpcId: Token.asString(vpc.id)
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
      requiresCompatibilities: [LAUNCH_TYPE]
    });

    new EcsService(this, 'container-for-cdktf-service', {
      cluster:                         ecsCluster.id,
      deploymentMaximumPercent:        200,
      deploymentMinimumHealthyPercent: 100,
      desiredCount:                    1,
      launchType:                      LAUNCH_TYPE,
      name:                            'container-for-cdktf-service',
      platformVersion:                 'LATEST',
      taskDefinition:                  ecsTaskDefinition.id,
      networkConfiguration:            [{
        securityGroups: [security.id],
        subnets:        [subnet1.id, subnet2.id]
      }]
    });

    new EcrRepository(this, 'project/repository_for_cdktf', {
      name: 'project/repository_for_cdktf'
    });

    const s3Bucket = new S3Bucket(this, 's3-for-cdktf', {
      bucket: 's3-for-cdktf',
      region: REGION
    });

    const lambda = new LambdaFunction(this, 'cdktf_for_slick', {
      functionName: 'cdktf_for_slick',
      handler:      'index.handler',
      role:         ecstaskrole.arn,
      runtime:      'Node.js 12.x',
      s3Bucket:     s3Bucket.bucket,
      s3Key:        'update-image-of-ecr-dist.zip',
      timeout:      30
    });

    const snsTopic = new SnsTopic(this, '', {
      name: 'cdktf_for_sns'
    });

    new SnsTopicSubscription(this, 'cdktf_for_sns_subscription', {
      endpoint: lambda.arn,
      protocol: 'AWS Lambda',
      topicArn: snsTopic.arn
    });
  }
}

const app = new App();
new CdktfStack(app, 'cdktf');
app.synth();
