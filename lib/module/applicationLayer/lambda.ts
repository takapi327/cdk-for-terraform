import { Construct }   from 'constructs';
import {
  IamRole,
  S3Bucket,
  SnsTopic,
  LambdaFunction,
  LambdaFunctionEnvironment,
  LambdaPermission
} from '../../../.gen/providers/aws';

export namespace LambdaModule {
  export function createFunctionForSNS(
    scope:               Construct,
    lambdaExecutionRole: IamRole,
    s3Bucket:            S3Bucket,
    variables:           LambdaFunctionEnvironment[]
  ): LambdaFunction {
    return new LambdaFunction(scope, 'cdktf_for_slack_sns', {
      functionName: 'cdktf_for_slack_sns',
      handler:      'index.handler',
      role:         lambdaExecutionRole.arn,
      runtime:      'nodejs12.x',
      s3Bucket:     s3Bucket.bucket,
      s3Key:        'update-image-of-ecr-dist.zip',
      timeout:      30,
      environment:  variables
    });
  }

  export function createFunctionForAPI(
    scope:               Construct,
    lambdaExecutionRole: IamRole,
    s3Bucket:            S3Bucket,
    variables:           LambdaFunctionEnvironment[]
  ): LambdaFunction {
    return new LambdaFunction(scope, 'cdktf_for_slack_sns', {
      functionName: 'cdktf_for_slack_sns',
      handler:      'index.handler',
      role:         lambdaExecutionRole.arn,
      runtime:      'nodejs12.x',
      s3Bucket:     s3Bucket.bucket,
      s3Key:        'update-image-of-ecr-dist.zip',
      timeout:      30,
      environment:  variables
    });
  }

  export function permissionLambdaForSNS(scope: Construct, lambdaForSns: LambdaFunction, snsTopic: SnsTopic): LambdaPermission {
    return new LambdaPermission(scope, 'lambda_permission_for_cdktf_lambda_sns', {
      action:       'lambda:InvokeFunction',
      functionName: lambdaForSns.functionName,
      principal:    'sns.amazonaws.com',
      sourceArn:    snsTopic.arn,
      statementId:  'AllowExecutionFromSNS'
    });
  }

  export function permissionLambdaForApi(scope: Construct, lambdaForSlackApi: LambdaFunction, sourceArn: string): LambdaPermission {
    return new LambdaPermission(scope, 'lambda_permission_for_cdktf_lambda_api', {
      action:       'lambda:InvokeFunction',
      functionName: lambdaForSlackApi.functionName,
      principal:    'apigateway.amazonaws.com',
      sourceArn:    sourceArn,
      statementId:  'AllowAPIGatewayInvoke'
    });
  }
}
