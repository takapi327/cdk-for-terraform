import { Construct } from 'constructs';
import {
  S3Bucket,
  S3BucketObject
} from '../../../.gen/providers/aws';
import * as path from 'path';

export namespace S3Module {
  export function createBucket(scope: Construct): S3Bucket {
    return new S3Bucket(scope, 's3-for-cdktf', {
      bucket: 's3-for-cdktf',
      region: 'ap-northeast-1'
    });
  }

  export function createObject1(scope: Construct, s3Bucket: S3Bucket): S3BucketObject {
    return new S3BucketObject(scope, 'update-image-of-ecr-dist.zip', {
      bucket:      s3Bucket.bucket,
      key:         'update-image-of-ecr-dist.zip',
      contentType: 'zip',
      source:      path.resolve('./src/main/typescript/aws/lambda/slack/notification/update-image-of-ecr/update-image-of-ecr-dist/update-image-of-ecr-dist.zip')
    });
  }

  export function createObject2(scope: Construct, s3Bucket: S3Bucket): S3BucketObject {
    return new S3BucketObject(scope, 'update-task-of-ecs-dist.zip', {
      bucket:      s3Bucket.bucket,
      key:         'update-task-of-ecs-dist.zip',
      contentType: 'zip',
      source:      path.resolve('./src/main/typescript/aws/lambda/slack/api/update-task-of-ecs/update-task-of-ecs-dist/update-task-of-ecs-dist.zip')
    });
  }
}
