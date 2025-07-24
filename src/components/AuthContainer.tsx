import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

export const AuthContainer = () => {
  const [isLogin, setIsLogin] = useState(true);

  if (isLogin) {
    return <LoginForm onSwitchToSignup={() => setIsLogin(false)} />;
  }

  return <SignupForm onSwitchToLogin={() => setIsLogin(true)} />;
};