// import AWS from "aws-sdk";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

async function on_connect(connectionId) {
  try {
    const command = new PutCommand({
      TableName: "usersTable",
      Item: {
        connectionId: connectionId,
      },
    });

    await docClient.send(command);
  } catch (error) {
    console.error("Error in on_connect: ", error);
    return { statusCode: 500, body: "Failed to connect" };
  }
  return {
    statusCode: 200,
  };
}

async function on_disconnect(connectionId) {
  try {
    const command = new DeleteCommand({
      TableName: "usersTable",
      Key: {
        connectionId: connectionId,
      },
    });

    await docClient.send(command);
  } catch (error) {
    console.error("Error in on_disconnect: ", error);
    return { statusCode: 500, body: "Failed to disconnect" };
  }
  return {
    statusCode: 200,
  };
}

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
    const response = await docClient.send(command);
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
      itemId: uuidv4(),
      title: parsedBody.title,
      status: parsedBody.status,
    };

    const params = {
      TableName: "itemsTable",
      Item: item,
    };

    const data = await docClient.send(new PutCommand(params));
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

async function on_updateStatus(body, domainName, stage) {
  try {
    const parsedBody = JSON.parse(body);
    const targetId = parsedBody.itemId;
    const newStatus = parsedBody.status;

    const input = {
      ExpressionAttributeNames: {
        "#ST": "status",
      },
      ExpressionAttributeValues: {
        ":t": newStatus,
      },
      Key: {
        itemId: targetId,
      },
      ReturnValues: "ALL_NEW",
      TableName: "itemsTable",
      UpdateExpression: "SET #ST = :t",
    };
    const command = new UpdateCommand(input);
    const response = await docClient.send(command);
    console.log("result: " + JSON.stringify(response));
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Item updated", response }),
    };

    // The below part will send all the items to all clients in thier terminal
    // const input2 = {

    //   TableName: "",
    // };
    // const ddbcommand = new ScanCommand(input2);
    // let connections;
    // try {
    //   connections = await docClient.send(ddbcommand);
    // } catch (error) {
    //   console.log(error);
    //   return {
    //     statusCode: 500,
    //   };
    // }

    // const callbackAPI = new ApiGatewayManagementApiClient({
    //   apiVersion: '2018-11-29',
    //   endpoint: 'https://' + domainName + '/' + stage,
    //   });
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
        itemId: targetId,
      },
      TableName: "itemsTable",
    };
    const command = new DeleteCommand(input);
    const response = await docClient.send(command);
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
      // console.log("Connection begins. connectionId: " + connectionId);
      await on_connect(connectionId);
      break;
    case "$disconnect":
      // console.log("disconnected.");
      await on_disconnect(connectionId);
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
      var res = await on_updateStatus(body, domainName, stage);
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
