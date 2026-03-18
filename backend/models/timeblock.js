'use strict';
// TimeBlock model definition
module.exports = (sequelize, DataTypes) => {
  const TimeBlock = sequelize.define('TimeBlock', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    label: DataTypes.STRING,
    type: DataTypes.STRING, // 'daily', 'weekly', 'workweek', 'single'
    startHour: DataTypes.INTEGER,
    startMinute: DataTypes.INTEGER,
    endHour: DataTypes.INTEGER,
    endMinute: DataTypes.INTEGER,
    dayOfWeek: DataTypes.INTEGER, // for 'weekly'
    date: DataTypes.STRING, // for 'single'
    isAllDay: DataTypes.BOOLEAN,
    excludedDates: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    reminderMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {});
  TimeBlock.associate = function(models) {
    TimeBlock.belongsTo(models.User, {
      foreignKey: 'userId',
      onDelete: 'CASCADE',
    });
    TimeBlock.belongsToMany(models.Task, { through: 'TaskTimeBlocks', foreignKey: 'timeBlockId', otherKey: 'taskId' });
  };
  return TimeBlock;
};