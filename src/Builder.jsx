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
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';


import { substitute, buildIncoming } from "./helpers/transformation_helper";

const pako = require('pako');

const saveFile = async (blob) => {
  const a = document.createElement('a');
  a.download = 'exported_project.json';
  a.href = URL.createObjectURL(blob);
  a.addEventListener('click', (e) => {
    setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
  });
  a.click();
};

function add_child(children,parent,child){

  var child_can;

  for(var element in children){
    
    child_can = null
    
    if(children[element].graphname === parent){

      children[element].children.push({title : child , graphname : child, number : {"expand" : {}, "decompose" : {}, "composition" : {}, "equiv" : {}}, children : []})

      return children

    }else if(children[element].children.length > 0){

      child_can = add_child(children[element].children, parent, child)

    }

    if(child_can != null){
      children[element].children = child_can
      return children
    }

  }

  return null

}


export default class Builder extends Component {

  // Initalise the main component 

  constructor(props) {
    super(props);
    this.transform_type = null
    this.transform_node = null
    this.transform_basename = null
    this.state = {graphdata : new Object(null), tree_data : [], selected : null, transformation_base : {}, transformation_display : {}};    
    this.toolbarRef = React.createRef()    

  }


  updateEquivs(newEquivs){

    var newGraphdata = {...this.state.graphdata}

    newGraphdata["equivs"] = newEquivs

    this.setState({graphdata : newGraphdata})

  }


  // Function to be passed to graph view for invoking an expansion 

  triggerTransformation(type, cell_value) {

  
    if(this.transformation_type != null){
      if(!window.confirm("You haven't finsihed the transformation, progress will be lost - are you sure you want to perform another transformation?")){         
        return
       }
     }

        this.transform_type = type

        this.transform_node = cell_value
        
        this.setState({transformation_base : JSON.parse(JSON.stringify(this.state.graphdata.modular_pkgs[this.state.selected])), transformation_display : this.state.graphdata.modular_pkgs[this.state.selected]});
    
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

    this.projUpload.value = null

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

updateGraphData(newGraphData, fin, transform_name=null){

if(fin){

  for(var element in this.state.tree_data) {
                
    if(this.matchSortableTreeElmSave(this.state.tree_data[element], newGraphData, transform_name)){
      return 
    }

  }

  var graphname = transform_name != null ? transform_name : this.state.selected + ' - ' + this.transform_type

  this.setState(prevState => {

    let tree_data = [...prevState.tree_data]
    let graphdata = { ...prevState.graphdata };  
    let transformation_base = {};
    let transformation_display = {};

    tree_data.push({'title' : graphname , 'graphname' : graphname, 'number' : {"expand" : {}, "decompose" : {}, "composition" : {}, "equiv" : {}}, 'children' : []})
    graphdata.modular_pkgs[graphname] = newGraphData;                     // update the name property, assign a new value                 

    this.transform_type = null
    this.transform_node = null

    return { graphdata, transformation_base, transformation_display, tree_data };                                 // return new object jasper object
    
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

matchSortableTreeElmSave(element,newGraphData, transform_name){

  if(this.transform_type == null){
    return false
  }

  if (element.graphname == this.state.selected){

    var graphname = transform_name != null ? transform_name : this.state.selected + ' - ' + this.transform_type
    
    var number = element.number[this.transform_type]

    console.log('number')
    console.log(number)

    if(number.hasOwnProperty(graphname)){

      number = number[graphname]

      element.number[this.transform_type][graphname] += 1;
 
      graphname = graphname + '  (' + number.toString() + ') '

    }else{
      element.number[this.transform_type][graphname] = 1
    }

      element.children.push({title : graphname, graphname : graphname, number : {"expand" : {}, "decompose" : {}, "composition" : {}, "equiv" : {}}, children : []})
      
      this.setState(prevState => {

          
        let graphdata = { ...prevState.graphdata };  
        let transformation_base = {};
        let transformation_display = {};

        graphdata.modular_pkgs[graphname] = newGraphData;                     // update the name property, assign a new value                 

        this.transform_type = null
        
        return { graphdata, transformation_base, transformation_display };                                 // return new object jasper object
        
      });

      return true;
   
    }else{

      for(var child in element.children) {
        if(this.matchSortableTreeElmSave(element.children[child], newGraphData, transform_name)){
          return true;
        }

      }

    }

    return false;
  
  }

deleteGraph(graphname){

  alert("delete this graph!")
  alert(graphname)

}



selectGraph(graphname){
  
  console.log(this.state.graphdata)
  console.log(graphname)

  if(this.transform_type == null){

    this.setState({selected : graphname});
  }else if (!window.confirm("You haven't finsihed the transformation, progress will be lost - are you sure you want to change seleceted graph?")){
      return
    } else {

      this.transform_type = null

      this.setState({selected : graphname, transformation_base : {}, transformation_display : {}});
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

      if(prevState.transform_type !== null){

        let transformation_display = newGraphData

        let transformation_base = JSON.parse(JSON.stringify(newGraphData))

        return {graphdata, transformation_base, transformation_display}

      }

      return {graphdata}

    });
  }

 

  runTransformations(parent,passedgraphdata=null, passedtree_data=null){

    var graphdata = passedgraphdata === null ? this.state.graphdata : passedgraphdata
    var tree_data = passedtree_data === null ? this.state.tree_data : passedtree_data
    
    if(!graphdata.modular_pkgs[parent].hasOwnProperty('to_run')){
      return
    }

    var more_to_run;
    var parentGraphData = buildIncoming(graphdata.modular_pkgs[parent])
    var parentGraphData_with_oracles = graphdata.modular_pkgs[parent]
    var newGraphData
    var can_tree_data;

    var lhs;
    var rhs;
    var partialMatching;
    var include;


    for(var newGraph in parentGraphData_with_oracles.to_run){

      if(parentGraphData_with_oracles.to_run[newGraph].type === 'substitute'){

          lhs = parentGraphData_with_oracles.to_run[newGraph].lhs
          rhs = parentGraphData_with_oracles.to_run[newGraph].rhs
          
          if(parentGraphData_with_oracles.to_run[newGraph].hasOwnProperty(partialMatching)){
            partialMatching = parentGraphData_with_oracles.to_run[newGraph].partialMatching
          }else{
            partialMatching = false;
          }

          if(parentGraphData_with_oracles.to_run[newGraph].hasOwnProperty(include)){          
            include = parentGraphData_with_oracles.to_run[newGraph].include
          
          }else{
            include = []
          }

          newGraphData = substitute(parentGraphData, parentGraphData_with_oracles, lhs, rhs, partialMatching, include)

          console.log(parent)
          console.log(lhs)
          console.log(rhs)
          console.log(newGraph)          
          console.log(newGraphData)

          if(graphdata.modular_pkgs.hasOwnProperty(newGraph)){
            throw "Name already exists!"
          }

          graphdata.modular_pkgs[newGraph] = newGraphData 

          can_tree_data = add_child(tree_data, parent, newGraph)

          if(can_tree_data === null){
            throw "Parent package doesn't exist!"
          }

          tree_data = can_tree_data

      }

      if(parentGraphData_with_oracles.to_run[newGraph].hasOwnProperty("to_run")){
        graphdata.modular_pkgs[newGraph] = { newGraphData, ...parentGraphData_with_oracles.to_run[newGraph].to_run} 
        [graphdata, tree_data] = this.runTransformations(newGraph)
      }

      graphdata.modular_pkgs[parent].history = {...graphdata.modular_pkgs[parent].to_run}
      graphdata.modular_pkgs[parent].to_run = {}
      
    }

    return [graphdata, tree_data]

  }
 
  render() {

    console.log(this.state.tree_data)


    if(this.state.selected !== null){
    var transform = []

    if(this.transform_type !== null){
      transform.push(<ReflexElement className="workboard" minSize="50" flex={0.5}> <GraphView update={this.updateGraphData.bind(this)} toolbarRef={this.toolbarRef}  allow_editing={false} selected={this.state.selected} triggerTransformationProp = {this.triggerTransformation.bind(this)} selected_graphdata={this.state.graphdata.modular_pkgs[this.state.selected]}/> </ReflexElement>)
      transform.push(<ReflexSplitter/>)
      transform.push(<ReflexElement className="workboard" minSize="50" flex={0.5}><GraphView update={this.updateGraphData.bind(this)} toolbarRef={this.toolbarRef}  allow_editing={false} selected={this.state.selected} triggerTransformationProp = {this.triggerTransformation.bind(this)} transform={true} selected_graphdata={this.state.transformation_display}/></ReflexElement>)
    }else{
      transform.push(<ReflexElement  flex={1} className="workboard" minSize="50">
      <GraphView update={this.updateGraphData.bind(this)} toolbarRef={this.toolbarRef} allow_editing={true} selected={this.state.selected} triggerTransformationProp = {this.triggerTransformation.bind(this)} selected_graphdata={this.state.graphdata.modular_pkgs[this.state.selected]}/>
    </ReflexElement>)
    }

    var code = {"oracles" : this.state.graphdata.modular_pkgs[this.state.selected].oracles, "graph" : this.state.graphdata.modular_pkgs[this.state.selected].graph}

    var code_editor = [<CodeEditor text={JSON.stringify(code, null, '\t')} onSubmit={(newGraphData) => this.updateSelected(newGraphData)}  getLineNumber = {this.lineNumberOfSelected.bind(this)}/>]

    var transform_code = {"to_run" : this.state.graphdata.modular_pkgs[this.state.selected].to_run == null ? {} : this.state.graphdata.modular_pkgs[this.state.selected].to_run, "transformation_history" : this.state.graphdata.modular_pkgs[this.state.selected].transformation_history == null ? {} : this.state.graphdata.modular_pkgs[this.state.selected].transformation_history}

    var transform_editor = [<CodeEditor text={JSON.stringify(transform_code, null, '\t')} onSubmit={(newGraphData) => this.updateSelected(newGraphData)}  getLineNumber = {this.lineNumberOfSelected.bind(this)}/>]


    }else{
      var transform = <div></div>
      var code_editor = <div></div>
      var transform_editor = <div></div>
    }
    
    if(this.state.graphdata.hasOwnProperty('equivs')){
      var graphEquivs = this.state.graphdata['equivs']
    }else{
      var graphEquivs = []
    }    
    console.log(this)

    return (      
      <ReflexContainer style={{height:"100vh"}}orientation="horizontal">
        <ReflexElement flex={0.05} className="video-panels">

<Stack direction="row" spacing={1}>

  <input type="file" style={{'display': 'none'}} ref={input => this.projUpload = input} onChange={this.onProjectUpload.bind(this)} id="proj_upload"/>
  <CustomIconButton tip="Import project file" type={["import"]} func={() => this.projUpload.click()}/>
  <CustomIconButton tip="Create new project file" type={["write"]} func={this.createProj.bind(this)}/>
  <CustomIconButton tip="Export current project file" type={["export"]} func={() => saveFile(new Blob([JSON.stringify(this.state.graphdata, null, 2)], {type : 'application/json'}))}/>

   </Stack>


        </ReflexElement>
        <ReflexSplitter/>
        <ReflexElement flex={0.9} className="site-content">
          <ReflexContainer className="site-content" orientation="vertical">

            <ReflexElement className="video-panels" flex={0.20} minSize="100">
            <ReflexContainer orientation="horizontal">
                {/* <ReflexElement flex={0.5} className="video-panels" >
                <Packages graphdata={this.state.graphdata}/>
                </ReflexElement> */}
 <Tabs>
    <TabList>
      <Tab>Code</Tab>
      <Tab>Transformations</Tab>
    </TabList>
    <TabPanel>
                  <ReflexElement flex={1} className="video-panels" >
                    {code_editor}
                  </ReflexElement>    
    </TabPanel>

    <TabPanel>
    <ReflexElement flex={0.1} className="video-panels">
                  
                  <Stack direction="row" spacing={1}>
  <CustomIconButton tip="Import transformations" type={["import","transform"]} func={() => alert("Import transformations")}/>
  <CustomIconButton tip="Run transformations" type={["run","transform"]} func={() => {
    var graphdata;
    var tree_data;
    [graphdata, tree_data] = this.runTransformations(this.state.selected)
    this.setState({graphdata, tree_data})
    }}/>
  <CustomIconButton tip="Clear transformation history" type={["clear","history"]} func={() => alert("Clear transformation history")}/>
  
   </Stack>
                    
                  </ReflexElement>
                    <ReflexSplitter/>
                  <ReflexElement flex={0.9} className="video-panels" >
                    {transform_editor}
                  </ReflexElement>    
    </TabPanel>
  </Tabs>

          

              </ReflexContainer>
              
            </ReflexElement>

            <ReflexSplitter />
            
            <ReflexElement>
              <ReflexContainer>
                <ReflexElement flex={0.05}>
                <div ref={this.toolbarRef} style={{backgroundColor : "#F9F6EE", height:"100%", width : "100%"}} id="divGraph" />
                </ReflexElement>
                <ReflexSplitter/>
                <ReflexElement flex={0.95}>
                <ReflexContainer>
                {transform}
                </ReflexContainer>
                </ReflexElement>
              </ReflexContainer>
            </ReflexElement>
            
            <ReflexSplitter />
        
            <ReflexElement flex={0.2} className="video-panels" >
              <ReflexContainer orientation="horizontal">
              <Tabs>
    <TabList>
      <Tab>Modular</Tab>
      <Tab>Monolithic</Tab>
    </TabList>
    <TabPanel>           
                <ReflexElement flex={0.1} minSize="50"> 
                  <Stack direction="row" spacing={1}>
                  <input type="file" style={{'display': 'none'}} ref={input => this.graphUpload = input} onChange={this.onGraphUpload.bind(this)} id="graph_upload"/>
                  <CustomIconButton tip="Import graph" type={["add","import"]} func={Object.keys(this.state.graphdata).length !== 0 ? () => this.graphUpload.click() : () => alert("Please open a project file to add graphs.")}/>
                  <CustomIconButton tip="Write new graph" type={["add","write"]} func={() => alert("not implemented yet!")}/> 
                  </Stack>
                  </ReflexElement>
                  <ReflexSplitter/>
                <ReflexElement flex={0.9} minSize="100"> 

                  <CustomTreeView deleteGraph={this.deleteGraph.bind(this)} tree_data={this.state.tree_data} select={this.selectGraph.bind(this)}/>
                </ReflexElement>
    </TabPanel>
    <TabPanel>
                  <ReflexElement flex={1} className="video-panels" >
                    <Packages graphdata={this.state.graphdata}/>
                  </ReflexElement>    
    </TabPanel>
  </Tabs>
              </ReflexContainer>
            </ReflexElement>
        
          </ReflexContainer>
        </ReflexElement>
        <ReflexSplitter/>
        <ReflexElement className="video-panels">
          <TransformationTools update={this.updateGraphData.bind(this)} allGraphData={this.state.graphdata} updateEquivsProp={this.updateEquivs.bind(this)} equivs={graphEquivs} type={this.transform_type} node={this.transform_node} base={this.state.transformation_base}/>
        </ReflexElement>
      
      </ReflexContainer>
    );
  }
}


