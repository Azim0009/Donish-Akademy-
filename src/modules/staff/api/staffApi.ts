import { useQuery } from '@tanstack/react-query';
import { api } from '@/core/api/axiosClient';
import { ENDPOINTS } from '@/core/api/endpoints';
import type { ApiResponse } from '@/core/api/types';

export interface StaffHome {
  branch: { name: string; address: string; phone: string };
  contacts: { name: string; phone: string; role: 'director' | 'administrator' }[];
  today: { id: string; name: string; time: string; studentsCount: number }[];
}

export const useStaffHome = () =>
  useQuery({
    queryKey: ['staff', 'home'],
    queryFn: () => api.get<ApiResponse<StaffHome>>(ENDPOINTS.staff.home).then((r) => r.data.data),
  });
