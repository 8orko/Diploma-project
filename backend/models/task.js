'use strict';
// Task model definition
module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    priority: DataTypes.STRING,
    category: DataTypes.STRING,
    reminderMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    dueTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
  }, {});
  Task.associate = function(models) {
    Task.belongsTo(models.User, {
      foreignKey: 'userId',
      onDelete: 'CASCADE',
    });
    Task.belongsToMany(models.TimeBlock, {
      through: 'TaskTimeBlocks',
      foreignKey: 'taskId',
      otherKey: 'timeBlockId',
    });
  };
  return Task;
};