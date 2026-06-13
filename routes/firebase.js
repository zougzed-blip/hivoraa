const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');

// Check Firebase status
router.get('/status', (req, res) => {
  try {
    const projectId = admin.app().options.projectId;
    res.json({
      success: true,
      firebase: 'Connected',
      projectId,
      credentials: {
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID ? '✅ Set' : '❌ Missing',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing',
        apiKey: process.env.FIREBASE_API_KEY ? '✅ Set' : '❌ Missing (Web API Key)',
      },
      debugCheckList: {
        step1: '🔎 Va à: https://console.firebase.google.com/project/hivoraa-323d9/settings/general',
        step2: '📋 Copie ta Web API Key (commence par AIzaSy...)',
        step3: '🌐 Va à: https://console.firebase.google.com/project/hivoraa-323d9/authentication/settings',
        step4: '✅ Ajoute localhost, 127.0.0.1, localhost:5000 dans "Authorized domains"',
        step5: '🔓 Va à: https://console.firebase.google.com/project/hivoraa-323d9/authentication/providers',
        step6: '✅ Active Google Sign-In provider',
        step7: '🧪 Ouvre http://localhost:5000/debug.html pour tester',
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      tip: 'Firebase Admin SDK non correctement configuré'
    });
  }
});

module.exports = router;
