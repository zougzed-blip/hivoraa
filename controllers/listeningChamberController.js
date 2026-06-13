const crypto = require('crypto');
const AnonymousReport = require('../models/AnonymousReport');
const { body, validationResult } = require('express-validator');

const doors = [
  { id: 1, name: 'I don\'t have enough to live', description: 'Food, housing, emergency aid, student jobs.' },
  { id: 2, name: 'I\'m not well mentally', description: 'Stress, anxiety, depression, dark thoughts.' },
  { id: 3, name: 'I\'m being harassed or abused', description: 'Bullying, threats, abuse. This is not your fault.' },
  { id: 4, name: 'I\'m failing academically', description: 'Too hard, falling behind, thinking of dropping out.' },
  { id: 5, name: 'I have an idea for the campus', description: 'Suggestion, improvement, feedback.' }
];

// Validation
const validateReport = [
  body('door').isInt({ min: 1, max: 5 }).withMessage('Invalid door.'),
  body('content').trim().isLength({ min: 5, max: 5000 }).escape()
];

const validateResponse = [
  body('adminResponse').trim().isLength({ min: 1, max: 5000 }).escape()
];

// Get the 5 doors
const getDoors = (req, res) => {
  res.status(200).json({ success: true, data: doors });
};

// Submit an anonymous report
const submitReport = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { door, content } = req.body;

    const code = 'CONFI-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    const report = await AnonymousReport.create({ code, door, content });

    res.status(201).json({
      success: true,
      message: 'Report submitted. Save your code to check for responses.',
      data: { code: report.code, door: report.door }
    });
  } catch (error) {
    next(error);
  }
};

// Check report status by code
const checkReport = async (req, res, next) => {
  try {
    const { code } = req.params;
    const report = await AnonymousReport.findOne({ code });

    if (!report) {
      return res.status(404).json({ success: false, message: 'No report found with this code.' });
    }

    res.status(200).json({
      success: true,
      data: {
        door: report.door,
        status: report.status,
        adminResponse: report.adminResponse,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get aggregated stats
const getStats = async (req, res, next) => {
  try {
    const total = await AnonymousReport.countDocuments();
    const pending = await AnonymousReport.countDocuments({ status: 'pending' });
    const responded = await AnonymousReport.countDocuments({ status: 'responded' });

    const byDoor = await AnonymousReport.aggregate([
      { $group: { _id: '$door', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: { total, pending, responded, byDoor }
    });
  } catch (error) {
    next(error);
  }
};


const respondToReport = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { code } = req.params;
    const { adminResponse } = req.body;

    const report = await AnonymousReport.findOne({ code });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    report.adminResponse = adminResponse;
    report.status = 'responded';
    await report.save();

    res.status(200).json({ success: true, message: 'Response saved.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateReport,
  validateResponse,
  getDoors,
  submitReport,
  checkReport,
  getStats,
  respondToReport
};