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
import TransformIcon from '@mui/icons-material/Transform';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ClearIcon from '@mui/icons-material/Clear';
import HistoryIcon from '@mui/icons-material/History';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import PendingIcon from '@mui/icons-material/Pending';
import CodeIcon from '@mui/icons-material/Code';


/** 
 * Custom button with icons and tooltip
 * 
 * @param {Object} props - Attributes: type, tip, func 
 * @property {String} [type] - Names of icons to appear in button (appear in order)
 * @property {String} tip - Tooltip to appear on hover
 * @property {function} func - Function the button triggers
*/

export default function CustomIconButton(props) {

    let icons = []

    for (var elm in props.type) {
        switch (props.type[elm]) {
            case 'add':
                icons.push(<AddIcon />)
                break;
            case 'list':
                icons.push(<ListIcon />)
                break;
            case 'sub':
                icons.push(<RemoveIcon />)
                break;
            case 'save':
                icons.push(<SaveIcon />)
                break;
            case 'write':
                icons.push(<CreateIcon />)
                break;
            case 'export':
                icons.push(<ExitToAppIcon />)
                break;
            case 'delete':
                icons.push(<DeleteIcon />)
                break;
            case 'import':
                icons.push(<PublishIcon />)
                break;
            case 'transform':
                icons.push(<TransformIcon />)
                break;
            case 'run':
                icons.push(<PlayArrowIcon />)
                break;
            case 'clear':
                icons.push(<ClearIcon />)
                break;
            case 'copy':
                icons.push(<ContentCopyIcon />)
                break;
            case 'history':
                icons.push(<HistoryIcon />)
                break;
            case 'partial':
                icons.push(<AutoGraphIcon />)
                break;
            case 'ghost':
                icons.push(<PendingIcon />)
                break;
            case 'code':
                icons.push(<CodeIcon />)
                break;
            default:
                break;
        }
    }

    return (

        <Tooltip title={props.tip}>
            <IconButton onClick={() => props.func(props.func)} aria-label="delete">
                {icons}
            </IconButton>
        </Tooltip>
    );
}
