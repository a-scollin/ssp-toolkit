import React, { Component } from "react";

import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex'


import "react-reflex/styles.css";


import GraphView from "./GraphView";
import Packages from "./Packages";

export default class Builder extends Component {
  constructor(props) {
    super(props);
    this.state = {graphdata : null, modular_pkgs : null, selected : null};    
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
         items.push(<option key= {i} value={graphname}>{graphname}</option>);   
         i++;
         //here I will be creating my options dynamically based on
         //what props are currently passed to the parent component

    }
    
    this.setState({modular_pkgs : items, selected : items[0].props.value})

}  

  render() {

    return (      
      <ReflexContainer className="site-content" orientation="vertical">
      
      <ReflexElement className="video-panels" flex={0.15} minSize="100">
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
<ReflexElement flex={0.2} minSize="100">
<select onChange={(e) => this.setState({selected : e.target.value})} label="Select" multiple>
       {this.state.modular_pkgs}
  </select>
</ReflexElement>
</ReflexContainer>
  </ReflexElement>
  <ReflexSplitter />
        <ReflexElement className="workboard" minSize="50">
          <GraphView selected={this.state.selected} graphdata={this.state.graphdata}/>
        </ReflexElement>
        <ReflexSplitter />
        <ReflexElement className="video-panels" flex={0.15} minSize="100">
<Packages/>        
</ReflexElement>
        
      </ReflexContainer>

    );
  }
}


