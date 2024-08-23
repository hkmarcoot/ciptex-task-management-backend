// import AWS from "aws-sdk";
import {
  DynamoDBClient,
  ScanCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";
// import {
//   ApiGatewayManagementApiClient,
//   PostToConnectionCommand,
// } from "@aws-sdk/client-apigatewaymanagementapi";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({});

async function on_scanEntireTable() {
  try {
    const input = {
      ExpressionAttributeNames: {
        "#ID": "itemId",
        "#TT": "title",
        "#ST": "status",
      },
      ProjectionExpression: "#ID, #TT, #ST",
      TableName: "itemsTable",
    };
    const command = new ScanCommand(input);
    const response = await client.send(command);
    console.log("result: " + JSON.stringify(response));
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Items scanned", response }),
    };
  } catch (error) {
    console.error("Error in on_scanEntireTable: ", error);
    return { statusCode: 500, body: "Failed to scan items" };
  }
}

async function on_createItem(body) {
  try {
    // const title = event.body.title;
    // const status = event.body.status;
    const parsedBody = JSON.parse(body);

    const item = {
      itemId: { S: uuidv4() },
      title: { S: parsedBody.title },
      status: { S: parsedBody.status },
    };

    const params = {
      TableName: "itemsTable",
      Item: item,
    };

    const data = await client.send(new PutItemCommand(params));
    console.log("result: " + JSON.stringify(data));
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Item created", item }),
    };
  } catch (error) {
    console.error("Error in on_createItem: ", error);
    return { statusCode: 500, body: "Failed to create item" };
  }
}

async function on_updateStatus(body) {
  try {
    const parsedBody = JSON.parse(body);
    const targetId = parsedBody.itemId;
    const newStatus = parsedBody.status;

    const input = {
      ExpressionAttributeNames: {
        "#ST": "status",
      },
      ExpressionAttributeValues: {
        ":t": {
          S: newStatus,
        },
      },
      Key: {
        itemId: {
          S: targetId,
        },
      },
      ReturnValues: "ALL_NEW",
      TableName: "itemsTable",
      UpdateExpression: "SET #ST = :t",
    };
    const command = new UpdateItemCommand(input);
    const response = await client.send(command);
    console.log("result: " + JSON.stringify(response));
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Item updated", response }),
    };
  } catch (error) {
    console.error("Error in on_updateStatus: ", error);
    return { statusCode: 500, body: "Failed to update item" };
  }
}

async function on_deleteItem(body) {
  try {
    const parsedBody = JSON.parse(body);
    const targetId = parsedBody.itemId;

    const input = {
      Key: {
        itemId: {
          S: targetId,
        },
      },
      TableName: "itemsTable",
    };
    const command = new DeleteItemCommand(input);
    const response = await client.send(command);
    console.log("result: " + JSON.stringify(response));
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Item deleted", response }),
    };
  } catch (error) {
    console.error("Error in on_deleteItem: ", error);
    return { statusCode: 500, body: "Failed to delete item" };
  }
}

function testing(connectionId) {
  var outputTest = {
    message:
      "Hello from Lambda! This is the test route. connectionId: " +
      connectionId,
  };
  const responseTest = {
    statusCode: 200,
    body: JSON.stringify(outputTest),
  };
  return responseTest;
}

export const handler = async (event) => {
  const {
    body,
    requestContext: { routeKey, connectionId, domainName, stage },
  } = event;
  // const title = event.body.title;
  // const status = event.body.status;

  switch (routeKey) {
    case "$connect":
      console.log("Connection begins. connectionId: " + connectionId);
      // await on_connect(connectionId, user_name, user_id);
      // return connecting(connectionId);
      break;
    case "$disconnect":
      console.log("disconnected.");
      break;
    case "test":
      // const callbackUrl = `https://${domainName}/${stage}`;
      // await on_message(connectionId, body, callbackUrl);
      return testing(connectionId);
    // break;
    case "scanEntireTable":
      var res = await on_scanEntireTable();
      return res;
    case "createItem":
      var res = await on_createItem(body);
      return res;
    // break;
    case "updateStatus":
      var res = await on_updateStatus(body);
      return res;
    // break;
    case "deleteItem":
      var res = await on_deleteItem(body);
      return res;
    // break;
    default:
      break;
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify(
      "Successful connection. Please use one of the routes."
    ),
  };
  return response;
};
