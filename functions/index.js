const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * A simple HTTP-triggered function to test the setup.
 */
exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Logs do Hello World!", {structuredData: true});
  response.send("Olá do BidExpert AI!");
});
