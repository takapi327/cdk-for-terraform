import { Construct } from 'constructs';
import { Vpc } from '../../../.gen/providers/aws';

export namespace VpcModule {
  export function create(scope: Construct): Vpc {
    return new Vpc(scope, 'cdktf-production', {
      cidrBlock:          '10.0.0.0/16',
      enableDnsHostnames: true,
      tags:               { ['Name']: 'cdktf production' }
    });
  }
}
