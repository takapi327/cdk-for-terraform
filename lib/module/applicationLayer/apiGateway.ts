import { Construct }   from 'constructs';
import {
  ApiGatewayRestApi,
  ApiGatewayMethod,
  ApiGatewayMethodResponse,
  ApiGatewayResource,
  ApiGatewayDeployment,
  ApiGatewayStage,
  ApiGatewayIntegration,
} from '../../../.gen/providers/aws';

export namespace ApiGatewayModule {
  export function createRestApi(scope: Construct): ApiGatewayRestApi {
    return new ApiGatewayRestApi(scope, 'cdktf_for_api_rest', {
      name: 'cdktf_for_apigateway'
    });
  }
}
