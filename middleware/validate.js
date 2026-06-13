const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateAuth = [
  body('email').isEmail().trim().toLowerCase(),
  body('pseudo').isLength({ min: 3, max: 20 }).trim(),
  validate,
];

const validateResource = [
  body('title').isLength({ min: 3, max: 200 }).trim(),
  body('description').isLength({ min: 10 }).trim(),
  validate,
];

module.exports = { validate, validateAuth, validateResource };
