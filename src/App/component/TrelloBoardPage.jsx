//import {useEffect, useState} from 'react'
import {makeStyles} from '@material-ui/core/styles'
//import {Backdrop, CircularProgress, MenuItem, Select} from '@material-ui/core'
//import {connect} from 'react-redux'
//import {Redirect} from 'react-router-dom'

import data from "../../data.json";
import Board from "react-trello";

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    '& > *': {
      margin: theme.spacing(1),
    },
    minWidth: '30px',
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
}))

function TrelloBoardPage() {

  const classes = useStyles()
  return (
    <div style={{marginLeft: "10px"}}>
      <div className={classes.root}>
        <Board
          data={data}
          draggable
          editable
          canAddLanes
          addLaneTitle="Add Column"
          addCardTitle="Add Item"
        />
      </div>
    </div>
  );
}

export default TrelloBoardPage;