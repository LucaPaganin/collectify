import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';

const PrivateRoute = ({ redirectTo, children }) => {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated()) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

PrivateRoute.propTypes = {
  redirectTo: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

export default PrivateRoute;
