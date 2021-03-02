import { Construct } from 'constructs';
import {
  CloudwatchLogGroup
} from '../../../.gen/providers/aws';

export namespace CloudwatchModule {

  export function createLogGroup(scope: Construct, id: string, name: string): CloudwatchLogGroup {
    return new CloudwatchLogGroup(scope, id, {
      name: name
    });
  }
}
