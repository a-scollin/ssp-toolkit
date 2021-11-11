
import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import Moveable from "react-moveable";
import 'react-reflex/styles.css'
import { black } from "ansi-colors";

var mx = require("mxgraph")({
  mxImageBasePath: "./mxgraph/javascript/src/images",
  mxBasePath: "./mxgraph/javascript/src"
})

export default class GraphView extends Component {
  constructor(props) {
    super(props);
    this.state = {graphdata : props.graphdata, selected : props.selected, displayed : null};
    this.GraphRef = React.createRef()
  }
  


  componentDidUpdate(prevProps){
    
    if(this.props.graphdata != prevProps.graphdata || this.props.selected != prevProps.selected){
      console.log(this.props)
    
      this.setState({graphdata : this.props.graphdata, selected : this.props.selected},() => {
        this.LoadGraph(this.props.selected);
      });
      
    }
  }

  LoadGraph(selected) {

    // Clear last graph
    if(this.state.displayed) {
      this.state.displayed.destroy();
    }

    if (this.state.graphdata){


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

      var editor = new mx.mxEditor(container);

      // Creates the graph inside the given container
      var graph = new mx.mxGraph(container);

      // Gets the default parent for inserting new cells. This is normally the first
      // child of the root (ie. layer 0).
      var parent = graph.getDefaultParent();


      // Enables tooltips, new connections and panning
      graph.setPanning(true);
      graph.setTooltips(false);
      graph.setConnectable(false);
      graph.setEnabled(true);
      graph.setEdgeLabelsMovable(false);
      graph.setVertexLabelsMovable(true);
      graph.setGridEnabled(false);
      graph.setAllowDanglingEdges(false);
      graph.setDisconnectOnMove(false);

    
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

        if (this.state.graphdata.hasOwnProperty("modular_pkgs")){          
        
        
          try {
        
            graph.getModel().beginUpdate();
    

          var dict = {};

          if(!this.state.graphdata.modular_pkgs[selected].graph.hasOwnProperty("Adv")){
            this.state.graphdata.modular_pkgs[selected].graph.Adv = [];
          }

          for (var element in this.state.graphdata.modular_pkgs[selected].graph){
         
            if(element == 'Adv'){
              var graphElement = graph.insertVertex(parent, null, "", 20, 20, 10, 200);    
              graphElement.style = 'fillColor=none;strokeColor=none;';        
            }else{
              var graphElement = graph.insertVertex(parent, null, element, 20, 20, 80, 50);            
            }

            
              
            dict[element] = graphElement;

            }
          
              for(var oracle in this.state.graphdata.modular_pkgs[selected].oracles){
              
                graph.insertEdge(parent, null,this.state.graphdata.modular_pkgs[selected].oracles[oracle][1], dict['Adv'] ,dict[this.state.graphdata.modular_pkgs[selected].oracles[oracle][0]]);
              
              }

              for(var element in this.state.graphdata.modular_pkgs[selected].graph){
              if (this.state.graphdata.modular_pkgs[selected].graph[element].length > 0){

                for(var edge in this.state.graphdata.modular_pkgs[selected].graph[element]){
                  graph.insertEdge(parent, null,this.state.graphdata.modular_pkgs[selected].graph[element][edge][1], dict[element] ,dict[this.state.graphdata.modular_pkgs[selected].graph[element][edge][0]]);
                }
              }

              }

        //data
      } finally {
        // Updates the display
        graph.getModel().endUpdate();

      }

        // Creates a layout algorithm to be used with the graph
        var layout = new mx.mxHierarchicalLayout(graph, mx.mxConstants.DIRECTION_WEST);

        layout.intraCellSpacing=60;
        layout.interRankCellSpacing=150;
        layout.parallelEdgeSpacing=40;
        // Moves stuff wider apart than usual
        layout.forceConstant = 500;
        layout.execute(parent, dict['Adv']);
       
        var highest_y = 10;
        var lowest_y = 10;

        graph.getModel().getChildVertices(parent).forEach(function (item, index) {
          if(item.geometry.y > highest_y){
            highest_y = item.geometry.y
          }
          if(item.geometry.y < lowest_y){
            lowest_y = item.geometry.y
          }
        });

        dict['Adv'].getGeometry().height = highest_y - lowest_y

        layout.execute(parent, dict['Adv']);

        // Translates graph down y axis 10 so it's not cut off! 
        graph.getView().setTranslate(0,10);

				// Configures automatic expand on mouseover
				graph.popupMenuHandler.autoExpand = true;
        
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
						alert('Decompose');
				    }, transform_submenu);
          menu.addItem('Compose', null, function()
				    {
						alert('Compose');
				    }, transform_submenu);
        }}}}.bind(this);

        this.setState({displayed : graph})


        // No windows seem to be working
        // var encoder = new mx.mxCodec();
        // var node = encoder.encode(graph.getModel());
        // mx.mxUtils.popup(mx.mxUtils.getPrettyXml(node), true);
                
       
        
          }


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