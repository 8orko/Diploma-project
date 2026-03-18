const { TimeBlock } = require('../models');

const getAllTimeBlocks = async (req, res) => {
  try {
    const blocks = await TimeBlock.findAll({ where: { userId: req.user.id } });
    res.json(blocks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching time blocks', error: error.message });
  }
};

const createTimeBlock = async (req, res) => {
  try {
    const { label, type, startHour, startMinute, endHour, endMinute, dayOfWeek, date, isAllDay, reminderMinutes } = req.body;
    const newBlock = await TimeBlock.create({
      label,
      type,
      startHour,
      startMinute,
      endHour,
      endMinute,
      dayOfWeek,
      date,
      isAllDay,
      reminderMinutes,
      userId: req.user.id,
    });
    res.status(201).json(newBlock);
  } catch (error) {
    res.status(500).json({ message: 'Error creating time block', error: error.message });
  }
};

const updateTimeBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, type, startHour, startMinute, endHour, endMinute, dayOfWeek, date, isAllDay, reminderMinutes } = req.body;
    const block = await TimeBlock.findOne({ where: { id, userId: req.user.id } });

    if (!block) {
      return res.status(404).json({ message: 'Time block not found' });
    }

    const updatedBlock = await block.update({
      label,
      type,
      startHour,
      startMinute,
      endHour,
      endMinute,
      dayOfWeek,
      date,
      isAllDay,
      reminderMinutes
    });
    res.json(updatedBlock);
  } catch (error) {
    res.status(500).json({ message: 'Error updating time block', error: error.message });
  }
};

const deleteTimeBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, scope } = req.query; // scope can be 'single' or 'series'
    const block = await TimeBlock.findOne({ where: { id, userId: req.user.id } });

    if (!block) {
      return res.status(404).json({ message: 'Time block not found' });
    }

    // If deleting a single instance of a recurring block
    if (scope === 'single' && block.type !== 'single' && date) {
      const excluded = block.excludedDates || [];
      if (!excluded.includes(date)) {
        // We need to use a different way to update the array for Sequelize
        await block.update({ excludedDates: [...excluded, date] });
      }
      // Return the updated block so the frontend can refresh its state
      res.json(block);
    } else { // If deleting the whole series or a non-recurring block
      await block.destroy();
      res.status(204).send();
    }
  } catch (error) {
    console.error('Error deleting time block:', error);
    res.status(500).json({ message: 'Error deleting time block', error: error.message });
  }
};

module.exports = {
  getAllTimeBlocks,
  createTimeBlock,
  updateTimeBlock,
  deleteTimeBlock,
};