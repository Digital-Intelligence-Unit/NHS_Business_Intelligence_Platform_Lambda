const { Construct } = require("constructs");
const { Vpc } = require("aws-cdk-lib/aws-ec2");
const { SubnetType, SecurityGroup } = require("aws-cdk-lib/aws-ec2");
const { ManagedPolicy, Role, ServicePrincipal, PolicyStatement, Effect } = require("aws-cdk-lib/aws-iam");

const lambda = require("aws-cdk-lib/aws-lambda");
const environment = require('../../environment');

class BaseLambda extends Construct {
    _vpc;
    get vpc() {
        if(!this._vpc) {
            this._vpc = Vpc.fromLookup(this, "BIPlatformVPC", { 
                vpcId: environment.vpc
            });
        }
        return this._vpc;
    }

    createFunction (options = {
        runtime: null,
        handler: null,
        environment: null,
        timeout: null,
        role: null
    }) {
        return new lambda.Function(this, `${this.constructor.name}Handler`, {
            runtime: options.runtime,
            code: lambda.Code.fromAsset("app"),
            handler: options.handler,
            environment: Object.assign({}, {
                PGDATABASE: environment.rds_endpoint
            }, options.environment),

            vpc: this.vpc,
            vpcSubnets: this.vpc.selectSubnets({ subnetType: SubnetType.PRIVATE }),
            securityGroups: [
                SecurityGroup.fromLookupByName(
                    this, `${this.constructor.name}DatabaseConnection`, 'postgis_database', this.vpc
                )
            ],

            timeout: options.timeout,
            role: options.role || this.createDefaultRole(),
        });
    }

    createDefaultRole() {
        // Create role
        const role = new Role(this, `${this.constructor.name}Role`, {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            roleName: `${this.constructor.name}Role`,
        });

        // Add needed policies
        role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonRDSReadOnlyAccess"));
        role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"));
        role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"));
        role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonVPCCrossAccountNetworkInterfaceOperations"));
        role.addManagedPolicy(new ManagedPolicy(this, "SecretsManagerRead", {
            statements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: ["secretsmanager:GetSecretValue"],
                    resources: ["*"]
                })
            ]
        }));

        return role;
    }
}

module.exports = BaseLambda;