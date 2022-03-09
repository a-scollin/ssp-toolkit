import { V } from "mathjax-full/js/output/common/FontData";
import { default as MxGraph } from "mxgraph";
import { buildMxFile } from "./export_helper.js";
import GrahamScan from '@lucio/graham-scan'
import { fromPairs, isFunction } from "lodash";
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
  mxShape,
  mxGeometry,
  mxCell,
  mxStencil,
  mxUndoManager,
  mxCellHighlight,
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

      console.log(selected_cells[cell])
      if(selected_cells[cell].edge){

        for(var point in selected_cells[cell].geometry.points){

          // Negitive y as the coords are flipped
          target_coords.push([selected_cells[cell].geometry.points[point].x,-selected_cells[cell].geometry.points[point].y]);

        }

      }else{
        
        target_coords.push([selected_cells[cell].geometry.x,-selected_cells[cell].geometry.y]);
        target_coords.push([selected_cells[cell].geometry.x + selected_cells[cell].geometry.width,-selected_cells[cell].geometry.y + selected_cells[cell].geometry.height]);

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

  for(var cell in other_cells){

    if(other_cells[cell].vertex){

      var highlight = new mxCellHighlight(graph, 'white', 10);
      highlight.spacing = 1
      highlight.highlight(graph.view.getState(other_cells[cell]));

    }else{
      
      
      var highlight = new mxCellHighlight(graph, 'white', 5);
      
      var clone = other_cells[cell].clone()

      console.log(clone)

      highlight.highlight(graph.view.getState(other_cells[cell]));

      graph.getModel().add(other_cells[cell],clone)

      
    }
    
    
  }
  
}


function isInsideRect(point, box){

  var [px, py] = point

  var [x1, y1, w, h] = box

  var x2 = x1+w
  var y2 = y1+h

	return px >= x1 && px <= x2 && py >= y1 && py <= y2; 
}

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
    
    var hullpoints = scan(target_cells)
    
    if(hullpoints.length === 0){
      return 
    }

    var lowest_x = hullpoints[0][0]
    var lowest_y = hullpoints[0][1]
    var biggest_x = hullpoints[0][0]
    var biggest_y = hullpoints[0][1]
    var x,y

    console.log(hullpoints)

    for(var point in hullpoints){
      
      [x,y] = hullpoints[point]

      if(x < lowest_x){
        lowest_x = x
      }

      if(x > biggest_x){
        biggest_x = x
      }
      
      if(y < lowest_y){
        lowest_y = y
      }

      if(y > biggest_y){
        biggest_y = y
      }

    }
    // box in format x,y,w,
    var box = [lowest_x, -biggest_y, biggest_x-lowest_x, -(biggest_y + lowest_y)]

    var other_cells = []
    
    var box = [0, 0, 100, 100]

    for(var cell in all_cells){
      if(!target_cells.includes(all_cells[cell]) && all_cells[cell].style !== 'swimlane' && all_cells[cell].value !== 'Adv_pkg' && all_cells[cell].value !== 'terminal_pkg' && (all_cells[cell].vertex || all_cells[cell].edge)){
        
        if(all_cells[cell].vertex){
          // middle of vertex in box
          if(isInsideRect([all_cells[cell].geometry.x,all_cells[cell].geometry.y],box)){
            other_cells.push(all_cells[cell])
          }
        }else if(all_cells[cell].edge){
          for(var point in all_cells[cell].geometry.points){
            
            if(isInsideRect([all_cells[cell].geometry.points[point].x,all_cells[cell].geometry.points[point].y],box)){

              other_cells.push(all_cells[cell])
              break

            }
          }
        }

      }
    }
  

    function ReductionShape() { }

    ReductionShape.prototype = new mxShape();
    ReductionShape.prototype.constructor = ReductionShape;
   
    

    ReductionShape.prototype.redrawShape = function(c, x, y, w, h)
    {
        c.begin();
        
        var point_x,point_y;
        console.log("jil")

        for(var point in hullpoints){
    
          [point_x,point_y] = hullpoints[point]
          c.lineTo(x + point_x, y + point_y);
    
        }
    
        c.close();
        c.fillAndStroke();
    
    };
    
    mxCellRenderer.registerShape('reduction', ReductionShape);
    
    var style = graph.getStylesheet().getDefaultVertexStyle();
    style[mxConstants.STYLE_SHAPE] = 'reduction';

      try {
        
        graph.getModel().beginUpdate();
      
        var red = graph.insertVertex(graph.getDefaultParent(), null, "", box[0], box[1], box[2], box[3], style);
        // var red = graph.insertVertex(graph.getDefaultParent(), null, "", 0, 0, 100, 100, 'fillColor=gray;strokeColor=none;rounded=false;fontSize=none;opacity=50;constituent=1');
        
        
        console.log(red)

        console.log("here")
        
        red.setConnectable(false)

        applyOverlay(graph,other_cells)

      } finally {
        graph.getModel().endUpdate();
        graph.refresh()
      }
    
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