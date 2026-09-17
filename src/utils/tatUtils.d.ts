import React from 'react';

export interface TatConfig {
  id?: string;
  system_id: string;
  system_name: string;
  page_name: string;
  page_path: string;
  tat_days: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TatStatusResult {
  hasData: boolean;
  tatDays: number | null;
  statusText: string;
  color: 'red' | 'green' | 'neutral';
  plannedDateStr?: string;
  isCompleted?: boolean;
  isDelayed?: boolean;
  delayDays?: number;
}

export interface CalculateTatStatusParams {
  tatDays?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isCompleted?: boolean;
}

export declare const DEFAULT_TAT_CONFIGS: TatConfig[];

export declare function fetchTatConfigs(): Promise<TatConfig[]>;

export declare function getTatDays(
  tatConfigs?: TatConfig[] | any[],
  pagePath?: string,
  fallbackDays?: number | null
): number;

export declare function calculateTatStatus(
  params: CalculateTatStatusParams
): TatStatusResult;

export interface TatPlannedCellProps {
  tatDays?: number | null;
  startDate?: string | null;
}

export declare function TatPlannedCell(
  props: TatPlannedCellProps
): React.ReactElement;

export interface TatDelayCellProps {
  status?: TatStatusResult | any;
  tatStatus?: TatStatusResult | any;
}

export declare function TatDelayCell(
  props: TatDelayCellProps
): React.ReactElement;
