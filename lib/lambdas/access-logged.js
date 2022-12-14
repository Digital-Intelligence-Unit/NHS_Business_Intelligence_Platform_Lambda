const BaseLambda = require('./base');
const { DynamoEventSource } = require("aws-cdk-lib/aws-lambda-event-sources");
const { Duration } = require("aws-cdk-lib");

const environment = require('../../environment');
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const lambda = require("aws-cdk-lib/aws-lambda");

class AccessLoggedLambda extends BaseLambda {
    constructor(scope, id) {
        // Run parent
        super(scope, id)

        // Create function
        const handler = this.createFunction({
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: "src/initialiser.main",
            environment: { 
                handler_name: 'access-logged',
            },
            timeout: Duration.minutes(5)
        });
        
        // Get table
        const accessLogTable = dynamodb.Table.fromTableName(this, 'AccessLogTable', 'access_logs');
        accessLogTable.tableStreamArn = environment["access-logged"].streamArn;
        
        // Grant lambda permissions
        accessLogTable.grantStreamRead(handler);
        accessLogTable.grantTableListStreams(handler);

        // Add dynamo db trigger
        handler.addEventSource(
            new DynamoEventSource(
                accessLogTable, {
                    batchSize: 25,
                    retryAttempts: 2,
                    maxBatchingWindow: Duration.minutes(5),
                    startingPosition: lambda.StartingPosition.LATEST,
                }
            )
        );
    }
}
module.exports = AccessLoggedLambda;