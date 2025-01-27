import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, where, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { FileText, Filter, ExternalLink, PlusCircle, Trash2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { Notification, NotificationFilters } from '../types/index';
import NotificationForm from './NotificationForm';

export default function Materials() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [isTeacher] = useState(true); 
  const [showForm, setShowForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchNotifications = async () => {
    try {
      const queryConditions = [];
      
      queryConditions.push(orderBy('createdAt', 'desc'));
      
      if (filters.course?.trim()) {
        queryConditions.push(where('course', '==', filters.course.trim()));
      }
      if (filters.grade) {
        queryConditions.push(where('grade', '==', filters.grade));
      }
      if (filters.semester) {
        queryConditions.push(where('semester', '==', filters.semester));
      }

      const q = query(collection(db, 'notifications'), ...queryConditions);

      const querySnapshot = await getDocs(q);
      const notificationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate()
      })) as Notification[];
      
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!window.confirm('この投稿を削除してもよろしいですか？')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, 'notifications', notificationId));
      await fetchNotifications(); 
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  useEffect(() => {
    fetchNotifications();
  }, [filters]); 

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">講義連絡掲示板</h1>
          {isTeacher && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              新規投稿
            </button>
          )}
        </div>

        {showForm ? (
          <NotificationForm onSubmitSuccess={() => {
            setShowForm(false);
            fetchNotifications();
          }} />
        ) : (
          <>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">検索フィルター</h2>
                <div className="flex items-center space-x-4">
                  <Filter className="h-5 w-5 text-gray-500" />
                  {(filters.course || filters.grade || filters.semester) && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                      フィルターをクリア
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="講義名で検索"
                  value={filters.course || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, course: e.target.value || undefined }))}
                  className="rounded-lg border border-slate-300 bg-slate-50/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-opacity-50 py-3 px-4"
                />
                <select
                  value={filters.grade || ''}
                  onChange={(e) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      grade: e.target.value ? Number(e.target.value) : undefined 
                    }))
                  }
                  className="rounded-lg border border-slate-300 bg-slate-50/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-opacity-50 py-3 px-4"
                >
                  <option value="">学年を選択</option>
                  {[1, 2, 3, 4, 5, 6].map(grade => (
                    <option key={grade} value={grade}>{grade}年</option>
                  ))}
                </select>
                <select
                  value={filters.semester || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    semester: e.target.value as '前期' | '後期' | undefined 
                  }))}
                  className="rounded-lg border border-slate-300 bg-slate-50/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-opacity-50 py-3 px-4"
                >
                  <option value="">学期を選択</option>
                  <option value="前期">前期</option>
                  <option value="後期">後期</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              {notifications.map((notification) => (
                <div key={notification.id} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-6 w-6 text-indigo-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-500">
                        {format(notification.createdAt, 'yyyy/MM/dd HH:mm')}
                      </div>
                      {isTeacher && (
                        <button
                          onClick={() => notification.id && handleDelete(notification.id)}
                          disabled={isDeleting}
                          className="text-red-500 hover:text-red-700 transition-colors duration-200 p-1 rounded-full hover:bg-red-50"
                          title="削除"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 text-gray-600">{notification.content}</div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {notification.course}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {notification.grade}年
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {notification.semester}
                    </span>
                  </div>
                  <div className="mt-4">
                  {notification.repositoryLink ? (
                    <a
                      href={notification.repositoryLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      資料を見る
                    </a>
                  ) : (
                    <span className="text-gray-500">資料リンクはありません</span>
                  )}
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  表示する投稿がありません
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}




/*
  # Create composite indexes for notifications collection

  1. Indexes Required
    - Index 1: createdAt (DESC) + course (ASC)
    - Index 2: createdAt (DESC) + grade (ASC)
    - Index 3: createdAt (DESC) + semester (ASC)
    - Index 4: createdAt (DESC) + course (ASC) + grade (ASC)
    - Index 5: createdAt (DESC) + course (ASC) + semester (ASC)
    - Index 6: createdAt (DESC) + grade (ASC) + semester (ASC)
    - Index 7: createdAt (DESC) + course (ASC) + grade (ASC) + semester (ASC)
*/
