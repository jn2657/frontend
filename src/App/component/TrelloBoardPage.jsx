import {useEffect, useState} from 'react'
import {makeStyles} from '@material-ui/core/styles'
import Axios from 'axios'

import Board from "react-trello";
import { createTranslate } from 'react-trello'

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
  const [boardData, setBoardData] = useState({})
  const [hasBoardData, setHasBoardData] = useState(false)
  const [currentProject, setCurrentProject] = useState({})

  const projectId = localStorage.getItem("projectId")
  const jwtToken = localStorage.getItem("jwtToken")

  useEffect(() => {
    Axios.get(`http://localhost:9100/pvs-api/project/1/${projectId}`,
      {headers: {"Authorization": `${jwtToken}`}})
      .then((response) => {
        setCurrentProject(response.data)
      })
      .catch((e) => {
        alert(e.response.status)
        console.error(e)
      })
  }, [])

  const getTrelloData = () => {
    const trelloBoard = currentProject.repositoryDTOList.find(repo => repo.type === 'trello')
    if (trelloBoard !== undefined) {
      Axios.get(`http://localhost:9100/pvs-api/repository/trello/check?url=${trelloBoard.url}` ,
      {headers: {"Authorization": `${jwtToken}`}})
      .then(
        Axios.get(`http://localhost:9100/pvs-api/trello/board?url=${trelloBoard.url}` ,
        {headers: {"Authorization": `${jwtToken}`}})
        .then((response) => {
          setBoardData(response.data)
          setHasBoardData(true)
        })
        .catch((e) => {
          alert(e.response.status)
          console.error(e)
        })
      )
      .catch((e) => {
        alert(e.response.status)
        console.error(e)
      })
    }
  }

  const TEXTS = {
    "Add another lane": "NEW LANE",
    "Click to add card": "Click to add card",
    "Delete lane": "Delete lane",
    "Lane actions": "Lane actions",
    "button": {
      "Add lane": "Add lane",
      "Add card": "ADD CARD",
      "Cancel": "Cancel"
    },
    "placeholder": {
      "title": "title",
      "description": "description",
      "label": "label"
    }
  }

  useEffect(() => {
    if (Object.keys(currentProject).length !== 0) {
      getTrelloData()
    }
  }, [currentProject])

  return (
    <div style={{marginLeft: "10px"}}>
      <div className={classes.root}>
        {hasBoardData &&
        <Board
          data={boardData}
          canAddLanes
          t={createTranslate(TEXTS)}
        />
        }
      </div>
    </div>
  );
}

export default TrelloBoardPage;
