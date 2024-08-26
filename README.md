# ciptex-task-management-backend

Here is my journey to setup the WebSocket API with Lambda Function and DynamoDB.

1. [Setup An Admin Account and IAM Account](#setup-an-admin-account-and-iam-account)

2. [Get The Access Key By Using The IAM Account](#get-the-access-key-by-using-the-iam-account)

3. [Create A Lambda Function](#create-a-lambda-function)

4. [Create Routes And Link Them To A Lambda Function](#create-routes-and-link-them-to-a-lambda-function)

5. [Check If the Routes Have Enabled Two-way Communication](#check-if-the-routes-have-enabled-two-way-communication)

6. [Check If the Routes Are Proxy Integration](#check-if-the-routes-are-proxy-integration)

7. [Adjust The Message From The Boilerplate Lambda Function](#adjust-the-message-from-the-boilerplate-lambda-function)

8. [Test In Terminal With wscat](#test-in-terminal-with-wscat)

9. [Create test, scanEntireTable, createItem, updateStatus And deleteItem Routes, And Their Lambda Function](#create-test-scanentiretable-createitem-updatestatus-and-deleteitem-routes-and-their-lambda-function)

10. [Create DynamoDB For itemsTable and usersTable](#create-dynamodb-for-itemstable-and-userstable)

11. [Provide Permissions To Lambda Function](#provide-permissions-to-lambda-function)

12. [Testing In Postman](#testing-in-postman)

13. [Testing In Terminals](#testing-in-terminals)

14. [Notice: Tackle with errors](#notice-tackle-with-errors)

## Setup An Admin Account and An IAM Account

I sign up for an AWS account to create a root user, and create an IAM user with administrative access by follow this guide:
[Amazon API Gateway Developer Guide - Prerequisites](https://docs.aws.amazon.com/apigateway/latest/developerguide/setting-up.html).

IAM user with administrator permissions will be used for accessing the WebSocket API and DynamoDB.

## Get The Access Key By Using The IAM Account

In the AWS access portal, find the Access Key and get credentials for administratorAccess. They will be used when testing the WebSocket API with Postman.

## Create A Lambda Function

Follow this guide here to create a Hello World Lambda function: [Create your first Lambda function](https://docs.aws.amazon.com/lambda/latest/dg/getting-started.html)

To create a Hello world Lambda function with the console

1. Open the Functions page of the Lambda console https://console.aws.amazon.com/lambda/home#/functions.

2. Choose Create function.

3. Select Author from scratch.

4. In the Basic information pane, for Function name I enter task-management-socket-connection.

5. For Runtime, I choose Node.js 20.x

6. Leave architecture set to x86_64 and choose Create function.

Lambda creates a function that returns the message "Hello from Lambda!"

## Create Routes And Link Them To A Lambda Function

Create routes in the WebSocket API by following this guide in step 2: [Create a WebSocket API](https://docs.aws.amazon.com/apigateway/latest/developerguide/websocket-api-chat-app.html#websocket-api-chat-app-create-api)

To create a WebSocket API

1. Sign in to the API Gateway console at https://console.aws.amazon.com/apigateway.

2. Choose Create API. Then for WebSocket API, choose Build.

3. For API name, I enter task-management-app.

4. For Route selection expression, I enter request.body.action. The route selection expression determines the route that API Gateway invokes when a client sends a message.

5. Choose Next.

6. For Predefined routes, choose Add $connect, Add $disconnect, and Add $default. The $connect and $disconnect routes are special routes that API Gateway invokes automatically when a client connects to or disconnects from an API. API Gateway invokes the $default route when no other routes match a request.

7. For Custom routes, choose Add custom route. For Route key, enter "test". This custom route handles messages that are sent to connected clients.

8. Choose Next.

9. Under Attach integrations, for each route and Integration type, choose Lambda.

10. For Lambda, instead of choosing the corresponding Lambda function that I created to match a specific route, I select the same and only one Lambda function for all routes. It is because I will put all the Lambda functions in a single file.

11. I review the stage that API Gateway creates for me. By default, API Gateway creates a stage name production and automatically deploys my API to that stage. Choose Next.

12. Choose Create and deploy.

## Check If the Routes Have Enabled Two-way Communication

Go to API Gateway -> APIs -> task-management-app.

Check whether each route has enabled two-way communication. The enable button is at the top right corner of the route description.

## Check If the Routes Are Proxy Integration

Go to API Gateway -> APIs -> task-management-app.

Check whether each route is a Lambda proxy integration.

Suppose a route is a Lambda proxy integration, which sends the request to my Lambda function as a structured event. In that case, the word "proxy integration" will be shown under the integration response in the route description diagram.

The $connect, $disconnect, $default, and my first custom route will automatically be set to proxy integration. The other custom routes I created afterwards need me to toggle it in settings when I make a new route by pressing the Create Route button.

## Adjust The Message From The Boilerplate Lambda Function

There is a boilerplate message in the Lambda function when I create function choosing Author from scratch. I edit the message so that it is easier to recognise my own function.

## Test In Terminal With wscat

Test In Terminal by using wscat by following this guide: [Use wscat to connect to a WebSocket API and send messages to it](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-how-to-call-websocket-api-wscat.html)

The below code is inputted in my terminal:

```
wscat -c wss://144lhasnn9.execute-api.eu-north-1.amazonaws.com/production/
> {"action": "test"}
```

The WebSocket API returns me a string:

```
< "Hello from Lambda! This is my first output!"
```

## Create test, scanEntireTable, createItem, updateStatus And deleteItem Routes, And Their Lambda Function

The test route and Lambda function are only for testing purpose.

The scanEntireTable, createItem, updateStatus and deleteItem routes and Lambda functions are the GET, POST, PUT and DELETE in RESTful API.

They are created by refering examples from these resources:

- [The App Creation Template For AWS CloudFormation](https://docs.aws.amazon.com/apigateway/latest/developerguide/websocket-api-chat-app.html#websocket-api-chat-app-create-dependencies)
- [Amazon DynamoDB References](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/dynamodb/)

- Article: [Real-time NodeJs chat application using AWS WebSocket and Lambda](https://medium.com/globant/real-time-nodejs-chat-application-using-aws-websocket-and-lambda-71ec20cd2b0b)
- Article: [How to Use AWS Websocket API with React web application to Work as a Server Sent Event Notifier](https://sidharthvpillai.medium.com/how-to-use-aws-websocket-api-with-react-web-application-to-work-as-a-server-sent-event-notifier-162a1c841397)
- Article: [Build a WebSocket Connection with AWS Lambda in React and Ruby](https://medium.com/@onkarhasabe30/build-a-websocket-connection-with-aws-lambda-in-react-and-ruby-8b219824ec69)

Three AWS SDK packages are used in the WebSocket API when creating the RESTful API, they are [@aws-sdk/client-dynamodb](https://www.npmjs.com/package/@aws-sdk/client-dynamodb), [@aws-sdk/lib-dynamodb](https://www.npmjs.com/package/@aws-sdk/lib-dynamodb) and [@aws-sdk/client-apigatewaymanagementapi](https://www.npmjs.com/package/@aws-sdk/client-apigatewaymanagementapi).

@aws-sdk/client-dynamodb and @aws-sdk/lib-dynamodb are used together to provide services for the ScanCommand, PutCommand, UpdateCommand and DeleteCommand to create the GET, POST, PUT and DELETE commands in RESTful API.

@aws-sdk/client-apigatewaymanagementapi is used to send immediate message to all connected clients by using ApiGatewayManagementApiClient and PostToConnectionCommand.

Again, I check if the routes have enabled two-way communication and are proxy integration.

## Create DynamoDB For itemsTable and usersTable

I create two tables, one for the todo items and one for the users' connectionId.

The todo itemsTable is created because every item in the todo list needs to be stored. The keys are itemId, title and status.

- itemId is a string generated in the WebSocket API using [uuid package](https://www.npmjs.com/package/uuid).
- title is a string typed by the app user in a input box.
- status is a string selected by the app user in a dropdown list.

The usersTable only saves the connectionId, which is a string created when a client connects to the WebSOcket API.

The DynamoDB table creation guide can be found from this tutorial:

- Article: [How to Use AWS Websocket API with React web application to Work as a Server Sent Event Notifier](https://sidharthvpillai.medium.com/how-to-use-aws-websocket-api-with-react-web-application-to-work-as-a-server-sent-event-notifier-162a1c841397)

## Provide Permissions To Lambda Function

From the article [How to Use AWS Websocket API with React web application to Work as a Server Sent Event Notifier](https://sidharthvpillai.medium.com/how-to-use-aws-websocket-api-with-react-web-application-to-work-as-a-server-sent-event-notifier-162a1c841397), it is advised to only give permissions to Lambda function to only what it needs. However, to simplify the process, I give full access to my task-management-socket-connection Lambda function.

The guide to give permissions to Lambda function can be found here: [Add DynamoDB Permission To Lambda](https://dynobase.dev/dynamodb-permissions-lambda/)

## Testing In Postman

Test the WebSocket API by using Postman with an example here: [Send a callback message to the client](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-how-to-call-websocket-api-connections.html)

Using POST request in Postman with the following link can send callback message to other connected clients:

```
https://144lhasnn9.execute-api.eu-north-1.amazonaws.com/production/@connections
```

Notice that access key id, secret access key and session token are needed to provide to the POST request, which can be found from the AWS access portal.

## Testing In Terminals

Testing are successful with the following commands in the terminal:

```
> {"action": "createItem", "title": "This is the first task from terminal02", "status": "todo"}
< {"message":"Item created","item":{"itemId":{"S":"8b24a8f6-5590-46a3-bdbb-4fca778765ae"},"title":{"S":"This is the first task from terminal02"},"status":{"S":"todo"}}}
```

```
> {"action": "updateStatus", "itemId": "8b24a8f6-5590-46a3-bdbb-4fca778765ae", "status": "inprogress"}
< {"message":"Item updated","response":{"$metadata":{"httpStatusCode":200,"requestId":"R2RTPRHI0P8D5ML8SQCQR253BJVV4KQNSO5AEMVJF66Q9ASUAAJG","attempts":1,"totalRetryDelay":0},"Attributes":{"itemId":{"S":"8b24a8f6-5590-46a3-bdbb-4fca778765ae"},"status":{"S":"inprogress"},"title":{"S":"This is the first task from terminal02"}}}}
```

```
> {"action": "deleteItem", "itemId": "8b24a8f6-5590-46a3-bdbb-4fca778765ae"}
< {"message":"Item deleted","response":{"$metadata":{"httpStatusCode":200,"requestId":"O2IUCF5TF63JIOQ7R63N5TO2GBVV4KQNSO5AEMVJF66Q9ASUAAJG","attempts":1,"totalRetryDelay":0}}}
```

```
> {"action": "scanEntireTable"}
< {"message":"Items scanned","response":{"$metadata":{"httpStatusCode":200,"requestId":"M2SMJ0CLDS00VGTFQ5GGTLKHDFVV4KQNSO5AEMVJF66Q9ASUAAJG","attempts":1,"totalRetryDelay":0},"Count":2,"Items":[{"itemId":{"S":"thisispartitionkey"},"status":{"S":"todo"},"title":{"S":"This is the first task created in platform"}},{"itemId":{"S":"7085b41f-154d-4745-9556-06ce75dd8df4"},"status":{"S":"todo"},"title":{"S":"This is the first task from terminal"}}],"ScannedCount":2}}
```

## Notice: Tackle with errors

When testing and running the frontend, I discovered that sometimes the browser and terminal encounter internal service errors. After testing everything, I found that it is due to undelete connectionId in the usersTable in the DynamoDB. The reason for saving undelete connectionId is that the browser cannot correctly close the websocket.

Deleting the unused connectionId from usersTable will solve the problem.
