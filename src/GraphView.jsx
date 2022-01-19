
import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import Moveable from "react-moveable";
import 'react-reflex/styles.css'
import { black } from "ansi-colors";
import { AbstractMmlLayoutNode } from "mathjax-full/js/core/MmlTree/MmlNode";


var mx = require("mxgraph")({
  mxImageBasePath: "./mxgraph/javascript/src/images",
  mxBasePath: "./mxgraph/javascript/src"
})

export default class GraphView extends Component {
  constructor(props) {
    super(props);
    this.state = {selected_graphdata : props.selected_graphdata, transform : props.transform, displayed : null};
    this.GraphRef = React.createRef()
  
  }
  

  componentDidMount(prevProps){


if (this.state.selected_graphdata != null && this.state.selected_graphdata != {}){
  this.LoadGraph()
}
  }

  componentDidUpdate(prevProps){



    if(this.props.selected_graphdata != prevProps.selected_graphdata || this.props.selected != prevProps.selected){
      this.setState({selected_graphdata : this.props.selected_graphdata},() => {
        this.LoadGraph();
      });
    }
     
  }

  LoadGraph() {

    

    // Clear last graph
    if(this.state.displayed) {
      this.state.displayed.destroy();
    }

    if (this.state.selected_graphdata){



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

      

      // Gets the default parent for inserting new cells. This is normally the first
      // child of the root (ie. layer 0).
      var parent = graph.getDefaultParent();

    
      // Enables tooltips, new connections and panning
      graph.setPanning(false);
      graph.setTooltips(false);
      graph.setConnectable(false);
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
            
            var lane1 = graph.insertVertex(parent, null, this.state.selected, 0, 0, 1000, 500, 'swimlane');

            lane1.setConnectable(false);

          var dict = {};

          if(!this.state.selected_graphdata.graph.hasOwnProperty("Adv_pkg")){
            this.state.selected_graphdata.graph.Adv_pkg = [];
          }

          for (var element in this.state.selected_graphdata.graph){
         
            if(element == 'Adv_pkg' || element == 'terminal_pkg'){
              var graphElement = graph.insertVertex(lane1, null, "", 20, 20, 10, 200);    
              graphElement.style = 'fillColor=none;strokeColor=none;';        
            }else{
              var graphElement = graph.insertVertex(lane1, null, element, 20, 20, 80, 50);            
            }

            
              
            dict[element] = graphElement;

            }
          
              for(var oracle in this.state.selected_graphdata.oracles){
              
                graph.insertEdge(parent, null,this.state.selected_graphdata.oracles[oracle][1], dict['Adv_pkg'] ,dict[this.state.selected_graphdata.oracles[oracle][0]]);
              
              }

              for(var element in this.state.selected_graphdata.graph){
              if (this.state.selected_graphdata.graph[element].length > 0){

                for(var edge in this.state.selected_graphdata.graph[element]){
                  if(this.state.selected_graphdata.graph[element][edge][0] == ""){
                    graph.insertEdge(parent, null,this.state.selected_graphdata.graph[element][edge][1], dict[element] ,dict['terminal_pkg']);
                    
                  }else{
                    graph.insertEdge(parent, null,this.state.selected_graphdata.graph[element][edge][1], dict[element] ,dict[this.state.selected_graphdata.graph[element][edge][0]]);

                  }
                }
              }

              }

        //data
      } finally {

        var layout = new mx.mxSwimlaneLayout(graph);
    
        // Executes the layout
        layout.orientation = mx.mxConstants.DIRECTION_WEST;

        layout.resizeParent = true;

        layout.moveParent = true;

        layout.parallelEdgeSpacing = 0

        layout.maintainParentLocation = true;

        

        layout.parentBorder = 100

      // layout.execute(parent, dict['Adv']);

      // // Translates graph down y axis 10 so it's not cut off! 
      // graph.getView().setTranslate(0,10);


        dict['Adv_pkg'].getGeometry().height = 700


        layout.execute(lane1, lane1.children)   
                   
        layout.execute(parent, parent.children);    
        // Updates the display
        graph.getModel().endUpdate();

      }
      


      // const oldConvertValueToString = graph.convertValueToString;
      // graph.convertValueToString = function(cell) {
      //   if (typeof cell.value === "object" && cell.value.style) {
      //     const div = document.createElement("div");
      //     div.innerHTML = div.title = cell.value.name;
      //     div.style = cell.value.style;
      //     return div;
      //   }
    
      //   return oldConvertValueToString.call(this, cell);
      // };

        // // Creates a layout algorithm to be used with the graph
        // var layout = new mx.mxHierarchicalLayout(graph, mx.mxConstants.DIRECTION_WEST);

        // layout.intraCellSpacing=80;
        // layout.interRankCellSpacing=170;
        // layout.parallelEdgeSpacing=50;
        // // Moves stuff wider apart than usual
        // layout.forceConstant = 500;

        // layout.execute(parent, dict['Adv']);
       
   

        // Translates graph down y axis 10 so it's not cut off! 
        // graph.getView().setTranslate(0,10);

				// Configures automatic expand on mouseover
				graph.popupMenuHandler.autoExpand = true;

        graph.fit()
        
			    // Installs context menu
				graph.popupMenuHandler.factoryMethod = function(menu, cell, evt)
				{
					if(cell != null){
					if(cell.hasOwnProperty("vertex")) {
            if(cell.vertex){
              var transform_submenu = menu.addItem('Apply Transformation', null, null);

              menu.addItem('Expand', null, function()
				    {
              this.props.expand(cell);
				    }.bind(this), transform_submenu);
					menu.addItem('Decompose', null, function()
				    {
              this.props.decompose(cell);
            }.bind(this), transform_submenu);
          menu.addItem('Equivalence', null, function()
				    {
              this.props.substitute(cell);
            }.bind(this), transform_submenu);
        }}}}.bind(this);

        this.setState({displayed : graph})


        // No windows seem to be working
        // var encoder = new mx.mxCodec();
        // var node = encoder.encode(graph.getModel());
        // mx.mxUtils.popup(mx.mxUtils.getPrettyXml(node), true);
                
       
        
        
      return;

    }


    }

  }



  render() {
  
      return (
        
        <div className="graphview-container">
      <div ref={this.GraphRef} className="graph-container" id="divGraph" />
      </div>
      );
   
}

}