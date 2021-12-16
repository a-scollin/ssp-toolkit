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
import { height } from "dom-helpers";

import TransformationTools from "./TransformationTools";
import { radioClasses } from "@mui/material";

const pako = require('pako');

export default class Builder extends Component {

  // Initalise the main component 

  constructor(props) {
    super(props);
    this.state = {graphdata : new Object(null), modular_pkgs : null, selected : null, transformation : {}};    
  }

  // Function to be passed to graph view for invoking an expansion 

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
                this.setState({transformation : {"selected" : this.state.selected + " - Expanded on " + cell.value, 
                "type" : "expand"}});
              })

            }
          });
          
          
          return
        }

      }
  
    }
    alert("Not expandable");
    }
    
    // Function to be passed to graph view for invoking an decomposition 

    decomposeGraph(cell){

      if (cell != null){
      
        if (cell.value.split("_{").length == 2){

          if (Object.keys(this.state.graphdata.modular_pkgs[this.state.selected].graph).filter(node => cell.value.split("_{")[0] == node.split("_{")[0]).length == 1){    

            this.state.modular_pkgs.forEach((element) => {

              if (element.graphname == this.state.selected){
          
                var expandedgraphdata = this.state.graphdata 
  
                expandedgraphdata.modular_pkgs[this.state.selected + " - Decomposed on " + cell.value] = expandedgraphdata.modular_pkgs[this.state.selected]
                
                this.setState({graphdata : expandedgraphdata}, () => {

                  console.log("RIGHTHERE")

                  element.children.push({title : "$$" + this.state.selected + " - Decomposed on " + cell.value + "$$", graphname : this.state.selected + " - Decomposed on " + cell.value,children : []});
              
                  this.setState({transformation : {'selected' : this.state.selected + " - Decomposed on " + cell.value, 'type' : "decompose", 'cell' : cell}});
              
                })
  
              }
            });
            
            
            return
          }
          
      return  

    }
  
  }

  alert("Cannot decompose!");
}

  // For parsing in the json or xml files 

  onChange(event) {

    
    var file = event.target.files[0];
    var reader = new FileReader();
    reader.onload = (event) => {
      // The file's text will be printed here
    if (file.name.split('.').pop().toLowerCase() == "json"){
    try {
        var json_data = JSON.parse(event.target.result);
    } catch (e) {
        alert("Please enter a valid JSON file");
        return;
    }
    
    this.setState({ graphdata: json_data }, function(){
      this.createSelectItems();
    });
    
    }else if (file.name.split('.').pop().toLowerCase() == "xml") {
      try {

        var XMLParser = require('react-xml-parser');
        var xml = new XMLParser().parseFromString(event.target.result);    // Assume xmlText contains the example XML

        json_data = this.resolve_xml_to_json(xml)
        console.log(json_data)
        
        

    } catch (e) {
        console.log(e)
        alert("Please enter a valid XML file");
        return;
    }
    
    }else {
      alert("Please enter a JSON or XML file.");
      return;
    }

    this.setState({ graphdata: json_data }, function(){
      this.createSelectItems();
    });

  }
  
    reader.readAsText(file);
  }

  // For resolving the 

  resolve_xml_to_json(xml){

    var json_data = {modular_pkgs : {}}

    for(var diagram in xml.children){
      json_data.modular_pkgs[xml.children[diagram].attributes.name] = this.resolve_diagram_to_json(xml.children[diagram].children[0].children[0].children)
    }

    return json_data
    
    
  }

  resolve_diagram_to_json(cells){
    
    var thegraph = {oracles : [], graph : {}}

    var packids = {}

    for(var cell in cells){

      var thecell = cells[cell]

      if (thecell.name != "mxCell") {
        throw "Not correct format!";
      }

      if(!thecell.attributes.hasOwnProperty("value")){
        continue;
      }else{

        if(!thecell.attributes.hasOwnProperty("connectable") & !thecell.attributes.hasOwnProperty("target") & !thecell.attributes.hasOwnProperty("source")){
          
          thegraph.graph[thecell.attributes.value] = []

          packids[thecell.attributes.id] = thecell.attributes.value
          
        }
      
      }

    }


    for(var cell in cells){

      var thecell = cells[cell]

      if (thecell.name != "mxCell") {
        throw "Not correct format!";
      }

      if(!thecell.attributes.hasOwnProperty("value")){
        continue;
      }else{

        
        if(thecell.attributes.hasOwnProperty("connectable")){
          
          for(var checkcell in cells){
            var check = cells[checkcell]
            if (check.attributes.id == thecell.attributes.parent){
    
              if(check.attributes.hasOwnProperty("source") & check.attributes.hasOwnProperty("target")){
                // inner package edge
                console.log(packids)

                thegraph.graph[packids[check.attributes.source]].push([packids[check.attributes.target],thecell.attributes.value])
                
              }else if (check.attributes.hasOwnProperty("target")){
                // oracle 
           
                thegraph.oracles.push([packids[check.attributes.target],thecell.attributes.value])
              }
    
            }
          }
    
    
        }else if ((thecell.attributes.parent == '1' || thecell.attributes.parent.split('-').pop() == '1') && thecell.attributes.style.includes("Arrow") && thecell.attributes.value != ""){


          console.log('thecell')
          console.log(thecell)

          if (thecell.attributes.hasOwnProperty("source") & thecell.attributes.hasOwnProperty("target")){
            thegraph.graph[packids[thecell.attributes.source]].push([packids[thecell.attributes.target],thecell.attributes.value])
          }else if  (thecell.attributes.hasOwnProperty("target")){
            thegraph.oracles.push([packids[thecell.attributes.target],thecell.attributes.value])

          }
          
          

        }

      }




    }
    
    console.log("The graph")
    console.log(thegraph)


    return thegraph;


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

updateGraphData(newGraphData, selected, fin){
  console.log(" UPDATE")

if(fin){

this.setState(prevState => {

  let graphdata = { ...prevState.graphdata };  
  graphdata.modular_pkgs[selected] = newGraphData;                     // update the name property, assign a new value                 
  let transformation = {};
  return { graphdata, transformation };                                 // return new object jasper object
  
});
}else{

  console.log("NOT FIN UPDATE")
  this.setState(prevState => {

    let graphdata = { ...prevState.graphdata }; 
    console.log(graphdata) 
    graphdata.modular_pkgs[selected] = newGraphData;                     // update the name property, assign a new value                 
    console.log(graphdata)
    return { graphdata };                                 // return new object jasper object
  
});
}

}

notFinsihedTransform(rowInfo){
  
    if (!window.confirm("You haven't finsihed the transformation, progress will be lost - are you sure you want to change graph?")){
      return
    } else {
      this.setState({selected : rowInfo.node.graphname, transformation : {}});
    }
  
}

  render() {

    
    let transform = Object.keys(this.state.transformation).length != 0 ? [<ReflexElement className="workboard" minSize="50" flex={0.5}>
    <GraphView decompose={this.decomposeGraph.bind(this)} expand={this.expandGraph.bind(this)} selected={this.state.selected} graphdata={this.state.graphdata}/> </ReflexElement>,<ReflexSplitter/>,<ReflexElement className="workboard" minSize="50" flex={0.5}><GraphView decompose={this.decomposeGraph.bind(this)} expand={this.expandGraph.bind(this)} selected={this.state.transformation['selected']} transform={true} graphdata={this.state.graphdata}/></ReflexElement>] :  [<ReflexElement  flex={1} className="workboard" minSize="50">
    <GraphView decompose={this.decomposeGraph.bind(this)} expand={this.expandGraph.bind(this)} selected={this.state.selected} graphdata={this.state.graphdata}/>
  </ReflexElement>]


    
    if (Object.keys(this.state.transformation).length != 0) {
    console.log('this.state.transformation')
    console.log(Object.keys(this.state.transformation))
    var transformation_graphdata = this.state.graphdata.modular_pkgs[this.state.transformation['selected']]    

    }else{

      var transformation_graphdata = null
  
    }
    
    return (      
      <ReflexContainer style={{height:"100vh"}}orientation="horizontal">
        <ReflexElement flex={0.9} className="site-content">
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
            buttons: [<button onClick={(event) => Object.keys(this.state.transformation).length == 0 ? this.setState({selected : rowInfo.node.graphname}) : this.notFinsihedTransform(rowInfo)}>Select</button>]
        })} 
        />
</ReflexElement>
      </ReflexContainer>
  </ReflexElement>
  <ReflexSplitter />
  <ReflexElement>
    <ReflexContainer>
        {transform}
        </ReflexContainer>
        </ReflexElement>
                <ReflexSplitter />
        <ReflexElement flex={0.2} className="video-panels" >
        <Packages graphdata={this.state.graphdata}/>
</ReflexElement>
        
      </ReflexContainer>
      </ReflexElement>
      <ReflexSplitter/>
        <ReflexElement className="video-panels">
          <TransformationTools update={this.updateGraphData.bind(this)} selected_graphdata={transformation_graphdata} transformationselection={this.state.transformation}/>
        </ReflexElement>
      </ReflexContainer>
    );
  }
}


