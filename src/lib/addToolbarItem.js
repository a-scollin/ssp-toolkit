import { default as MxGraph } from "mxgraph";
import { getStyleStringByObj } from "./getStyleStringByObj";

const { mxEvent, mxUtils } = MxGraph();

export default function addToolbarItem(graph, toolbar, prototype, image, value, passedFunct=null) {
  // Function that is executed when the image is dropped on
  // the graph. The cell argument points to the cell under
  // the mousepointer if there is one.
  var funct = passedFunct === null ? function(graph, evt, cell, x, y) {
    graph.stopEditing(false);

    
    

    var vertex = graph.getModel().cloneCell(prototype);
    vertex.geometry.x = x;
    vertex.geometry.y = y;


      graph.addCell(vertex);
      graph.setSelectionCell(vertex);
      

  } : passedFunct

  // Creates the image which is used as the drag icon (preview)
  var img = toolbar.addMode(null, image, function(evt, cell) {
    var pt = this.graph.getPointForEvent(evt);
    funct(graph, evt, cell, pt.x, pt.y, value);
  });

  // Disables dragging if element is disabled. This is a workaround
  // for wrong event order in IE. Following is a dummy listener that
  // is invoked as the last listener in IE.
  mxEvent.addListener(img, "mousedown", function(evt) {

  });

  // This listener is always called first before any other listener
  // in all browsers.
  mxEvent.addListener(img, "mousedown", function(evt) {
    

    
    if (!img.enabled) {
      mxEvent.consume(evt);
    }
  });

  mxUtils.makeDraggable(img, graph, funct);

  return img;
}
