import { api, query } from '../api';

// Matches the Events module's CreateEventRequest and EventDto contracts.
export interface PersonalEvent {
  id: string; title: string; description: string | null;
  startAtUtc: string; endAtUtc: string | null; isCompleted: boolean;
  reminderMinutesBefore: number | null;
}
export interface CreatePersonalEvent {
  title: string; description: string | null; startAtUtc: string;
  endAtUtc: string; reminderMinutesBefore: number | null;
}
export const personalEvents = {
  list: (startDate: string, endDate: string) => api.get<PersonalEvent[]>(`/api/events${query({ startDate, endDate })}`),
  create: (body: CreatePersonalEvent) => api.post<PersonalEvent>('/api/events', body),
};
