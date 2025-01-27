
export interface User {
  id: string;
  email: string;
  name: string;
  picture_url: string;
  role: 'teacher' | 'student';
  department: string;
  google_id: string;
  last_login_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Video {
  id: string;
  teacher_id: string;
  title: string;
  description: string;
  lecture_name: string;
  grade: number;
  semester: 'first' | 'second';
  thumbnail_url: string;
  video_url: string;
  duration: number;
  view_count: number;
  status: 'processing' | 'ready';
  subtitles_url?: string;
  created_at: Date;
  updated_at: Date;
  isCompleted?: boolean;
}

export interface LectureMaterial {
  id: string;
  video_id: string;
  file_name: string;
  file_url: string;
  created_at: Date;
}

export interface VideoPlayerProps {
  videoId: string;
  videoUrl: string;
  title: string;
  isAutoPlay?: boolean;
  isLoop?: boolean;
  startTime?: number;
}

export interface PlaybackProgress {
  lastPosition: number;
  completed: boolean;
  lastUpdated: Date;
}

export interface Notification {
  id?: string;
  title: string;
  content: string;
  course: string;
  grade: number;
  semester: '前期' | '後期';
  repositoryLink: string;
  createdAt: Date;
}

export interface NotificationFilters {
  course?: string;
  grade?: number;
  semester?: '前期' | '後期';
}
