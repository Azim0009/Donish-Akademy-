import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/core/api/axiosClient';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { ApiResponse } from '@/core/api/types';
import type { UserListItem } from '@/core/types/models';

const E = ENDPOINTS.administrator;
const get = <T>(url: string, params?: object) => api.get<ApiResponse<T>>(url, { params }).then((r) => r.data.data);

export interface TodayGroup {
  id: string;
  name: string;
  mentorName: string | null;
  time: string;
  studentsCount: number;
  capacity: number;
}
export interface AdministratorDashboard {
  studentsCount: number;
  activeCount: number;
  groupsCount: number;
  freeSeats: number;
  today: TodayGroup[];
  recent: UserListItem[];
}

export const useAdministratorDashboard = () =>
  useQuery({ queryKey: ['administrator', 'dashboard'], queryFn: () => get<AdministratorDashboard>(E.dashboard) });

export const useAdministratorStudents = (params: { search: string; groupId: string }) =>
  useQuery({ queryKey: ['administrator', 'students', params], queryFn: () => get<UserListItem[]>(E.students, params), placeholderData: keepPreviousData });
