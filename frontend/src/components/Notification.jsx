import React from 'react';

const Notification = ({ message, type }) => {
  if (!message) {
    return null;
  }

  const baseClasses = 'fixed bottom-5 right-5 p-4 rounded-lg text-white shadow-lg';
  const typeClasses = {
    info: 'bg-blue-500',
    error: 'bg-red-500',
    success: 'bg-green-500',
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      {message}
    </div>
  );
};

export default Notification;
