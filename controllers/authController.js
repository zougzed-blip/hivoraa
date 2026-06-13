const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { OAuth2Client } = require('google-auth-library');

const verifyFirebaseToken = async (token) => {
  const admin = require('../config/firebase');
  const decoded = await admin.auth().verifyIdToken(token);
  return { uid: decoded.uid, email: decoded.email, name: decoded.name };
};

const verifyGoogleToken = async (token) => {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();
  return { uid: payload.sub, email: payload.email, name: payload.name };
};

const googleLogin = async (req, res, next) => {
  try {
    const { token, email, name, sub } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token required.' });
    }

    let uid, userEmail, userName;

    if (email && sub) {
      uid = sub;
      userEmail = email;
      userName = name;
    } else {
      try {
        const result = await verifyFirebaseToken(token);
        uid = result.uid;
        userEmail = result.email;
        userName = result.name;
      } catch (firebaseError) {
        try {
          const result = await verifyGoogleToken(token);
          uid = result.uid;
          userEmail = result.email;
          userName = result.name;
        } catch (googleError) {
          return res.status(401).json({ success: false, message: 'Invalid token.' });
        }
      }
    }

    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      user = await User.create({ firebaseUid: uid, email: userEmail });
      const jwtToken = generateToken(user._id, user.role);

      return res.status(201).json({
        success: true,
        message: 'Account created.',
        data: {
          token: jwtToken,
          user: { id: user._id, email: user.email, pseudonym: user.pseudonym, role: user.role },
          isNewUser: true
        }
      });
    }

    const jwtToken = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token: jwtToken,
        user: { id: user._id, email: user.email, pseudonym: user.pseudonym, role: user.role },
        isNewUser: !user.pseudonym
      }
    });
  } catch (error) {
    next(error);
  }
};

const setPseudonym = async (req, res, next) => {
  try {
    const { pseudonym } = req.body;

    if (!pseudonym || pseudonym.trim().length < 3 || pseudonym.trim().length > 20) {
      return res.status(400).json({ success: false, message: 'Pseudonym must be 3-20 characters.' });
    }

    const existingUser = await User.findOne({ pseudonym: pseudonym.trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Pseudonym already taken.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { pseudonym: pseudonym.trim() },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Pseudonym set.',
      data: { user: { id: user._id, email: user.email, pseudonym: user.pseudonym, role: user.role } }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { googleLogin, setPseudonym };