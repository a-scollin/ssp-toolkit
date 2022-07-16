import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';

/** 
 * Custom popup for selecting items from a list
 * 
 * @param {Object} props - Attributes: title, open, items, onChoice
 * @property {String} title - Title of popup 
 * @property {boolean} open - Specifies if popup is active 
 * @property {String} [items] - Names to select
 * @property {function} onChoice - Triggered on selection, takes selected value as a string.
*/


export function CustomPopup(props) {
  const { onChoice, open, items, title } = props;

  // Mui list reqiures a callback
  const handleListItemClick = (value) => {
    onChoice(value);
  };

  return (
    <Dialog open={open}>
      <DialogTitle>{title}</DialogTitle>
      <List sx={{ pt: 0 }}>
        {items.map((item) => (
          <ListItem button onClick={() => handleListItemClick(item)} key={item}>
            <ListItemText primary={item} />
          </ListItem>
        ))}
      </List>
    </Dialog>
  );
}