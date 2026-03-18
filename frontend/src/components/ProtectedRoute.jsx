import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * A component that acts as a guard for routes that require authentication.
 * It checks for a 'token' in localStorage. If the token exists, it renders the
 * child routes (using the <Outlet /> component). Otherwise, it redirects the
 * user to the /login page.
 */
const ProtectedRoute = () => {
  const token = localStorage.getItem('token');

  // If there's a token, the user is considered authenticated.
  // The <Outlet /> component will render the nested child route component.
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
