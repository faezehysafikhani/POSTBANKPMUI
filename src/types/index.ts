export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type ProjectStatus = 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold' | 'overdue';
export type TaskStatus = 'todo' | 'in_progress' | 'waiting_approval' | 'approved' | 'rejected' | 'done';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  email: string;
  department: string;
  activeTasksCount: number;
  completedTasksCount: number;
  isOnline: boolean;
}

export interface Project {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  manager: TeamMember;
  members: TeamMember[];
  startDate: string;
  endDate: string;
  progress: number; // 0 - 100
  status: ProjectStatus;
  priority: Priority;
  budget: number;
  spent: number;
  tags: string[];
  createdAt: string;
}

export interface ProjectAction {
  id: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  title: string;
  description: string;
  assignee: TeamMember;
  priority: Priority;
  status: TaskStatus;
  deadline: string;
  progress: number;
  requiresApproval: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approver?: string;
  createdAt: string;
}

export interface ApprovalRequest {
  id: string;
  actionId: string;
  actionTitle: string;
  projectTitle: string;
  requester: TeamMember;
  assignedApprover: string;
  dateSubmitted: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  priority: Priority;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  author: string;
  date: string;
  tags: string[];
  summary: string;
  content: string;
  attachmentsCount: number;
}

export interface StrategicGoal {
  id: string;
  title: string;
  targetYear: string;
  progress: number;
  owner: string;
  linkedProjectsCount: number;
  status: 'on_track' | 'at_risk' | 'behind';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  receiverId?: string; // If private
  channelId?: string; // If group
  text: string;
  timestamp: string;
  isEncrypted: boolean;
  integrityHash: string;
  attachment?: {
    name: string;
    size: string;
    type: string;
  };
}

export interface ChatChannel {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  unreadCount: number;
  membersCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'project' | 'task' | 'approval' | 'security' | 'chat';
  timestamp: string;
  read: boolean;
  priority: Priority;
  linkTo?: string;
}

export interface SystemSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: 'teal' | 'indigo' | 'emerald' | 'cyan' | 'slate';
  enablePushNotifications: boolean;
  enableSound: boolean;
  encryptionLevel: 'AES-GCM-256' | 'ChaCha20-Poly1305';
  securityAuditLogging: boolean;
  backendApiUrl: string;
  apiAuthToken: string;
}
