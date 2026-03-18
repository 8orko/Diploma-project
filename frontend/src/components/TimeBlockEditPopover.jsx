import React, { useState, useRef } from 'react';
import useClickOutside from '../hooks/useClickOutside';

const daysOfWeek = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

const TimeBlockEditPopover = ({ show, block, tasks, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState(() => ({
    ...block,
    reminderMinutes: block.reminderMinutes || 0,
  }));
  const popoverRef = useRef(null);

  useClickOutside({ ref: popoverRef, callback: onClose });

  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    const [h, m] = value.split(':').map(Number);
    if (name === 'start') {
      setFormData(prev => ({ ...prev, startHour: h, startMinute: m }));
    } else {
      setFormData(prev => ({ ...prev, endHour: h, endMinute: m }));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm fade-in">
      <div 
        ref={popoverRef}
        className="bg-gray-800 border border-gray-600 rounded-xl shadow-2xl p-6 w-96 scale-in"
      >
      <h3 className="text-lg font-bold mb-4 text-white">
        {block.isPreview ? 'Create New Block' : 'Edit Time Block'}
      </h3>
      <form onSubmit={handleSave} className="space-y-4">
        <input
          type="text"
          placeholder="Block Label"
          className="input-field"
          value={formData.label || ''}
          onChange={e => setFormData({...formData, label: e.target.value})}
          required
        />
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isAllDay"
            name="isAllDay"
            checked={formData.isAllDay || false}
            onChange={e => {
              const checked = e.target.checked;
              setFormData(prev => ({
                ...prev,
                isAllDay: checked,
                startHour: checked ? 0 : 9,
                startMinute: 0,
                endHour: checked ? 24 : 17,
                endMinute: 0,
              }));
            }}
            className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-600"
          />
          <label htmlFor="isAllDay" className="ml-2 text-sm text-gray-300">All Day Event</label>
        </div>

        <div className="flex gap-2">
          <select
            className="input-field"
            value={formData.type}
            onChange={e => setFormData({...formData, type: e.target.value})}
          >
            <option value="daily">Daily (Mon-Sun)</option>
            <option value="workweek">Work Week (Mon-Fri)</option>
            <option value="weekly">Weekly (Specific Day)</option>
            <option value="single">Single Day</option>
          </select>
          {formData.type === 'weekly' && (
            <select
              className="input-field"
              value={formData.dayOfWeek}
              onChange={e => setFormData({...formData, dayOfWeek: parseInt(e.target.value, 10)})}
            >
              {daysOfWeek.map(day => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          )}
          {formData.type === 'single' && (
            <input
              type="date"
              className="input-field"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              required
            />
          )}
        </div>

        {!formData.isAllDay && (
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Start Time</label>
              <input
                type="time"
                name="start"
                className="input-field"
                value={`${String(formData.startHour).padStart(2, '0')}:${String(formData.startMinute || 0).padStart(2, '0')}`}
                onChange={handleTimeChange}
                required
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">End Time</label>
              <input
                type="time"
                name="end"
                className="input-field"
                value={`${String(formData.endHour).padStart(2, '0')}:${String(formData.endMinute || 0).padStart(2, '0')}`}
                onChange={handleTimeChange}
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Reminder</label>
          <select
            className="input-field"
            value={formData.reminderMinutes || 0}
            onChange={e => setFormData({...formData, reminderMinutes: parseInt(e.target.value)})}
          >
            <option value="0">No Reminder</option>
            <option value="5">5 minutes before</option>
            <option value="10">10 minutes before</option>
            <option value="15">15 minutes before</option>
            <option value="30">30 minutes before</option>
            <option value="60">1 hour before</option>
            <option value="1440">1 day before</option>
            <option value="10080">1 week before</option>
          </select>
        </div>

        {tasks && tasks.length > 0 && (
          <div className="pt-2">
            <h4 className="text-sm font-semibold text-gray-300 mb-1">Associated Tasks:</h4>
            <ul className="text-xs text-gray-400 list-disc list-inside">
              {tasks.map(t => <li key={t.id}>{t.title}</li>)}
            </ul>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button type="submit" className="flex-1 btn-primary">Save</button>
          <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
        </div>
        
        {!block.isPreview && (
          <div className="pt-4 border-t border-gray-700 text-center">
            {block.type !== 'single' && (
              <p className="text-xs text-gray-500 mb-2">Delete this occurrence or the whole series?</p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => onDelete(block.id, block.eventDate, block.type === 'single' ? 'series' : 'single')} className="flex-1 text-xs bg-red-900/50 text-red-300 hover:bg-red-800/50 rounded-md py-1">Delete {block.type === 'single' ? 'Block' : 'This One'}</button>
              {block.type !== 'single' && (<button type="button" onClick={() => onDelete(block.id, null, 'series')} className="flex-1 text-xs bg-red-700 text-white hover:bg-red-600 rounded-md py-1">Delete Series</button>)}
            </div>
          </div>
        )}
      </form>
    </div>
    </div>
  );
};

export default TimeBlockEditPopover;