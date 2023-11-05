import handler from "@expressv2-sst/core/handler";
import dynamoDb from "@expressv2-sst/core/dynamodb";
import { Table } from "sst/node/table";

export const main = handler(async (event) => {
  const params = {
    TableName: Table.Notes.tableName,
    Key: {
      userId: event.requestContext.authorizer?.iam.cognitoIdentity.identityId,
      noteId: event?.pathParameters?.id, // The id of the note from the path
    },
  };

  await dynamoDb.delete(params);

  return JSON.stringify({ status: true });
});
