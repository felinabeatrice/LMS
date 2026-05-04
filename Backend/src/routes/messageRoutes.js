const express = require('express');
const router = express.Router();

const {
  sendMessage,
  getCourseMessages,
  getUnreadCounts,
  getMyMessages,
} = require('../controllers/messageController');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', sendMessage);
router.get('/my-messages', getMyMessages);
router.get('/unread-counts', getUnreadCounts);
router.get('/course/:courseId', getCourseMessages);

module.exports = router;