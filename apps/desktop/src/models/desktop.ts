import { createModel } from '@rematch/core';

interface DesktopIcon {
  id: string;
  name: string;
  icon: string;
  position: { x: number; y: number };
  isActive: boolean;
}

interface DesktopState {
  icons: DesktopIcon[];
  selectedIcon: string | null;
  isLoading: boolean;
  error: string | null;
}

export const desktop = createModel()({
  state: {
    icons: [
      {
        id: '1',
        name: 'File Manager',
        icon: '📁',
        position: { x: 50, y: 50 },
        isActive: false,
      },
      {
        id: '2',
        name: 'Terminal',
        icon: '💻',
        position: { x: 150, y: 50 },
        isActive: false,
      },
      {
        id: '3',
        name: 'Settings',
        icon: '⚙️',
        position: { x: 250, y: 50 },
        isActive: false,
      },
    ],
    selectedIcon: null,
    isLoading: false,
    error: null,
  } as DesktopState,
  
  reducers: {
    selectIcon: (state, payload: string) => ({
      ...state,
      selectedIcon: payload,
    }),
    moveIcon: (state, payload: { id: string; position: { x: number; y: number } }) => ({
      ...state,
      icons: state.icons.map(icon =>
        icon.id === payload.id
          ? { ...icon, position: payload.position }
          : icon
      ),
    }),
    addIcon: (state, payload: DesktopIcon) => ({
      ...state,
      icons: [...state.icons, payload],
    }),
    removeIcon: (state, payload: string) => ({
      ...state,
      icons: state.icons.filter(icon => icon.id !== payload),
    }),
    setIconActive: (state, payload: { id: string; isActive: boolean }) => ({
      ...state,
      icons: state.icons.map(icon =>
        icon.id === payload.id
          ? { ...icon, isActive: payload.isActive }
          : icon
      ),
    }),
  },
  
  effects: (dispatch) => ({
    async openApp(iconId: string) {
      try {
        dispatch.desktop.setIconActive({ id: iconId, isActive: true });
        // 实际项目中替换为应用启动逻辑
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`Opening app with id: ${iconId}`);
        dispatch.desktop.setIconActive({ id: iconId, isActive: false });
      } catch (err) {
        console.error('Failed to open app:', err);
      }
    },
  }),
});

export default desktop;