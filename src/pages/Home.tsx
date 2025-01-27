import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Video } from '../types/index';
import ReactPlayer from 'react-player';

const Home: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const q = query(
          collection(db, 'videos'),
          where('status', '==', 'ready'),
          orderBy('created_at', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const videoList: Video[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          created_at: (doc.data().created_at as Timestamp).toDate()
        })) as Video[];
        setVideos(videoList);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('動画の取得中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
  };

  const closeVideoPlayer = () => {
    setSelectedVideo(null);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">ホーム</h1>

      <section>
        <div className="flex items-center mb-4">
          <Clock className="h-5 w-5 text-gray-600" />
          <h2 className="ml-2 text-xl font-semibold text-gray-900">最近の講義</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <div key={video.id} className="block group cursor-pointer" onClick={() => handleVideoClick(video)}>
              <div className="bg-white rounded-lg shadow-sm p-4 transition-all duration-200 hover:shadow-md">
                <div className="aspect-video bg-gray-200 rounded-lg mb-3 overflow-hidden">
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
                <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">
                  {video.title}
                </h3>
                <p className="text-sm text-gray-600">{video.lecture_name}</p>
                <p className="text-sm text-gray-600">
                  {video.grade}年 {video.semester === 'first' ? '前期' : '後期'}
                </p>
                <p className="text-sm text-gray-500 mt-2">{video.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span>再生時間: {formatDuration(video.duration)}</span>
                  <span>視聴回数: {video.view_count}回</span>
                  <span>アップロード日: {new Date(video.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl">
            <div className="p-4">
              <ReactPlayer
                url={`http://localhost:3001${selectedVideo.video_url}`}
                width="100%"
                height="100%"
                playing={true}
                controls={true}
                config={{
                  file: {
                    attributes: {
                      controlsList: 'nodownload',
                      onContextMenu: (e: React.MouseEvent) => e.preventDefault()
                    }
                  }
                }}
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

export default Home;
