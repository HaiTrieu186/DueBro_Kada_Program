// Edge Function: generate-recurring-tasks (Architecture Section 6.1 & 8)
// Triggered by pg_cron daily at 00:05.
// Scans active chore_templates and bill_templates, evaluates RRULE, and generates open task_instances.

import { rrulestr } from 'rrule';
import { corsHeaders } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabaseClient.ts';

interface ChoreTemplateRow {
  id: string;
  room_id: string;
  name: string;
  category: string;
  default_effort_points: number;
  estimated_minutes: number | null;
  recurrence_rule: string | null;
  requires_photo: boolean;
  created_by: string;
}

interface BillTemplateRow {
  id: string;
  room_id: string;
  name: string;
  recurrence_rule: string;
  created_by: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();

    // Define boundary of today (UTC or local)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Default due time is 21:00 (9:00 PM) today
    const defaultDueAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0, 0, 0);

    let choreCreatedCount = 0;
    let billCreatedCount = 0;

    // ==========================================
    // 1. Process chore_templates (recurring chores)
    // ==========================================
    const { data: choreTemplates, error: choreError } = await supabase
      .from('chore_templates')
      .select('id, room_id, name, category, default_effort_points, estimated_minutes, recurrence_rule, requires_photo, created_by')
      .eq('is_active', true)
      .eq('approved_by_host', true)
      .not('recurrence_rule', 'is', null);

    if (choreError) {
      console.error('Error querying chore_templates:', choreError);
      throw choreError;
    }

    for (const template of (choreTemplates as ChoreTemplateRow[] || [])) {
      if (!template.recurrence_rule) continue;

      try {
        const rule = rrulestr(template.recurrence_rule);
        const occurrencesToday = rule.between(startOfToday, endOfToday, true);

        if (occurrencesToday.length > 0) {
          // Idempotency check: check if task already created for this template today
          const { data: existingTask } = await supabase
            .from('task_instances')
            .select('id')
            .eq('template_id', template.id)
            .gte('due_at', startOfToday.toISOString())
            .lte('due_at', endOfToday.toISOString())
            .maybeSingle();

          if (!existingTask) {
            // Insert task_instance
            const { data: newTask, error: taskInsertError } = await supabase
              .from('task_instances')
              .insert({
                room_id: template.room_id,
                template_id: template.id,
                source: 'recurring',
                title: template.name,
                category: template.category,
                effort_points: template.default_effort_points,
                requires_photo: template.requires_photo,
                status: 'open',
                opened_at: now.toISOString(),
                due_at: defaultDueAt.toISOString(),
                bonus_multiplier: 1.0,
                created_by: template.created_by,
              })
              .select('id')
              .single();

            if (taskInsertError) {
              console.error(`Failed to insert task for chore template ${template.id}:`, taskInsertError);
              continue;
            }

            // Insert task_event: 'created'
            await supabase.from('task_events').insert({
              task_id: newTask.id,
              event_type: 'created',
              actor_id: null,
              metadata: { source: 'generate-recurring-tasks', template_id: template.id },
            });

            choreCreatedCount++;
          }
        }
      } catch (err) {
        console.warn(`Error processing RRULE for chore template ${template.id} (${template.recurrence_rule}):`, err);
      }
    }

    // ==========================================
    // 2. Process bill_templates (life_deadline tasks)
    // ==========================================
    const { data: billTemplates, error: billError } = await supabase
      .from('bill_templates')
      .select('id, room_id, name, recurrence_rule, created_by')
      .eq('is_active', true);

    if (billError) {
      console.error('Error querying bill_templates:', billError);
      throw billError;
    }

    for (const bill of (billTemplates as BillTemplateRow[] || [])) {
      if (!bill.recurrence_rule) continue;

      try {
        const rule = rrulestr(bill.recurrence_rule);
        const occurrencesToday = rule.between(startOfToday, endOfToday, true);

        if (occurrencesToday.length > 0) {
          // Idempotency check for bill
          const { data: existingBillTask } = await supabase
            .from('task_instances')
            .select('id')
            .eq('room_id', bill.room_id)
            .eq('source', 'life_deadline')
            .eq('title', bill.name)
            .gte('due_at', startOfToday.toISOString())
            .lte('due_at', endOfToday.toISOString())
            .maybeSingle();

          if (!existingBillTask) {
            const { data: newBillTask, error: billInsertError } = await supabase
              .from('task_instances')
              .insert({
                room_id: bill.room_id,
                source: 'life_deadline',
                title: bill.name,
                category: 'bill',
                effort_points: 0, // Bills are deadlines, points are handled if applicable
                requires_photo: false,
                status: 'open',
                opened_at: now.toISOString(),
                due_at: defaultDueAt.toISOString(),
                bonus_multiplier: 1.0,
                created_by: bill.created_by,
              })
              .select('id')
              .single();

            if (billInsertError) {
              console.error(`Failed to insert task for bill template ${bill.id}:`, billInsertError);
              continue;
            }

            await supabase.from('task_events').insert({
              task_id: newBillTask.id,
              event_type: 'created',
              actor_id: null,
              metadata: { source: 'generate-recurring-tasks', bill_id: bill.id },
            });

            billCreatedCount++;
          }
        }
      } catch (err) {
        console.warn(`Error processing RRULE for bill template ${bill.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        timestamp: now.toISOString(),
        chore_tasks_created: choreCreatedCount,
        bill_tasks_created: billCreatedCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('generate-recurring-tasks fatal error:', errorMsg);
    return new Response(JSON.stringify({ ok: false, error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
