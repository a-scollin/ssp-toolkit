import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';

export function CustomPopup(props) {
  const { onChoice, open, items, title} = props;

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