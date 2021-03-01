import { Construct } from 'constructs';
import { Vpc, InternetGateway } from '../../../.gen/providers/aws';

export namespace InternetGatewayModule {
  export function create(scope: Construct, vpc: Vpc): InternetGateway {
    return new InternetGateway(scope, 'gateway-for-cdktf', {
      vpcId: vpc.id,
      tags:  {
        'Name': 'ECS vpc-for-cdktf - InternetGateway'
      }
    });
  }
}
