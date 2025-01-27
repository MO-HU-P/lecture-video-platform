import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';

const Login: React.FC = () => {
  const { user, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string>('');

  console.log('Login component user state:', user);

  const handleLogin = async () => {
    try {
      setError('');
      await signInWithGoogle();
      console.log('Login successful');
    } catch (error) {
      setError('ログインに失敗しました。組織のメールアドレスでログインしてください。');
    }
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">講義動画プラットフォーム</h2>
          <p className="mt-2 text-gray-600">組織アカウントでログインしてください</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <LogIn className="h-5 w-5" />
          Googleでログイン
        </button>
      </div>
    </div>
  );
};

export default Login;