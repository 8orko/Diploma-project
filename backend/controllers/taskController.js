const { Task, TimeBlock } = require('../models');

const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({ 
      where: { userId: req.user.id },
      // Include full TimeBlock model so frontend has startHour/startMinute etc.
      include: [{ model: TimeBlock, through: { attributes: [] } }] 
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, priority, category, timeBlockIds, reminderMinutes, dueDate, dueTime } = req.body;
    const task = await Task.create({
      title,
      description,
      priority,
      category,
      reminderMinutes,
      dueDate: dueDate || null,
      dueTime: dueTime || null,
      userId: req.user.id,
    });
    if (timeBlockIds && timeBlockIds.length > 0) {
      await task.setTimeBlocks(timeBlockIds);
    }
    const result = await Task.findByPk(task.id, { 
      include: [{ model: TimeBlock, through: { attributes: [] } }] 
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { timeBlockIds, title, description, priority, category, reminderMinutes, dueDate, dueTime } = req.body;
    const task = await Task.findOne({ where: { id, userId: req.user.id } });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const updateData = {};
    // Only include fields in the update if they were actually provided in the request body.
    // This prevents accidentally overwriting existing data with `undefined` from a partial update.
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (category !== undefined) updateData.category = category;
    if (reminderMinutes !== undefined) updateData.reminderMinutes = reminderMinutes;
    if (dueDate !== undefined) updateData.dueDate = dueDate || null;
    if (dueTime !== undefined) updateData.dueTime = dueTime || null;

    await task.update(updateData);

    if (timeBlockIds !== undefined) {
      await task.setTimeBlocks(timeBlockIds);
    }

    const result = await Task.findByPk(task.id, {
      include: [{ model: TimeBlock, through: { attributes: [] } }],
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOne({ where: { id, userId: req.user.id } });
    if (task) {
      await task.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};

module.exports = { getAllTasks, createTask, updateTask, deleteTask };