/**
 * Hook personalizado para usar el contexto de autenticación
 */

import { useContext } from 'react';
import { AuthContext } from '../Contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  
  return context;
};
