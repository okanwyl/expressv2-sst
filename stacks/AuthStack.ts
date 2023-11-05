import { Cognito, StackContext, use } from "sst/constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import { ApiStack } from "./ApiStack";
import { StorageStack } from "./StorageStack";

export function AuthStack({ stack, app }: StackContext) {
  const { api } = use(ApiStack);
  const { bucket } = use(StorageStack);

  const auth = new Cognito(stack, "Auth", {
    login: ["email"],
  });

  auth.attachPermissionsForAuthUsers(stack, [
    api,
    new iam.PolicyStatement({
      actions: ["s3:*"],
      effect: iam.Effect.ALLOW,
      resources: [
        bucket.bucketArn + "/private/${cognito-identity.amazonaws.com:sub}/*",
      ],
    }),
  ]);

  stack.addOutputs({
    Region: app.region,
    UserPoolId: auth.userPoolId,
    UserPoolClientId: auth.userPoolClientId,
    IdentityPoolId: auth.cognitoIdentityPoolId,
  });

  return {
    auth,
  };
}

// {
//     "UserConfirmed": false,
//     "CodeDeliveryDetails": {
//         "Destination": "a***@e***",
//         "DeliveryMedium": "EMAIL",
//         "AttributeName": "email"
//     },
//     "UserSub": "8d9b8f8c-9da3-4d7a-9b0b-484db9a25a9b"
// }