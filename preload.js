const { contextBridge, ipcRenderer } = require('electron');

// React uygulamasına sunulan tamamen güvenli, sınırlandırılmış ve adlandırılmış IPC metodları
contextBridge.exposeInMainWorld('api', {
  // Tarla API'leri
  tarlalar: {
    getAll: () => ipcRenderer.invoke('tarlalar:get-all'),
    add: (data) => ipcRenderer.invoke('tarlalar:add', data),
    remove: (id) => ipcRenderer.invoke('tarlalar:remove', id)
  },
  
  // Ürün API'leri
  urunler: {
    getAll: () => ipcRenderer.invoke('urunler:get-all'),
    add: (data) => ipcRenderer.invoke('urunler:add', data),
    remove: (id) => ipcRenderer.invoke('urunler:remove', id)
  },
  
  // Ekim API'leri
  ekimler: {
    getAll: () => ipcRenderer.invoke('ekimler:get-all'),
    add: (data) => ipcRenderer.invoke('ekimler:add', data),
    remove: (id) => ipcRenderer.invoke('ekimler:remove', id)
  },
  
  // Masraf API'leri (Gübre, İlaç, Tohum, Yakıt, İşçilik vb.)
  masraflar: {
    getAll: () => ipcRenderer.invoke('masraflar:get-all'),
    add: (data) => ipcRenderer.invoke('masraflar:add', data),
    update: (id, data) => ipcRenderer.invoke('masraflar:update', id, data),
    remove: (id) => ipcRenderer.invoke('masraflar:remove', id)
  },
  
  // Hasat ve Satış API'leri
  hasatlar: {
    getAll: () => ipcRenderer.invoke('hasatlar:get-all'),
    add: (data) => ipcRenderer.invoke('hasatlar:add', data),
    remove: (id) => ipcRenderer.invoke('hasatlar:remove', id)
  },

  // Raporlama ve Özet Analiz API'leri
  raporlar: {
    getSummary: () => ipcRenderer.invoke('raporlar:get-summary')
  },

  // Zaman Damgalı Yedekleme API'leri
  backup: {
    export: () => ipcRenderer.invoke('backup:export'),
    import: () => ipcRenderer.invoke('backup:import'),
    getBackups: () => ipcRenderer.invoke('backup:get-list'),
    createManual: () => ipcRenderer.invoke('backup:create-manual'),
    restoreFromPath: (filePath) => ipcRenderer.invoke('backup:restore-from-path', filePath)
  },

  checkUpdates: () => ipcRenderer.invoke('check-updates'),
  getUpdateState: () => ipcRenderer.invoke('updates:get-state'),
  onUpdateAvailable: (callback) => {
    const listener = (_, payload) => callback(payload);
    ipcRenderer.on('update:available', listener);
    return () => ipcRenderer.removeListener('update:available', listener);
  },
  onDownloadProgress: (callback) => {
    const listener = (_, payload) => callback(payload);
    ipcRenderer.on('update:download-progress', listener);
    return () => ipcRenderer.removeListener('update:download-progress', listener);
  },
  onUpdateDownloaded: (callback) => {
    const listener = (_, payload) => callback(payload);
    ipcRenderer.on('update:downloaded', listener);
    return () => ipcRenderer.removeListener('update:downloaded', listener);
  },
  onUpdateNotAvailable: (callback) => {
    const listener = (_, payload) => callback(payload);
    ipcRenderer.on('update:not-available', listener);
    return () => ipcRenderer.removeListener('update:not-available', listener);
  },
  onUpdateError: (callback) => {
    const listener = (_, payload) => callback(payload);
    ipcRenderer.on('update:error', listener);
    return () => ipcRenderer.removeListener('update:error', listener);
  }
});
