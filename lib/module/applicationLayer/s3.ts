import { Construct } from 'constructs';
import {
  S3Bucket
} from '../../../.gen/providers/aws';

export namespace S3Module {
  export function createBucket(scope: Construct): S3Bucket {
    return new S3Bucket(this, 's3-for-cdktf', {
      bucket: 's3-for-cdktf',
      region: 'ap-northeast-1'
    });
  }
}
