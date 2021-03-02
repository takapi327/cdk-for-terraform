import { Construct }           from 'constructs';
import { App, TerraformStack } from 'cdktf';
import { AwsProvider } from './.gen/providers/aws';

import { EcsTaskRoleModule, EcsTaskExecutionRoleModule, LambdaExecutionRoleModule } from './lib/module'
import { VpcModule, InternetGatewayModule, RouteTableModule, SubnetModule } from './lib/module/networkLayer'
import { SecurityModule } from './lib/module/securityLayer'
import { AlbModule, EcsModule, S3Module, LambdaModule, CloudwatchModule, SnsModule, ApiGatewayModule } from './lib/module/applicationLayer'

class CdktfStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

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

    const alb            = AlbModule.createAlb(this, security, [subnet1.id, subnet2.id])
    const albTargetGroup = AlbModule.createTargetGroup(this, vpc)
    const albListener    = AlbModule.createAlbListener(this, alb, albTargetGroup)
    AlbModule.createAlbListenerRule(this, albListener, albTargetGroup)

    const ecsCluster        = EcsModule.createCluster(this)
    const ecsRepository     = EcsModule.createRepository(this)
    const ecsTaskDefinition = EcsModule.createEcsTask(this, ecsRepository, ecsTaskRole, ecsTaskExecutionRole)
    EcsModule.createService(
      this,
      ecsCluster,
      ecsTaskDefinition,
      security,
      [subnet1.id, subnet2.id],
      albTargetGroup
    )

    const s3Bucket = S3Module.createBucket(this)
    S3Module.createObject1(this, s3Bucket)
    S3Module.createObject2(this, s3Bucket)

    const lambdaForSns = LambdaModule.createFunctionForSNS(
      this,
      lambdaExecutionRole,
      s3Bucket,
      [{
        variables: {
          ['SLACK_API_TOKEN']:      'xoxb-1276255441778-1782007042404-sSybUERnFKYRyHTHecs3kvr0',
          ['SLACK_CHANNEL']:        'C017PFW6D1D',
          ['SLACK_SIGNING_SECRET']: '967223f0520093c9f14d82d76e513441'
        }
      }]
    )

    CloudwatchModule.createLogGroup(this, 'lambda_for_sns_log_group', `/aws/lambda/${lambdaForSns.functionName}`)
    CloudwatchModule.createLogGroup(this, 'ecs_task_log_group', `/aws/ecs/${ecsTaskDefinition.family}`)

    const lambdaForSlackApi = LambdaModule.createFunctionForAPI(
      this,
      lambdaExecutionRole,
      s3Bucket,
      [{
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
    )

    CloudwatchModule.createLogGroup(this, 'lambda_for_slack_api_log_group', `/aws/lambda/${lambdaForSlackApi.functionName}`)

    const snsTopic = SnsModule.createTopic(this)
    SnsModule.createSubscription(this, lambdaForSns, snsTopic)
    SnsModule.createPolicy(this, snsTopic)

    LambdaModule.permissionLambdaForSNS(this, lambdaForSns, snsTopic)

    const apiGateway         = ApiGatewayModule.createRestApi(this)
    const apiGatewayResource = ApiGatewayModule.createResource(this, apiGateway)
    const apiMethod          = ApiGatewayModule.createMethod(this, apiGatewayResource, apiGateway)
    ApiGatewayModule.createResponse(this, apiMethod, apiGatewayResource, apiGateway)
    ApiGatewayModule.createIntegration(this, apiMethod, apiGateway, apiGatewayResource, lambdaForSlackApi)
    const apiDeploy = ApiGatewayModule.deployment(this, apiGateway)
    ApiGatewayModule.createStage(this, apiDeploy, apiGateway)

    LambdaModule.permissionLambdaForApi(this, lambdaForSlackApi, `${apiGateway.executionArn}/*/${apiMethod.httpMethod}/${apiGatewayResource.pathPart}`)

    const eventRule = CloudwatchModule.createEventRule(this)
    CloudwatchModule.createEventTarget(this, snsTopic, eventRule)

  }
}

const app = new App();
new CdktfStack(app, 'cdktf');
app.synth();
