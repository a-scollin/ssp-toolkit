import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';

export function CustomDecomposePopup(props) {
  const { onChoice, open, packs} = props;

  const handleListItemClick = (value) => {
    onChoice(value);
  };

  return (
    <Dialog open={open}>
      <DialogTitle>Choose package to decompose:</DialogTitle>
      <List sx={{ pt: 0 }}>
        {packs.map((pack) => (
          <ListItem button onClick={() => handleListItemClick(pack)} key={pack}>
            <ListItemText primary={pack} />
          </ListItem>
        ))}
      </List>
    </Dialog>
  );
}