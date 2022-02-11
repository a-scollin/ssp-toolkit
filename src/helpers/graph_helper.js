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

export function selectedCellsToGraphData(selectmodel){
  
  var selectedvalues = []

  for(var id in selectmodel.cells){

    if(selectmodel.cells[id].value === ""){
      throw 'Unamed ' + selectmodel.cells[id].vertex ? "vertex!" : "edge!";
    }
    
    selectedvalues.push(selectmodel.cells[id].value)
    
  }

  var model = selectmodel.graph.model
  
     var outgoing_edges = {}

    var new_graph = {"graph" : {}, "oracles" : []}

    var thecell

    var cells

    for(var id in model.cells){

      thecell = model.cells[id]

      if(thecell.style !== "swimlane" && selectedvalues.includes(thecell.value)){

        console.log("here")
        if (thecell.vertex === true) {

          cells = model.getOutgoingEdges(thecell)

          for(var edge in cells){

            if(!new_graph.graph.hasOwnProperty(cells[edge].target.value) && (cells[edge].target.value !== "terminal_pkg" || cells[edge].target.value !== "")){
              new_graph.graph[cells[edge].target.value] = []
            }

              if(selectedvalues.includes(cells[edge].value)){

                if(thecell.value == 'Adv_pkg'){
                  new_graph.oracles.push([cells[edge].target.value,cells[edge].value])
                }else{
                  if(!new_graph.graph.hasOwnProperty(cells[edge].source.value)){
                    new_graph.graph[cells[edge].source.value] = []
                  }
                  new_graph.graph[cells[edge].source.value].push([cells[edge].target.value,cells[edge].value])
                }

              }


          }
        }

      }
    }

    return new_graph
}