import React, { cloneElement, Component } from "react";

import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex'


import "react-reflex/styles.css";

import { MathJax, MathJaxContext } from "better-react-mathjax";

import GraphView from "./GraphView";
import Packages from "./Packages";

import TransformationTools from "./TransformationTools";
import CodeEditor from "./uiComponents/CodeEditor.jsx";

import CustomTreeView from "./uiComponents/CustomTreeView"

import CustomIconButton from "./uiComponents/CustomIconButton";
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { useFormControlUnstyled } from "@mui/material";
import { resolveInput } from "./helpers/import_helper"


const pako = require('pako');

export default class Builder extends Component {

  // Initalise the main component 

  constructor(props) {
    super(props);
    
    this.state = {graphdata : new Object(null), tree_data : [], selected : null, transformation : {}, transformation_display : {}};    
  }


  updateEquivs(newEquivs){

    var newGraphdata = {...this.state.graphdata}

    newGraphdata["equivs"] = newEquivs

    this.setState({graphdata : newGraphdata})

  }

  // Function to be passed to graph view for invoking an expansion 

  expandGraph(cell) {


    if (cell != null){

      if (cell.value.split("_[").length == 2){   
        
        
        this.setState({transformation : {"selected" : this.state.selected + " - expanded on " + cell.value, 
        "type" : "expand", "cell" : cell, "basename" : this.state.selected ,"base" : JSON.parse(JSON.stringify(this.state.graphdata.modular_pkgs[this.state.selected]))}, transformation_display : this.state.graphdata.modular_pkgs[this.state.selected]});

        return
          
      }
  
    }

    alert("Not expandable");
    
  }

    // Function to be passed to graph view for invoking an decomposition 

    decomposeGraph(cell){

      if (cell != null){
      

          if (Object.keys(this.state.graphdata.modular_pkgs[this.state.selected].graph).filter(node => cell.value.split("_[")[0] == node.split("_[")[0]).length == 1){    


             
          this.setState({transformation : {"selected" : this.state.selected + " - decomposed on " + cell.value, 
          "type" : "decompose", "cell" : cell, "basename" : this.state.selected ,"base" : JSON.parse(JSON.stringify(this.state.graphdata.modular_pkgs[this.state.selected]))}, transformation_display : this.state.graphdata.modular_pkgs[this.state.selected]});


           return 
            
            
          }
          
    
  
  }

  alert("Not decomposable");
}

substituteGraph(cell){

  if (cell != null){

             
    this.setState({transformation : {"selected" : this.state.selected + " - composed on " + cell.value, 
    "type" : "equiv", "cell" : cell, "basename" : this.state.selected ,"base" : JSON.parse(JSON.stringify(this.state.graphdata.modular_pkgs[this.state.selected]))}, transformation_display : this.state.graphdata.modular_pkgs[this.state.selected]});
    return 

}

alert("Not Equiv?");
}

  // For parsing in the json or xml files 


  onProjectUpload(event) {

    var file = event.target.files[0];
    resolveInput(file, (json_data) => {
      if(!json_data.hasOwnProperty("modular_pkgs")){
        alert("Not correctly formatted JSON, needs modular_pkgs.")
        return
      }
      if(Object.keys(this.state.graphdata).length !== 0){
        if(!window.confirm("This will overwrite the current project, are you sure you want to continue?\nIf you want to add a graph to the current project use the + button.")){
          return 
        }
      }
      this.setState({ graphdata: json_data }, function(){
        this.createSelectItems();
      });
    })


  }

  createProj(){
    alert("HERER")
    if(Object.keys(this.state.graphdata).length !== 0){
      if(!window.confirm("This will overwrite the current project, are you sure you want to continue?\nIf you want to add a graph to the current project use the + button.")){
        return 
      }
    }
    var graphname = window.prompt("Please enter a name for the initial graph:", "Graph name");
    this.setState({graphdata: JSON.parse("{ \"modular_pkgs\" : {\"" + graphname + "\" : {\"graph\":{},\"oracles\" :[[]]}}, \"monolithic_pkgs\" :{}}")}, function() {
      this.createSelectItems();
    })
    
  }
  


  onGraphUpload(event){

    var file = event.target.files[0];
    resolveInput(file, (json_data) => {
      
      this.setState((prevState) => { 
        let tree_data = [...prevState.tree_data]
        let graphdata = { ...prevState.graphdata };  

        if(json_data.hasOwnProperty("modular_pkgs")){

          for(var graphname in json_data.modular_pkgs){

            tree_data.push({title : graphname , graphname : graphname, number : {"expand" : {}, "decompose" : {}, "composition" : {}, "equiv" : {}}, children : []})
            graphdata.modular_pkgs[graphname] = json_data.modular_pkgs[graphname];                     // update the name property, assign a new value                 

          }

            return { graphdata, tree_data }

        }else{

        if(json_data.hasOwnProperty("graph")){

          var graphname = window.prompt("Please enter a name for the graph:", "Graph name");
          tree_data.push({title : graphname , graphname : graphname, number : {"expand" : {}, "decompose" : {}, "composition" : {}, "equiv" : {}}, children : []})
          graphdata.modular_pkgs[graphname] = json_data;                     // update the name property, assign a new value                 
          return { graphdata, tree_data };            

        }else{

          alert("Incorrectly formatted JSON, please ensure there is a \'graph\' key.")
          return

          }

        }
        
      });
    })
  }
  

  createSelectItems() {
    let items = [];         
    var i = 0;
    for (var graphname in this.state.graphdata.modular_pkgs) {   
         items.push({title : graphname, number : {"expand" : {}, "decompose" : {}, "composition" : {}, "equiv" : {}}, graphname : graphname, children : []});   
         i++;
         //here I will be creating my options dynamically based on
         //what props are currently passed to the parent component

    }
    
    this.setState({tree_data : items, selected : items[0].graphname})

}  

updateGraphData(newGraphData, fin){

if(fin){

  for(var element in this.state.tree_data) {
                
    if(this.matchSortableTreeElmSave(this.state.tree_data[element],newGraphData)){
      return 
    }

  }

  var graphname = this.state.transformation['selected']

  this.setState(prevState => {

    let tree_data = [...prevState.tree_data]
    let graphdata = { ...prevState.graphdata };  
    let transformation = {};
    let transformation_display = {};

    tree_data.push({title : graphname , graphname : graphname, number : {"expand" : {}, "decompose" : {}, "composition" : {}, "equiv" : {}}, children : []})
    graphdata.modular_pkgs[graphname] = newGraphData;                     // update the name property, assign a new value                 

    return { graphdata, transformation, transformation_display, tree_data };                                 // return new object jasper object
    
  });

  return

}else{
  
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


      element.children.push({title : graphname, graphname : graphname, number : {"expand" : {}, "decompose" : {}, "composition" : {}, "equiv" : {}}, children : []})
      
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

selectGraph(graphname){
  
  if(Object.keys(this.state.transformation).length == 0 ){
    this.setState({selected : graphname, transformation : {}});
  }else if (!window.confirm("You haven't finsihed the transformation, progress will be lost - are you sure you want to change seleceted graph?")){
      return
    } else {
      this.setState({selected : graphname, transformation : {}});
    }
  }


  lineNumberOfSelected(){
    
    var text = JSON.stringify(this.state.graphdata, null, '\t')


    var index = text.indexOf(this.state.selected); // => 18


    var tempString = text.substring(0, index);

    // Line number
    return tempString.split('\n').length;

  }

  updateSelected(newGraphData){
    this.setState(prevState =>{
      
      let graphdata = {...prevState.graphdata}
      
      graphdata.modular_pkgs[prevState.selected] = newGraphData

      if(Object.keys(prevState.transformation).length !== 0){

        let transformation = {...prevState.transformation}
        let transformation_display = newGraphData

        transformation['base'] = JSON.parse(JSON.stringify(newGraphData))

        return {graphdata, transformation, transformation_display}

      }

      return {graphdata}

    });
  }
 
  render() {



    if(this.state.graphdata.hasOwnProperty("modular_pkgs")){
    var transform = Object.keys(this.state.transformation).length != 0 ? [<ReflexElement className="workboard" minSize="50" flex={0.5}>
    <GraphView decompose={this.decomposeGraph.bind(this)} expand={this.expandGraph.bind(this)} substitute={this.substituteGraph.bind(this)} selected_graphdata={this.state.graphdata.modular_pkgs[this.state.selected]}/> </ReflexElement>,<ReflexSplitter/>,<ReflexElement className="workboard" minSize="50" flex={0.5}><GraphView decompose={this.decomposeGraph.bind(this)} expand={this.expandGraph.bind(this)} substitute={this.substituteGraph.bind(this)} transform={true} selected_graphdata={this.state.transformation_display}/></ReflexElement>] :  [<ReflexElement  flex={1} className="workboard" minSize="50">
    <GraphView decompose={this.decomposeGraph.bind(this)} expand={this.expandGraph.bind(this)} substitute={this.substituteGraph.bind(this)} selected_graphdata={this.state.graphdata.modular_pkgs[this.state.selected]}/>
  </ReflexElement>]

    var editor = [<CodeEditor text={JSON.stringify(this.state.graphdata.modular_pkgs[this.state.selected], null, '\t')} onSubmit={(newGraphData) => this.updateSelected(newGraphData)}  getLineNumber = {this.lineNumberOfSelected.bind(this)}/>]

    }else{
      var transform = <div></div>
      var editor = <div></div>
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
                {/* <ReflexElement flex={0.5} className="video-panels" >
                <Packages graphdata={this.state.graphdata}/>
                </ReflexElement> */}
                <ReflexElement flex={1} className="video-panels" >
                  {editor}
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
                <ReflexElement flex={0.1} minSize="70">

                <Stack direction="row" spacing={1}>

                  <input type="file" style={{'display': 'none'}} ref={input => this.projUpload = input} onChange={this.onProjectUpload.bind(this)} id="proj_upload"/>
                  <CustomIconButton tip="Import project file" type={["import"]} func={() => this.projUpload.click()}/>
                  <CustomIconButton tip="Create new project file" type={["write"]} func={this.createProj.bind(this)}/>
                  
                   </Stack>
                </ReflexElement>

                <ReflexSplitter/>
                
                <ReflexElement flex={0.9} minSize="100"> 
                <Stack direction="row" spacing={1}>
                <input type="file" style={{'display': 'none'}} ref={input => this.graphUpload = input} onChange={this.onGraphUpload.bind(this)} id="graph_upload"/>
                <CustomIconButton tip="Import graph" type={["add","import"]} func={Object.keys(this.state.graphdata).length !== 0 ? () => this.graphUpload.click() : () => alert("Please open a project file to add graphs.")}/>
                <CustomIconButton tip="Write new graph" type={["add","write"]} func={() => alert("Beans")}/> 
                </Stack>
                <Divider />
                <CustomTreeView tree_data={this.state.tree_data} select={this.selectGraph.bind(this)}/>
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


