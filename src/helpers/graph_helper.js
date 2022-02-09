import { default as MxGraph } from "mxgraph";


const {
  mxEvent,
  mxRubberband,
  mxUtils,
  mxToolbar,
  mxClient,
  mxDivResizer,
  mxKeyHandler,
  mxGeometry,
  mxCell,
  mxUndoManager,
  mxEllipse,
  mxConstants,
  mxPerimeter,
  mxCellRenderer,
  mxText, 
  mxGraph,
  mxEdgeHandler
} = MxGraph(); 

export function configureKeyBindings(graph) {

  console.log("configure new key bindings")
  console.log(graph)

  if (!graph.isEditing()){
    graph.container.setAttribute('tabindex', '-1');
    graph.container.focus();
  }else{
    alert("what")
  }

  var undoManager = new mxUndoManager();
  var listener = function(sender, evt) {
    console.log("event added")
    undoManager.undoableEditHappened(evt.getProperty("edit"));
  };
  graph.getModel().addListener(mxEvent.UNDO, listener);
  graph.getView().addListener(mxEvent.UNDO, listener);

  const keyHandler = new mxKeyHandler(graph);

  keyHandler.getFunction = function(evt)
{
  if (evt != null)
  {
    return (mxEvent.isControlDown(evt) || (mxClient.IS_MAC && evt.metaKey)) ? this.controlKeys[evt.keyCode] : this.normalKeys[evt.keyCode];
  }

  return null;
};

  // Undo handler: CTRL + Z
  keyHandler.bindControlKey(90, function(evt) {
    console.log("undo")
    undoManager.undo();
  });

  // Redo handler: CTRL + SHIFT + Z
  keyHandler.bindControlShiftKey(90, function(evt) {
    console.log("redo")
    undoManager.redo();
  });

  // Delete handler.
  keyHandler.bindKey(8, function(evt) {
    console.log("delete")
    if (graph.isEnabled()) {
      const currentNode = graph.getSelectionCell();
      graph.removeCells([currentNode]);
    }
  });

}