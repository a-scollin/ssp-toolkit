import * as React from 'react';
import PropTypes from 'prop-types';
import TreeView from '@mui/lab/TreeView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItem, { useTreeItem } from '@mui/lab/TreeItem';
import clsx from 'clsx';
import Typography from '@mui/material/Typography';

/** 
 * Non-stateful treeview component used for selecting graph to work on
 * 
 * @param {Object} props - Attributes: treeData, onSelect, deleteNode
 * @property {Object} treeData - Structed as mui rich object, https://mui.com/material-ui/react-tree-view/
 * @property {function} onSelect - Triggered when object is selected, takes string of value selected 
 * @property {function} deleteNode - !Needs linked to TreeItem for deleting a node, takes string of value selected for deletion
*/

// Chore : Add functionality for reuse in ordering scripted transformations  

export default function CustomTreeView(props) {

  // Following tutorial for custom mui TreeItem 
  const CustomContent = React.forwardRef(function CustomContent(innerProps, ref) {
    const {
      classes,
      className,
      label,
      nodeId,
      icon: iconProp,
      expansionIcon,
      displayIcon,
    } = innerProps;

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
      props.onSelect(event.target.textContent)
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
        {
          /* Chore : Add delete button, this already works but looks terrible
           <CustomIconButton tip="Test" type={["add"]} func={() => innerProps.deleteGraph(label)}/>  
           */
        }
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

  const CustomTreeItem = (innerProps) => (
    <TreeItem ContentComponent={CustomContent} {...innerProps} />
  );

  function renderChildren(children, deleteGraph) {

    var items = []

    for (var child in children) {

      items.push(<CustomTreeItem nodeId={children[child].graphname} ContentProps={{ 'deleteGraph': deleteGraph }} label={children[child].title}>{renderChildren(children[child].children, deleteGraph)}</CustomTreeItem>)

    }

    return items

  }


  return (
    <TreeView
      aria-label="icon expansion"
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      sx={{ height: '100%', flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
    >
      {
        renderChildren(props.treeData, props.deleteGraph)
      }
    </TreeView>
  );
}
