import React, { cloneElement, Component } from "react";

import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex'


import "react-reflex/styles.css";

import { MathJax, MathJaxContext } from "better-react-mathjax";

import SortableTree from '@nosferatu500/react-sortable-tree';
import '@nosferatu500/react-sortable-tree/style.css'; // This only needs to be imported once in your app

import GraphView from "./GraphView";
import Packages from "./Packages";
import Latex from "./Latex";

export default class Builder extends Component {
  constructor(props) {
    super(props);
    this.state = {graphdata : null, modular_pkgs : null, selected : null};    
  }


  expandGraph(cell) {
    
    if (cell != null){
      if (cell.value.split("_{").length == 2){
        
        
        if (Object.keys(this.state.graphdata.modular_pkgs[this.state.selected].graph).filter(node => cell.value.split("_{")[0] == node.split("_{")[0]).length == 1){
          

          this.state.modular_pkgs.forEach((element) => {
            if (element.graphname == this.state.selected){

              var expandedgraphdata = this.state.graphdata 

              expandedgraphdata.modular_pkgs[this.state.selected + " - Expanded on " + cell.value] = expandedgraphdata.modular_pkgs[this.state.selected]
              
              this.setState({graphdata : expandedgraphdata}, () => {
                element.children.push({title : "$$" + this.state.selected + " - Expanded on " + cell.value + "$$", graphname : this.state.selected + " - Expanded on " + cell.value,children : []});
              })

            }
          });
          
          
          return
        }

      }
  
    }
    alert("Not expandable");
    }
    
  


  onChange(event) {
    var file = event.target.files[0];
    var reader = new FileReader();
    reader.onload = (event) => {
      // The file's text will be printed here
      
    try {
        var json_data = JSON.parse(event.target.result);
    } catch (e) {
        alert("Please enter a JSON file");
        return;
    }
    
    this.setState({ graphdata: json_data }, function(){
      this.createSelectItems();
    });
    
    };
  
    reader.readAsText(file);
  }

  createSelectItems() {
    let items = [];         
    var i = 0;
    for (var graphname in this.state.graphdata.modular_pkgs) {   
         items.push({title : '$$' + graphname + '$$', graphname : graphname, children : []});   
         i++;
         //here I will be creating my options dynamically based on
         //what props are currently passed to the parent component

    }
    
    this.setState({modular_pkgs : items, selected : items[0].graphname})

}  

  render() {

    return (      
      <ReflexContainer className="site-content" orientation="vertical">

      <ReflexElement className="video-panels" flex={0.20} minSize="100">
      <ReflexContainer orientation="horizontal">
      <ReflexElement flex={0.2} minSize="100">

      <form>
  <label>
    Graph input:
    <input type="file" onChange={this.onChange.bind(this)} name="graph_file" />
  </label>
  <input type="submit" value="Reset" />
</form>
</ReflexElement>
<ReflexSplitter/>
<ReflexElement flex={0.6} minSize="100"> 
<SortableTree
          treeData={this.state.modular_pkgs}
          onChange={treeData => this.setState({ modular_pkgs : treeData })}
          generateNodeProps={rowInfo => ({
            buttons: [<button onClick={(event) => this.setState({selected : rowInfo.node.graphname})}>Select</button>]
        })} 
        />
</ReflexElement>
</ReflexContainer>
  </ReflexElement>
  <ReflexSplitter />
        <ReflexElement className="workboard" minSize="50">
          <GraphView expand={this.expandGraph.bind(this)} selected={this.state.selected} graphdata={this.state.graphdata}/>
        </ReflexElement>
        <ReflexSplitter />
        <ReflexElement className="video-panels" flex={0.15} minSize="100">
<Packages graphdata={this.state.graphdata}/>        
</ReflexElement>
        
      </ReflexContainer>


    );
  }
}


