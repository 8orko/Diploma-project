import { useState, useEffect } from 'react';
import moment from 'moment';

const useReminders = (remindersEnabled, timeBlocks, tasks, notifiedIds, setNotifiedIds) => {
  const [activeReminders, setActiveReminders] = useState([]);

  useEffect(() => {
    if (!remindersEnabled) {
      setActiveReminders([]);
      return;
    }

    const checkReminders = () => {
      const now = moment();
      const upcoming = [];
      let newNotifiedIds = new Set(notifiedIds);
      let hasUpdates = false;

      timeBlocks.forEach(block => {
        let nextStart = null;
        const blockTime = moment().hour(block.startHour).minute(block.startMinute || 0).second(0);
        
        if (block.type === 'single') {
            nextStart = moment(block.date).hour(block.startHour).minute(block.startMinute || 0).second(0);
            if (nextStart.isBefore(now)) nextStart = null; 
        } else if (block.type === 'daily') {
            nextStart = blockTime.clone();
            if (nextStart.isBefore(now)) nextStart.add(1, 'days');
        } else if (block.type === 'weekly') {
            nextStart = blockTime.clone().day(block.dayOfWeek);
            if (nextStart.isBefore(now)) nextStart.add(1, 'weeks');
        } else if (block.type === 'workweek') {
            nextStart = blockTime.clone();
            while (nextStart.isBefore(now) || nextStart.day() === 0 || nextStart.day() === 6) {
                nextStart.add(1, 'days');
            }
        }

        if (!nextStart) return;

        if (block.excludedDates && block.excludedDates.includes(nextStart.format('YYYY-MM-DD'))) return;

        const diff = nextStart.diff(now, 'minutes');
        const blockReminderTime = block.reminderMinutes || 0;

        const isBlockReminder = blockReminderTime > 0 && diff >= 0 && diff <= blockReminderTime;

        const associatedTasks = tasks.filter(t => t.timeBlockIds && t.timeBlockIds.includes(block.id));
        const triggeringTasks = associatedTasks.filter(t => {
             const taskReminderTime = t.reminderMinutes || 0;
             return taskReminderTime > 0 && diff >= 0 && diff <= taskReminderTime;
        });

        if (isBlockReminder || triggeringTasks.length > 0) {
             const taskNames = triggeringTasks.map(t => t.title).join(', ');
             
             upcoming.push({
               id: block.id,
               label: block.label,
               time: nextStart.format('HH:mm'),
               date: nextStart.format('YYYY-MM-DD'),
               tasks: taskNames,
               minutes: diff
             });

             if (isBlockReminder) {
                 const key = `block-rem-${block.id}-${nextStart.format('YYYY-MM-DD')}`;
                 if (!newNotifiedIds.has(key)) {
                     if ('Notification' in window && Notification.permission === 'granted') {
                         new Notification(`Upcoming Block: ${block.label}`, {
                             body: `Starting in ${diff} minutes at ${nextStart.format('HH:mm')}.`,
                             icon: '/vite.svg'
                         });
                     }
                     newNotifiedIds.add(key);
                     hasUpdates = true;
                 }
             }
        }
      });

      upcoming.sort((a, b) => a.minutes - b.minutes);
      setActiveReminders(upcoming);
      if (hasUpdates) setNotifiedIds(newNotifiedIds);
    };

    const interval = setInterval(checkReminders, 30000); // Check every 30s
    checkReminders();
    return () => clearInterval(interval);
  }, [remindersEnabled, timeBlocks, tasks, notifiedIds, setNotifiedIds]);

  return activeReminders;
};

export default useReminders;
