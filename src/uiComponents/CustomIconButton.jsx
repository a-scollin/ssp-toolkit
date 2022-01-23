import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import CreateIcon from '@mui/icons-material/Create';
import IconButton from "@mui/material/IconButton";
import DeleteIcon from '@mui/icons-material/Delete';
import PublishIcon from '@mui/icons-material/Publish';
export default function CustomIconButton(props) {
    
    let items = []

    for(var elm in props.type){

            switch(props.type[elm]) {
                case 'add':
                    items.push(<AddIcon/>)
                    break;
                case 'sub':
                    items.push(<RemoveIcon/>)
                    break;
                case 'write':
                    items.push(<CreateIcon/>)
                    break;
                case 'export':
                    items.push(<ExitToAppIcon/>)
                    break;
                case 'delete':
                    items.push(<DeleteIcon/>)
                    break;
                case 'import':
                    items.push(<PublishIcon/>)
                    break;
                default:
                    break;
                  // code block
              }

    }
    
    return (
        <IconButton onClick={props.func} aria-label="delete">
            {items}
        </IconButton>
    );
  }
  