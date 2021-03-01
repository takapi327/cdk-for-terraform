import { Construct } from 'constructs';
import {
  EcsCluster
} from '../../../.gen/providers/aws';

export namespace EcsModule {
  export function createCluster(scope: Construct): EcsCluster {
    return new EcsCluster(scope, 'cluster-for-cdktf', {
      name: 'cluster-for-cdktf'
    });
  }
}
