
import { getPopoverUtilityClass } from "@mui/material";
import { default as MxGraph } from "mxgraph";

export function buildMxFile(graphModels){

    var ret = '<?xml version="1.0" encoding="UTF-8"?><mxfile host="app.diagrams.net" version="16.5.6">'

    var cellContent;

    var id;

    var ids;

    var geom;

    for(var model in graphModels){

      ret += '<diagram id="diagram-' + model.toString() + '" name="' + graphModels[model][0] + '">'

      
      console.log(graphModels[model])
      
      ids = {}
      
    ret += '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>';

      id = 2;
      
      for(var i = 2; i < Object.keys(graphModels[model][1].cells).length; i++){
       
            cellContent = graphModels[model][1].cells[i]  
    
              if(cellContent.vertex){
                  
                if(cellContent.style === 'swimlane'){
                
                    continue 
                
                }
                
            
                // TODO Add export feature to consume the cells numbering _[x] => _{x}

                geom = '<mxGeometry x="' + cellContent.geometry.x.toString() + '" y ="' + cellContent.geometry.y.toString() + '" width="' + cellContent.geometry.width.toString() + '" height="' + cellContent.geometry.height.toString() + '" as="geometry"/>'
                
                ret += '<mxCell value="'+ cellContent.value.replace(/\n/g,"&lt;br&gt;") + '" id="' + id.toString() + '"  style="rounded=1;" parent="1"  vertex="1">'

                ret +=  geom
                
                ret += '</mxCell>'     

                ids[cellContent.value] = id
                    
                id += 1
                
              }    

    }

      for(var i = 0; i < Object.keys(graphModels[model][1].cells).length; i++){
        
        cellContent = graphModels[model][1].cells[i]  

          if(cellContent.edge){

              console.log(cellContent)    
            
              geom = '<mxGeometry width="50" relative="1" as="geometry"><Array as="points">'

              for(var point in cellContent.geometry.points){

                geom += '<mxPoint x="' + cellContent.geometry.points[point].x.toString() + '" y="' + cellContent.geometry.points[point].y.toString() + '"/>'

              }

              geom += '</Array>'

              geom += '</mxGeometry>'

              console.log(geom)

              ret += '<mxCell id="' + id.toString() + '" style="noEdgeStyle=1;orthogonal=1;" edge="1" parent="1" source="' + ids[cellContent.source.value].toString() + '" target="' + ids[cellContent.target.value].toString() + '">' + geom + '</mxCell>';
            
              id += 1 
              
              ret += '<mxCell id="'+ id.toString() + '" value="' + cellContent.value.replace(/\n/g,"&lt;br&gt;") + '" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];" vertex="1" connectable="0" parent="' + (id-1).toString() + '"><mxGeometry x="-0.205" y="-5" relative="1" as="geometry"><mxPoint as="offset"/></mxGeometry></mxCell>'
          
              id += 1
        }

      }

      ret += '</root></mxGraphModel>'

      ret += '</diagram>'

    }


    ret += '</mxfile>'

    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(ret,"text/xml");

    console.log(xmlDoc)

    console.log(ret)

}