import {useState, useEffect} from 'react'
import {useHistory} from 'react-router-dom'
import {makeStyles} from '@material-ui/core/styles'
import {Box, CardActionArea, Avatar, CardActions, IconButton} from '@material-ui/core'
import GitHubIcon from '@material-ui/icons/GitHub';
import FilterDramaIcon from '@material-ui/icons/FilterDrama';
import GpsFixedIcon from '@material-ui/icons/GpsFixed';
import DashboardIcon from '@material-ui/icons/Dashboard';
import AddIcon from '@material-ui/icons/Add';
import AddRepositoryDialog from './AddRepositoryDialog';
import {connect} from 'react-redux'
import {setCurrentProjectId} from '../../redux/action'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@material-ui/core'
import Axios from "axios"

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    '& > *': {
      margin: theme.spacing(1),
    },
  },
  small: {
    width: theme.spacing(10),
    height: theme.spacing(10),
  },
  large: {
    width: theme.spacing(25),
  },
  icon: {},
  avatar: {
    width: "100%",
    height: "100%"
  }
}))

function ProjectAvatar(props) {
  const classes = useStyles()
  const history = useHistory()

  const [addRepoDialogOpen, setAddRepoDialogOpen] = useState(false)
  const [hasGithubRepo, setHasGithubRepo] = useState(false)
  const [hasGitlabRepo, setHasGitlabRepo] = useState(false)
  const [hasSonarRepo, setHasSonarRepo] = useState(false)
  const [hasTrelloBoard, setHasTrelloBoard] = useState(false)
  const [deletionAlertDialog, setDeletionAlertDialog] = useState(false)
  const jwt = localStorage.getItem("jwtToken")

  useEffect(() => {
    if (props.size === 'large') {
      const getGithubRepo = props.project.repositoryDTOList.find(x => x.type === "github")
      const getGitlabRepo = props.project.repositoryDTOList.find(x => x.type === "gitlab")
      const getSonarRepo = props.project.repositoryDTOList.find(x => x.type === "sonar")
      const getTrelloBoard = props.project.repositoryDTOList.find(x => x.type === "trello")

      setHasGithubRepo(getGithubRepo !== undefined)
      setHasGitlabRepo(getGitlabRepo !== undefined)
      setHasSonarRepo(getSonarRepo !== undefined)
      setHasTrelloBoard(getTrelloBoard !== undefined)
    }
  }, [props.project])

  const goToCommit = () => {
    localStorage.setItem("projectId", props.project.projectId)
    props.setCurrentProjectId(props.project.projectId)
    history.push("/commits")
  }

  const goToCodeCoverage = () => {
    localStorage.setItem("projectId", props.project.projectId)
    props.setCurrentProjectId(props.project.projectId)
    history.push("/code_coverage")
  }

  const goToDashboard = () => {
    localStorage.setItem("projectId", props.project.projectId)
    props.setCurrentProjectId(props.project.projectId)
    history.push("/dashboard")
  }

  const goToTrelloBoard = () => {
    localStorage.setItem("projectId", props.project.projectId)
    props.setCurrentProjectId(props.project.projectId)
    history.push("/trello_board")
  }

  const showAddRepoDialog = () => {
    setAddRepoDialogOpen(true)
  }

  const toggleDeletionAlertDialog = () => {
    setDeletionAlertDialog(!deletionAlertDialog)
  }

  const deleteProject = () => {
    Axios.delete(`http://localhost:9100/pvs-api/project/remove/${props.project.projectId}`,
      {headers: {...(jwt && {"Authorization": jwt})}})  // If jwt is null, it will return {} to headers. Otherwise it will return {"Authorization": jwt}
      .then(() => {
        toggleDeletionAlertDialog()
        props.reloadProjects()
      })
      .catch((e) => {
        console.error(e)
      })
  }

  return (
    <span>
      <Box className={props.size === 'large' ? classes.large : classes.small}>
      {props.size === 'large' &&
      <Button onClick={toggleDeletionAlertDialog}>X</Button>
      }
      <Dialog
      open={deletionAlertDialog}
      onClose={toggleDeletionAlertDialog}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description">
        <DialogTitle id="alert-dialog-title">
          {"Are You Sure You Want to Delete This Project?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            You cannot restore it after deleting.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={toggleDeletionAlertDialog}>Back</Button>
          <Button onClick={deleteProject} autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
        <CardActionArea onClick={goToDashboard}>
          <Avatar alt="first repository" src={props.project.avatarURL} className={classes.avatar}/>
          {props.size === 'large' &&
          <p style={{"textAlign": "center"}}>{props.project.projectName}</p>
          }
        </CardActionArea>

        {props.size === 'large' &&
        <CardActions disableSpacing>

          {hasGithubRepo &&
          <IconButton aria-label="GitHub" onClick={goToCommit}>
            <GitHubIcon/>
          </IconButton>
          }

          {hasGitlabRepo &&
          <IconButton aria-label="GitLab" onClick={goToCommit}>
            <FilterDramaIcon/>
          </IconButton>
          }

          {hasSonarRepo &&
          <IconButton aria-label="SonarQube" onClick={goToCodeCoverage}>
            <GpsFixedIcon/>
          </IconButton>
          }

          {hasTrelloBoard &&
          <IconButton aria-label="Trello" onClick={goToTrelloBoard}>
            <DashboardIcon/>
          </IconButton>
          }

          {!((hasGithubRepo || hasTrelloBoard) && hasSonarRepo && hasTrelloBoard) &&
          <IconButton aria-label="Add Repository" onClick={showAddRepoDialog}>
            <AddIcon/>
          </IconButton>
          }

        </CardActions>
        }
      </Box>
      <AddRepositoryDialog
        open={addRepoDialogOpen}
        reloadProjects={props.reloadProjects}
        handleClose={() => setAddRepoDialogOpen(false)}
        projectId={props.project.projectId}
        hasGitRepo={hasGithubRepo || hasGitlabRepo}
        hasSonar={hasSonarRepo}
        hasTrello={hasTrelloBoard}
      />
    </span>
  )
}

export default connect(null, {setCurrentProjectId})(ProjectAvatar);
