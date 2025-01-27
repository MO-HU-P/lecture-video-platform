import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Upload as UploadIcon, Video, X, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import axios from 'axios';

const Upload: React.FC = () => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setError('');

      const videoElement = document.createElement('video');
      videoElement.src = URL.createObjectURL(file);
      videoElement.onloadedmetadata = () => {
        setVideoDuration(videoElement.duration);
      };
    } else {
      setError('動画ファイルを選択してください。');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile || !user) return;

    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const lectureName = formData.get('lecture_name') as string;
    const grade = parseInt(formData.get('grade') as string);
    const semester = formData.get('semester') as string;

    try {
      setIsUploading(true);
      setError('');

      const uploadFormData = new FormData();
      uploadFormData.append('video', selectedFile);

      const response = await axios.post('/api/upload', uploadFormData, {
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.loaded / (progressEvent.total ?? 0) * 100;
          setUploadProgress(progress);
        },
      });

      const { videoUrl } = response.data;

      await addDoc(collection(db, 'videos'), {
        teacher_id: user.uid,
        teacher_email: user.email,
        title,
        description,
        lecture_name: lectureName,
        grade,
        semester,
        video_url: videoUrl,
        duration: videoDuration || 0,
        view_count: 0,
        status: 'ready',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      // フォームをリセット
      setSelectedFile(null);
      setVideoDuration(null);
      setUploadProgress(0);
      if (formRef.current) formRef.current.reset();
      
      alert('動画のアップロードが完了しました。');
    } catch (error) {
      console.error('Upload error:', error);
      setError('アップロードに失敗しました。');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">講義動画のアップロード</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              ${selectedFile ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}`}
          >
            {selectedFile ? (
              <div className="flex items-center justify-center gap-2">
                <Video className="h-6 w-6 text-indigo-600" />
                <span className="text-indigo-600 font-medium">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setVideoDuration(null);
                    if (formRef.current) formRef.current.reset();
                  }}
                  className="p-1 hover:bg-indigo-100 rounded-full"
                >
                  <X className="h-4 w-4 text-indigo-600" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <UploadIcon className="h-12 w-12 text-gray-400 mx-auto" />
                <div className="text-gray-600">
                  クリックして動画を選択
                  <br />
                  または
                  <br />
                  ドラッグ＆ドロップ
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              タイトル
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              説明
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="lecture_name" className="block text-sm font-medium text-gray-700">
              講義名
            </label>
            <input
              type="text"
              id="lecture_name"
              name="lecture_name"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                学年
              </label>
              <select
                id="grade"
                name="grade"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="1">1年</option>
                <option value="2">2年</option>
                <option value="3">3年</option>
                <option value="4">4年</option>
                <option value="5">5年</option>
                <option value="6">6年</option>
              </select>
            </div>

            <div>
              <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
                開講時期
              </label>
              <select
                id="semester"
                name="semester"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="first">前期</option>
                <option value="second">後期</option>
              </select>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="text-sm text-gray-600 text-center">
              {Math.round(uploadProgress)}% アップロード完了
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!selectedFile || isUploading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              アップロード中...
            </>
          ) : (
            <>
              <UploadIcon className="h-5 w-5" />
              アップロード
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Upload;
