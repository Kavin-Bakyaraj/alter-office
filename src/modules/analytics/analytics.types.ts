export interface EventSummaryQuery {
  event: string;
  startDate?: string;
  endDate?: string;
  app_id?: string;
}

export interface UserStatsQuery {
  userId: string;
}
