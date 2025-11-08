import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'active': '#4C3BCF',
    'completed': '#10B981',
    'pending': '#F59E0B',
    'blocked': '#EF4444',
    'in-progress': '#3B82F6',
    'on-hold': '#6B7280'
  };
  return statusColors[status.toLowerCase()] || '#4C3BCF';
}

export interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  summary: string;
}
