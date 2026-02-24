class EventReactExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);

    this._viewer = viewer;
    this._itemSelected = document.getElementById('items-selected');
    this._navigationTool = document.getElementById('navigation-tool');

    this._onSelectedBinded = null;
  }

  load() {
    // bind() is used to keep a reference to this within onSelectionEvent()
    this._onSelectedBinded = this.onSelectionChanged.bind(this);
    this._onChangeNavigateBinded = this.onChangeNavigateTool.bind(this);

    this._viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this._onSelectedBinded)
    this._viewer.addEventListener(Autodesk.Viewing.NAVIGATION_MODE_CHANGED_EVENT, this._onChangeNavigateBinded)
    
    return true;
  }

  unload() {
    this._viewer.removeEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this._onSelectedBinded);
    this._viewer.removeEventListener(Autodesk.Viewing.NAVIGATION_MODE_CHANGED_EVENT, this._onChangeNavigateBinded)

    this._itemSelected = null;
    this._navigationTool = null;
    this._onSelectedBinded = null;

    return true
  }

  onSelectionChanged(event) {
    let currentSelection = this._viewer.getSelection();
    this._itemSelected.innerText = currentSelection.length;
  }

  onChangeNavigateTool(event) {
    this._navigationTool.innerText = this._viewer.getActiveNavigationTool();
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension('EventReactExtension', EventReactExtension);