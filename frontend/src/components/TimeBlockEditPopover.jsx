import React, { useState, useRef } from 'react';
import useClickOutside from '../hooks/useClickOutside';

const TimeBlockEditPopover = ({ show, block, tasks, onClose, onSave, onDelete, t }) => {
  const [formData, setFormData] = useState(() => ({
    ...block,
    reminderMinutes: block.reminderMinutes || 0,
  }));
  const popoverRef = useRef(null);

  useClickOutside({ ref: popoverRef, callback: onClose });

  const daysOfWeekList = [
    { label: t.sunday, value: 0 },
    { label: t.monday, value: 1 },
    { label: t.tuesday, value: 2 },
    { label: t.wednesday, value: 3 },
    { label: t.thursday, value: 4 },
    { label: t.friday, value: 5 },
    { label: t.saturday, value: 6 },
  ];

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
        {block.isPreview ? t.createTimeBlock : t.editTimeBlock}
      </h3>
      <form onSubmit={handleSave} className="space-y-4">
        <input
          type="text"
          placeholder={t.blockLabel}
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
          <label htmlFor="isAllDay" className="ml-2 text-sm text-gray-300">{t.allDayEvent}</label>
        </div>

        <div className="flex gap-2">
          <select
            className="input-field"
            value={formData.type}
            onChange={e => setFormData({...formData, type: e.target.value})}
          >
            <option value="daily">{t.daily}</option>
            <option value="workweek">{t.workWeek}</option>
            <option value="weekly">{t.weekly}</option>
            <option value="single">{t.single}</option>
          </select>
          {formData.type === 'weekly' && (
            <select
              className="input-field"
              value={formData.dayOfWeek}
              onChange={e => setFormData({...formData, dayOfWeek: parseInt(e.target.value, 10)})}
            >
              {daysOfWeekList.map(day => (
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
              <label className="text-xs text-gray-400 mb-1 block">{t.startTime}</label>
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
              <label className="text-xs text-gray-400 mb-1 block">{t.endTime}</label>
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
          <label className="text-xs text-gray-400 mb-1 block">{t.reminder}</label>
          <select
            className="input-field"
            value={formData.reminderMinutes || 0}
            onChange={e => setFormData({...formData, reminderMinutes: parseInt(e.target.value)})}
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
        </div>

        {tasks && tasks.length > 0 && (
          <div className="pt-2">
            <h4 className="text-sm font-semibold text-gray-300 mb-1">{t.attachedTasks}:</h4>
            <ul className="text-xs text-gray-400 list-disc list-inside">
              {tasks.map(t => <li key={t.id}>{t.title}</li>)}
            </ul>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button type="submit" className="flex-1 btn-primary">{t.save}</button>
          <button type="button" onClick={onClose} className="flex-1 btn-secondary">{t.cancel}</button>
        </div>
        
        {!block.isPreview && (
          <div className="pt-4 border-t border-gray-700 text-center">
            {block.type !== 'single' && (
              <p className="text-xs text-gray-500 mb-2">{t.deleteQuestion}</p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => onDelete(block.id, block.eventDate, block.type === 'single' ? 'series' : 'single')} className="flex-1 text-xs bg-red-900/50 text-red-300 hover:bg-red-800/50 rounded-md py-1">{block.type === 'single' ? t.deleteBlock : t.deleteInstance}</button>
              {block.type !== 'single' && (<button type="button" onClick={() => onDelete(block.id, null, 'series')} className="flex-1 text-xs bg-red-700 text-white hover:bg-red-600 rounded-md py-1">{t.deleteSeries}</button>)}
            </div>
          </div>
        )}
      </form>
    </div>
    </div>
  );
};

export default TimeBlockEditPopover;