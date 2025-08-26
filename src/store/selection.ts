import { create } from 'zustand';

type Id = string;

interface SelectionState {
  selected: Set<Id>;
  toggle: (id: Id) => void;
  clear: () => void;
  addMany: (ids: Id[]) => void;
  removeMany: (ids: Id[]) => void;
  isSelected: (id: Id) => boolean;
  getSelectedCount: () => number;
}

export const useSelection = create<SelectionState>((set, get) => ({
  selected: new Set(),
  
  toggle: (id) => set((state) => {
    const next = new Set(state.selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return { selected: next };
  }),
  
  clear: () => set({ selected: new Set() }),
  
  addMany: (ids) => set((state) => {
    const next = new Set(state.selected);
    ids.forEach(id => next.add(id));
    return { selected: next };
  }),
  
  removeMany: (ids) => set((state) => {
    const next = new Set(state.selected);
    ids.forEach(id => next.delete(id));
    return { selected: next };
  }),
  
  isSelected: (id) => get().selected.has(id),
  
  getSelectedCount: () => get().selected.size
}));
