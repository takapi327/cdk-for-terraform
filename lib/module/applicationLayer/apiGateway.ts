import { Construct }   from 'constructs';
import {
  ApiGatewayRestApi,
  ApiGatewayMethod,
  ApiGatewayMethodResponse,
  ApiGatewayResource,
  ApiGatewayDeployment,
  ApiGatewayStage,
  ApiGatewayIntegration,
  LambdaFunction
} from '../../../.gen/providers/aws';

export namespace ApiGatewayModule {
  export function createRestApi(scope: Construct): ApiGatewayRestApi {
    return new ApiGatewayRestApi(scope, 'cdktf_for_api_rest', {
      name: 'cdktf_for_apigateway'
    });
  }

  export function createResource(scope: Construct, apiGateway: ApiGatewayRestApi): ApiGatewayResource {
    return  new ApiGatewayResource(scope, 'cdktf_for_api_resource', {
      parentId:  apiGateway.rootResourceId,
      pathPart:  'ecs-deploy',
      restApiId: apiGateway.id
    });
  }

  export function createMethod(scope: Construct, apiGatewayResource: ApiGatewayResource, apiGateway: ApiGatewayRestApi): ApiGatewayMethod {
    return  new ApiGatewayMethod(scope, 'cdktf_for_api_method', {
      authorization: 'NONE',
      httpMethod:    'POST',
      resourceId:    apiGatewayResource.id,
      restApiId:     apiGateway.id
    });
  }

  export function createResponse(scope: Construct, apiMethod: ApiGatewayMethod, apiGatewayResource: ApiGatewayResource, apiGateway: ApiGatewayRestApi): ApiGatewayMethodResponse {
    return new ApiGatewayMethodResponse(scope, 'cdktf_for_api_method_response', {
      httpMethod: apiMethod.httpMethod,
      resourceId: apiGatewayResource.id,
      restApiId:  apiGateway.id,
      statusCode: '200',
      responseModels: {
        'application/json': 'Empty'
      }
    });
  }

  export function createIntegration(
    scope:              Construct,
    apiMethod:          ApiGatewayMethod,
    apiGateway:         ApiGatewayRestApi,
    apiGatewayResource: ApiGatewayResource,
    lambdaForSlackApi:  LambdaFunction
  ): ApiGatewayIntegration {
    return new ApiGatewayIntegration(scope, 'cdktf_for_api_integration', {
      httpMethod:            apiMethod.httpMethod,
      restApiId:             apiGateway.id,
      resourceId:            apiGatewayResource.id,
      integrationHttpMethod: 'POST',
      type:                  'AWS_PROXY',
      uri:                   lambdaForSlackApi.invokeArn
    });
  }

  export function deployment(scope: Construct, apiGateway: ApiGatewayRestApi): ApiGatewayDeployment {
    return new ApiGatewayDeployment(scope, 'cdktf_for_apideploy', {
      restApiId: apiGateway.id
    });
  }

  export function createStage(scope: Construct, apiDeploy: ApiGatewayDeployment, apiGateway: ApiGatewayRestApi): ApiGatewayStage {
    return new ApiGatewayStage(scope, 'cdktf_for_api_stage', {
      deploymentId: apiDeploy.id,
      restApiId:    apiGateway.id,
      stageName:    'cdktf_for_apistage'
    });
  }
}
