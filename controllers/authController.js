const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');
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
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'Token required.' });
    }

    let uid, userEmail;

    try {
      const result = await verifyFirebaseToken(token);
      uid = result.uid;
      userEmail = result.email;
    } catch (firebaseError) {
      try {
        const result = await verifyGoogleToken(token);
        uid = result.uid;
        userEmail = result.email;
      } catch (googleError) {
        return res.status(401).json({ success: false, message: 'Invalid token.' });
      }
    }

    if (!uid || !userEmail) {
      return res.status(401).json({ success: false, message: 'Invalid token payload.' });
    }

    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {

      const existingEmail = await User.findOne({ email: userEmail });
      if (existingEmail) {
        return res.status(409).json({ success: false, message: 'Email already associated with another account.' });
      }
      user = await User.create({ firebaseUid: uid, email: userEmail });
    }

    const jwtToken = generateToken(user._id, user.role);

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie('x-csrf-token', csrfToken, {
      httpOnly: false, 
      secure: isProd,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    const isNewUser = !user.pseudonym;

    res.status(isNewUser ? 201 : 200).json({
      success: true,
      message: isNewUser ? 'Account created.' : 'Login successful.',
      data: {
        user: { id: user._id, email: user.email, pseudonym: user.pseudonym, role: user.role },
        isNewUser: isNewUser
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

    const cleanPseudonym = pseudonym.trim();

    const existingUser = await User.findOne({ pseudonym: cleanPseudonym });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Pseudonym already taken.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { pseudonym: cleanPseudonym },
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

const logout = (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('token', { httpOnly: true, secure: isProd, sameSite: 'strict' });
  res.clearCookie('x-csrf-token', { httpOnly: false, secure: isProd, sameSite: 'strict' });
  res.status(200).json({ success: true, message: 'Logged out.' });
};

module.exports = { googleLogin, setPseudonym, logout };