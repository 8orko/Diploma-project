const express = require('express');
const router = express.Router();
const { getAllTimeBlocks, createTimeBlock, updateTimeBlock, deleteTimeBlock } = require('../controllers/timeBlockController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getAllTimeBlocks).post(protect, createTimeBlock);
router.route('/:id').put(protect, updateTimeBlock).delete(protect, deleteTimeBlock);

module.exports = router;