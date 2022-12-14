// Set handler type
process.env.handler_name = 'access-logged';

// Start
const Initialiser = require('../app/src/initialiser');
const TestData = require('./data/access-logs');
Initialiser.main(TestData, null, null);