
import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import Moveable from "react-moveable";
import 'react-reflex/styles.css'
import { black } from "ansi-colors";
import { AbstractMmlLayoutNode } from "mathjax-full/js/core/MmlTree/MmlNode";
import { default as MxGraph } from "mxgraph";
import { initToolbar, configureKeyBindings, selectedCellsToGraphData} from "./helpers/graph_helper.js"
import addToolbarItem from "./helpers/addToolbarItem";
import getStyleStringByObj from "./helpers/getStyleStringByObj";
import { resolve_diagram_to_json } from "./helpers/import_helper.js";
import { touchRippleClasses } from "@mui/material";
import { V } from "mathjax-full/js/output/common/FontData";
import { GradingSharp } from "@mui/icons-material";
import { style } from "@mui/system";


const {
  mxGraph,
  mxEvent,
  mxVertexHandler,
  mxConnectionHandler,
  mxImage,
  mxClient,
  mxRubberband,
  mxConstants,
  mxUtils,
  mxGeometry,
  mxPoint,
  mxHierarchicalLayout,
  mxFastOrganicLayout,
  mxEdgeHandler,
  mxUndoManager,
  mxKeyHandler,
  mxGraphHandler,
  mxConstraintHandler,
  mxGuide,
  mxCellState,
  mxConnectionConstraint,
  mxDragSource,
  mxToolbar,
  mxDivResizer,
  mxCell
} = MxGraph();

var mx = require("mxgraph")({
  mxImageBasePath: "./mxgraph/javascript/src/images",
  mxBasePath: "./mxgraph/javascript/src"
})

var graphHandlerGetInitialCellForEvent = mxGraphHandler.prototype.getInitialCellForEvent;
mxGraphHandler.prototype.getInitialCellForEvent = function(me)
{
  var cell = graphHandlerGetInitialCellForEvent.apply(this, arguments);
  
  if (this.graph.isPart(cell))
  {
    cell = this.graph.getModel().getParent(cell)
  }
  
  return cell;
};

export default class GraphView extends Component {
  constructor(props) {
    super(props);
    this.state = {selected_graphdata : props.selected_graphdata, transform : props.transform, graph : null, lane : null, parent : null, toolbar : null};
    this.GraphRef = React.createRef()

  }
  

  componentDidMount(prevProps){

    console.log(this.props)

if (this.state.selected_graphdata != null && this.state.selected_graphdata != {}){
  this.setupNewGraph(this.props.selected_graphdata, this.props.selected, this.props.allow_editing);
}
}

  componentDidUpdate(prevProps){

    console.log(this.props)

    if(this.props.selected_graphdata != prevProps.selected_graphdata || this.props.allow_editing != prevProps.allow_editing){
      
      if(this.props.selected_graphdata != null){
        this.setupNewGraph(this.props.selected_graphdata, this.props.selected, this.props.allow_editing);
      }
      return
    
    }    
  }

  initToolbar(graph, selected) {
    
    var tbContainer = ReactDOM.findDOMNode(this.props.toolbarRef.current);

    tbContainer.innerHTML = ""

    // Creates new toolbar without event processing
    var toolbar = new mxToolbar(tbContainer);
    toolbar.enabled = false;
  
    // Workaround for Internet Explorer ignoring certain styles
    if (mxClient.IS_QUIRKS) {
      document.body.style.overflow = "hidden";
      new mxDivResizer(tbContainer);
    }
  
    mxEdgeHandler.prototype.addEnabled = true;
    // Allow multiple edges between two vertices
    graph.setMultigraph(true);
  
    // Stops editing on enter or escape keypress
    configureKeyBindings(graph, selected, this.props.exportGraph);

    var rubberband = new mxRubberband(graph);
  
    var addDropper = function(icon, w, h, style, value = null) {
      var vertex = new mxCell("", new mxGeometry(0, 0, w, h), style);
 
      vertex.setVertex(true);
  
      var img = addToolbarItem(graph, toolbar, vertex, icon, value);
      img.enabled = true;
  
      graph.getSelectionModel().addListener(mxEvent.CHANGE, function() {
        var tmp = graph.isSelectionEmpty();
        mxUtils.setOpacity(img, tmp ? 100 : 20);
        img.enabled = tmp;
      });
  
    };

    var addPainter = function(icon, w, h, style, value = null) {
      var vertex = new mxCell("", new mxGeometry(0, 0, w, h), style);
 
      vertex.setVertex(true);

      var funct = function(){
        alert("beans");
      };
  
      var img = addToolbarItem(graph, toolbar, vertex, icon, value, funct);
      img.enabled = true;
  
      graph.getSelectionModel().addListener(mxEvent.CHANGE, function() {
        var tmp = !graph.isSelectionEmpty();
        mxUtils.setOpacity(img, tmp ? 100 : 20);
        img.enabled = tmp;
      });
  
    };
  
    var baseStyle = { ...graph.getStylesheet().getDefaultVertexStyle() };
  
    addDropper(
      "images/rectangle.gif", 
      100,
      40,
      '!toolbar!'
    );

    // addPainter(
    //   "images/rectangle.gif", 
    //   100,
    //   40,
    //   '!toolbar!'
    // );

  
    return toolbar
  
  }

  setupNewGraph(selected_graphdata, selected, allow_editing) {

    if(this.state.graph){
      this.state.graph.destroy();
    }
    
    var graph, lane, parent, dict, edgedict;


    console.log(selected_graphdata);
    console.log(selected);
    console.log(allow_editing);

    [graph, lane, parent, dict, edgedict] = this.LoadGraph(selected_graphdata, selected, allow_editing);
    
    graph.foldingEnabled = false;
    graph.recursiveResize = true;
  
    this.executeLayout(graph, lane, parent);
    
    if(allow_editing){
      
      this.initToolbar(graph, selected);
      
      // Updates the display
      graph.getModel().endUpdate();
      graph.getModel().addListener(mxEvent.CHANGE, this.onChange.bind(this));
      graph.getSelectionModel().addListener(mxEvent.CHANGE, this.onSelected.bind(this));
      
    }



  //   // Helper method to mark parts with constituent=1 in the style
  //   graph.isPart = function(cell)
  //   {
  //     return this.getCurrentCellStyle(cell)['constituent'] == '1';
  //   };
    
  //   // Redirects selection to parent
  //   graph.selectCellForEvent = function(cell)
  //   {
  //     if (this.isPart(cell))
  //     {
  //       cell = this.model.getParent(cell);
  //     }
      
  //     mxGraph.prototype.selectCellForEvent.apply(this, arguments);
  //   };

  // // try {
        
  //   graph.getModel().beginUpdate();

  //   // var overlay = new mx.mxCellOverlay(new mx.mxImage("https://www.vhv.rs/file/max/18/186017_gray-rectangle-png.png", 10, 10), "Reduction");
  //   // graph.addCellOverlay(edgedict['EV_[1...d]']['SETBIT_[d+1]'], overlay);
  //   // overlay.addListener(mxEvent.CLICK, function(sender, evt)
  //   // {
  //   //   var cell = evt.getProperty('cell');
  //   //   graph.setSelectionCell(cell);
  //   // });



  //   var redcell = new mx.mxCell("test", new mx.mxPolyline([new mx.mxPoint(0,0), new mx.mxPoint(0,1)]))
    
  //   // mxUtils.setCellStyles(graph.getModel(), [dict['EV_[1...d]'], edgedict['EV_[1...d]']['SETBIT_[d+1]']], 'opacity', 20);
    
  //   var red = graph.insertVertex(graph.getDefaultParent(), null, "", 0, 0, 100, 100);
    
  //   red.style = 'fillColor=gray;strokeColor=none;fontSize=none;opacity=50;constituent=1';   
    
  //   red.setConnectable(false)
    
  //   graph.getModel().add(red, dict['EV_[1...d]'])
    

  // }finally{

  //   graph.getModel().endUpdate();

  // }




    if(allow_editing){
    graph.doResizeContainer(window.innerWidth, window.innerHeight)

    
    var margin = 250;
    var max = 1;
    
    var bounds = graph.getGraphBounds();
    var cw = graph.container.clientWidth - margin;
    var ch = graph.container.clientHeight - margin;
    var w = bounds.width / graph.view.scale;
    var h = bounds.height / graph.view.scale;
    var s = Math.min(max, Math.min(cw / w, ch / h));
    
    graph.view.scaleAndTranslate(s,
      (margin + cw - w * s) / (2 * s) - bounds.x / graph.view.scale,
      (margin + ch - h * s) / (2 * s) - bounds.y / graph.view.scale);
      
    graph.swimlaneSelectionEnabled = false
    
  }else{
    graph.fit()
  }

  

  graph.refresh()
    this.setState({graph : graph, lane : lane, parent : parent})
      
  }
      
  LoadGraph(selected_graphdata, selected, allow_editing){
    
    if (selected_graphdata){

    var container = ReactDOM.findDOMNode(this.GraphRef.current);

    // var wnd = new mx.mxWindow('Title', container, 100, 100, 200, 200, true, true);
    // wnd.setVisible(true);

    // Checks if the browser is supported
    if (!mx.mxClient.isBrowserSupported()) {
      // Displays an error message if the browser is not supported.
      mx.mxUtils.error("Browser is not supported!", 200, false);
    } else {
      // Disables the built-in context menu
      mx.mxEvent.disableContextMenu(container);

      // Creates the graph inside the given container
      var graph = new mx.mxGraph(container);    

      graph.graphHandler.scaleGrid = true;
      
      // Gets the default parent for inserting new cells. This is normally the first
      // child of the root (ie. layer 0).
      var parent = graph.getDefaultParent();

      // Enables tooltips, new connections and panning
      // Enables new connections in the graph
      graph.setPanning(true);
      graph.setTooltips(true);
      graph.setConnectable(true);
      graph.setEnabled(true);
      graph.setEdgeLabelsMovable(false);
      graph.setVertexLabelsMovable(false);
      graph.setGridEnabled(true);
      graph.setAllowDanglingEdges(false);
      graph.setDisconnectOnMove(false);

      var style = [];
      style[mx.mxConstants.STYLE_SHAPE] = mx.mxConstants.SHAPE_SWIMLANE;
      style[mx.mxConstants.STYLE_PERIMETER] = mx.mxPerimeter.RectanglePerimeter;
      style[mx.mxConstants.STYLE_STROKECOLOR] = 'none';
      style[mx.mxConstants.STYLE_FONTCOLOR] = '#606060';
      style[mx.mxConstants.STYLE_FILLCOLOR] = 'none';
      style[mx.mxConstants.STYLE_GRADIENTCOLOR] = 'white';
      style[mx.mxConstants.STYLE_STARTSIZE] = 30;
      style[mx.mxConstants.STYLE_ROUNDED] = false;
      style[mx.mxConstants.STYLE_FONTSIZE] = 12;
      style[mx.mxConstants.STYLE_FONTSTYLE] = 0;
      style[mx.mxConstants.STYLE_HORIZONTAL] = false;
      // To improve text quality for vertical labels in some old IE versions...
      style[mx.mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = '#efefef';
      graph.getStylesheet().putCellStyle('swimlane', style);
    
      // styling
      var style = graph.getStylesheet().getDefaultVertexStyle();
      style[mx.mxConstants.STYLE_STROKECOLOR] = 'gray';
      style[mx.mxConstants.STYLE_STROKE] = 'gray';
      style[mx.mxConstants.STYLE_ROUNDED] = true;
      style[mx.mxConstants.STYLE_FILLCOLOR] = 'white';
      style[mx.mxConstants.STYLE_FONTCOLOR] = 'black';
      style[mx.mxConstants.STYLE_FONTSIZE] = '12';
      style[mx.mxConstants.STYLE_SPACING] = 4;

      // edge style
      style = graph.getStylesheet().getDefaultEdgeStyle();
      style[mx.mxConstants.STYLE_STROKECOLOR] = '#0C0C0C';
      style[mx.mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = 'white';
      style[mx.mxConstants.STYLE_ROUNDED] = true;
      style[mx.mxConstants.STYLE_FONTCOLOR] = 'black';
      style[mx.mxConstants.STYLE_FONTSIZE] = '10';
      style[mx.mxConstants.STYLE_STROKEWIDTH] = '1.25';
      style[mx.mxConstants.STYLE_EDGE] = mx.mxEdgeStyle.ElbowConnector;

        // run through each element in json        
      
        // HAVE TO ADD 2 ? ?? ?? ?? ? ? var adv = graph.insertVertex(parent, null, "ADV", 40, 40, 80, 30);         
        


          try {
        
            graph.getModel().beginUpdate();
            
            var lane = graph.insertVertex(parent, null, selected, 0, 0, 1000, 500, 'swimlane');

            lane.setConnectable(false);

          var dict = {};

          if(!selected_graphdata.graph.hasOwnProperty("Adv_pkg")){
            selected_graphdata.graph.Adv_pkg = [];
          }

          if(!selected_graphdata.graph.hasOwnProperty("terminal_pkg")){
            selected_graphdata.graph.terminal_pkg = [];
          }

          for (var element in selected_graphdata.graph){
         
            if(element == 'Adv_pkg' || element == 'terminal_pkg'){
              var graphElement = graph.insertVertex(lane, null, element, 20, 20, 10, 200);    
              graphElement.style = 'fillColor=none;strokeColor=none;fontSize=none;';        
              
            }else{
              var graphElement = graph.insertVertex(lane, null, element, 20, 20, 80, 50);            
              
            }

            
              
            dict[element] = graphElement;

            }

            var edgedict = {}
          
              for(var oracle in selected_graphdata.oracles){
              
                var edge_element = graph.insertEdge(lane, null, selected_graphdata.oracles[oracle][1], dict['Adv_pkg'] ,dict[selected_graphdata.oracles[oracle][0]]);
              
                if(!edgedict.hasOwnProperty('Adv_pkg')){
                  edgedict['Adv_pkg'] = {}
                }

                if(edgedict['Adv_pkg'].hasOwnProperty(selected_graphdata.oracles[oracle][1])){
                  alert("Multiple similarly named oracles?")
                }

                edgedict['Adv_pkg'][selected_graphdata.oracles[oracle][1]] = edge_element

              }

              for(var element in selected_graphdata.graph){
              if (selected_graphdata.graph[element].length > 0){

                for(var edge in selected_graphdata.graph[element]){
                  if(selected_graphdata.graph[element][edge][0] == ""){
                    var edge_element = graph.insertEdge(lane, null,selected_graphdata.graph[element][edge][1], dict[element] ,dict['terminal_pkg']);
                    
                  }else{
                    var edge_element = graph.insertEdge(lane, null,selected_graphdata.graph[element][edge][1], dict[element] ,dict[selected_graphdata.graph[element][edge][0]]);

                  }
                }

                if(!edgedict.hasOwnProperty(element)){
                  edgedict[element] = {}
                }

                if(edgedict[element].hasOwnProperty(selected_graphdata.graph[element][edge][1])){
                  alert("Multiple similarly named edges from one package!")
                }

                console.log(element)
                console.log(selected_graphdata.graph[element][edge][1])


                edgedict[element][selected_graphdata.graph[element][edge][1]] = edge_element

              }

              }

        //data
      } finally {
        // Updates the display
        graph.getModel().endUpdate();

      }
      
				graph.popupMenuHandler.autoExpand = true;
        
        if(allow_editing){
			    // Installs context menu
				graph.popupMenuHandler.factoryMethod = function(menu, cell, evt)
				{
					if(cell != null){
					if(cell.hasOwnProperty("vertex")) {
            if(cell.vertex){
              var transform_submenu = menu.addItem('Apply Transformation', null, null);
              var copy_graph = menu.addItem('Copy Graph', null, this.copyGraph.bind(this));
              var extract_graph_to_project = menu.addItem('Extract graph', null, this.extractGraph.bind(this));

              menu.addItem('Expand', null, function()
				    {
              this.props.triggerTransformationProp('expand', cell.value);
				    }.bind(this), transform_submenu);
					menu.addItem('Decompose', null, function()
				    {
              this.props.triggerTransformationProp('decompose', cell.value);
            }.bind(this), transform_submenu);
          menu.addItem('Equivalence', null, function()
				    {
              this.props.triggerTransformationProp('equiv', cell.value);
            }.bind(this), transform_submenu);
        }}}}.bind(this);

        }

      return [graph, lane, parent, dict, edgedict];

    }


    }

  }

  copyGraph(arg1){

    console.log(arg1)
    var graphdata = selectedCellsToGraphData(this.state.graph.getSelectionModel())

    navigator.clipboard.writeText(JSON.stringify(graphdata, null, '\t'))

  }


  extractGraph(arg1){

    console.log(this.state.graph.getSelectionModel())

    var graphdata = selectedCellsToGraphData(this.state.graph.getSelectionModel())

    var graphname = window.prompt("Please enter a name for the graph:", "Graph name");

    if(this.state.transform){
      if(!window.confirm("This will overwrite the current transformation, are you sure you want to continue?")){
        return 
      }
    }

    this.props.update(graphdata, true, graphname)
    
  }

  executeLayout(graph, lane, parent){

    if(graph !== null){

      var layout = new mx.mxSwimlaneLayout(graph);
    
      // Executes the layout
      layout.orientation = mx.mxConstants.DIRECTION_WEST;

      layout.resizeParent = true;

      layout.moveParent = true;

      layout.parallelEdgeSpacing = 10

      layout.maintainParentLocation = true;

      layout.parentBorder = 100

    // layout.execute(parent, dict['Adv']);

    // // Translates graph down y axis 10 so it's not cut off! 
    // graph.getView().setTranslate(0,10);

      layout.execute(lane, lane.children)   
                 
      layout.execute(parent, parent.children);    

      // Swimlanes layout very well apart from the overlapping edges,
      // Solved below. 

      var cellContent

      var cells = graph.getModel().cells

      var terminal_id;
      var adv_id;
      
      for(var id in cells){

        if(cells[id].value == 'Adv_pkg'){
          
          adv_id = id
          
        }

        if(cells[id].value == 'terminal_pkg'){
          
          terminal_id = id
          
        }

      }

      var source_id;
      var target_id;

      console.log(cells)

      var sources = {}

      for(var cell in cells){
        
        cellContent = cells[cell]

        console.log(cellContent)
        
        if(cellContent.edge){

          if(!sources.hasOwnProperty(cellContent.source.id)){

            sources[cellContent.source.id] = {}

          }

          if(cellContent.target == null){
            target_id = terminal_id
          }else{
            target_id = cellContent.target.id
          }

          if(cellContent.source == null){
            source_id = adv_id
          }else{
            source_id = cellContent.source.id
          }

          if(!sources[source_id].hasOwnProperty(target_id)){

            sources[source_id][target_id] = []

          }

          sources[source_id][target_id].push(cellContent.id)

        }

        console.log("Pass")
        
      }

      var incr;
      var mult;

      var base_x;
      var base_y;


      for(var source in sources){
    
        for(var target in sources[source]){

          if(sources[source][target].length > 1){
            
            
            base_x = (cells[source].geometry.x + cells[target].geometry.x) / 2 + (cells[source].geometry.width)/2 
            base_y = cells[target].geometry.y  
            
            incr = cells[target].geometry.height / sources[source][target].length
            
            mult = 0.5
                        
            for(var edge in sources[source][target]){
              
              // cells[sources[source][target][edge]].geometry.y += mult * source_y - cells[source].geometry.height/2
              
              if(cells[sources[source][target][edge]].geometry.points.length === 0){

                cells[sources[source][target][edge]].geometry.points.push(new mxPoint(base_x,base_y + incr*mult))

              }

              mult += 1
              
            }
            
          }
          
        }

          
      }

      graph.refresh()

      console.log(graph.getModel())
        
      }
  }

  onChange(model, e){

    console.log(model)
    console.log(e)

    // var outgoing_edges = {}
    // var thecell;

    // var new_graph = {"graph" : {}, "oracles" : []}

    // var cells

    // console.log(model.cells)

    // var newthing = false

    // for(var id in model.cells){

    //   thecell = model.cells[id]

    //   if(thecell.value === "!New_Package!" || (thecell.value !== "" && thecell.vertex === true)){

    //     newthing = true

    //   }

    // }

    // if(!newthing){
    //   return
    // }

    // for(var id in model.cells){

    //   thecell = model.cells[id]

    //   if(thecell.value === "!New_Package!"){
    //     model.beginUpdate();
    //     try
    //     {
    //       var new_name = window.prompt("Please enter a new name for the package:","New package")

    //       if(new_name === null){
    //         throw "Cancelled"
    //       }

    //       thecell.value = new_name

    //     }catch(e){
    //       return 
    //     }
    //     finally
    //     {
    //       model.endUpdate();
    //     } 
                
    //   }
    //   // console.log(thecell)

    //   if(thecell.style !== "swimlane"){

        
    //     if(thecell.value !== "" && thecell.vertex === true){


    //       if(new_graph.hasOwnProperty(thecell.value)){
    //         alert(thecell.value + " appears multiple times!")
    //         return
    //       }
          
    //       new_graph.graph[thecell.value] = []

    //       cells = model.getOutgoingEdges(thecell)

    //       for(var edge in cells){

    //         if(cells[edge].value === null || cells[edge].value === ""){
    //           model.beginUpdate();
    //           try
    //           {
    //             var new_name = window.prompt("Please enter a new name for the edge:","New edge")
      
    //             if(new_name === null){
    //               throw "Cancelled"
    //             }
      
    //             cells[edge].value = new_name
      
    //           }catch(e){
    //             return 
    //           }
    //           finally
    //           {
    //             model.endUpdate();
    //           }             
    //         }

    //         console.log(cells[edge])

    //         var check1 = cells[edge].target

    //         new_graph.graph[thecell.value].push([cells[edge].target.value,cells[edge].value])

    //       }


    //     }else if (thecell.vertex === true) {

    //       if(new_graph.oracles.length !== 0){
    //         // wont work for subgraphs with terminal edges
    //         return
    //       }

    //       cells = model.getOutgoingEdges(thecell)

    //       for(var edge in cells){

    //         if(cells[edge].value === null || cells[edge].value === ""){
    //           model.beginUpdate();
    //           try
    //           {
    //             var new_name = window.prompt("Please enter a new name for the package:","New edge")
      
    //             if(new_name === null){
    //               throw "Cancelled"
    //             }
      
    //             cells[edge].value = new_name
      
    //           }catch(e){
    //             return 
    //           }
    //           finally
    //           {
    //             model.endUpdate();
    //           }             
    //         }

    //         new_graph.oracles.push([cells[edge].target.value,cells[edge].value])

    //       }
    //     }

    //   }
    // }

    // console.log(new_graph)

    // this.props.update(new_graph)

  }

  onSelected(){
    console.log("onSelected")
    this.state.graph.container.focus()
  }

  onElementAdd(a,b,c,d){
    console.log(a)
    console.log(b)
    console.log(c)
    console.log(d)

    console.log("onElementAdd")
  }

  onDragEnd(){
    console.log("onDragEnd")
  }



  render() {
  
      return (
        
        <div className="graphview-container">
      <div ref={this.GraphRef} style={{height : "100%", width : "100%"}} className="graph-container" id="divGraph" />
      </div>
      );
   
}

}