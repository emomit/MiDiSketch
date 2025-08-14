import { getSupabaseClient } from './supabaseClient';
import { z } from 'zod';
import { projectSnapshotSchema, type ProjectSnapshot } from './projectSnapshot';

export interface ProjectPayload {
  name: string;
  data: unknown;
}

export const upsertProject = async (payload: ProjectPayload) => {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('projects')
    .upsert(
      {
        user_id: user.id,
        name: payload.name,
        data: payload.data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,name' }
    );
  if (error) throw error;
};

export const createVersion = async (projectName: string) => {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error('Not authenticated');

  const { data: proj, error: projErr } = await supabase
    .from('projects')
    .select('id, data')
    .eq('user_id', user.id)
    .eq('name', projectName)
    .single();
  if (projErr || !proj) throw projErr ?? new Error('Project not found');

  const { error } = await supabase.from('project_versions').insert({
    project_id: proj.id,
    data: proj.data,
  });
  if (error) throw error;
};

export const upsertUserSettings = async (settings: Record<string, unknown>) => {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error('Not authenticated');

  const settingsSchema = z.record(z.string(), z.unknown());
  const parsed = settingsSchema.safeParse(settings);
  if (!parsed.success) throw new Error('Invalid settings payload');

  const { error } = await supabase.from('user_settings').upsert({
    user_id: user.id,
    settings: parsed.data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
};

export const fetchProjectByName = async (name: string): Promise<ProjectSnapshot> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .select('data')
    .eq('name', name)
    .single();
  if (error) throw error;
  const parsed = projectSnapshotSchema.safeParse(data?.data);
  if (!parsed.success) throw new Error('Invalid project snapshot');
  return parsed.data as ProjectSnapshot;
};

export interface ProjectListItem {
  id: string;
  name: string;
  updated_at: string;
}

export const listProjects = async (orderBy: 'updated_at' | 'name', ascending: boolean) => {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, updated_at')
    .eq('user_id', user?.id || '')
    .order(orderBy, { ascending });
  if (error) throw error;
  const schema = z.array(z.object({ id: z.string(), name: z.string(), updated_at: z.string() }));
  const parsed = schema.safeParse(data ?? []);
  if (!parsed.success) throw new Error('Invalid projects list');
  return parsed.data as ProjectListItem[];
};

export const fetchProjectById = async (id: string): Promise<{ name: string; data: ProjectSnapshot }> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .select('name, data')
    .eq('id', id)
    .single();
  if (error) throw error;
  const snap = projectSnapshotSchema.safeParse(data?.data);
  if (!snap.success) throw new Error('Invalid project snapshot');
  return { name: data?.name as string, data: snap.data as ProjectSnapshot };
};

export const deleteProject = async (id: string) => {
  const supabase = getSupabaseClient();
  // バージョンを先に削除
  const { error: vErr } = await supabase
    .from('project_versions')
    .delete()
    .eq('project_id', id);
  if (vErr) throw vErr;
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// 名前重複時の上書き/別名保存（末尾にナンバリング）確認付きのユーティリティ
export const upsertProjectWithRename = async (payload: ProjectPayload): Promise<string> => {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 既存名の存在チェック
  const { data: existing } = await supabase
    .from('projects')
    .select('id,name')
    .eq('user_id', user.id)
    .eq('name', payload.name)
    .maybeSingle();

  if (!existing) {
    await upsertProject(payload);
    return payload.name;
  }

  try {
    const overwrite = confirm('同名のプロジェクトが存在します。上書きしますか？「キャンセル」で別名保存します。');
    if (overwrite) {
      await upsertProject(payload);
      return payload.name;
    }
  } catch {}

  let index = 2;
  let newName = `${payload.name} (${index})`;
  while (true) {
    const { data: hit } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', newName)
      .maybeSingle();
    if (!hit) break;
    index += 1;
    newName = `${payload.name} (${index})`;
  }
  await upsertProject({ ...payload, name: newName });
  return newName;
};

