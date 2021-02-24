import { Construct }                  from 'constructs';
import { App, TerraformStack, Token } from 'cdktf';
import * as path from 'path';
import {
  AwsProvider,
  IamRole,
  IamPolicy,
  IamRolePolicyAttachment,
  Vpc,
  InternetGateway,
  Subnet,
  SecurityGroup,
  SecurityGroupRule,
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
  Alb,
  AlbTargetGroup,
  AlbListener,
  AlbListenerRule,
  CloudwatchEventRule,
  CloudwatchEventTarget,
  CloudwatchLogGroup
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

    const vpc = new Vpc(this, 'vpc-for-cdktf', {
      cidrBlock: '10.0.0.0/16',
      tags:      { ['Name']: 'ECS vpc-for-cdktf' }
    });

    new InternetGateway(this, 'gateway-for-cdktf', {
      vpcId: vpc.id
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

    new SecurityGroupRule(this, 'security-ingress-for-cdktf', {
      cidrBlocks:      [vpc.cidrBlock],
      fromPort:        9000,
      protocol:        'tcp',
      securityGroupId: security.id,
      toPort:          9000,
      type:            'ingress'
    });

    const alb = new Alb(this, 'cdktf_for_alb', {
      name:             'cdktf-for-alb',
      internal:         false,
      loadBalancerType: 'application',
      securityGroups:   [security.id],
      subnets:          [subnet1.id, subnet2.id],
      ipAddressType:    'ipv4',
      enableHttp2:      true
    });

    const albTargetGroup = new AlbTargetGroup(this, 'cdktf_for_alb_target_group', {
      name:       'cdktf-for-alb-target-group',
      port:       9000,
      protocol:   'HTTP',
      targetType: 'ip',
      vpcId:      vpc.id,
      healthCheck: [{
        interval:           30,
        path:               '/',
        port:               'traffic-port',
        protocol:           'HTTP',
        timeout:            5,
        unhealthyThreshold: 2
      }]
    });

    const albListener = new AlbListener(this, 'cdktf_for_alb_listener', {
      loadBalancerArn: alb.arn,
      port:            9000,
      protocol:        'HTTP',
      defaultAction:   [{
        targetGroupArn: albTargetGroup.arn,
        type:           'forward'
      }]
    });

    new AlbListenerRule(this, 'cdktf_for_alb_listener_rule', {
      listenerArn: albListener.arn,
      priority:    100,
      action:      [{
        type:          'forward',
        targetGroupArn: albTargetGroup.arn
      }],
      condition: [{
        field: 'path-pattern',
        values: ['/target/']
      }]
    });

    const ecsCluster = new EcsCluster(this, 'cluster-for-cdktf', {
      name: 'cluster-for-cdktf'
    });

    const imageName:           string = 'project/repository_for_cdktf'
    const imageVersion:        string = 'latest'
    const containerDefinition: string = `[
      {
        "essential":    true,
        "name":         "container-for-cdktf",
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
      containerDefinitions:    containerDefinition,
      family:                  'task-for-cdktf',
      networkMode:             'awsvpc',
      executionRoleArn:        ecsTaskExecutionRole.arn,
      taskRoleArn:             ecstaskrole.arn,
      cpu:                     '256',
      memory:                  '512',
      requiresCompatibilities: [LAUNCH_TYPE]
    });

    const ecsService = new EcsService(this, 'container-for-cdktf-service', {
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
      }],
      loadBalancer: [{
        containerName:  'container-for-cdktf',
        containerPort:  9000,
        targetGroupArn: albTargetGroup.arn
      }]
    });

    const lambdaExecutionIamPolicy = new IamPolicy(this, 'lambda_logging', {
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
              "arn:aws:ecs:${REGION}:445682127642:service/${ecsCluster.name}/${ecsService.name}",
              "arn:aws:iam::445682127642:role/ecsTaskExecutionRole_for_cdktf"
            ],
            "Effect": "Allow"
          }
        ]
      }`
    });

    new IamRolePolicyAttachment(this, 'lambda_policy_attach', {
      role:      lambdaExecutionRole.name,
      policyArn: lambdaExecutionIamPolicy.arn
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
          ['SLACK_SIGNING_SECRET']: '967223f0520093c9f14d82d76e513441'
        }
      }]
    });

    new CloudwatchLogGroup(this, 'lambda_for_sns_log_group', {
      name: `/aws/lambda/${lambda_for_sns.functionName}`
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
          ['SLACK_CHANNEL']:     'C017PFW6D1D',
          ['SUBNET_1']:          subnet1.id,
          ['SUBNET_2']:          subnet2.id,
          ['SECURITY']:          security.id
        }
      }]
    });

    new CloudwatchLogGroup(this, 'lambda_for_slack_api_log_group', {
      name: `/aws/lambda/${lambda_for_slack_api.functionName}`
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
      sourceArn:    snsTopic.arn,
      statementId:  'AllowExecutionFromSNS'
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

    const eventRule = new CloudwatchEventRule(this, 'cdktf_for_event_rule', {
      name:        'capture_aws_ecr_update',
      description: 'Capture each AWS ECR Update',
      eventPattern: `{
        "source": ["aws.ecr"],
        "detail-type": ["ECR Image Action"],
        "detail": {
          "action-type": ["PUSH"],
          "result": ["SUCCESS"]
        }
      }`
    });

    new CloudwatchEventTarget(this, 'cdktf_for_event_target', {
      arn:      snsTopic.arn,
      rule:     eventRule.name,
      targetId: 'SendToSNS'
    });
  }
}

const app = new App();
new CdktfStack(app, 'cdktf');
app.synth();
