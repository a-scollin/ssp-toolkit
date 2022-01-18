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
import FileExplorerTheme from '@nosferatu500/theme-file-explorer';



import GraphView from "./GraphView";
import Packages from "./Packages";
import Latex from "./Latex";
import { height } from "dom-helpers";

import TransformationTools from "./TransformationTools";
import { radioClasses, touchRippleClasses } from "@mui/material";
import { fontSize } from "@mui/system";
import MyAceComponent from "./editor.jsx";

const pako = require('pako');

export default class Builder extends Component {

  // Initalise the main component 

  constructor(props) {
    super(props);
    
    this.state = {graphdata : new Object(null), modular_pkgs : null, selected : null, transformation : {}, transformation_display : {}};    
  }


  updateEquivs(newEquivs){

    var newGraphdata = {...this.state.graphdata}

    newGraphdata["equivs"] = newEquivs

    this.setState({graphdata : newGraphdata})

  }

  // Function to be passed to graph view for invoking an expansion 

  expandGraph(cell) {


    if (cell != null){

      if (cell.value.split("_{").length == 2){   
        
        for(var element in this.state.modular_pkgs) {
                
          if(this.matchSortableTreeElmSetup(this.state.modular_pkgs[element], 'expand', cell)){
            return 
          }

        }
          
      }
  
    }
    alert("Not expandable");
    }

    matchSortableTreeElmSetup(element, type, cell){

        if (element.graphname == this.state.selected){

            this.setState({transformation : {"selected" : this.state.selected + " - " + type + "ed on " + cell.value, 
            "type" : type, "cell" : cell, "basename" : this.state.selected ,"base" : JSON.parse(JSON.stringify(this.state.graphdata.modular_pkgs[this.state.selected]))}, transformation_display : this.state.graphdata.modular_pkgs[this.state.selected]});


            return true;
         
          }else{

            for(var child in element.children) {
              if(this.matchSortableTreeElmSetup(element.children[child], type, cell)){
                return true;
              }

            }

          }

          return false;
        
        }


    
    
    // Function to be passed to graph view for invoking an decomposition 

    decomposeGraph(cell){

      if (cell != null){
      
        if (cell.value.split("_{").length == 2){

          if (Object.keys(this.state.graphdata.modular_pkgs[this.state.selected].graph).filter(node => cell.value.split("_{")[0] == node.split("_{")[0]).length == 1){    

            for(var element in this.state.modular_pkgs) {
                
              if(this.matchSortableTreeElmSetup(this.state.modular_pkgs[element], 'decompose', cell)){
                return 
              }
  
            }
            
            
          }
          
    }
  
  }

  alert("Not decomposable");
}

substituteGraph(cell){

  if (cell != null){
  
        for(var element in this.state.modular_pkgs) {
            
          if(this.matchSortableTreeElmSetup(this.state.modular_pkgs[element], 'equiv', cell)){
            return 
          }

}

}


alert("Not Equiv?");
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
        var xml = new XMLParser().parseFromString(event.target.result.replace(/&lt;(.*?)&gt;/g,""));    // Assume xmlText contains the example XML

        json_data = this.resolve_xml_to_json(xml)

        
        

    } catch (e) {
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

      var sub, data
      [sub, data] = this.resolve_diagram_to_json(xml.children[diagram].children[0].children[0].children)


      var title = xml.children[diagram].attributes.name

      if(sub){
        title += " - SUBGRAPH"
      }
      
      json_data.modular_pkgs[title] = data 
    }

    return json_data
    
    
  }

  resolve_diagram_to_json(cells){
    
    var thegraph = {oracles : [], graph : {}}

    var packids = {}

    var sub = false

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

                thegraph.graph[packids[check.attributes.source]].push([packids[check.attributes.target],thecell.attributes.value])
                
              }else if (check.attributes.hasOwnProperty("target")){
                // oracle 
           
                thegraph.oracles.push([packids[check.attributes.target],thecell.attributes.value])
              }else if (check.attributes.hasOwnProperty("source")){
                
                if(!sub){
                  sub = true
                  thegraph.graph['terminal_pkg'] = []
                }
                
                thegraph.graph[packids[check.attributes.source]].push(["terminal_pkg",thecell.attributes.value])
              
              }
    
            }
          }
    
    
        }else if ((thecell.attributes.parent == '1' || thecell.attributes.parent.split('-').pop() == '1') && (thecell.attributes.hasOwnProperty("edge") || thecell.attributes.style.includes("Arrow")) && thecell.attributes.value != ""){



          if (thecell.attributes.hasOwnProperty("source") & thecell.attributes.hasOwnProperty("target")){
            thegraph.graph[packids[thecell.attributes.source]].push([packids[thecell.attributes.target],thecell.attributes.value])
          }else if  (thecell.attributes.hasOwnProperty("target")){
            thegraph.oracles.push([packids[thecell.attributes.target],thecell.attributes.value])

          }else if  (thecell.attributes.hasOwnProperty("source")){

            if(!sub){
              sub = true
              thegraph.graph['terminal_pkg'] = []
            }
            
            thegraph.graph[packids[thecell.attributes.source]].push(['terminal_pkg',thecell.attributes.value])
          }
          
          

        }

      }

 


    }

    return [sub, thegraph];


  }

  createSelectItems() {
    let items = [];         
    var i = 0;
    for (var graphname in this.state.graphdata.modular_pkgs) {   
         items.push({title : '$$' + graphname + '$$', number : {"expand" : {}, "decompose" : {}, "composition" : {}}, graphname : graphname, children : []});   
         i++;
         //here I will be creating my options dynamically based on
         //what props are currently passed to the parent component

    }
    
    this.setState({modular_pkgs : items, selected : items[0].graphname})

}  

updateGraphData(newGraphData, fin){



if(fin){

  for(var element in this.state.modular_pkgs) {
                
    if(this.matchSortableTreeElmSave(this.state.modular_pkgs[element],newGraphData)){
      return 
    }

  }  

  alert("Couldn't save, did you delete the parent package?");

}else{

  console.log("SKEPEKPSK")
  console.log(newGraphData)
  
  if(newGraphData.hasOwnProperty("modular_pkgs")){


    this.setState({graphdata : newGraphData})

  }else{

  this.setState({transformation_display : newGraphData})
  }
}

}




matchSortableTreeElmSave(element,newGraphData){

  if (element.graphname == this.state.transformation["basename"]){


    var graphname = this.state.transformation['selected']

    var number = element.number[this.state.transformation['type']]

    console.log('number')
    console.log(number)

    if(number.hasOwnProperty(graphname)){

      number = number[graphname]

      element.number[this.state.transformation['type']][graphname] += 1;
 
      graphname = graphname + '  (' + number.toString() + ') '

    }else{
      element.number[this.state.transformation['type']][graphname] = 1
    }


      element.children.push({title : '$$' + graphname + '$$', graphname : graphname, number : {"expand" : {}, "decompose" : {}, "composition" : {}}, children : []})
      
      this.setState(prevState => {

        let graphdata = { ...prevState.graphdata };  
        graphdata.modular_pkgs[graphname] = newGraphData;                     // update the name property, assign a new value                 
        let transformation = {};
        let transformation_display = {};
        return { graphdata, transformation, transformation_display };                                 // return new object jasper object
        
      });

      return true;
   
    }else{

      for(var child in element.children) {
        if(this.matchSortableTreeElmSave(element.children[child], newGraphData)){
          return true;
        }

      }

    }

    return false;
  
  }

notFinsihedTransform(rowInfo){
  
    if (!window.confirm("You haven't finsihed the transformation, progress will be lost - are you sure you want to change graph?")){
      return
    } else {
      this.setState({selected : rowInfo.node.graphname, transformation : {}});
    }
  
  }


  lineNumberOfSelected(){
    
    var text = JSON.stringify(this.state.graphdata, null, '\t')


    var index = text.indexOf(this.state.selected); // => 18


    var tempString = text.substring(0, index);

    // Line number
    return tempString.split('\n').length;

  }

  render() {



    if(this.state.graphdata.hasOwnProperty("modular_pkgs")){
    var transform = Object.keys(this.state.transformation).length != 0 ? [<ReflexElement className="workboard" minSize="50" flex={0.5}>
    <GraphView decompose={this.decomposeGraph.bind(this)} expand={this.expandGraph.bind(this)} substitute={this.substituteGraph.bind(this)} selected_graphdata={this.state.graphdata.modular_pkgs[this.state.selected]}/> </ReflexElement>,<ReflexSplitter/>,<ReflexElement className="workboard" minSize="50" flex={0.5}><GraphView decompose={this.decomposeGraph.bind(this)} expand={this.expandGraph.bind(this)} substitute={this.substituteGraph.bind(this)} transform={true} selected_graphdata={this.state.transformation_display}/></ReflexElement>] :  [<ReflexElement  flex={1} className="workboard" minSize="50">
    <GraphView decompose={this.decomposeGraph.bind(this)} expand={this.expandGraph.bind(this)} substitute={this.substituteGraph.bind(this)} selected_graphdata={this.state.graphdata.modular_pkgs[this.state.selected]}/>
  </ReflexElement>]
    }else{
      var transform = <div>Load a graph!</div>
    }

    
    if(this.state.graphdata.hasOwnProperty('equivs')){
      var equivs = this.state.graphdata['equivs']
    }else{
      var equivs = []
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
          onVisibilityToggle={({treeData})=>{
            console.log("treeData")
            console.log(treeData)
          }}
          style={{  height: 'auto', width : 'auto',
             fontSize : 12,
             frameBorder : 1
          }}

          isVirtualized={false}
          theme={FileExplorerTheme}

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
        <ReflexContainer orientation="horizontal">
        {/* <ReflexElement flex={0.5} className="video-panels" >
        <Packages graphdata={this.state.graphdata}/>
        </ReflexElement> */}
        <ReflexElement flex={1} className="video-panels" >
        <MyAceComponent text={JSON.stringify(this.state.graphdata, null, '\t')} onSubmit={this.updateGraphData.bind(this)}  getLineNumber = {this.lineNumberOfSelected.bind(this)}/>
        </ReflexElement>
        </ReflexContainer>
</ReflexElement>
        
      </ReflexContainer>
      </ReflexElement>
      <ReflexSplitter/>
        <ReflexElement className="video-panels">
          <TransformationTools update={this.updateGraphData.bind(this)} updateEquivsProp={this.updateEquivs.bind(this)} equivs={equivs} transformationselection={this.state.transformation}/>
        </ReflexElement>
      </ReflexContainer>
    );
  }
}


