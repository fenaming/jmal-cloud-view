class ToolbarExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);

    this._viewer = viewer;
    this._subToolbar = null;
  }

  load() {
    this._viewer.setLightPreset(6);
    this._viewer.setEnvMapBackground(true);
    this._viewer.fitToView()

    return true;
  }

  unload() {
    if(this._subToolbar) {
      this._viewer.toolbar.removeControl(this._subToolbar);
      this._subToolbar = null;
    }

    return true;
  }

  // To add button to toolbar we need to override onToolbarCreated method.
  onToolbarCreated(toolbar) {
    const btn_1 = new Autodesk.Viewing.UI.Button('show-env-btn');
    btn_1.addClass('show-env-bg-button');
    btn_1.setToolTip('显示背景');
    btn_1.onClick = (e) => {
      this._viewer.setEnvMapBackground(true);
    }

    const btn_2 = new Autodesk.Viewing.UI.Button('hide-env-btn');
    btn_2.addClass('hide-env-bg-button');
    btn_2.setToolTip('隐藏背景');
    btn_2.onClick = (e) => {
      this._viewer.setEnvMapBackground(false);
    }

    this._subToolbar = new Autodesk.Viewing.UI.ControlGroup('environment-toolbar');
    this._subToolbar.addControl(btn_1);
    this._subToolbar.addControl(btn_2);

    toolbar.addControl(this._subToolbar);
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension('ToolbarExtension', ToolbarExtension);
