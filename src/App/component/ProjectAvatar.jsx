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

  return (
    <div>
      <Box className={props.size === 'large' ? classes.large : classes.small}>
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

          <IconButton aria-label="Add Repository" onClick={showAddRepoDialog}>
            <AddIcon/>
          </IconButton>
        </CardActions>
        }
      </Box>
      <AddRepositoryDialog
        open={addRepoDialogOpen}
        reloadProjects={props.reloadProjects}
        handleClose={() => setAddRepoDialogOpen(false)}
        projectId={props.project.projectId}
      />
    </div>
  )
}

export default connect(null, {setCurrentProjectId})(ProjectAvatar);
