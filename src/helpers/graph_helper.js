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
  var undoManager = new mxUndoManager();
  var listener = function(sender, evt) {
    undoManager.undoableEditHappened(evt.getProperty("edit"));
  };
  graph.getModel().addListener(mxEvent.UNDO, listener);
  graph.getView().addListener(mxEvent.UNDO, listener);

  const keyHandler = new mxKeyHandler(graph);
  // Undo handler: CTRL + Z
  keyHandler.bindControlKey(90, function(evt) {
    undoManager.undo();
  });

  // Redo handler: CTRL + SHIFT + Z
  keyHandler.bindControlShiftKey(90, function(evt) {
    undoManager.redo();
  });

  // Delete handler.
  keyHandler.bindKey(46, function(evt) {
    if (graph.isEnabled()) {
      const currentNode = graph.getSelectionCell();
      graph.removeCells([currentNode]);
    }
  });

}