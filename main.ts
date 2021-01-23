import { Construct }                  from 'constructs';
import { App, TerraformStack, Token } from 'cdktf';
import {
  AwsProvider,
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

    const vpc = new Vpc(this, 'Vpc-cdk-for-terraform', {
      cidrBlock: '10.0.0.0/16',
      tags:      { ['Name']: 'ECS cdk-for-terraform' }
    });

    new Subnet(this, 'Subnet-cdk-for-terraform', {
      vpcId:            Token.asString(vpc.id),
      availabilityZone: 'ap-northeast-1a',
      cidrBlock:        '10.0.0.0/24',
      tags:             { ['Name']: 'ECS cdk-for-terraform' }
    });

    const ecs_cluster = new EcsCluster(this, 'cluster-cdk-for-terraform', {
      name: 'cluster-cdk-for-terraform'
    });

    new EcsService(this, 'container-cdk-for-terraform-service', {
      cluster:                         ecs_cluster.id,
      deploymentMaximumPercent:        200,
      deploymentMinimumHealthyPercent: 100,
      desiredCount:                    1,
      launchType:                      'FARGATE',
      name:                            'container-cdk-for-terraform-service',
      platformVersion:                 'LATEST'
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

    new EcsTaskDefinition(this, 'cdk-for-terraform', {
      containerDefinitions:    taskDefinition,
      family:                  'cdk-for-terraform',
      networkMode:             'awsvpc',
      cpu:                     '256',
      memory:                  '512',
      requiresCompatibilities: ['FARGATE']
    });

    new EcrRepository(this, 'project/repository_cdk_for_terraform', {
      name: 'project/repository_cdk_for_terraform'
    });
  }
}

const app = new App();
new FargateStack(app, 'cdk-for-terraform');
app.synth();
