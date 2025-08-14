import React, { useEffect, useState, useCallback } from 'react';
import { deleteProject, fetchProjectById, listProjects, ProjectListItem } from '../../utils/projectApi';
import { projectSnapshotSchema, type ProjectSnapshot } from '../../utils/projectSnapshot';

interface ProjectPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadProject: (payload: { name: string; data: ProjectSnapshot }) => void;
}

export const ProjectPickerSheet: React.FC<ProjectPickerSheetProps> = ({ isOpen, onClose, onLoadProject }) => {
  const [items, setItems] = useState<ProjectListItem[]>([]);
  const [orderBy, setOrderBy] = useState<'updated_at' | 'name'>('updated_at');
  const [ascending, setAscending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOver, setIsOver] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listProjects(orderBy, ascending);
      setItems(list);
    } catch {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  }, [orderBy, ascending]);

  const onDropFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const parsed = projectSnapshotSchema.safeParse(data);
      if (!parsed.success) throw new Error('Invalid JSON schema');
      const name = (data?.name as string) || file.name.replace(/\.json$/i, '') || 'Imported';
      onLoadProject({ name, data: parsed.data });
      onClose();
    } catch {
      setError('JSONの読み込みに失敗しました');
    }
  }, [onLoadProject, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    reload();
  }, [isOpen, reload]);

  const toggleOrderKey = useCallback(() => {
    setOrderBy(prev => (prev === 'updated_at' ? 'name' : 'updated_at'));
  }, []);
  const toggleAsc = useCallback(() => setAscending(v => !v), []);

  return (
    <div className={`fixed inset-0 z-[10010] flex items-start justify-end ${isOpen ? '' : 'pointer-events-none'}`}>
      <div 
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`relative w-[420px] h-full bg-slate-800 border-l border-slate-700 p-4 overflow-y-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 transition-transform duration-200 ease-out will-change-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">プロジェクトを開く</h3>
          <button className="text-slate-300 hover:text-white transition-colors active:scale-95" onClick={onClose}>✕</button>
        </div>
      
        <div
          className={`mb-3 p-4 border-2 rounded text-sm ${isOver ? 'border-blue-400 bg-slate-700/40' : 'border-slate-600 bg-slate-700/20'} text-slate-200`}
        onDragOver={(ev) => { ev.preventDefault(); setIsOver(true); }}
        onDragLeave={() => setIsOver(false)}
        onDrop={(ev) => { ev.preventDefault(); setIsOver(false); onDropFiles(ev.dataTransfer.files); }}
        >
          JSONをドラッグ&ドロップして読み込み
        </div>
        <div className="flex items-center gap-2 mb-3">
          <button className="px-2 py-1 rounded bg-slate-700 text-xs text-white hover:bg-slate-600 transition-colors active:scale-95" onClick={toggleOrderKey}>
            並び: {orderBy === 'updated_at' ? '保存順' : '名前順'}
          </button>
          <button className="px-2 py-1 rounded bg-slate-700 text-xs text-white hover:bg-slate-600 transition-colors active:scale-95" onClick={toggleAsc}>
            {ascending ? '昇順' : '降順'}
          </button>
          <button className="ml-auto px-2 py-1 rounded bg-slate-700 text-xs text-white hover:bg-slate-600 transition-colors active:scale-95" onClick={reload}>更新</button>
        </div>
        {loading && <div className="text-slate-300 text-sm">読み込み中...</div>}
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-2 p-2 rounded bg-slate-700/40 hover:bg-slate-700 transition-colors">
              <div className="flex-1">
                <div className="text-white text-sm">{item.name}</div>
                <div className="text-slate-400 text-xs">{new Date(item.updated_at).toLocaleString()}</div>
              </div>
              <button
                className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-500 transition-colors active:scale-95"
                onClick={async () => {
                  try {
                    const payload = await fetchProjectById(item.id);
                    const parsed = projectSnapshotSchema.safeParse(payload.data);
                    if (!parsed.success) throw new Error('Invalid project data');
                    onLoadProject({ name: payload.name, data: parsed.data });
                    onClose();
                  } catch { setError('読み込みに失敗しました'); }
                }}
              >開く</button>
              <button
                className="px-2 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-500 transition-colors active:scale-95"
                onClick={async () => {
                  if (!confirm('削除しますか？この操作は取り消せません。')) return;
                  try {
                    await deleteProject(item.id);
                    reload();
                   } catch {}
                }}
              >削除</button>
            </div>
          ))}
          {(!loading && items.length === 0) && (
            <div className="text-slate-300 text-sm">プロジェクトがありません</div>
          )}
        </div>
      </div>
    </div>
  );
};