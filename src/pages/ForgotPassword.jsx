import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout.jsx';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm.jsx';

export const ForgotPassword = ({ onShowToast }) => {
  return (
    <AuthLayout>
      <ForgotPasswordForm onShowToast={onShowToast} />
    </AuthLayout>
  );
};
