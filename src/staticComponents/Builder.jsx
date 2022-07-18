import React, { Component } from "react";

import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex'
import "react-reflex/styles.css";

import GraphView from "./GraphView";
import Packages from "./Packages";
import TransformationTools from "./TransformationTools";

import CodeEditor from "../reusableComponents/CodeEditor.jsx";
import CustomTreeView from "../reusableComponents/TreeView"
import CustomIconButton from "../reusableComponents/IconButton";

import { resolveInput } from "../lib/import_helper"
import { getMxFile, saveFile } from "../lib/export_helper.js";
import {
  runScriptedTransformations
} from "../lib/transformation_helper";

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import Stack from '@mui/material/Stack';


/** 
 * Main component for the tool, manages and distributes state for all other components. 
*/

export default class Builder extends Component {

  constructor(props) {
    super(props);
    this.transform_type = null
    this.transform_node = null
    this.meta = null
    this.transform_basename = null
    this.state = { graphdata: new Object(null), tree_data: [], selected: null, transformation_base: {}, transformation_display: {} };
    this.toolbarRef = React.createRef()

  }



  // Function to be passed to graph view for invoking transformation tools from context menu

  triggerTransformation(type, cell_value) {

    // This is in case of another transformation being in process when triggered - should only be possible if MxGraphs context is buggy
    if (this.transformation_type != null) {
      if (!window.confirm("You haven't finsihed the transformation, progress will be lost - are you sure you want to perform another transformation?")) {
        return
      }
    }

    this.transform_type = type

    this.transform_node = cell_value

    this.setState({ transformation_base: JSON.parse(JSON.stringify(this.state.graphdata.modular_pkgs[this.state.selected])), transformation_display: JSON.parse(JSON.stringify(this.state.graphdata.modular_pkgs[this.state.selected])) });

  }

  // Uses the library method for accessing Fs to open new project to the workspace. 
  onProjectUpload(event) {

    var file = event.target.files[0];
    resolveInput(file, (json_data) => {
      if (!json_data.hasOwnProperty("modular_pkgs")) {
        alert("Not correctly formatted JSON, needs modular_pkgs.")
        return
      }
      if (Object.keys(this.state.graphdata).length !== 0) {
        if (!window.confirm("This will overwrite the current project, are you sure you want to continue?\nIf you want to add a graph to the current project use the + button.")) {
          return
        }
      }

      var selected = Object.keys(json_data.modular_pkgs)[0]

      this.setState({ graphdata: json_data, selected: selected }, function () {
        this.createTreeItems();
      });
    })

    this.projUpload.value = null

  }

  // Overwrites and creates a blank project to start a workspace
  createProj() {
    if (Object.keys(this.state.graphdata).length !== 0) {
      if (!window.confirm("This will overwrite the current project, are you sure you want to continue?\nIf you want to add a graph to the current project use the + button.")) {
        return
      }
    }
    var graphname = window.prompt("Please enter a name for the initial graph:", "Graph name");
    this.setState({ graphdata: JSON.parse("{ \"modular_pkgs\" : {\"" + graphname + "\" : {\"graph\":{},\"oracles\" :[[]]}}, \"monolithic_pkgs\" :{}}") }, () => {
      this.createTreeItems();
    })

  }

  //  Uses the library method for accessing Fs to add new graphs or the graphs in project files to the workspace. 
  onGraphUpload(event) {

    var file = event.target.files[0];
    resolveInput(file, (json_data) => {

      this.setState((prevState) => {
        let tree_data = [...prevState.tree_data]
        let graphdata = { ...prevState.graphdata };

        if (json_data.hasOwnProperty("modular_pkgs")) {

          for (var graphname in json_data.modular_pkgs) {

            tree_data.push({ title: graphname, graphname: graphname, number: { "expand": {}, "reduce": {}, "decompose": {}, "compose": {}, "equiv": {} }, children: [] })
            graphdata.modular_pkgs[graphname] = json_data.modular_pkgs[graphname];                     // update the name property, assign a new value                 

          }

          return { graphdata, tree_data }

        } else if (json_data.hasOwnProperty("graph")) {

          var graphname = window.prompt("Please enter a name for the graph:", "Graph name");
          tree_data.push({ title: graphname, graphname: graphname, number: { "expand": {}, "reduce": {}, "decompose": {}, "compose": {}, "equiv": {} }, children: [] })
          graphdata.modular_pkgs[graphname] = json_data;                     // update the name property, assign a new value                 
          return { graphdata, tree_data };

        } else {

          alert("Incorrectly formatted JSON, please ensure there is a \'graph\' or \'modular_pkgs' key.");
          return

        }



      });
    })
  }

  
  // Uses the library method for accessing Fs to add new graphs in project files to the workspace. 
  onTransformUpload(event) {
    resolveInput(event.target.file[0], (json) => {
      this.updateSelectedTransformations(json)
    })
  }

  // Create the tree items for selecting a graph to work on
  // Chore : Add project to project tree structure preservation, currently all graphs in a project are loaded in a flat list.  
  createTreeItems() {
    let items = [];
    var i = 0;
    for (var graphname in this.state.graphdata.modular_pkgs) {
      items.push({ title: graphname, number: { "expand": {}, "reduce": {}, "decompose": {}, "compose": {}, "equiv": {} }, graphname: graphname, children: [] });
      i++;
    }

    this.setState({ tree_data: items, selected: items[0].graphname })

  }

  // Updates the new graph data during transformations and for updating all modular_pkgs in project data. 

  /* 
  * Chore : seperate the functions for updating modular_pkgs and the selected
  * graph -- this is a kind of builder "API" since it feeds to rest of app so and 
  * having one function for both is needlessly complicated  
  */

  updateGraphData(newGraphDataPassed, fin, transform_name = null) {

    var newGraphData = { "oracles": newGraphDataPassed.oracles, "graph": newGraphDataPassed.graph, "reduction": (newGraphDataPassed.hasOwnProperty("reduction") ? newGraphDataPassed.reduction : []) }

    // If finished is true we are adding a newly transformed graph to the tree
    if (fin) {

      // If any one parent matches the name then we can add under it and give it an appropriate number.    
      for (var element in this.state.tree_data) {
        if (this.dfsGraphSave(this.state.tree_data[element], newGraphData, transform_name)) {
          return
        }
      }

      // If there is no match in the tree just add the new graph at the top level 
      var graphname = transform_name != null ? transform_name : this.state.selected + ' - ' + this.transform_type

      this.setState(prevState => {

        let tree_data = [...prevState.tree_data]
        let graphdata = { ...prevState.graphdata };

        let transformation_base = {};
        let transformation_display = {};

        this.transform_type = null
        this.transform_node = null

        // push to the "end" of the tree list 
        tree_data.push({ 'title': graphname, 'graphname': graphname, 'number': { "expand": {}, "reduce": {}, "decompose": {}, "composition": {}, "equiv": {} }, 'children': [] })

        // update the graphdata property, add a new key : val        
        graphdata.modular_pkgs[graphname] = newGraphData;

        return { graphdata, transformation_base, transformation_display, tree_data };

      });

      return

    } else {

      // If not we could either have an update of all modular_pkgs or just what the temporary transformation display is.  
      if (newGraphData.hasOwnProperty("modular_pkgs")) {

        this.setState({ graphdata: newGraphData })

      } else {

        this.setState({ transformation_display: newGraphData })
      }
    }

  }

  /*  
  * Uses a DFS to match a newly transformed graph to its original parent, 
  * handles numbering of new graph by keeping track in tree_data. 
  */
  dfsGraphSave(element, newGraphData, transform_name) {

    if (this.transform_type == null) {
      return false
    }

    // If the element traversed is the selected then add new graph as child
    if (element.graphname == this.state.selected) {

      var graphname = transform_name != null ? transform_name : this.state.selected + ' - ' + this.transform_type
      var number = element.number[this.transform_type]

      // If there is already a transformed graph of same name then we number it higher, otherwise we mark it as the first of that name
      if (number.hasOwnProperty(graphname)) {

        number = number[graphname]

        element.number[this.transform_type][graphname] += 1;

        graphname = graphname + '  (' + number.toString() + ') '

      } else {
        element.number[this.transform_type][graphname] = 1
      }

      element.children.push({ title: graphname, graphname: graphname, number: { "expand": {}, "reduce": {}, "decompose": {}, "composition": {}, "equiv": {} }, children: [] })

      // Resets transformation and updates the project state. 
      this.setState(prevState => {

        let graphdata = { ...prevState.graphdata };
        let transformation_base = {};
        let transformation_display = {};

        graphdata.modular_pkgs[graphname] = newGraphData;

        this.transform_type = null

        return { graphdata, transformation_base, transformation_display };

      });

      return true;

    } else {
      // Check down children lineage
      for (var child in element.children) {
        if (this.dfsGraphSave(element.children[child], newGraphData, transform_name)) {
          return true;
        }
      }
    }

    return false;

  }

  /* 
  * Chore : Implement deletion of graphs from the tree, will also
  * take a boolean specifying if children are inherited or deleted 
  */
  graphDelete(graphname) {

    alert("delete this graph!")
    alert(graphname)

  }

  /* 
  * Updates the selected graph, needed to check if there is a transformation 
  * in progress and to update a graphs metadata (XML structure for exporting) 
  */
  selectGraph(selected) {

    if (this.transform_type == null) {

      if (this.meta == null) {
        this.setState({ selected: selected });
      } else {
        this.setState(prevState => {

          let graphdata = { ...prevState.graphdata }

          graphdata.modular_pkgs[prevState.selected] = { ...graphdata.modular_pkgs[prevState.selected], ...this.meta }

          this.meta = null

          return { graphdata, selected }

        });
      }

    } else if (!window.confirm("You haven't finsihed the transformation, progress will be lost - are you sure you want to change seleceted graph?")) {
      return
    } else {

      this.transform_type = null
      this.setState({ selected: selected, transformation_base: {}, transformation_display: {} });
    }
  }

  // returns the line number of the selected graph (extra feature for CodeEditor)
  /* 
  * Chore : should actually return the line of the selected monolithic package 
  * (not modular) -- this requires interfacing with GraphView selection model.
  * Also needs to have a specific function for scripted transformations.  
  */

  lineNumberOfSelected() {

    var text = JSON.stringify(this.state.graphdata, null, '\t')
    var index = text.indexOf(this.state.selected); // => 18
    var tempString = text.substring(0, index);

    // Line number
    return tempString.split('\n').length;

  }

  // envoked with new graphdata to update selected
  updateSelectedGraphdata(newGraphData) {
    this.setState(prevState => {

      let graphdata = { ...prevState.graphdata }

      graphdata.modular_pkgs[prevState.selected].graph = { ...newGraphData.graph }

      graphdata.modular_pkgs[prevState.selected].oracles = [...newGraphData.oracles]

      if (newGraphData.hasOwnProperty("reudction")) {
        graphdata.modular_pkgs[prevState.selected].reduction = [...newGraphData.reduction]
      }

      delete graphdata.modular_pkgs[prevState.selected].xml

      /* 
      * If there is a transformation in progress and the selected graphdata is changed (ie. in CodeEditor)
      * then we reset the transformation base to the updated graphdata. 
      */

      if (prevState.transform_type !== null) {

        let transformation_display = newGraphData

        let transformation_base = JSON.parse(JSON.stringify(newGraphData))

        return { graphdata, transformation_base, transformation_display }

      }

      return { graphdata }

    });
  }

  // Updates the scripted transformations from CodeEditor

  updateSelectedTransformations(newTransformations) {

    this.setState(prevState => {

      let graphdata = { ...prevState.graphdata }

      graphdata.modular_pkgs[prevState.selected].to_run = { ...newTransformations.to_run }

      graphdata.modular_pkgs[prevState.selected].history = { ...newTransformations.history }

      return { graphdata }

    });
  }

  /*
  * Updates the meta data for the selected graph - this is used
  * to store each individual graph model and it's structure (where
  * the user moves each package, their colour) 
  * 
  * Chore: Is also passed edit history for Undo and Redo, 
  * however it is very buggy due to object complexity hence empty array    
   */
  updateSelectedMeta(xml, edithistory) {

    this.meta = { "xml": xml, "edithistory": [] }

  }


  render() {

    console.log(this.state.tree_data)


    if (this.state.selected !== null) {
      var transform = []

      if (this.transform_type !== null) {
        transform.push(<ReflexElement className="workboard" minSize="50" flex={0.5}> <GraphView update={this.updateGraphData.bind(this)} toolbarRef={this.toolbarRef} allow_editing={false} selected={this.state.selected} triggerTransformationProp={this.triggerTransformation.bind(this)} selected_graphdata={JSON.parse(JSON.stringify(this.state.graphdata.modular_pkgs[this.state.selected]))} /> </ReflexElement>)
        transform.push(<ReflexSplitter />)
        transform.push(<ReflexElement className="workboard" minSize="50" flex={0.5}><GraphView update={this.updateGraphData.bind(this)} toolbarRef={this.toolbarRef} allow_editing={false} selected={this.state.selected} triggerTransformationProp={this.triggerTransformation.bind(this)} transform={true} selected_graphdata={JSON.parse(JSON.stringify(this.state.transformation_display))} /></ReflexElement>)
      } else {
        transform.push(<ReflexElement flex={1} className="workboard" minSize="50">
          <GraphView updateSelected={this.updateSelectedMeta.bind(this)} onSave={(newGraphData) => this.updateSelectedGraphdata(newGraphData)} update={this.updateGraphData.bind(this)} toolbarRef={this.toolbarRef} allow_editing={true} selected={this.state.selected} triggerTransformationProp={this.triggerTransformation.bind(this)} selected_graphdata={JSON.parse(JSON.stringify(this.state.graphdata.modular_pkgs[this.state.selected]))} />
        </ReflexElement>)
      }

      var code = { "oracles": this.state.graphdata.modular_pkgs[this.state.selected].oracles, "graph": this.state.graphdata.modular_pkgs[this.state.selected].graph, "reduction": this.state.graphdata.modular_pkgs[this.state.selected].reduction }

      var code_editor = [<CodeEditor mod_packs={this.state.graphdata != null ? Object.keys(this.state.graphdata.modular_pkgs) : []} mon_packs={this.state.graphdata != null ? Object.keys(this.state.graphdata.modular_pkgs[this.state.selected].graph) : []} text={JSON.stringify(code, null, '\t')} onSubmit={(newGraphData) => this.updateSelectedGraphdata(newGraphData)} getLineNumber={this.lineNumberOfSelected.bind(this)} />]

      var transform_code = { "to_run": this.state.graphdata.modular_pkgs[this.state.selected].to_run == null ? {} : this.state.graphdata.modular_pkgs[this.state.selected].to_run, "history": this.state.graphdata.modular_pkgs[this.state.selected].history == null ? {} : this.state.graphdata.modular_pkgs[this.state.selected].history }

      var transform_editor = [<CodeEditor mod_packs={this.state.graphdata != null ? Object.keys(this.state.graphdata.modular_pkgs) : []} mon_packs={this.state.graphdata != null ? Object.keys(this.state.graphdata.modular_pkgs[this.state.selected].graph) : []} text={JSON.stringify(transform_code, null, '\t')} onSubmit={(newTransformations) => this.updateSelectedTransformations(newTransformations)} getLineNumber={this.lineNumberOfSelected.bind(this)} />]


    } else {
      var transform = <div></div>
      var code_editor = <div></div>
      var transform_editor = <div></div>
    }


    console.log(this)

    return (
      <ReflexContainer style={{ height: "100vh" }} orientation="horizontal">
        <ReflexElement flex={0.05} className="video-panels">

          <Stack direction="row" spacing={1}>

            <input type="file" style={{ 'display': 'none' }} ref={input => this.projUpload = input} onChange={this.onProjectUpload.bind(this)} id="proj_upload" />
            <CustomIconButton tip="Import project file" type={["import"]} func={() => this.projUpload.click()} />
            <CustomIconButton tip="Create new project file" type={["write"]} func={this.createProj.bind(this)} />
            <CustomIconButton tip="Export current project file" type={["save"]} func={() => saveFile(new Blob([JSON.stringify(this.state.graphdata, null, 2)], { type: 'application/json' }), "exported_project.json")} />
            <CustomIconButton tip="Export current selected and children to XML" type={["code"]} func={() => saveFile(new Blob([getMxFile(this.state.graphdata, this.state.tree_data, this.state.selected)], { type: 'application/xml' }), "exported_diagrams.drawio")} />

          </Stack>


        </ReflexElement>
        <ReflexSplitter />
        <ReflexElement flex={0.95} className="site-content">
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
                        <input type="file" style={{ 'display': 'none' }} ref={input => this.transformUpload = input} onChange={this.onTransformUpload.bind(this)} id="transform_upload" />
                        <CustomIconButton tip="Import transformations" type={["import", "transform"]} func={() => this.transformUpload.click()} />
                        <CustomIconButton tip="Run transformations" type={["run", "transform"]} func={() => {
                          var graphdata;
                          var tree_data;
                          [graphdata, tree_data] = runScriptedTransformations(this.state.selected, JSON.parse(JSON.stringify(this.state.graphdata)), JSON.parse(JSON.stringify(this.state.tree_data)))
                          this.setState({ graphdata, tree_data })
                        }} />
                        <CustomIconButton tip="Clear transformation history" type={["clear", "history"]} func={() => this.updateSelectedTransformations({ 'to_run': this.state.graphdata.modular_pkgs[this.state.selected].to_run, "history": {} })} />

                      </Stack>

                    </ReflexElement>
                    <ReflexSplitter />
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
                <ReflexElement flex={this.transform_type == null ? 0.05 : 0}>
                  <div ref={this.toolbarRef} style={{ backgroundColor: "#F9F6EE", height: "100%", width: "100%" }} id="divGraph" />
                </ReflexElement>
                <ReflexSplitter />
                <ReflexElement flex={this.transform_type == null ? 0.95 : 0.85}>
                  <ReflexContainer>
                    {transform}
                  </ReflexContainer>
                </ReflexElement>
                <ReflexSplitter />
                <ReflexElement flex={this.transform_type == null ? 0 : 0.15} className="video-panels">
                  <TransformationTools update={this.updateGraphData.bind(this)} allGraphData={this.state.graphdata} type={this.transform_type} node={this.transform_node} base={this.state.transformation_base} />
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
                        <input type="file" style={{ 'display': 'none' }} ref={input => this.graphUpload = input} onChange={this.onGraphUpload.bind(this)} id="graph_upload" />
                        <CustomIconButton tip="Import graph" type={["add", "import"]} func={Object.keys(this.state.graphdata).length !== 0 ? () => this.graphUpload.click() : () => alert("Please open a project file to add graphs.")} />
                        <CustomIconButton tip="Write new graph" type={["add", "write"]} func={() => this.updateGraphData({ "oracles": [["package", "oracle_[1]"]], "graph": { "package": [["", "outgoing_[1]"]] } }, true, window.prompt("Please input a name for the new graph"))} />
                      </Stack>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement flex={0.9} minSize="100">
                      <CustomTreeView treeData={this.state.tree_data} onSelect={this.selectGraph.bind(this)} deleteNode={this.graphDelete.bind(this)} />
                    </ReflexElement>
                  </TabPanel>
                  <TabPanel>
                    <ReflexElement flex={1} className="video-panels" >
                      <Packages graphdata={this.state.graphdata} />
                    </ReflexElement>
                  </TabPanel>
                </Tabs>
              </ReflexContainer>
            </ReflexElement>

          </ReflexContainer>
        </ReflexElement>
      </ReflexContainer>
    );
  }
}


