import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import CreateIcon from '@mui/icons-material/Create';
import IconButton from "@mui/material/IconButton";
import DeleteIcon from '@mui/icons-material/Delete';
import PublishIcon from '@mui/icons-material/Publish';
import Tooltip from '@mui/material/Tooltip';
import SaveIcon from '@mui/icons-material/Save';
import ListIcon from '@mui/icons-material/List';

export default function CustomIconButton(props) {
    
    let items = []

    for(var elm in props.type){

            switch(props.type[elm]) {
                case 'add':
                    items.push(<AddIcon/>)
                    break;
                case 'list':
                    items.push(<ListIcon/>)
                    break;
                case 'sub':
                    items.push(<RemoveIcon/>)
                    break;
                case 'save':
                    items.push(<SaveIcon/>)
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

    let tip = props.tip
    
    return (

        <Tooltip title={tip}>
        <IconButton onClick={props.func} aria-label="delete">
            {items}
        </IconButton>
        </Tooltip>
    );
  }
  