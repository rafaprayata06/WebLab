
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { initializeAuth } from '../features/auth/authSlice';
import App from '../App';

function AppInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return <App />;
}

export default AppInitializer;
