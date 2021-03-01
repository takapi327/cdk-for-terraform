import { Construct } from 'constructs';
import {
  EcsCluster,
  EcrRepository
} from '../../../.gen/providers/aws';

export namespace EcsModule {
  export function createCluster(scope: Construct): EcsCluster {
    return new EcsCluster(scope, 'cluster-for-cdktf', {
      name: 'cluster-for-cdktf'
    });
  }

  export function createRepository(scope: Construct): EcrRepository {
    return new EcrRepository(scope, 'project/repository_for_cdktf', {
      name: 'project/repository_for_cdktf'
    });
  }
}
