
  // For parsing in the json or xml files 

  export function resolveInput(file, callback){
    
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
    
    
    }else if (file.name.split('.').pop().toLowerCase() == "xml" || file.name.split('.').pop().toLowerCase() == "drawio") {
      try {        

        var XMLParser = require('react-xml-parser');
        var xml = new XMLParser().parseFromString(event.target.result.replace(/&lt;(.*?)&gt;/g,""));    // Assume xmlText contains the example XML

        json_data = resolve_xml_to_json(xml)

    } catch (e) {
        alert("Please enter a valid XML file");
        return;
    }
    
    }else {
      alert("Please enter a JSON or XML file.");
      return;
    }

    var new_data = {}

    new_data['modular_pkgs'] = {}

    if(json_data.hasOwnProperty("modular_pkgs")){

      for(var graph in json_data.modular_pkgs){

        new_data.modular_pkgs[graph] = json_data.modular_pkgs[graph]
  
      }

    }else if(json_data.hasOwnProperty("graph")){

        callback(json_data)

        return 

    }

    if(json_data.hasOwnProperty("monolithic_pkgs")){

      new_data['monolithic_pkgs'] = json_data['monolithic_pkgs']

    }
    
    callback(new_data)

    return

  }

  try {

  reader.readAsText(file);

  } catch (e) {
    alert(e)
    return
  }

}


function resolve_xml_to_json(xml){

    var json_data = {modular_pkgs : {}}

    for(var diagram in xml.children){

      var sub, data
      [sub, data] = resolve_diagram_to_json(xml.children[diagram].children[0].children[0].children)


      var title = xml.children[diagram].attributes.name

      if(sub){
        title += " - SUBGRAPH"
      }
      
      json_data.modular_pkgs[title] = data 
    }

    return json_data
    
    
  }

export function resolve_diagram_to_json(cells,parent_id="1"){
    
    var thegraph = {oracles : [], graph : {}}

    var packids = {}
    
    var pack_names = []

    var pack_index = {}

    var sub = false

    for(var cell in cells){

      var thecell = cells[cell]

      if(!thecell.attributes.hasOwnProperty("style")){
        thecell.attributes.style = ""
      }

      if(thecell.name !== "mxCell"){
        throw "Not correct format!";
      }

      if(!thecell.attributes.hasOwnProperty("value")){
        continue;
      }else{

        if(!thecell.attributes.hasOwnProperty("connectable") & !thecell.attributes.hasOwnProperty("target") & !thecell.attributes.hasOwnProperty("source")){
          
          if(thecell.attributes.value.split("_[").length === 1){
            pack_names.push(thecell.attributes.value + '_[1]')
          }else{
            pack_names.push(thecell.attributes.value)
          }
        }
      
      }

    }

    var dupl = pack_names.reduce(function(list, item, index, array) { 
      if (array.indexOf(item, index + 1) !== -1 && list.indexOf(item) === -1) {
        list.push(item);
      }

      return list;
    }, []);

    if(dupl.length > 0){

      for(var pack in dupl){

        if(dupl[pack].split("_[").length == 2){

          throw "Multiple packages of same name with same index."

        }
       
        alert("Warning! \"" + dupl[pack] + "\" appears multiple times, this packages index will be resolved automatically.")
          
        var max_index = 0
 
        for(var innerpack in pack_names){

          if(pack_names[innerpack].split('_[')[0] === dupl[pack] && pack_names[innerpack].split('_[').length === 2){

            // is numeric
            if(/^\d+$/.test(pack_names[innerpack].split('_[')[1].split(']')[0])){

            var index = parseInt(pack_names[innerpack].split('_[')[1].split(']')[0])
            if(index > max_index){

              max_index = index

            }

            }
          }
        }

        pack_index[dupl[pack]] = max_index

      }

    }

    for(var cell in cells){

      var thecell = cells[cell]

      if(!thecell.attributes.hasOwnProperty("value")){
        continue;
      }else{

        if(!thecell.attributes.hasOwnProperty("connectable") & !thecell.attributes.hasOwnProperty("target") & !thecell.attributes.hasOwnProperty("source")){
          
          var pack_name = thecell.attributes.value

          if(pack_index.hasOwnProperty(pack_name)){

            pack_index[pack_name] += 1

            pack_name = pack_name + '_['+ pack_index[pack_name] +']'

          }

          thegraph.graph[pack_name] = []

          packids[thecell.attributes.id] = pack_name
          
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
                
                thegraph.graph[packids[check.attributes.source]].push(["",thecell.attributes.value])
              
              }
    
            }
          }
    
    
        }else if ((thecell.attributes.parent == parent_id || thecell.attributes.parent.split('-').pop() == parent_id || (thecell.attributes.hasOwnProperty("source") && thecell.attributes.hasOwnProperty("target"))) && (thecell.attributes.hasOwnProperty("edge") || thecell.attributes.style.includes("Arrow")) && thecell.attributes.value != ""){



          if (thecell.attributes.hasOwnProperty("source") & thecell.attributes.hasOwnProperty("target")){
            thegraph.graph[packids[thecell.attributes.source]].push([packids[thecell.attributes.target],thecell.attributes.value])
          }else if  (thecell.attributes.hasOwnProperty("target")){
            thegraph.oracles.push([packids[thecell.attributes.target],thecell.attributes.value])

          }else if  (thecell.attributes.hasOwnProperty("source")){

            if(!sub){
              sub = true
              thegraph.graph['terminal_pkg'] = []
            }
            
            thegraph.graph[packids[thecell.attributes.source]].push(["",thecell.attributes.value])
          }
          
          

        }

      }

 


    }

    return [sub, thegraph];


  }