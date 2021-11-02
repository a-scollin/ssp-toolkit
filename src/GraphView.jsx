
import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import {
  mxGraph,
  mxWindow,
  mxHierarchicalLayout,
  mxClient,
  mxUtils,
  mxEvent,
  mxConstants,
  mxEdgeStyle
} from "mxgraph-js";

import 'react-reflex/styles.css'

import { black } from "ansi-colors";

export default class GraphView extends Component {
  constructor(props) {
    super(props);
    this.state = {graphdata : props.graphdata};
    this.GraphRef = React.createRef()

  }

  componentDidUpdate(prevProps){
    if(this.props.graphdata != prevProps.graphdata){
      this.setState({graphdata : this.props.graphdata},function() {
        this.LoadGraph();
      });
      
    }
  }

  LoadGraph() {

    if (this.state.graphdata){

    var container = ReactDOM.findDOMNode(this.GraphRef.current);

    // Checks if the browser is supported
    if (!mxClient.isBrowserSupported()) {
      // Displays an error message if the browser is not supported.
      mxUtils.error("Browser is not supported!", 200, false);
    } else {
      // Disables the built-in context menu
      mxEvent.disableContextMenu(container);

      // Creates the graph inside the given container
      var graph = new mxGraph(container);

      // Gets the default parent for inserting new cells. This is normally the first
      // child of the root (ie. layer 0).
      var parent = graph.getDefaultParent();

      // // Enables tooltips, new connections and panning
      // graph.setPanning(true);
      // graph.setTooltips(false);
      // graph.setConnectable(false);
      // graph.setEnabled(false);
      // graph.setEdgeLabelsMovable(false);
      // graph.setVertexLabelsMovable(false);
      // graph.setGridEnabled(false);
      // graph.setAllowDanglingEdges(false);

    
      // styling
      var style = graph.getStylesheet().getDefaultVertexStyle();
      style[mxConstants.STYLE_STROKECOLOR] = 'gray';
      style[mxConstants.STYLE_STROKE] = 'gray';
      style[mxConstants.STYLE_ROUNDED] = true;
      style[mxConstants.STYLE_FILLCOLOR] = 'white';
      style[mxConstants.STYLE_FONTCOLOR] = 'black';
      style[mxConstants.STYLE_FONTSIZE] = '12';
      style[mxConstants.STYLE_SPACING] = 4;

      // edge style
      style = graph.getStylesheet().getDefaultEdgeStyle();
      style[mxConstants.STYLE_STROKECOLOR] = '#0C0C0C';
      style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = 'white';
      style[mxConstants.STYLE_ROUNDED] = true;
      style[mxConstants.STYLE_FONTCOLOR] = 'black';
      style[mxConstants.STYLE_FONTSIZE] = '10';
      style[mxConstants.STYLE_STROKEWIDTH] = '1.25';
      style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;



      try {
        
        graph.getModel().beginUpdate();


        var dict = {};
        // run through each element in json        
      
        // HAVE TO ADD 2 ? ?? ?? ?? ? ? var adv = graph.insertVertex(parent, null, "ADV", 40, 40, 80, 30); 

        if (this.state.graphdata.hasOwnProperty("modular_pkgs")){          
        for(var parsedgraph in this.state.graphdata.modular_pkgs){
          var first = true;
          for (var element in this.state.graphdata.modular_pkgs[parsedgraph].graph){
         
            var graphElement = graph.insertVertex(parent, null, element, 20, 20, 80, 30);            
              
            dict[element] = graphElement;

            }
          
              for(var oracle in this.state.graphdata.modular_pkgs[parsedgraph].oracles){
              
                graph.insertEdge(parent, null,this.state.graphdata.modular_pkgs[parsedgraph].oracles[oracle][1], dict['Adv'] ,dict[this.state.graphdata.modular_pkgs[parsedgraph].oracles[oracle][0]]);
              
              }

              for(var element in this.state.graphdata.modular_pkgs[parsedgraph].graph){
              if (this.state.graphdata.modular_pkgs[parsedgraph].graph[element].length > 0){

                for(var edge in this.state.graphdata.modular_pkgs[parsedgraph].graph[element]){
                  graph.insertEdge(parent, null,this.state.graphdata.modular_pkgs[parsedgraph].graph[element][edge][1], dict[element] ,dict[this.state.graphdata.modular_pkgs[parsedgraph].graph[element][edge][0]]);
                }
              }

              }

            break;

          }         


          }

        //data
      } finally {
        // Updates the display
        graph.getModel().endUpdate();

        // Creates a layout algorithm to be used with the graph
        var layout = new mxHierarchicalLayout(graph, mxConstants.DIRECTION_WEST);

        layout.intraCellSpacing=50;
        layout.interRankCellSpacing=100;

        // Moves stuff wider apart than usual
        layout.forceConstant = 500;
        if (dict.hasOwnProperty("Adv")) {
            layout.execute(parent, dict['Adv']);
        }
      
       
      }

      return(<div ref={this.GraphRef} className="graph-container" id="divGraph" />);

    }


    }
  }
  render() {
  
      return (<div ref={this.GraphRef} className="graph-container" id="divGraph" />);
   
}

}