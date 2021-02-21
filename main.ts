import { Construct }                  from 'constructs';
import { App, TerraformStack, Token } from 'cdktf';
import * as path from 'path';
import {
  AwsProvider,
  IamRole,
  Vpc,
  Subnet,
  SecurityGroup,
  S3Bucket,
  S3BucketObject,
  EcsCluster,
  EcsService,
  EcrRepository,
  EcsTaskDefinition,
  LambdaFunction,
  LambdaPermission,
  SnsTopic,
  SnsTopicSubscription,
  ApiGatewayRestApi,
  ApiGatewayMethod,
  ApiGatewayMethodResponse,
  ApiGatewayResource,
  ApiGatewayDeployment,
  ApiGatewayStage,
  ApiGatewayIntegration,
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

    const lambdaExecutionRole = new IamRole(this , 'lambdaExecutionRole',{
      name: 'lambdaExecutionRole_for_cdktf',
      assumeRolePolicy: `{
        "Version":   "2012-10-17",
        "Statement": [
          {
            "Action":    "sts:AssumeRole",
            "Principal": {
              "Service": "lambda.amazonaws.com"
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
      availabilityZone: 'ap-northeast-1a',
      cidrBlock:        '10.0.0.0/24',
      tags:             { ['Name']: 'ECS subnet-for-cdktf Public Subnet1' }
    });

    const subnet2 = new Subnet(this, 'subnet-for-cdktf2', {
      vpcId:            Token.asString(vpc.id),
      availabilityZone: 'ap-northeast-1c',
      cidrBlock:        '10.0.1.0/24',
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

    const ecsRepository = new EcrRepository(this, 'project/repository_for_cdktf', {
      name: 'project/repository_for_cdktf'
    });

    const s3Bucket = new S3Bucket(this, 's3-for-cdktf', {
      bucket: 's3-for-cdktf',
      region: REGION
    });

    new S3BucketObject(this, 'update-image-of-ecr-dist.zip', {
      bucket:      s3Bucket.bucket,
      key:         'update-image-of-ecr-dist.zip',
      contentType: 'zip',
      source:      path.resolve('./src/main/typescript/aws/lambda/slack/notification/update-image-of-ecr/update-image-of-ecr-dist/update-image-of-ecr-dist.zip')
    });

    new S3BucketObject(this, 'update-task-of-ecs-dist.zip', {
      bucket:      s3Bucket.bucket,
      key:         'update-task-of-ecs-dist.zip',
      contentType: 'zip',
      source:      path.resolve('./src/main/typescript/aws/lambda/slack/api/update-task-of-ecs/update-task-of-ecs-dist/update-task-of-ecs-dist.zip')
    });

    const lambda_for_sns = new LambdaFunction(this, 'cdktf_for_slack_sns', {
      functionName: 'cdktf_for_slack_sns',
      handler:      'index.handler',
      role:         lambdaExecutionRole.arn,
      runtime:      'nodejs12.x',
      s3Bucket:     s3Bucket.bucket,
      s3Key:        'update-image-of-ecr-dist.zip',
      timeout:      30,
      environment:  [{
        variables: {
          ['SLACK_API_TOKEN']:      'xoxb-1276255441778-1782007042404-sSybUERnFKYRyHTHecs3kvr0',
          ['SLACK_CHANNEL']:        'C017PFW6D1D',
          ['SLACK_SIGNING_SECRET']: '5db9d3349e7830b149daf815e84067e4'
        }
      }]
    });

    const lambda_for_slack_api = new LambdaFunction(this, 'cdktf_for_slack_api', {
      functionName: 'cdktf_for_slack_api',
      handler:      'index.handler',
      role:         lambdaExecutionRole.arn,
      runtime:      'nodejs12.x',
      s3Bucket:     s3Bucket.bucket,
      s3Key:        'update-task-of-ecs-dist.zip',
      timeout:      30,
      environment:  [{
        variables: {
          ['CLUSTER_NAME']:      ecsCluster.arn,
          ['DOCKER_IMAGE_PATH']: ecsRepository.arn,
          ['SLACK_API_TOKEN']:   'xoxb-1276255441778-1782007042404-sSybUERnFKYRyHTHecs3kvr0',
          ['SLACK_CHANNEL']:     'C017PFW6D1D'
        }
      }]
    });

    const snsTopic = new SnsTopic(this, 'cdktf_for_sns', {
      name: 'cdktf_for_sns'
    });

    new SnsTopicSubscription(this, 'cdktf_for_sns_subscription', {
      endpoint: lambda_for_sns.arn,
      protocol: 'lambda',
      topicArn: snsTopic.arn
    });

    new LambdaPermission(this, 'lambda_permission_for_cdktf_lambda_sns', {
      action:       'lambda:InvokeFunction',
      functionName: lambda_for_sns.functionName,
      principal:    'sns.amazonaws.com',
      sourceArn:    snsTopic.arn
    });

    const apiGateway = new ApiGatewayRestApi(this, 'cdktf_for_api_rest', {
      name: 'cdktf_for_apigateway'
    });

    const apiGatewayResource = new ApiGatewayResource(this, 'cdktf_for_api_resource', {
      parentId:  apiGateway.rootResourceId,
      pathPart:  'ecs-deploy',
      restApiId: apiGateway.id
    });

    const apiMethod = new ApiGatewayMethod(this, 'cdktf_for_api_method', {
      authorization: 'NONE',
      httpMethod:    'POST',
      resourceId:    apiGatewayResource.id,
      restApiId:     apiGateway.id
    });

    new ApiGatewayMethodResponse(this, 'cdktf_for_api_method_response', {
      httpMethod: apiMethod.httpMethod,
      resourceId: apiGatewayResource.id,
      restApiId:  apiGateway.id,
      statusCode: '200',
      responseModels: {
        'application/json': 'Empty'
      }
    });

    new ApiGatewayIntegration(this, 'cdktf_for_api_integration', {
      httpMethod:            apiMethod.httpMethod,
      restApiId:             apiGateway.id,
      resourceId:            apiGatewayResource.id,
      integrationHttpMethod: 'POST',
      type:                  'AWS_PROXY',
      uri:                   lambda_for_slack_api.invokeArn
    });

    const apiDeploy = new ApiGatewayDeployment(this, 'cdktf_for_apideploy', {
      restApiId: apiGateway.id
    });

    new ApiGatewayStage(this, 'cdktf_for_api_stage', {
      deploymentId: apiDeploy.id,
      restApiId:    apiGateway.id,
      stageName:    'cdktf_for_apistage'
    });

    new LambdaPermission(this, 'lambda_permission_for_cdktf_lambda_api', {
      action:       'lambda:InvokeFunction',
      functionName: lambda_for_slack_api.functionName,
      principal:    'apigateway.amazonaws.com',
      sourceArn:    `${apiGateway.executionArn}/*/${apiMethod.httpMethod}/${apiGatewayResource.pathPart}`,
      statementId:  'AllowAPIGatewayInvoke'
    });

  }
}

const app = new App();
new CdktfStack(app, 'cdktf');
app.synth();
