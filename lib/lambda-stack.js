const { Stack } = require("aws-cdk-lib");
const Lambdas = require('./lambdas');

class LambdaStack extends Stack {
    /**
     *
     * @param {Construct} scope
     * @param {string} id
     * @param {StackProps=} props
     */
    constructor(scope, id, props) {
        // Call parent
        super(scope, id, props);

        // Add lambdas
        Lambdas.forEach((LambdaClass) => {
            new LambdaClass(this, LambdaClass.name)
        });
    }
}

module.exports = { LambdaStack }
