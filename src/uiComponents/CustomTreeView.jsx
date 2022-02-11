import * as React from 'react';
import PropTypes from 'prop-types';
import TreeView from '@mui/lab/TreeView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItem, { useTreeItem } from '@mui/lab/TreeItem';
import clsx from 'clsx';
import Typography from '@mui/material/Typography';

import CustomIconButton from './CustomIconButton'


export default function CustomTreeView(outerprops) {

    const CustomContent = React.forwardRef(function CustomContent(props, ref) {
      console.log(props)
        const {
          classes,
          className,
          label,
          nodeId,
          icon: iconProp,
          expansionIcon,
          displayIcon,
        } = props;
      
        const {
          disabled,
          expanded,
          selected,
          focused,
          handleExpansion,
          handleSelection,
          preventSelection,
        } = useTreeItem(nodeId);
      
        const icon = iconProp || expansionIcon || displayIcon;
      
        const handleMouseDown = (event) => {
          preventSelection(event);
        };
      
        const handleExpansionClick = (event) => {
          handleExpansion(event);
        };
      
        const handleSelectionClick = (event) => {
            outerprops.select(event.target.textContent)
            handleSelection(event);
          };
      
        return (
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions
          <div
            className={clsx(className, classes.root, {
              [classes.expanded]: expanded,
              [classes.selected]: selected,
              [classes.focused]: focused,
              [classes.disabled]: disabled,
            })}
            onMouseDown={handleMouseDown}
            ref={ref}
          >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
            <div onClick={handleExpansionClick} className={classes.iconContainer}>
              {icon}
            </div>
            <Typography
              onClick={handleSelectionClick}
              component="div"
              className={classes.label}
            >
              {label}
            </Typography>

            <CustomIconButton tip="Test" type={["add"]} func={() => props.deleteGraph(label)}/>
          </div>
        );
      });
      
      CustomContent.propTypes = {
        /**
         * Override or extend the styles applied to the component.
         */
        classes: PropTypes.object.isRequired,
        /**
         * className applied to the root element.
         */
        className: PropTypes.string,
        /**
         * The icon to display next to the tree node's label. Either a parent or end icon.
         */
        displayIcon: PropTypes.node,
        /**
         * The icon to display next to the tree node's label. Either an expansion or collapse icon.
         */
        expansionIcon: PropTypes.node,
        /**
         * The icon to display next to the tree node's label.
         */
        icon: PropTypes.node,
        /**
         * The tree node label.
         */
        label: PropTypes.node,
        /**
         * The id of the node.
         */
        nodeId: PropTypes.string.isRequired,
      };
      
      const CustomTreeItem = (props) => (
        <TreeItem ContentComponent={CustomContent} {...props} />
      );

      function renderChildren(children, deleteGraph){

        var items = []
    
        for(var child in children){
    
            console.log(children)
            console.log(child)
    
            items.push(<CustomTreeItem nodeId={children[child].graphname} ContentProps={{'deleteGraph' : deleteGraph}} label={children[child].title}>{renderChildren(children[child].children, deleteGraph)}</CustomTreeItem>)
    
        }
    
        return items
    
    }
    
    console.log(outerprops)
  return (
    <TreeView
      aria-label="icon expansion"
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      sx={{ height: 240, flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
    >
     {
         renderChildren(outerprops.tree_data, outerprops.deleteGraph)
     }
    </TreeView>
  );
}
