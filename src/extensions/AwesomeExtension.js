class AwesomeExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);
    this._viewer = viewer;
    
    this._lockBtn = document.getElementById('lockCameraBtn');
    this._unlockBtn = document.getElementById('UnlockCameraBtn');
  }

  load() {
    this._lockBtn.addEventListener('click', () => this.lockCamera(true));
    this._unlockBtn.addEventListener('click', () => this.lockCamera(false));
    
    return true;
  }

  lockCamera(lock) {
    this._viewer.setNavigationLock(lock);
  }

  unload() {
    if (this._lockBtn) {
      this._lockBtn.removeEventListener('click', this.lockCamera);
      this._lockBtn = null;
    }

    if (this._unlockBtn) {
      this._unlockBtn.removeEventListener('click', this.lockCamera);
      this._unlockBtn = null;
    }
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension('AwesomeExtension', AwesomeExtension);
