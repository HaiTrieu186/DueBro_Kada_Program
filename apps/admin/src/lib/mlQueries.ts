import { createAdminClient } from './supabaseServer';

export interface MlPredictionItem {
  id: number;
  taskId: string;
  taskTitle: string;
  candidateMemberId: string;
  candidateName: string;
  modelVersion: string;
  rank: number;
  score: number;
  createdAt: string;
}

export interface MlMonitoringSummary {
  completedTasksCount: number;
  thresholdTarget: number;
  thresholdProgressPct: number;
  currentTier: 'Tier 1 (Cold Start: Rule-Based)' | 'Tier 2 (Hybrid LightGBM ML)';
  totalPredictions: number;
  ruleBasedCount: number;
  mlModelCount: number;
  ruleBasedPct: number;
  mlModelPct: number;
  recentPredictions: MlPredictionItem[];
  featureStats: {
    totalMembersWithFeatures: number;
    avgCompletionRate: number;
    avgDelayHours: number;
    avgQuotaProgress: number;
  };
}

/**
 * Fetches ML monitoring stats, prediction distribution, and feature store health.
 * (Architecture Section 5 & 7)
 */
export async function getMlMonitoringSummary(): Promise<MlMonitoringSummary> {
  const supabase = createAdminClient();
  const THRESHOLD_TARGET = 500;

  // 1. Check completed tasks count for the 500 milestone
  const { count: completedCountResult, error: completedErr } = await supabase
    .from('task_instances')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  if (completedErr) {
    console.error('Failed to count completed tasks for ML threshold:', completedErr);
  }
  const completedTasksCount = completedCountResult || 0;
  const thresholdProgressPct = Math.min(
    100,
    (completedTasksCount / THRESHOLD_TARGET) * 100
  );
  const currentTier =
    completedTasksCount >= THRESHOLD_TARGET
      ? 'Tier 2 (Hybrid LightGBM ML)'
      : 'Tier 1 (Cold Start: Rule-Based)';

  // 2. Fetch ML predictions distribution
  const { data: rawPredictions, error: predErr } = await supabase
    .from('ml_predictions')
    .select('id, task_id, candidate_member_id, model_version, rank, score, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (predErr) {
    console.error('Failed to fetch ml_predictions:', predErr);
  }
  const predictions = rawPredictions || [];

  let ruleBasedCount = 0;
  let mlModelCount = 0;

  for (const p of predictions) {
    if (p.model_version.includes('rule')) {
      ruleBasedCount++;
    } else {
      mlModelCount++;
    }
  }

  const totalPredictions = predictions.length;
  const ruleBasedPct =
    totalPredictions > 0 ? (ruleBasedCount / totalPredictions) * 100 : 100;
  const mlModelPct =
    totalPredictions > 0 ? (mlModelCount / totalPredictions) * 100 : 0;

  // 3. Resolve names for recent predictions
  const taskIds = Array.from(new Set(predictions.map((p) => p.task_id)));
  const memberIds = Array.from(new Set(predictions.map((p) => p.candidate_member_id)));

  const { data: tasksData } = await supabase
    .from('task_instances')
    .select('id, title')
    .in('id', taskIds);
  const taskMap = new Map((tasksData || []).map((t) => [t.id, t.title]));

  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', memberIds);
  const profileMap = new Map((profilesData || []).map((p) => [p.id, p.display_name]));

  const recentPredictions: MlPredictionItem[] = predictions.slice(0, 20).map((p) => ({
    id: p.id,
    taskId: p.task_id,
    taskTitle: taskMap.get(p.task_id) || 'Task #'.concat(p.task_id.slice(0, 8)),
    candidateMemberId: p.candidate_member_id,
    candidateName: profileMap.get(p.candidate_member_id) || 'Thành viên',
    modelVersion: p.model_version,
    rank: p.rank,
    score: p.score,
    createdAt: p.created_at,
  }));

  // 4. Fetch feature stats from mv_member_features
  const { data: featuresData, error: featErr } = await supabase
    .from('mv_member_features')
    .select('completion_rate, avg_delay_hours, quota_progress_pct');

  if (featErr) {
    console.error('Failed to fetch mv_member_features:', featErr);
  }
  const features = featuresData || [];
  const totalMembersWithFeatures = features.length;

  let sumCompletion = 0;
  let sumDelay = 0;
  let sumQuota = 0;

  for (const f of features) {
    sumCompletion += f.completion_rate || 0;
    sumDelay += f.avg_delay_hours || 0;
    sumQuota += f.quota_progress_pct || 0;
  }

  const avgCompletionRate =
    totalMembersWithFeatures > 0 ? sumCompletion / totalMembersWithFeatures : 0;
  const avgDelayHours =
    totalMembersWithFeatures > 0 ? sumDelay / totalMembersWithFeatures : 0;
  const avgQuotaProgress =
    totalMembersWithFeatures > 0 ? sumQuota / totalMembersWithFeatures : 0;

  return {
    completedTasksCount,
    thresholdTarget: THRESHOLD_TARGET,
    thresholdProgressPct,
    currentTier,
    totalPredictions,
    ruleBasedCount,
    mlModelCount,
    ruleBasedPct,
    mlModelPct,
    recentPredictions,
    featureStats: {
      totalMembersWithFeatures,
      avgCompletionRate,
      avgDelayHours,
      avgQuotaProgress,
    },
  };
}
