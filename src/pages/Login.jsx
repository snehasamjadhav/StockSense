import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout.jsx';
import { LoginForm } from '../components/auth/LoginForm.jsx';

export const Login = ({ onShowToast }) => {
  return (
    <AuthLayout>
      <LoginForm onShowToast={onShowToast} />
    </AuthLayout>
  );
};
