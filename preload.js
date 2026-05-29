const { contextBridge, ipcRenderer } = require('electron');

async function invoke(channel, ...args) {
  const response = await ipcRenderer.invoke(channel, ...args);
  if (!response || typeof response !== 'object' || !('ok' in response)) {
    return response;
  }
  if (!response.ok) {
    throw new Error(response.error || 'İşlem başarısız oldu.');
  }
  return response.data;
}

function on(channel, callback) {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld('api', {
  tarlalar: {
    getAll: () => invoke('tarlalar:get-all'),
    add: (data) => invoke('tarlalar:add', data),
    remove: (id) => invoke('tarlalar:remove', id)
  },

  urunler: {
    getAll: () => invoke('urunler:get-all'),
    add: (data) => invoke('urunler:add', data),
    remove: (id) => invoke('urunler:remove', id)
  },

  ekimler: {
    getAll: () => invoke('ekimler:get-all'),
    add: (data) => invoke('ekimler:add', data),
    remove: (id) => invoke('ekimler:remove', id)
  },

  masraflar: {
    getAll: () => invoke('masraflar:get-all'),
    add: (data) => invoke('masraflar:add', data),
    update: (id, data) => invoke('masraflar:update', id, data),
    remove: (id) => invoke('masraflar:remove', id)
  },

  hasatlar: {
    getAll: () => invoke('hasatlar:get-all'),
    add: (data) => invoke('hasatlar:add', data),
    remove: (id) => invoke('hasatlar:remove', id)
  },

  raporlar: {
    getSummary: () => invoke('raporlar:get-summary')
  },

  backup: {
    export: () => invoke('backup:export'),
    import: () => invoke('backup:import'),
    getBackups: () => invoke('backup:get-list'),
    createManual: () => invoke('backup:create-manual'),
    restoreFromPath: (filePath) => invoke('backup:restore-from-path', filePath)
  },

  health: {
    check: () => invoke('health:check')
  },

  checkUpdates: () => invoke('check-updates'),
  getUpdateState: () => invoke('updates:get-state'),
  onUpdateAvailable: (callback) => on('update:available', callback),
  onDownloadProgress: (callback) => on('update:download-progress', callback),
  onUpdateDownloaded: (callback) => on('update:downloaded', callback),
  onUpdateNotAvailable: (callback) => on('update:not-available', callback),
  onUpdateError: (callback) => on('update:error', callback)
});
