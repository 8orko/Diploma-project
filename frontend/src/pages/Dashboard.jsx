import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import apiClient from '../api/apiClient';
import 'moment/locale/bg';
import TimeBlockEditPopover from '../components/TimeBlockEditPopover';
import useReminders from '../hooks/useReminders';
import useNotification from '../hooks/useNotification';
import { BLOCK_TYPES, TASK_CATEGORIES, TASK_PRIORITIES, FILTER_OPTIONS, SORT_OPTIONS, SEARCH_TARGETS } from '../constants';
import Notification from '../components/Notification';

const localizer = momentLocalizer(moment);

const initialTaskState = { title: '', description: '', priority: TASK_PRIORITIES.MEDIUM, category: TASK_CATEGORIES.GENERAL, timeBlockIds: [], reminderMinutes: 0, dueDate: '', dueTime: '' };
const initialBlockState = { label: '', type: BLOCK_TYPES.DAILY, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0, dayOfWeek: 1, date: '', isAllDay: false, reminderMinutes: 0 };

const getColor = (str) => {
  if (!str) return '#3174ad';
  const colors = [
    '#D97706', '#EA580C', '#DC2626', '#DB2777', '#9333EA', 
    '#4F46E5', '#2563EB', '#0284C7', '#0D9488', '#059669', 
    '#16A34A', '#65A30D'
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const DnDCalendar = withDragAndDrop(Calendar);

import { TRANSLATIONS } from '../utils/translations';

const Dashboard = () => {
  // Calendar State
  const [view, setView] = useState('week');
  const [date, setDate] = useState(new Date());
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');

  // Data State
  const [tasks, setTasks] = useState([]);
  const [timeBlocks, setTimeBlocks] = useState([]);

  const ignoreSelection = useRef(false);
  const taskFormRef = useRef(null);

  // Form State
  const [newTask, setNewTask] = useState(initialTaskState);
  const [newBlock, setNewBlock] = useState({ label: '', type: 'daily', startHour: 9, startMinute: 0, endHour: 17, endMinute: 0, dayOfWeek: 1, date: '', isAllDay: false, reminderMinutes: 0 });
  const [editingTask, setEditingTask] = useState(null);
  const [editingBlock, setEditingBlock] = useState(null);
  const [editPopover, setEditPopover] = useState({ show: false, position: null, block: null });

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState(FILTER_OPTIONS.ALL);
  const [filterPriority, setFilterPriority] = useState(FILTER_OPTIONS.ALL);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.NEWEST);
  const [searchTarget, setSearchTarget] = useState(SEARCH_TARGETS.TASK);
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' or 'blocks'

  // Reminders State
  const [notifiedIds, setNotifiedIds] = useState(new Set());
  
  const { notification, addNotification } = useNotification();
  const activeReminders = useReminders(true, timeBlocks, tasks, notifiedIds, setNotifiedIds);

  // Explicit Task Reminder Effect
  useEffect(() => {
    const checkTaskReminders = () => {
      const now = moment();
      let updates = new Set();
      
      tasks.forEach(task => {
        // We want to remind if the task has a reminder set > 0
        const taskReminderMinutes = task.reminderMinutes || 0;
        if (taskReminderMinutes <= 0) return;

        let starts = [];

        // 1. If task has a native dueDate and dueTime
        if (task.dueDate && task.dueTime) {
          if (task.dueDate === now.format('YYYY-MM-DD')) {
             const [h, m] = task.dueTime.split(':');
             starts.push({ time: moment().hour(h).minute(m).second(0), label: 'Scheduled Time', id: 'native' });
          }
        }

        // 2. If task is attached to active blocks
        const attachedBlockIds = task.TimeBlocks ? task.TimeBlocks.map(tb => tb.id) : [];
        if (attachedBlockIds.length > 0) {
          const attachedBlocks = timeBlocks.filter(tb => attachedBlockIds.includes(tb.id));
          attachedBlocks.forEach(block => {
            let isToday = false;
            if (block.type === 'daily') isToday = true;
            else if (block.type === 'workweek' && now.day() >= 1 && now.day() <= 5) isToday = true;
            else if (block.type === 'weekly' && block.dayOfWeek === now.day()) isToday = true;
            else if (block.type === 'single' && block.date === now.format('YYYY-MM-DD')) isToday = true;
            
            if (block.excludedDates?.includes(now.format('YYYY-MM-DD'))) isToday = false;

            if (isToday) {
              starts.push({
                time: moment().hour(block.startHour).minute(block.startMinute || 0).second(0),
                label: `Block: ${block.label}`,
                id: block.id
              });
            }
          });
        }

        starts.forEach(startObj => {
          const start = startObj.time;
          const reminderTime = start.clone().subtract(taskReminderMinutes, 'minutes');
          
          if (now.isSameOrAfter(reminderTime) && now.isBefore(reminderTime.clone().add(2, 'minutes')) && now.isBefore(start)) {
             const notifId = `task-rem-${task.id}-${startObj.id}-${now.format('YYYY-MM-DD')}`;
             
             if (!notifiedIds.has(notifId)) {
               updates.add(notifId);
               const msg = language === 'en' ? `Reminder: ${task.title}` : `Напомняне: ${task.title}`;
               const body = `${language === 'en' ? 'Starts in' : 'Започва след'} ${taskReminderMinutes}m (${startObj.label})`;
               addNotification(`${msg} - ${body}`, 'info');
               
               if (Notification.permission === 'granted') {
                 new Notification(msg, { body });
               }
             }
          }
        });
      });

      if (updates.size > 0) {
        setNotifiedIds(prev => {
            const next = new Set(prev);
            updates.forEach(id => next.add(id));
            return next;
        });
      }
    };

    const interval = setInterval(checkTaskReminders, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [tasks, timeBlocks, notifiedIds, addNotification, language]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    moment.locale(language);
  }, [language]);

  const t = TRANSLATIONS.dashboard[language];

  const daysOfWeek = [
    { label: t.monday, value: 1 },
    { label: t.tuesday, value: 2 },
    { label: t.wednesday, value: 3 },
    { label: t.thursday, value: 4 },
    { label: t.friday, value: 5 },
    { label: t.saturday, value: 6 },
    { label: t.sunday, value: 0 },
  ];

  const getDaysArray = (block) => {
    if (block.type === 'daily') return [0, 1, 2, 3, 4, 5, 6];
    if (block.type === 'workweek') return [1, 2, 3, 4, 5];
    if (block.type === 'weekly') return [block.dayOfWeek];
    return []; // single blocks don't have a recurring day array
  };

  const resetTaskForm = () => {
    setEditingTask(null);
    setNewTask(initialTaskState);
  };

  const resetBlockForm = () => {
    setEditingBlock(null);
    setNewBlock({ label: '', type: 'daily', startHour: 9, startMinute: 0, endHour: 17, endMinute: 0, dayOfWeek: 1, date: '', isAllDay: false, reminderMinutes: 0 });
  };

  // Mock Data Initialization
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, blocksRes] = await Promise.all([
          apiClient.get('/tasks'),
          apiClient.get('/timeblocks')
        ]);
        setTasks(tasksRes.data);
        setTimeBlocks(blocksRes.data);
      } catch (error) {
        addNotification(t.errorFetchingData, 'error');
      }
    };
    fetchData();
  }, [addNotification]);

  const calendarEvents = useMemo(() => {
    const generatedEvents = [];
    
    let rangeStart, rangeEnd;

    if (view === 'month') {
        rangeStart = moment(date).startOf('month').startOf('week');
        rangeEnd = moment(date).endOf('month').endOf('week');
    } else if (view === 'week') {
        rangeStart = moment(date).startOf('week');
        rangeEnd = moment(date).endOf('week');
    } else if (view === 'agenda') {
        rangeStart = moment(date).startOf('day');
        rangeEnd = moment(date).clone().add(30, 'days').endOf('day'); // Agenda shows next 30 days
    } else { // 'day'
        rangeStart = moment(date).startOf('day');
        rangeEnd = moment(date).endOf('day');
    }

    let currentDay = rangeStart.clone();
    while (currentDay.isSameOrBefore(rangeEnd, 'day')) {
      const dayIndex = currentDay.day(); // 0-6

      timeBlocks.forEach(block => {
        let shouldRender = false;
        if (block.type === BLOCK_TYPES.DAILY) shouldRender = true;
        if (block.type === BLOCK_TYPES.WEEKLY && block.dayOfWeek === dayIndex) shouldRender = true;
        if (block.type === BLOCK_TYPES.WORKWEEK && dayIndex >= 1 && dayIndex <= 5) shouldRender = true;
        if (block.type === BLOCK_TYPES.SINGLE && block.date === currentDay.format('YYYY-MM-DD')) shouldRender = true;
        
        // Check for exceptions
        if (block.excludedDates?.includes(currentDay.format('YYYY-MM-DD'))) shouldRender = false;

        if (shouldRender) {
          let start = currentDay.clone().hour(block.startHour).minute(block.startMinute || 0).toDate();
          let end = currentDay.clone().hour(block.endHour).minute(block.endMinute || 0).toDate();

          if (view !== 'month' && block.startHour === 0 && block.endHour === 24) end = currentDay.clone().endOf('day').toDate();
          generatedEvents.push({
            id: `block-${block.id}-${currentDay.format('YYYY-MM-DD')}`,
            title: block.label,
            start,
            end,
            resource: { ...block, eventDate: currentDay.format('YYYY-MM-DD') }, // Pass specific date
            allDay: view === 'month' ? block.isAllDay : false
          });
        }
      });
      currentDay.add(1, 'days');
    }

    if (!editingBlock && newBlock.isPreview) {
       const previewDate = newBlock.type === 'single' ? moment(newBlock.date) : moment(date);
       
       let start = previewDate.clone().hour(newBlock.startHour).minute(newBlock.startMinute).toDate();
       let end = previewDate.clone().hour(newBlock.endHour).minute(newBlock.endMinute).toDate();
       if (view !== 'month' && newBlock.startHour === 0 && newBlock.endHour === 24) end = previewDate.clone().endOf('day').toDate();

       generatedEvents.push({
         id: 'preview-block',
         title: t.newBlock,
         start,
         end,
         resource: { ...newBlock, id: 'preview' },
         isPreview: true,
         allDay: view === 'month' ? newBlock.isAllDay : false
       });
    }

    return generatedEvents;
  }, [timeBlocks, date, view, newBlock, editingBlock, tasks]);

  const findOverlap = (newBlock, ignoreId = null) => {
    return timeBlocks.find(existingBlock => {
      if (ignoreId && existingBlock.id === ignoreId) {
        return false;
      }

      const startA = newBlock.startHour * 60 + (newBlock.startMinute || 0);
      const endA = newBlock.endHour * 60 + (newBlock.endMinute || 0);
      const startB = existingBlock.startHour * 60 + (existingBlock.startMinute || 0);
      const endB = existingBlock.endHour * 60 + (existingBlock.endMinute || 0);

      const timeOverlaps = startA < endB && endA > startB;
      if (!timeOverlaps) {
        return false;
      }

      if (newBlock.type === BLOCK_TYPES.SINGLE && existingBlock.type === BLOCK_TYPES.SINGLE) {
        return newBlock.date === existingBlock.date;
      }

      if (newBlock.type === BLOCK_TYPES.SINGLE || existingBlock.type === BLOCK_TYPES.SINGLE) {
        const singleBlock = newBlock.type === BLOCK_TYPES.SINGLE ? newBlock : existingBlock;
        const recurringBlock = newBlock.type === BLOCK_TYPES.SINGLE ? existingBlock : newBlock;
        
        const singleDate = moment(singleBlock.date);
        const dayOfWeek = singleDate.day();
        
        if (recurringBlock.excludedDates?.includes(singleBlock.date)) {
          return false;
        }

        if (recurringBlock.type === BLOCK_TYPES.DAILY) return true;
        if (recurringBlock.type === BLOCK_TYPES.WORKWEEK && dayOfWeek >= 1 && dayOfWeek <= 5) return true;
        if (recurringBlock.type === BLOCK_TYPES.WEEKLY && recurringBlock.dayOfWeek === dayOfWeek) return true;
        
        return false;
      }

      const days1 = getDaysArray(newBlock);
      const days2 = getDaysArray(existingBlock);
      return days1.some(day => days2.includes(day));
    });
  };

  
  const handleSelecting = ({ start, end }) => {
    if (ignoreSelection.current) return false;
    if (document.body.classList.contains('rbc-addons-dnd-is-dragging')) return false;
    const events = calendarEvents;
    return !events.some(event => {
      if (event.isPreview) return false;
      const rangeStart = moment(start);
      const rangeEnd = moment(end);
      const eventStart = moment(event.start);
      const eventEnd = moment(event.end);
      return rangeStart.isBefore(eventEnd) && rangeEnd.isAfter(eventStart);
    });
  };

  const addBlock = async (blockData) => {
    try {
      const res = await apiClient.post('/timeblocks', blockData);
      setTimeBlocks(prev => [...prev, res.data]);
      addNotification(t.blockCreated, 'success');
    } catch (error) {
      addNotification(error.response?.data?.message || 'Failed to create time block. Please try again.', 'error');
    }
  };

  const handleSaveBlock = async (blockData) => {
    const startTotal = blockData.startHour * 60 + blockData.startMinute;
    const endTotal = blockData.endHour * 60 + blockData.endMinute;
    if (startTotal >= endTotal) {
      addNotification(t.startTimeError, 'error');
      return;
    }

    let blockId = blockData.id ?? (editingBlock?.id || null);
    if (blockId === 'preview') blockId = null;

    const conflict = findOverlap(blockData, blockId);
    if (conflict) {
      addNotification(`${t.overlapError} "${conflict.label}" (${String(conflict.startHour).padStart(2,'0')}:${String(conflict.startMinute||0).padStart(2,'0')}).`, 'error');
      return;
    }

    const dataToSave = { ...blockData };
    if (!blockId) delete dataToSave.id;

    try {
      if (blockId) {
        const res = await apiClient.put(`/timeblocks/${blockId}`, dataToSave);
        setTimeBlocks(prev => prev.map(b => b.id === blockId ? res.data : b));
        addNotification(t.blockUpdated, 'success');
      } else {
        await addBlock(dataToSave);
      }
      resetBlockForm();
    } catch (error) {
      addNotification(error.response?.data?.message || t.failedToSaveBlock, 'error');
    }
  };

  // Task Handlers
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (newTask.reminderMinutes > 0 && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    try {
      if (editingTask) {
        const res = await apiClient.put(`/tasks/${editingTask.id}`, newTask);
        setTasks(tasks.map(t => (t.id === editingTask.id ? res.data : t)));
        addNotification(t.taskUpdated, 'success');
      } else {
        const res = await apiClient.post('/tasks', newTask);
        setTasks([...tasks, res.data]);
        addNotification(t.taskCreated, 'success');
      }
      resetTaskForm();
    } catch (error) {
      addNotification(t.errorSavingTask, 'error');
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await apiClient.delete(`/tasks/${id}`);
      setTasks(tasks.filter(t => t.id !== id));
      addNotification(t.taskDeleted, 'success');
    } catch (error) {
      addNotification(t.errorDeletingTask, 'error');
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    // Map the associated TimeBlocks to an array of IDs for the form
    setNewTask({
      ...task,
      timeBlockIds: task.TimeBlocks ? task.TimeBlocks.map(tb => tb.id) : []
    });
    taskFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDeleteBlock = async (id, date = null, scope = 'series') => {
    try {
      const res = await apiClient.delete(`/timeblocks/${id}`, { params: { date, scope } });
      
      if (scope === 'series' || res.status === 204) {
        setTimeBlocks(prev => prev.filter(b => b.id !== id));
        // Also remove this block from any tasks that were referencing it
        setTasks(prev => prev.map(t => ({
          ...t,
          timeBlockIds: t.timeBlockIds.filter(tbId => tbId !== id),
          TimeBlocks: (t.TimeBlocks || []).filter(tb => tb.id !== id)
        })));
      } else if (res.data) {
        // If we deleted a single instance, the updated block with its new
        // exclusion date is returned. We update our local state to match.
        setTimeBlocks(prev => prev.map(b => b.id === id ? res.data : b));
      }
      addNotification(t.blockDeleted, 'success');
    } catch (error) {
      addNotification(error.response?.data?.message || t.failedToDeleteBlock, 'error');
    }
  };

  const handleEditBlock = (block) => {
    setEditingBlock(block);
    setNewBlock(block);
  };

  const handleSaveBlockFromForm = async (e) => {
    e.preventDefault();

    if (newBlock.reminderMinutes > 0 && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    await handleSaveBlock(newBlock);
  };

  // Drag & Drop Handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleTaskDrop = async (e, timeBlockId) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Check if already assigned
    const currentIds = task.TimeBlocks ? task.TimeBlocks.map(tb => tb.id) : [];
    if (currentIds.includes(timeBlockId)) return;

    const updatedTaskPayload = { ...task, timeBlockIds: [...currentIds, timeBlockId] };
    
    const originalTasks = tasks;
    // Optimistic update
    const newTimeBlock = timeBlocks.find(tb => tb.id === timeBlockId);
    if (newTimeBlock) {
      const optimisticTask = {
        ...task,
        TimeBlocks: [...(task.TimeBlocks || []), newTimeBlock],
        timeBlockIds: updatedTaskPayload.timeBlockIds
      };
      setTasks(tasks.map(t => (t.id === taskId ? optimisticTask : t)));
    }

    try {
      const res = await apiClient.put(`/tasks/${taskId}`, updatedTaskPayload);
      // On success, update our state with the authoritative response from the server
      setTasks(originalTasks.map(t => t.id === taskId ? res.data : t));
    } catch (error) {
      addNotification(t.errorAssigningTask, 'error');
      setTasks(originalTasks); // Revert on error
    }
  };

  const handleSelectSlot = ({ start, end, box, slots }) => {
    if (ignoreSelection.current) return;
    if (document.body.classList.contains('rbc-addons-dnd-is-dragging')) return;

    const events = calendarEvents;
    if (view !== 'month' && slots.length === 1) {
      return;
    }

    const startOverlaps = events.some(event => 
      !event.isPreview && moment(start).isSameOrAfter(event.start) && moment(start).isBefore(event.end)
    );
    if (startOverlaps) return;

    const overlappingEvent = events.find(event =>
      !event.isPreview && moment(start).isBefore(event.end) && moment(end).isAfter(event.start)
    );
    if (overlappingEvent) {
      // Adjust the end time to the start of the overlapping event
      end = overlappingEvent.start;
    }

    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    let endHour = end.getHours();
    let endMinute = end.getMinutes();
    
    if (endHour === 0 && end.getDate() !== start.getDate()) {
      endHour = 24;
      endMinute = 0;
    }
    
    if (startHour === endHour && startMinute === endMinute) {
        const proposedEnd = moment(start).add(30, 'minutes').toDate();
        
        // Verify expansion doesn't collide
        const expansionCollision = events.some(event => 
            !event.isPreview && moment(start).isBefore(event.end) && moment(proposedEnd).isAfter(event.start)
        );

        if (expansionCollision) return;

        let newEndH = proposedEnd.getHours();
        let newEndM = proposedEnd.getMinutes();
        if (newEndH === 0 && proposedEnd.getDate() !== start.getDate()) newEndH = 24;

        endHour = newEndH;
        endMinute = newEndM;
    }

    const finalEnd = moment(start).set({hour: endHour, minute: endMinute});
    if (moment(start).isSameOrAfter(finalEnd)) {
      return;
    }

    setNewBlock({ 
        ...newBlock, 
        label: '', // Set empty label to prompt user
        isPreview: true, // Mark as a preview
        startHour, startMinute,
        endHour, endMinute,
        dayOfWeek: start.getDay(), 
        type: 'single',
        date: moment(start).format('YYYY-MM-DD'),
        isAllDay: view === 'month'
    });

    // Open popover for the new slot
    setEditPopover({
      show: true,
      position: box ? { top: box.y, left: box.x } : { top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 100 },
      block: {
        isPreview: true,
        id: 'preview',
        startHour, startMinute,
        endHour, endMinute,
        dayOfWeek: start.getDay(),
        type: 'single',
        date: moment(start).format('YYYY-MM-DD'),
        isAllDay: view === 'month',
        reminderMinutes: 0
      }
    });
    setEditingBlock(null);
  };

  const handleSelectEvent = (calendarEvent, e) => {
    if (calendarEvent.resource) {
      e.preventDefault();
      e.stopPropagation();
      setEditPopover({
        show: true,
        target: null, // Use position instead
        position: { top: e.clientY, left: e.clientX },
        block: calendarEvent.resource,
      });
    }
  };

  const handleEventDrop = async ({ event, start, end, isAllDay: droppedIsAllDay }) => {
    ignoreSelection.current = true;
    setTimeout(() => { ignoreSelection.current = false; }, 200);

    if (droppedIsAllDay) return;
    const block = event.resource;
    if (block.id === 'preview') return;

    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    let endHour = end.getHours();
    let endMinute = end.getMinutes();
    if (endHour === 0 && end.getDate() !== start.getDate()) endHour = 24;
    if (startHour === endHour && startMinute === endMinute) {
        endMinute += 30; // Min duration
        if (endMinute >= 60) { endHour += Math.floor(endMinute / 60); endMinute %= 60; }
    }

    if (block.type !== 'single') {
      const originalBlock = timeBlocks.find(b => b.id === block.id);
      if (!originalBlock) return;
      const updatedOriginalBlock = {
        ...originalBlock,
        excludedDates: [...(originalBlock.excludedDates || []), block.eventDate || moment(event.start).format('YYYY-MM-DD')],
      };
      await handleSaveBlock(updatedOriginalBlock);
      
      const newBlock = {
        ...block,
        type: 'single',
        date: moment(start).format('YYYY-MM-DD'),
        startHour,
        startMinute,
        endHour,
        endMinute,
      };
      delete newBlock.id;
      await handleSaveBlock(newBlock);
    } else {
      const updatedBlock = { ...block, startHour, startMinute, endHour, endMinute, date: moment(start).format('YYYY-MM-DD') };
      await handleSaveBlock(updatedBlock);
    }
  };

  const handleEventResize = async ({ event, start, end }) => {
    ignoreSelection.current = true;
    setTimeout(() => { ignoreSelection.current = false; }, 200);
    
    const block = event.resource;
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    let endHour = end.getHours();
    let endMinute = end.getMinutes();
    if (endHour === 0 && end.getDate() !== start.getDate()) endHour = 24;
    
    if (block.type !== 'single') {
        const originalBlock = timeBlocks.find(b => b.id === block.id);
        if (!originalBlock) return;
        const updatedOriginalBlock = {
            ...originalBlock,
            excludedDates: [...(originalBlock.excludedDates || []), block.eventDate || moment(event.start).format('YYYY-MM-DD')],
        };
        await handleSaveBlock(updatedOriginalBlock);

        const newBlock = {
            ...block,
            type: 'single',
            date: moment(start).format('YYYY-MM-DD'),
            startHour, startMinute, endHour, endMinute
        };
        delete newBlock.id;
        await handleSaveBlock(newBlock);
    } else {
        const updatedBlock = { ...block, startHour, startMinute, endHour, endMinute };
        await handleSaveBlock(updatedBlock);
    }
  };

  // Filter & Sort Logic
  const filteredTasks = tasks
    .filter(task => {
      const matchesSearch = searchTarget === 'Task' 
        ? (task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
           task.description.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
      const matchesCategory = filterCategory === 'All' || task.category === filterCategory;
      const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;
      return matchesSearch && matchesCategory && matchesPriority;
    })
    .sort((a, b) => {
      if (sortBy === 'Newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'Oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'Priority') {
        const priorities = { High: 3, Medium: 2, Low: 1 };
        return priorities[b.priority] - priorities[a.priority];
      }
      return 0;
    });

  const filteredTimeBlocks = timeBlocks.filter(block => {
    if (searchTarget === 'TimeBlock') {
      return block.label.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  return (
    <>
      <div style={{ position: 'fixed', zIndex: 2147483647 }}>
        <Notification message={notification?.message} type={notification?.type} />
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-6rem)] gap-6">
      {/* Left Sidebar: Management */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4 h-full">
        
        {/* Header & Profile */}
        <div className="flex justify-between items-center px-1 mb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t.dashboard}</h1>
          {'Notification' in window && Notification.permission === 'default' && (
            <button 
              onClick={() => Notification.requestPermission()}
              className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200 px-3 py-1.5 rounded-full font-semibold hover:bg-indigo-200 transition-colors"
            >
              🔔 Enable Notifications
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 shrink-0 shadow-sm transition-colors duration-200">
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'tasks' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}
          >
            {t.tasks}
          </button>
          <button 
            onClick={() => setActiveTab('blocks')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'blocks' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}
          >
            {t.schedule}
          </button>
        </div>

        {/* Reminders Toggle & List */}
        <div className="space-y-2">
          {activeReminders.length > 0 && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/30 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 transform-gpu">
              <div className="flex items-center justify-between text-indigo-800 dark:text-indigo-200 text-xs font-bold uppercase tracking-wider">
                <span>{t.upcoming}</span>
                <span className="bg-indigo-200 dark:bg-indigo-500/20 text-indigo-900 dark:text-indigo-100 px-1.5 py-0.5 rounded text-[10px]">{activeReminders.length}</span>
              </div>
              <div className="space-y-2">
                {activeReminders.map(reminder => (
                  <div key={reminder.id} className="bg-white dark:bg-gray-800/50 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">{reminder.label}</span>
                      <span className="text-indigo-700 dark:text-indigo-300 text-xs font-mono bg-indigo-100 dark:bg-indigo-900/40 px-1.5 py-0.5 rounded">
                        {reminder.minutes === 0 ? t.now : `${reminder.minutes}m`}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {reminder.time} {moment(reminder.date).isSame(moment(), 'day') ? '' : `(${moment(reminder.date).format('MMM D')})`}
                    </div>
                    {reminder.tasks && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700/50">
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase mb-0.5">Tasks</div>
                        <div className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{reminder.tasks}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
          {activeTab === 'tasks' ? (
            <>
              {/* Task Management */}
              <div ref={taskFormRef} className="glass-panel p-6 rounded-xl">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  {editingTask ? t.editTask : t.addNewTask}
                </h3>
                <form onSubmit={handleSaveTask} className="space-y-4">
                  <input
                    type="text"
                    placeholder={t.taskTitle}
                    className="input-field"
                    value={newTask.title}
                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                    required
                  />
                  <textarea
                    placeholder={t.description}
                    className="input-field min-h-[80px]"
                    value={newTask.description}
                    onChange={e => setNewTask({...newTask, description: e.target.value})}
                  />
                  <div className="flex gap-2">
                    <select
                      className="input-field"
                      value={newTask.priority}
                      onChange={e => setNewTask({...newTask, priority: e.target.value})}
                    >
                      <option value={TASK_PRIORITIES.LOW}>{t.lowPriority}</option>
                      <option value={TASK_PRIORITIES.MEDIUM}>{t.mediumPriority}</option>
                      <option value={TASK_PRIORITIES.HIGH}>{t.highPriority}</option>
                    </select>
                    <select
                      className="input-field"
                      value={newTask.category}
                      onChange={e => setNewTask({...newTask, category: e.target.value})}
                    >
                      <option value={TASK_CATEGORIES.GENERAL}>{t.general}</option>
                      <option value={TASK_CATEGORIES.WORK}>{t.work}</option>
                      <option value={TASK_CATEGORIES.PERSONAL}>{t.personal}</option>
                      <option value={TASK_CATEGORIES.UNIVERSITY}>{t.university}</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      className="input-field"
                      value={newTask.dueDate || ''}
                      onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                    />
                    <input
                      type="time"
                      className="input-field"
                      value={newTask.dueTime || ''}
                      onChange={e => setNewTask({...newTask, dueTime: e.target.value})}
                    />
                  </div>
                  <select
                    multiple
                    className="input-field h-24"
                    value={newTask.timeBlockIds}
                    onChange={e => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                      setNewTask({...newTask, timeBlockIds: selectedOptions});
                    }}
                  >
                    <option value="" disabled>{t.attachToBlocks}</option>
                    {timeBlocks.map(block => (
                      <option key={block.id} value={block.id}>
                        {block.label} ({block.type === 'single' ? block.date : block.type})
                      </option>
                    ))}
                  </select>
                  <select
                    className="input-field"
                    value={newTask.reminderMinutes || 0}
                    onChange={e => setNewTask({...newTask, reminderMinutes: parseInt(e.target.value)})}
                  >
                    <option value="0">{t.noReminder}</option>
                    <option value="5">5 {t.minBefore}</option>
                    <option value="10">10 {t.minBefore}</option>
                    <option value="15">15 {t.minBefore}</option>
                    <option value="30">30 {t.minBefore}</option>
                    <option value="60">{t.hourBefore}</option>
                    <option value="1440">{t.dayBefore}</option>
                    <option value="10080">{t.weekBefore}</option>
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 btn-primary">
                      {editingTask ? t.updateTask : t.addTask}
                    </button>
                    {editingTask && (
                      <>
                        <button 
                          type="button" 
                          onClick={() => {
                            handleDeleteTask(editingTask.id);
                            resetTaskForm();
                          }}
                          className="px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-900/70 rounded-lg transition-colors text-sm font-semibold"
                        >
                          {t.del}
                        </button>
                      <button 
                        type="button" 
                        onClick={resetTaskForm}
                        className="btn-secondary"
                      >
                        {t.cancel}
                      </button>
                      </>
                    )}
                  </div>
                </form>
              </div>

              {/* Task List */}
              <div className="glass-panel p-6 rounded-xl flex flex-col gap-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.yourTasks}</h3>
                
                {/* Search & Filter Controls */}
                <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700/50">
                  <div className="flex gap-2">
                    <select
                      className="input-field w-1/3 text-xs"
                      value={searchTarget}
                      onChange={e => setSearchTarget(e.target.value)}
                    >
                      <option value={SEARCH_TARGETS.TASK}>{t.searchTargetTask}</option>
                      <option value={SEARCH_TARGETS.TIME_BLOCK}>{t.searchTargetBlock}</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder={searchTarget === SEARCH_TARGETS.TASK ? t.searchTasks : t.searchBlocks}
                      className="input-field text-sm"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                     <select 
                       className="input-field text-xs"
                       value={filterCategory}
                       onChange={e => setFilterCategory(e.target.value)}
                     >
                       <option value={FILTER_OPTIONS.ALL}>{t.allCategories}</option>
                       <option value={TASK_CATEGORIES.GENERAL}>{t.general}</option>
                       <option value={TASK_CATEGORIES.WORK}>{t.work}</option>
                       <option value={TASK_CATEGORIES.PERSONAL}>{t.personal}</option>
                       <option value={TASK_CATEGORIES.UNIVERSITY}>{t.university}</option>
                     </select>
                     <select 
                       className="input-field text-xs"
                       value={filterPriority}
                       onChange={e => setFilterPriority(e.target.value)}
                     >
                       <option value={FILTER_OPTIONS.ALL}>{t.allPriorities}</option>
                       <option value={TASK_PRIORITIES.HIGH}>{t.highPriority}</option>
                       <option value={TASK_PRIORITIES.MEDIUM}>{t.mediumPriority}</option>
                       <option value={TASK_PRIORITIES.LOW}>{t.lowPriority}</option>
                     </select>
                  </div>
                  <select 
                       className="input-field text-xs"
                       value={sortBy}
                       onChange={e => setSortBy(e.target.value)}
                     >
                       <option value={SORT_OPTIONS.NEWEST}>{t.sortNewest}</option>
                       <option value={SORT_OPTIONS.OLDEST}>{t.sortOldest}</option>
                       <option value={SORT_OPTIONS.PRIORITY}>{t.sortPriority}</option>
                  </select>
                </div>

                <div className="space-y-3">
                  {filteredTasks.length === 0 && <p className="text-gray-600 dark:text-gray-400 text-center py-4">{t.noTasksFound}</p>}
                  {filteredTasks.map(task => (
                    <div 
                      key={task.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => handleEditTask(task)}
                      className="group bg-white dark:bg-gray-700/50 p-3 rounded-lg card-hover cursor-pointer flex justify-between items-start"
                    >
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{task.title}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{task.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2 text-[10px]">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            task.priority === 'High' ? 'bg-red-100 dark:bg-red-900/80 text-red-800 dark:text-red-200' : 
                            task.priority === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900/80 text-yellow-800 dark:text-yellow-200' : 
                            'bg-green-100 dark:bg-green-900/80 text-green-800 dark:text-green-200'
                          }`}>{t[task.priority.toLowerCase()]}
                          </span>
                          <span className="bg-blue-100 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">{t[task.category.toLowerCase()]}</span>
                          {task.TimeBlocks && task.TimeBlocks.map(tb => (
                            <span key={tb.id} className="text-white px-2 py-0.5 rounded-full ml-1 shadow-sm" style={{ backgroundColor: getColor(tb.id) }}>
                              {tb.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform-gpu">
                        <button onClick={(e) => { e.stopPropagation(); handleEditTask(task); }} className="text-blue-400 hover:text-blue-300 text-xs">{t.edit}</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="text-red-400 hover:text-red-300 text-xs">{t.del}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Time Block Management */}
              <div className="glass-panel p-6 rounded-xl">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                  {editingBlock ? t.editTimeBlock : t.createTimeBlock}
                </h3>
                <form onSubmit={handleSaveBlockFromForm} className="space-y-4">
                  <input
                    type="text"
                    placeholder={t.blockLabel}
                    className="input-field"
                    value={newBlock.label}
                    onChange={e => setNewBlock({...newBlock, label: e.target.value})}
                    required
                  />
                  <div className="flex gap-2">
                    <select
                      className="input-field"
                      value={newBlock.type}
                      onChange={e => setNewBlock({...newBlock, type: e.target.value})}
                    >
                      <option value={BLOCK_TYPES.DAILY}>{t.daily}</option>
                      <option value={BLOCK_TYPES.WORKWEEK}>{t.workWeek}</option>
                      <option value={BLOCK_TYPES.WEEKLY}>{t.weekly}</option>
                      <option value={BLOCK_TYPES.SINGLE}>{t.single}</option>
                    </select>
                    {newBlock.type === BLOCK_TYPES.WEEKLY && (
                      <select
                        className="input-field"
                        value={newBlock.dayOfWeek}
                        onChange={e => setNewBlock({...newBlock, dayOfWeek: parseInt(e.target.value, 10)})}
                      >
                        {daysOfWeek.map(day => (
                          <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                      </select>
                    )}
                    {newBlock.type === BLOCK_TYPES.SINGLE && (
                      <input
                        type="date"
                        className="input-field"
                        value={newBlock.date}
                        onChange={e => setNewBlock({...newBlock, date: e.target.value})}
                        required
                      />
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <label htmlFor="start-hour" className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">{t.startTime}</label>
                      <input
                        type="time"
                        id="start-hour"
                        className="input-field"
                        value={`${String(newBlock.startHour).padStart(2, '0')}:${String(newBlock.startMinute).padStart(2, '0')}`}
                        onChange={e => {
                          const [h, m] = e.target.value.split(':').map(Number);
                          setNewBlock({...newBlock, startHour: h, startMinute: m});
                        }}
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="end-hour" className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">{t.endTime}</label>
                      <input
                        type="time"
                        id="end-hour"
                        className="input-field"
                        value={`${String(newBlock.endHour).padStart(2, '0')}:${String(newBlock.endMinute).padStart(2, '0')}`}
                        onChange={e => {
                          const [h, m] = e.target.value.split(':').map(Number);
                          setNewBlock({...newBlock, endHour: h, endMinute: m});
                        }}
                        required
                      />
                    </div>
                  </div>
                  <select
                    className="input-field"
                    value={newBlock.reminderMinutes || 0}
                    onChange={e => setNewBlock({...newBlock, reminderMinutes: parseInt(e.target.value)})}
                  >
                    <option value="0">{t.noReminder}</option>
                    <option value="5">5 {t.minBefore}</option>
                    <option value="10">10 {t.minBefore}</option>
                    <option value="15">15 {t.minBefore}</option>
                    <option value="30">30 {t.minBefore}</option>
                    <option value="60">{t.hourBefore}</option>
                    <option value="1440">{t.dayBefore}</option>
                    <option value="10080">{t.weekBefore}</option>
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 btn-primary">
                      {editingBlock ? t.updateBlock : t.addBlock}
                    </button>
                    {editingBlock && (
                        <button 
                          type="button" 
                          onClick={resetBlockForm}
                          className="btn-secondary"
                        >
                          {t.cancel}
                        </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Existing Time Blocks List */}
              <div className="glass-panel p-6 rounded-xl">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t.existingBlocks}</h4>
                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                  {filteredTimeBlocks.map(block => (
                    <div key={block.id} className="bg-white dark:bg-gray-700/50 p-3 rounded-lg flex justify-between items-center border-l-4 card-hover shadow-sm" style={{ borderLeftColor: getColor(block.id) }}>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white text-sm">{block.label}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {block.type === 'daily' ? t.daily.split(' ')[0] : 
                           block.type === 'workweek' ? t.monFri :
                           block.type === 'single' ? block.date :
                           daysOfWeek.find(d => d.value === block.dayOfWeek)?.label} 
                           • {String(block.startHour).padStart(2, '0')}:{String(block.startMinute || 0).padStart(2, '0')} - {String(block.endHour).padStart(2, '0')}:{String(block.endMinute || 0).padStart(2, '0')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditBlock(block)} className="text-blue-400 hover:text-blue-300 text-xs font-medium">{t.edit}</button>
                        <button onClick={() => handleDeleteBlock(block.id)} className="text-red-400 hover:text-red-300 text-xs font-medium">{t.del}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Side: Calendar */}
      <div className="w-full lg:w-2/3 glass-panel p-6 rounded-xl h-full">
        <DnDCalendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          
          messages={{
            today: t.today,
            previous: t.back,
            next: t.next,
            month: t.month,
            week: t.week,
            day: t.day,
            agenda: t.agenda,
            date: t.date,
            time: t.time,
            event: t.event,
            allDay: t.allDay,
            showMore: (total) => `+${total} ${t.showMore}`
          }}
          // Controlled State for Buttons to Work
          view={view}
          date={date}
          onView={(newView) => setView(newView)}
          onNavigate={(newDate) => setDate(newDate)}
          
          // Drag to Create
          selectable
          onSelectSlot={handleSelectSlot}
          onSelecting={handleSelecting}
          
          // Drag to Move/Resize Blocks
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          resizable
          dayLayoutAlgorithm="no-overlap"

          // Click to Edit
          onSelectEvent={handleSelectEvent}

          // Drag to Drop Task
          components={{
            // This allows you to replace the default header you found
            header: ({ date, label }) => (
              <div className="custom-header">
                {label} {/* Or any custom formatting */}
              </div>
            ),
            event: ({ event }) => (
              <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleTaskDrop(e, event.resource.id)} className="h-full w-full" title={event.title}>
                {event.title}
              </div>
            )
          }}

          dayPropGetter={(date) => {
            const day = moment(date).day();
            const isWeekend = day === 0 || day === 6;
            // Add a class to all-day cells to identify them as invalid drop targets
            return {
              className: isWeekend ? 'weekend-day' : '',
            };
          }}

          // Custom Styling
          eventPropGetter={(event) => {
            if (event.isPreview) {
                return { style: { backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '2px dashed white' } };
            }
            const style = {
              backgroundColor: getColor(event.resource.id),
            };
            return { style };
          }}
        />
      </div>
      {editPopover.show && (
        <TimeBlockEditPopover
          show={editPopover.show}
          position={editPopover.position}
          block={editPopover.block}
          tasks={tasks.filter(t => t.TimeBlocks && t.TimeBlocks.some(tb => tb.id === editPopover.block.id))}
          onClose={() => {
            setEditPopover({ show: false, target: null, block: null });
            resetBlockForm(); // Clear preview on close
          }}
          onDelete={async (id, date, scope) => {
            await handleDeleteBlock(id, date, scope);
            setEditPopover({ show: false, target: null, block: null });
          }}
          onSave={async (blockToSave) => {
            setEditPopover({ show: false, target: null, block: null });
            await handleSaveBlock(blockToSave);
          }}
          t={t}
        />
      )}
      </div>
    </>
  );
};

export default Dashboard;
