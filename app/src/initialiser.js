module.exports = {
    main(...args) {
        (async () => {
            // Configure environment variables
            const AWSHelper = require("diu-data-functions").Helpers.Aws;

            // AWS
            const awsCredentials = JSON.parse(await AWSHelper.getSecrets("awsdev"));
            process.env.AWS_SECRETID = awsCredentials.secretid;
            process.env.AWS_SECRETKEY = awsCredentials.secretkey;

            // Postgres
            const postgresCredentials = JSON.parse(await AWSHelper.getSecrets("postgres"));
            process.env.POSTGRES_UN = postgresCredentials.username;
            process.env.POSTGRES_PW = postgresCredentials.password;
        })().then(() => {
            // Initialise class
            let handler = require(`./handlers/${process.env.handler_name}/index`);
            handler = new handler();
            handler.handle(...args);    
        }).catch((error) => {
            console.log(error);
        });
    }
}