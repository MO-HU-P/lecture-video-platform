import React, { useState, useEffect } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Video } from '../types';
import ReactPlayer from 'react-player';
import VideoPlayer from './VideoPlayer';

interface SearchFilters {
  grade: string;
  semester: '' | 'first' | 'second';
  lectureName: string;
  keyword: string;
}

const Search: React.FC = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    grade: '',
    semester: '',
    lectureName: '',
    keyword: ''
  });
  const [results, setResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError('');
  
      const baseQuery = collection(db, 'videos');
      const queryFilters: any[] = [where('status', '==', 'ready')];
  
      if (filters.grade) {
        queryFilters.push(where('grade', '==', parseInt(filters.grade)));
      }
  
      if (filters.semester) {
        queryFilters.push(where('semester', '==', filters.semester));
      }
  
      if (filters.lectureName.trim()) {
        const lectureName = filters.lectureName.trim();
        queryFilters.push(where('lecture_name', '>=', lectureName));
        queryFilters.push(where('lecture_name', '<=', lectureName + '\uf8ff'));
      }
  
      queryFilters.push(orderBy('status', 'asc'));
      queryFilters.push(orderBy('created_at', 'desc'));
  
      const q = query(baseQuery, ...queryFilters);
      const querySnapshot = await getDocs(q);
  
      let searchResults = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          created_at: (data.created_at as Timestamp).toDate(),
          updated_at: (data.updated_at as Timestamp).toDate()
        } as Video;
      });
  
      if (filters.keyword.trim()) {
        const keyword = filters.keyword.toLowerCase().trim();
        searchResults = searchResults.filter(video => 
          video.title.toLowerCase().includes(keyword) ||
          video.description.toLowerCase().includes(keyword) ||
          video.lecture_name.toLowerCase().includes(keyword)
        );
      }
  
      setResults(searchResults);
    } catch (err) {
      console.error('Search error:', err);
      setError('検索中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [filters]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
  };

  const closeVideoPlayer = () => {
    setSelectedVideo(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">講義動画検索</h1>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 検索フィルター */}
        <div className="w-full lg:w-64 bg-white rounded-lg shadow p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">学年</label>
            <select 
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" 
              value={filters.grade}
              onChange={(e) => handleFilterChange('grade', e.target.value)}
            >
              <option value="">全て</option>
              {[1, 2, 3, 4, 5, 6].map((year) => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">開講時期</label>
            <select 
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" 
              value={filters.semester}
              onChange={(e) => handleFilterChange('semester', e.target.value as '' | 'first' | 'second')}
            >
              <option value="">全て</option>
              <option value="first">前期</option>
              <option value="second">後期</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">講義名</label>
            <input 
              type="text" 
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" 
              placeholder="講義名を入力"
              value={filters.lectureName}
              onChange={(e) => handleFilterChange('lectureName', e.target.value)}
            />
          </div>
        </div>

        {/* 検索結果 */}
        <div className="flex-1 space-y-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" 
              placeholder="キーワードで検索"
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-600">検索中...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {results.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  検索条件に一致する動画が見つかりませんでした。
                </div>
              ) : (
                results.map((video) => (
                  <div
                    key={video.id}
                    className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleVideoClick(video)}
                  >
                    <div className="w-full sm:w-48 aspect-video bg-gray-200 rounded-lg overflow-hidden">
                      <ReactPlayer
                        url={`http://localhost:3001${video.video_url}`}
                        width="100%"
                        height="100%"
                        light={true}
                        playing={false}
                        controls={false}
                        config={{
                          file: {
                            attributes: {
                              controlsList: 'nodownload',
                              onContextMenu: (e: React.MouseEvent) => e.preventDefault()
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-4 flex-1">
                      <h3 className="font-medium text-gray-900">{video.title}</h3>
                      <p className="text-sm text-gray-600">
                        {video.lecture_name} ({video.grade}年 {video.semester === 'first' ? '前期' : '後期'})
                      </p>
                      <p className="mt-2 text-sm text-gray-500">{video.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span>再生時間: {formatDuration(video.duration)}</span>
                        <span>視聴回数: {video.view_count}回</span>
                        <span>アップロード日: {formatDate(video.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl">
            <div className="p-4">
              <VideoPlayer
                videoId={selectedVideo.id}
                videoUrl={selectedVideo.video_url}
                title={selectedVideo.title}
              />
              <button
                onClick={closeVideoPlayer}
                className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;


