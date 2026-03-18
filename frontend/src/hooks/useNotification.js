import { useState, useCallback } from 'react';

const useNotification = () => {
  const [notification, setNotification] = useState(null);

  const addNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  }, []);

  return { notification, addNotification };
};

export default useNotification;
