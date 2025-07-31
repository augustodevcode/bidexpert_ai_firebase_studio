const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize the Firebase Admin SDK
admin.initializeApp();

/**
 * A callable Cloud Function to register a new user.
 */
exports.registerUser = functions.https.onCall(async (data, context) => {
  const { email, password, name } = data;

  // Basic validation
  if (!email || !password || !name) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with "email", "password", and "name" arguments.'
    );
  }

  try {
    // Create the user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    functions.logger.info(`Successfully created new user: ${name} (${email}) with UID: ${userRecord.uid}`);

    // You can perform other actions here, like creating a user document in Firestore
    // await admin.firestore().collection('users').doc(userRecord.uid).set({ name, email, role: 'bidder' });

    return {
      uid: userRecord.uid,
      message: `Successfully created new user: ${name} (${email})`,
    };

  } catch (error) {
    functions.logger.error('Error creating new user:', error);
    // It's good practice to throw a specific HttpsError for the client
    if (error.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'The email address is already in use by another account.');
    }
    throw new functions.https.HttpsError('internal', 'An error occurred while creating the user.');
  }
});
