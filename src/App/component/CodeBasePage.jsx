import { useEffect, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import ProjectAvatar from './ProjectAvatar'
import DrawingBoard from './DrawingBoard'
import Axios from 'axios'
import moment from 'moment'
import { Backdrop, CircularProgress } from '@material-ui/core'
import { connect } from 'react-redux';
import { Button } from 'react-bootstrap';

const useStyles = makeStyles((theme) => ({
  root: {
    marginLeft: '10px',
  },
  chartContainer: {
    display: 'flex',
    '& > *': {
      margin: theme.spacing(1),
    },
    minWidth: '30px',
  },
  chart: {
    width: '67%',
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
  buttonContainer: {
    display: 'flex',
    '& > *': {
      margin: theme.spacing(1),
    },
    minWidth: '30px',
    alignItems: 'center',
    width: "67%",
    justifyContent: "space-between",
  },
  title: {
    display: 'flex',
    marginLeft: '15px',
    marginRight: '15px',
    alignItems: 'center',
  },
  avatar: {
    display: 'inline-block'
  },
  header: {
    display: 'flex',
    width: '95%'
  },
}))

function CodeBasePage(prop) {
  const classes = useStyles()
  const [commitListData, setCommitListData] = useState([])
  const [dataForCodeBaseChart, setDataForCodeBaseChart] = useState({ labels: [], data: { additions: [], deletions: [] } })

  const [currentProject, setCurrentProject] = useState({})

  const projectId = localStorage.getItem("projectId")
  const jwtToken = localStorage.getItem("jwtToken")
  const memberId = localStorage.getItem("memberId")

  const [open, setOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const handleClose = () => {
    setOpen(false);
  };
  const handleToggle = () => {
    setOpen(!open);
  };

  useEffect(() => {
    Axios.get(`http://localhost:9100/pvs-api/project/${memberId}/${projectId}`,
      { headers: { "Authorization": `${jwtToken}` } })
      .then((response) => {
        setCurrentProject(response.data)
      })
      .catch((e) => {
        alert(e.response?.status)
        console.error(e)
      })
  }, [])

  const getCommitFromGitHub = () => {
    const githubRepo = currentProject.repositoryDTOList.find(repo => repo.type === 'github')
    if (githubRepo !== undefined) {
      const query = githubRepo.url.split("github.com/")[1]
      Axios.post(`http://localhost:9100/pvs-api/github/commits/${query}`, "",
        { headers: { "Authorization": `${jwtToken}` } })
        .then(() => {
          getGitHubCommitFromDB()
          setLoading(false)
        })
        .catch((e) => {
          alert(e.response?.status)
          console.error(e)
        })
    }
  }

  const getGitHubCommitFromDB = () => {
    const githubRepo = currentProject.repositoryDTOList.find(repo => repo.type === 'github')
    if (githubRepo !== undefined) {
      const query = githubRepo.url.split("github.com/")[1]
      // todo need refactor with async
      Axios.get(`http://localhost:9100/pvs-api/github/commits/${query}`,
        { headers: { "Authorization": `${jwtToken}` } })
        .then((response) => {
          setCommitListData(response.data)
        })
        .catch((e) => {
          alert(e.response?.status)
          console.error(e)
        })
    }
  }

  const getCommitFromGitLab = () => {
    const gitlabRepo = currentProject.repositoryDTOList.find(repo => repo.type === 'gitlab')
    if (gitlabRepo !== undefined) {
      const query = gitlabRepo.url.split("gitlab.com/")[1]
      Axios.post(`http://localhost:9100/pvs-api/gitlab/commits/${query}`, "",
        { headers: { "Authorization": `${jwtToken}` } })
        .then(() => {
          getGitLabCommitFromDB()
          setLoading(false)
        })
        .catch((e) => {
          alert(e.response?.status)
          console.error(e)
        })
    }
  }

  const getGitLabCommitFromDB = () => {
    const gitlabRepo = currentProject.repositoryDTOList.find(repo => repo.type === 'gitlab')
    if (gitlabRepo !== undefined) {
      const query = gitlabRepo.url.split("gitlab.com/")[1]
      Axios.get(`http://localhost:9100/pvs-api/gitlab/commits/${query}`,
        { headers: { "Authorization": `${jwtToken}` } })
        .then((response) => {
          if (response?.data) {
            setCommitListData(previousArray => [...previousArray, ...response.data])
          }
        })
        .catch((e) => {
          alert(e.response?.status)
          console.error(e)
        })
    }
  }

  const handleClick = () => setLoading(true);

  // Default get commits from database
  useEffect(() => {
    if (Object.keys(currentProject).length !== 0) {
      handleToggle()
      getGitHubCommitFromDB()
      getGitLabCommitFromDB()
      handleClose()
    }
  }, [currentProject, prop.startMonth, prop.endMonth])

  // To reduce loading time, it will get/update commits from GitHub/GitLab only if the reload button is clicked.
  useEffect(() => {
    if (isLoading) {
      const githubRepo = currentProject.repositoryDTOList.find(repo => repo.type === 'github')
      const gitlabRepo = currentProject.repositoryDTOList.find(repo => repo.type === 'gitlab')
      if (githubRepo !== undefined) {
        getCommitFromGitHub()
      }
      if (gitlabRepo !== undefined) {
        getCommitFromGitLab()
      }
    }
  }, [isLoading]);

  useEffect(() => {
    const { startMonth, endMonth } = prop

    let chartDataset = { labels: [], data: { additions: [], deletions: [] } }
    for (let month = moment(startMonth); month <= moment(endMonth); month = month.add(1, 'months')) {
      chartDataset.labels.push(month.format("YYYY-MM"))

      chartDataset.data.additions.push(commitListData.filter(commit => {
        return moment(commit.committedDate).format("YYYY-MM") === month.format("YYYY-MM")
      })
        .reduce(function (additionSum, currentCommit) {
          return additionSum + currentCommit.additions;
        }, 0))
      chartDataset.data.deletions.push(commitListData.filter(commit => {
        return moment(commit.committedDate).format("YYYY-MM") === month.format("YYYY-MM")
      })
        .reduce(function (deletionSum, currentCommit) {
          return deletionSum - currentCommit.deletions;
        }, 0))
    }
    setDataForCodeBaseChart(chartDataset)
  }, [commitListData, prop.startMonth, prop.endMonth])

  return (
    <div className={classes.root}>
      <Backdrop className={classes.backdrop} open={open}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <header className={classes.header}>
        <div className={classes.header}>
          <ProjectAvatar
            size="small"
            project={currentProject}
            className={classes.avatar}
          />
          <h2 className={classes.title}>{currentProject ? currentProject.projectName : ""}</h2>
        </div>
        <div className={classes.buttonContainer}>
          {/* Reload Button */}
          <Button
            disabled={isLoading}
            onClick={!isLoading ? handleClick : null}
          >
            {isLoading ? 'Loading…' : 'reload commits'}
          </Button>
        </div>
      </header>

      <div className={classes.chartContainer}>
        <div className={classes.chart}>
          <div>
            <h1>Team</h1>
            <div>
              <DrawingBoard data={dataForCodeBaseChart} isCodeBase={true} id="team-codebase-chart" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const mapStateToProps = (state) => {
  return {
    startMonth: state.selectedMonth.startMonth,
    endMonth: state.selectedMonth.endMonth
  }
}

export default connect(mapStateToProps)(CodeBasePage);
