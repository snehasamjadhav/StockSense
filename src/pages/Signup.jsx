import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout.jsx';
import { SignupForm } from '../components/auth/SignupForm.jsx';

export const Signup = ({ onShowToast }) => {
  return (
    <AuthLayout>
      <SignupForm onShowToast={onShowToast} />
    </AuthLayout>
  );
};
