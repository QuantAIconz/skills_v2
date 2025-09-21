// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Configure email transporter (using Gmail as example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().gmail.email,
    pass: functions.config().gmail.password,
  },
});

// Store verification codes in Firestore with expiration
const verificationCodes = admin.firestore().collection('verificationCodes');

// Generate and send sign-in code
exports.sendSignInCode = functions.https.onCall(async (data, context) => {
  const { email } = data;
  
  // Validate email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid email is required');
  }
  
  try {
    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code in Firestore with expiration (10 minutes)
    await verificationCodes.doc(email).set({
      code,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });
    
    // Send email with code
    const mailOptions = {
      from: functions.config().gmail.email,
      to: email,
      subject: 'Your Sign-In Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your QuantAI Sign-In Code</h2>
          <p>Use the following code to sign in to your account:</p>
          <div style="background-color: #f3f4f6; padding: 16px; text-align: center; margin: 20px 0;">
            <h1 style="margin: 0; font-size: 32px; letter-spacing: 8px; color: #000;">${code}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    
    return { success: true, message: 'Verification code sent' };
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send verification code');
  }
});

// Verify sign-in code
exports.verifySignInCode = functions.https.onCall(async (data, context) => {
  const { email, code } = data;
  
  if (!email || !code) {
    throw new functions.https.HttpsError('invalid-argument', 'Email and code are required');
  }
  
  try {
    // Get the stored code
    const codeDoc = await verificationCodes.doc(email).get();
    
    if (!codeDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'No verification code found for this email');
    }
    
    const codeData = codeDoc.data();
    const now = new Date();
    
    // Check if code has expired
    if (now > codeData.expiresAt.toDate()) {
      await verificationCodes.doc(email).delete();
      throw new functions.https.HttpsError('deadline-exceeded', 'Verification code has expired');
    }
    
    // Check if code matches
    if (codeData.code !== code) {
      throw new functions.https.HttpsError('permission-denied', 'Invalid verification code');
    }
    
    // Code is valid - get or create user
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        userRecord = await admin.auth().createUser({
          email,
          emailVerified: true,
          displayName: email.split('@')[0],
        });
        
        // Create user document in Firestore
        await admin.firestore().collection('users').doc(userRecord.uid).set({
          email,
          name: email.split('@')[0],
          role: 'candidate',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        throw error;
      }
    }
    
    // Generate custom token for the user
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    
    // Clean up the used code
    await verificationCodes.doc(email).delete();
    
    return { success: true, customToken };
  } catch (error) {
    console.error('Error verifying code:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to verify code');
  }
});