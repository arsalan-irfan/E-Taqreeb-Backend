const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
//Welcome page
router.get('/', auth, (req, res) => res.send('api running'));
//Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) =>
  res.render('dashboard', {
    name: req.user.name
  })
);

module.exports = router;
