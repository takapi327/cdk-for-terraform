import { Construct }                  from 'constructs';
import { App, TerraformStack } from 'cdktf';
import * as path from 'path';
import {
  AwsProvider,
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
  SnsTopicPolicy,
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

import { EcsTaskRoleModule, EcsTaskExecutionRoleModule, LambdaExecutionRoleModule } from './lib/module'
import { VpcModule, InternetGatewayModule, RouteTableModule, SubnetModule } from './lib/module/networkLayer'
import { SecurityModule } from './lib/module/securityLayer'
import { AlbModule } from './lib/module/applicationLayer'

class CdktfStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    const LAUNCH_TYPE: string = 'FARGATE'

    new AwsProvider(this, 'aws-for-cdktf', {
      region: 'ap-northeast-1'
    });

    const ecsTaskRole      = EcsTaskRoleModule.createRole(this)
    const ecsTaskIamPolicy = EcsTaskRoleModule.createPolicy(this)
    EcsTaskRoleModule.attachmentRole(this, ecsTaskRole, ecsTaskIamPolicy)

    const ecsTaskExecutionRole      = EcsTaskExecutionRoleModule.createRole(this)
    const ecsTaskExecutionIamPolicy = EcsTaskExecutionRoleModule.createPolicy(this)
    EcsTaskExecutionRoleModule.attachmentRole(this, ecsTaskRole, ecsTaskExecutionIamPolicy)

    const lambdaExecutionRole      = LambdaExecutionRoleModule.createRole(this)
    const lambdaExecutionIamPolicy = LambdaExecutionRoleModule.createPolicy(this)
    LambdaExecutionRoleModule.attachmentRole(this, lambdaExecutionRole, lambdaExecutionIamPolicy)

    const vpc             = VpcModule.create(this)
    const internetGateway = InternetGatewayModule.create(this, vpc)
    const routeTable      = RouteTableModule.create(this, vpc, internetGateway)

    const subnet1 = SubnetModule.create1(this, vpc)
    const subnet2 = SubnetModule.create2(this, vpc)

    RouteTableModule.association(this, routeTable, subnet1, 'route-for-cdktf1')
    RouteTableModule.association(this, routeTable, subnet2, 'route-for-cdktf2')

    const security = SecurityModule.create(this, vpc)
    SecurityModule.ingressRule(this, vpc, security)
    SecurityModule.egressRule(this, security)

    const alb = AlbModule.createAlb(this, security, [subnet1.id, subnet2.id])

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
        values: ['*']
      }]
    });

    const ecsCluster = new EcsCluster(this, 'cluster-for-cdktf', {
      name: 'cluster-for-cdktf'
    });

    const ecsRepository = new EcrRepository(this, 'project/repository_for_cdktf', {
      name: 'project/repository_for_cdktf'
    });

    const imageVersion:        string = 'latest'
    const containerDefinition: string = `[
      {
        "essential":    true,
        "name":         "container-for-cdktf",
        "image":        "${ecsRepository.repositoryUrl}:${imageVersion}",
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

    const ecsTaskDefinition = new EcsTaskDefinition(this, 'task-for-cdktf', {
      containerDefinitions:    containerDefinition,
      family:                  'task-for-cdktf',
      networkMode:             'awsvpc',
      executionRoleArn:        ecsTaskExecutionRole.arn,
      taskRoleArn:             ecsTaskRole.arn,
      cpu:                     '512',
      memory:                  '1024',
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
        assignPublicIp: true,
        securityGroups: [security.id],
        subnets:        [subnet1.id, subnet2.id]
      }],
      loadBalancer: [{
        containerName:  'container-for-cdktf',
        containerPort:  9000,
        targetGroupArn: albTargetGroup.arn
      }]
    });

    const s3Bucket = new S3Bucket(this, 's3-for-cdktf', {
      bucket: 's3-for-cdktf',
      region: 'ap-northeast-1'
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

    new CloudwatchLogGroup(this, 'ecs_task_log_group', {
      name: `/aws/ecs/${ecsTaskDefinition.family}`
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
          ['DOCKER_IMAGE_PATH']: ecsRepository.repositoryUrl,
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

    new SnsTopicPolicy(this, 'cdktf_for_sns_policy', {
      arn: snsTopic.arn,
      policy: `{
        "Version":   "2012-10-17",
        "Statement": {
          "Effect": "Allow",
          "Sid":    "",
          "Principal": {
            "Service": "events.amazonaws.com"
          },
          "Action": [
            "SNS:Publish"
          ],
          "Resource": [
            "*"
          ]
        }
      }`
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
