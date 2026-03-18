import React, { useState } from 'react';
import { format } from 'date-fns';

// A reusable modal component
const Modal = ({ children, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex justify-center items-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className={`bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg z-10 transform transition-transform duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}>
        <div className="flex justify-end">
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
};


const BlockEditorModal = ({ eventInfo, isOpen, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState(() => {
    if (eventInfo) {
      const fmt = (date) => format(new Date(date), "yyyy-MM-dd'T'HH:mm");
      const isRecurring = eventInfo.resource?.isRecurring || false;
      return {
        startTime: eventInfo.start ? fmt(eventInfo.start) : '',
        endTime: eventInfo.end ? fmt(eventInfo.end) : '',
        label: eventInfo.resource?.label || '',
        isRecurring: isRecurring,
        type: eventInfo.resource?.type || 'daily',
        dayOfWeek: eventInfo.resource?.dayOfWeek || 0,
        startHour: eventInfo.resource?.startHour || 9,
        endHour: eventInfo.resource?.endHour || 17,
      };
    }
    return {
      startTime: '',
      endTime: '',
      label: '',
      isRecurring: false,
      type: 'daily',
      dayOfWeek: 0,
      startHour: 9,
      endHour: 17,
    };
  });

  const handleSave = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this time block?')) {
        onDelete(eventInfo.resource.id);
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-2xl font-semibold mb-4">
        {eventInfo?.resource ? 'Edit Time Block' : 'Create New Time Block'}
      </h3>
      <form onSubmit={handleSave} className="space-y-4">
        <input 
            type="text" 
            name="label" 
            placeholder="Label (e.g. Deep Work)" 
            value={formData.label} 
            onChange={handleInputChange} 
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        
        <div className="flex items-center">
          <input type="checkbox" id="isRecurring" name="isRecurring" checked={formData.isRecurring} onChange={handleInputChange} className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-600" />
          <label htmlFor="isRecurring" className="ml-2 text-gray-300">Recurring Event</label>
        </div>

        {formData.isRecurring ? (
          <div className="space-y-4 p-4 bg-gray-700/50 rounded-md">
            <select name="type" value={formData.type} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            {formData.type === 'weekly' && (
              <select name="dayOfWeek" value={formData.dayOfWeek} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
            )}
            <div className="grid grid-cols-2 gap-4">
              <input type="number" name="startHour" value={formData.startHour} onChange={handleInputChange} min="0" max="23" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="number" name="endHour" value={formData.endHour} onChange={handleInputChange} min="0" max="23" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleInputChange} required className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="datetime-local" name="endTime" value={formData.endTime} onChange={handleInputChange} required className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        )}
        
        <div className="flex justify-end space-x-4 pt-4">
            {eventInfo?.resource && (
                 <button type="button" onClick={handleDelete} className="py-2 px-4 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition-colors">Delete</button>
            )}
             <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold transition-colors">Cancel</button>
            <button type="submit" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold transition-colors">Save</button>
        </div>
      </form>
    </Modal>
  );
};

export default BlockEditorModal;