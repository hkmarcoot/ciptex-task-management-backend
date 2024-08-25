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

async function on_connect(myconnectionId: string) {
  try {
    if (!myconnectionId) return;
    const command = new PutCommand({
      TableName: "usersTable",
      Item: {
        connectionId: myconnectionId,
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

async function on_disconnect(myconnectionId: string) {
  try {
    if (!myconnectionId) return;
    const command = new DeleteCommand({
      TableName: "usersTable",
      Key: {
        connectionId: myconnectionId,
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

async function sendAllItemsToClients(
  myconnectionId: string,
  domainName: string,
  stage: string
) {
  /*
       The below part will send all the items to all clients in thier terminal
       */

  // Firstly, get all clients from the usersTable in DynamoDB
  const input2 = {
    TableName: "usersTable",
  };
  const ddbcommand = new ScanCommand(input2);
  let connections;
  try {
    connections = await docClient.send(ddbcommand);
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
    };
  }
  // All clients' id are now stored in connections object.
  // Now we need to get all items from itemsTable in DynamoDB
  const input3 = {
    TableName: "itemsTable",
  };
  const itemddbcommand = new ScanCommand(input3);
  let allItems;
  try {
    allItems = await docClient.send(itemddbcommand);
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
    };
  }
  // All items are now stored in allItems object.
  // Below we will send the items to every client.

  const callbackAPI = new ApiGatewayManagementApiClient({
    apiVersion: "2018-11-29",
    endpoint: "https://" + domainName + "/" + stage,
  });

  const sendItems = connections.Items.map(async ({ connectionId }) => {
    if (connectionId !== myconnectionId) {
      try {
        await callbackAPI.send(
          new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: JSON.stringify(allItems),
          })
        );
      } catch (error) {
        console.log(error);
      }
    }
  });

  try {
    await Promise.all(sendItems);
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
    };
  }
}

async function on_createItem(
  myconnectionId: string,
  body: any,
  domainName: string,
  stage: string
) {
  try {
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
    console.log("Create result: " + JSON.stringify(data));
    // return {
    //   statusCode: 200,
    //   body: JSON.stringify({ message: "Item created", item }),
    // };

    /*
       The below function will send all the items to all clients in thier terminal
      */
    await sendAllItemsToClients(myconnectionId, domainName, stage);

    return { statusCode: 200 };
  } catch (error) {
    console.error("Error in on_createItem: ", error);
    return { statusCode: 500, body: "Failed to create item" };
  }
}

async function on_updateStatus(
  myconnectionId: string,
  body: any,
  domainName: string,
  stage: string
) {
  try {
    // if (!myconnectionId) return;
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
    console.log("Update result: " + JSON.stringify(response));
    // return {
    //   statusCode: 200,
    //   body: JSON.stringify({ message: "Item updated", response }),
    // };

    /*
        The below function will send all the items to all clients in thier terminal
      */
    await sendAllItemsToClients(myconnectionId, domainName, stage);

    return { statusCode: 200 };
  } catch (error) {
    console.error("Error in on_updateStatus: ", error);
    return { statusCode: 500, body: "Failed to update item" };
  }
}

async function on_deleteItem(
  myconnectionId: string,
  body: any,
  domainName: string,
  stage: string
) {
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
    console.log("Delete result: " + JSON.stringify(response));
    // return {
    //   statusCode: 200,
    //   body: JSON.stringify({ message: "Item deleted", response }),
    // };

    /*
        The below function will send all the items to all clients in thier terminal
      */
    await sendAllItemsToClients(myconnectionId, domainName, stage);

    return { statusCode: 200 };
  } catch (error) {
    console.error("Error in on_deleteItem: ", error);
    return { statusCode: 500, body: "Failed to delete item" };
  }
}

function testing(myconnectionId: string, domainName: string, stage: string) {
  var outputTest = {
    message:
      "Hello from Lambda! This is the test route. connectionId: " +
      myconnectionId +
      "|domainName: " +
      domainName +
      "|stage: " +
      stage,
  };
  const responseTest = {
    statusCode: 200,
    body: JSON.stringify(outputTest),
  };
  return responseTest;
}

export const handler = async (event: any) => {
  const {
    body,
    requestContext: {
      routeKey,
      connectionId: myconnectionId,
      domainName,
      stage,
    },
  } = event;

  switch (routeKey) {
    case "$connect":
      await on_connect(myconnectionId);
      break;

    case "$disconnect":
      await on_disconnect(myconnectionId);
      break;

    case "test":
      return testing(myconnectionId, domainName, stage);

    case "scanEntireTable":
      var res1 = await on_scanEntireTable();
      return res1;

    case "createItem":
      var res2 = await on_createItem(myconnectionId, body, domainName, stage);
      return res2;

    case "updateStatus":
      var res3 = await on_updateStatus(myconnectionId, body, domainName, stage);
      return res3;

    case "deleteItem":
      var res4 = await on_deleteItem(myconnectionId, body, domainName, stage);
      return res4;

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
