import { Construct }   from 'constructs';
import {
  IamRole,
  LambdaFunction,
  S3Bucket,
  LambdaFunctionEnvironment
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
}
