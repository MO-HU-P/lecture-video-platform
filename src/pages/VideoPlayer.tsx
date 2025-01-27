import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2, AlertCircle } from 'lucide-react';
import { VideoPlayerProps, PlaybackProgress } from '../types/index';


const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  videoUrl,
  title,
  isAutoPlay = false,
  isLoop = false,
  startTime = 0
}) => {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<PlaybackProgress | null>(null);
  const [played, setPlayed] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);

  const resolvedVideoUrl = videoUrl.startsWith('/')
    ? `${videoUrl}`  // Use relative path for Docker
    : `/${videoUrl}`;

  useEffect(() => {
    if (user && videoId) {
      loadPlaybackProgress();
    }
  }, [user, videoId]);

  const loadPlaybackProgress = async () => {
    if (!user) return;
    
    try {
      const progressRef = doc(db, 'users', user.uid, 'playback-progress', videoId);
      const progressDoc = await getDoc(progressRef);
      
      if (progressDoc.exists()) {
        setProgress(progressDoc.data() as PlaybackProgress);
        if (!progressDoc.data().completed) {
          setPlayedSeconds(progressDoc.data().lastPosition);
        }
      }
    } catch (err) {
      console.error('Error loading playback progress:', err);
    }
  };

  const savePlaybackProgress = async (currentTime: number, isCompleted: boolean = false) => {
    if (!user) return;

    try {
      const progressRef = doc(db, 'users', user.uid, 'playback-progress', videoId);
      const progress: PlaybackProgress = {
        lastPosition: currentTime,
        completed: isCompleted,
        lastUpdated: new Date()
      };

      await setDoc(progressRef, progress);

      if (isCompleted) {
        const videoRef = doc(db, 'videos', videoId);
        await updateDoc(videoRef, {
          view_count: increment(1)
        });
      }
    } catch (err) {
      console.error('Error saving playback progress:', err);
    }
  };

  const handleReady = () => {
    setIsReady(true);
    if (startTime > 0) {
      setPlayedSeconds(startTime);
    } else if (progress && !progress.completed) {
      setPlayedSeconds(progress.lastPosition);
    }
  };

  const handleProgress = ({ played, playedSeconds }: { played: number; playedSeconds: number }) => {
    if (!seeking) {
      setPlayed(played);
      setPlayedSeconds(playedSeconds);

      if (Math.floor(playedSeconds) % 30 === 0) {
        savePlaybackProgress(playedSeconds);
      }
    }
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  const handleEnded = () => {
    savePlaybackProgress(duration, true);
  };

  const handleError = (error: any) => {
    console.error('Video playback error:', error);
    setError('動画の再生中にエラーが発生しました。しばらく待ってから再度お試しください。');
  };

  return (
    <div className="w-full space-y-4">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p className="text-center">{error}</p>
          </div>
        )}

        <ReactPlayer
          url={resolvedVideoUrl}
          width="100%"
          height="100%"
          playing={isAutoPlay}
          loop={isLoop}
          controls={true}
          playsinline
          pip
          onReady={handleReady}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onEnded={handleEnded}
          onError={handleError}
          progressInterval={1000}
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

      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>{formatTime(playedSeconds)} / {formatTime(duration)}</span>
          <span>{Math.round(played * 100)}% 完了</span>
          {progress?.completed && (
            <span className="text-green-600">✓ 視聴完了</span>
          )}
        </div>

        <div className="relative h-1 bg-gray-200 rounded-full overflow-hidden">
          <input
            type="range"
            min={0}
            max={0.999999}
            step="any"
            value={played}
            className="absolute w-full h-full opacity-0 cursor-pointer"
            onMouseDown={() => setSeeking(true)}
            onMouseUp={() => setSeeking(false)}
            onChange={e => setPlayed(parseFloat(e.target.value))}
          />
          <div
            className="h-full bg-indigo-600 transition-all duration-100"
            style={{ width: `${played * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const formatTime = (seconds: number) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(remainingSeconds)}`
    : `${minutes}:${pad(remainingSeconds)}`;
};

export default VideoPlayer;