import { V } from "mathjax-full/js/output/common/FontData";
import { default as MxGraph } from "mxgraph";
import { buildMxFile } from "./export_helper.js";
import GrahamScan from '@lucio/graham-scan'
import { isFunction } from "lodash";
import { InputGroup, Overlay } from "react-bootstrap";
const {
  mxEvent,
  mxRubberband,
  mxUtils,
  mxToolbar,
  mxClient,
  mxDivResizer,
  mxKeyHandler,
  mxCodec,
  mxGeometry,
  mxCell,
  mxUndoManager,
  mxClipboard,
  mxEllipse,
  mxConstants,
  mxPerimeter,
  mxCellRenderer,
  mxText, 
  mxGraph,
  mxEdgeHandler
} = MxGraph(); 


function scan(selected_cells){

    var target_coords = []

    for(var cell in selected_cells){

      if(selected_cells[cell].edge){

        for(var point in selected_cells[cell].geometry.points){
          target_coords.push([selected_cells[cell].geometry.points[point].x,selected_cells[cell].geometry.points[point].y])  
        }

      }else{
        target_coords.push([selected_cells[cell].geometry.x,selected_cells[cell].geometry.y])

      }

    }

    //Create a new instance.
    var grahamScan = new GrahamScan();
  
    grahamScan.setPoints(target_coords);

    //getHull() returns the array of points
    //that make up the convex hull.
    return grahamScan.getHull();  // [1,0], [2,1], [0,1]
}

function applyOverlay(graph,other_cells){

  console.log(graph)
  console.log(other_cells)

}

function inside(point, vs) {
  // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
  
  var x = point[0], y = point[1];
  
  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      var xi = vs[i][0], yi = vs[i][1];
      var xj = vs[j][0], yj = vs[j][1];
      
      var intersect = ((yi > y) != (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
  }
  
  return inside;
};

const saveFile = async (blob) => {
  const a = document.createElement('a');
  a.download = 'exportsvg.svg';
  a.href = URL.createObjectURL(blob);
  a.addEventListener('click', (e) => {
    setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
  });
  a.click();
};


export function configureKeyBindings(graph, selected) {

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

  // Redo handler: CTRL + X
  keyHandler.bindControlKey(88, function(evt) {
    console.log("redo")
    undoManager.redo();
  });

  // copy handler: CTRL + C
  keyHandler.bindControlKey(67, function(evt) {
    mxClipboard.copy(graph)
    });

  // paste handler: CTRL + V
  keyHandler.bindControlKey(86, function(evt) {
    mxClipboard.paste(graph)
    });


  // HULL handler: CTRL + H
  keyHandler.bindControlKey(72, function(evt) {
   
    var target_cells = graph.getSelectionModel().cells

    var all_cells = graph.getModel().cells
    
    var other_cells = []
    
    for(var cell in all_cells){
      if(!target_cells.includes(all_cells[cell]) && all_cells[cell].style !== 'swimlane' && all_cells[cell].value !== 'Adv_pkg' && all_cells[cell].value !== 'terminal_pkg' && (all_cells[cell].vertex || all_cells[cell].edge)){
        other_cells.push(all_cells[cell])
      }
    }
    
    var hullpoints = scan(target_cells)

    applyOverlay(graph,other_cells)

    
  });
    
    // HULL handler: CTRL + F
    keyHandler.bindControlKey(70, function(evt) {
  
      mxUtils.setCellStyles(graph.getModel(), graph.getSelectionModel().cells, 'opacity', 20);
    
    });

    // HULL handler: CTRL + G
    keyHandler.bindControlKey(71, function(evt) {
  
      mxUtils.setCellStyles(graph.getModel(), graph.getSelectionModel().cells, 'opacity', 100);
    
    });


  // export handler: CTRL + E
  keyHandler.bindControlKey(69, () => buildMxFile([[selected, graph.getModel()]]))

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
  
  var vertex = {}

  var new_graph = {"graph" : {}, "oracles" : []}

  for(var id in selectmodel.cells){

    if(selectmodel.cells[id].value === ""){
      throw 'Unamed ' + selectmodel.cells[id].vertex ? "vertex!" : "edge!";
    }

    if(selectmodel.cells[id].vertex && selectmodel.cells[id].style !== 'swimlane'){

      new_graph.graph[selectmodel.cells[id].value] = []
    
    }
        
  }

  var target_name;

  var source_name;

  for(var id in selectmodel.cells){

    if(selectmodel.cells[id].edge){

      target_name = new_graph.graph.hasOwnProperty(selectmodel.cells[id].target.value) ? selectmodel.cells[id].target.value : ""

      source_name = selectmodel.cells[id].source.value

      if(new_graph.graph.hasOwnProperty(source_name)){

        new_graph.graph[source_name].push([target_name,selectmodel.cells[id].value])

      }else if(target_name !== ""){

        new_graph.oracles.push([target_name, selectmodel.cells[id].value])

      }

    }

  }

    return new_graph
}