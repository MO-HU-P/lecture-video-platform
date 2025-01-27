import React from 'react';
import { useForm } from 'react-hook-form';
import { Notification } from '../types/index';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface NotificationFormProps {
  onSubmitSuccess: () => void;
}

export default function NotificationForm({ onSubmitSuccess }: NotificationFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Notification>();

  const onSubmit = async (data: Notification) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...data,
        grade: parseInt(data.grade as unknown as string, 10),  // 文字列を数値に変換
        createdAt: serverTimestamp()
      });
      reset();
      onSubmitSuccess();
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl shadow-lg p-8 border border-slate-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">新規連絡事項の投稿</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">タイトル</label>
            <input
              type="text"
              {...register('title', { required: true })}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-50/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-opacity-50 py-3 px-4"
            />
            {errors.title && <span className="text-red-500 text-sm">必須項目です</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">連絡事項</label>
            <textarea
              {...register('content', { required: true })}
              rows={4}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-50/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-opacity-50 py-3 px-4"
            />
            {errors.content && <span className="text-red-500 text-sm">必須項目です</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">講義名</label>
              <input
                type="text"
                {...register('course', { required: true })}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-50/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-opacity-50 py-3 px-4"
              />
              {errors.course && <span className="text-red-500 text-sm">必須項目です</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">学年</label>
              <select
                {...register('grade', { required: true, valueAsNumber: true })}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-50/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-opacity-50 py-3 px-4"
              >
                {[1, 2, 3, 4, 5, 6].map(grade => (
                  <option key={grade} value={grade}>{grade}年</option>
                ))}
              </select>
              {errors.grade && <span className="text-red-500 text-sm">必須項目です</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">学期</label>
              <select
                {...register('semester', { required: true })}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-50/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-opacity-50 py-3 px-4"
              >
                <option value="前期">前期</option>
                <option value="後期">後期</option>
              </select>
              {errors.semester && <span className="text-red-500 text-sm">必須項目です</span>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">資料リンク</label>
            <input
              type="url"
              {...register('repositoryLink')}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-50/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-opacity-50 py-3 px-4"
            />
            {errors.repositoryLink && <span className="text-red-500 text-sm">無効なURL形式です</span>}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
            >
              投稿する
            </button>
            <button
              type="button"
              onClick={() => onSubmitSuccess()}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}