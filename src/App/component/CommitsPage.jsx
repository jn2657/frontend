import { useEffect, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import ProjectAvatar from './ProjectAvatar'
import DrawingBoard from './DrawingBoard'
import Axios from 'axios'
import moment from 'moment'
import { Backdrop, CircularProgress, MenuItem, Select } from '@material-ui/core'
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'
import { Button } from 'react-bootstrap'

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
  buttonContainer: {
    display: 'flex',
    '& > *': {
      margin: theme.spacing(1),
    },
    minWidth: '30px',
    alignItems: 'center',
    width: "67%",
    justifyContent: "space-between",
  }
}))

function CommitsPage(prop) {

  const classes = useStyles()
  const [commitListData, setCommitListData] = useState([])
  const [dataForTeamCommitChart, setDataForTeamCommitChart] = useState({ labels: [], data: { team: [] } })
  const [dataForMemberCommitChart, setDataForMemberCommitChart] = useState({ labels: [], data: {} })
  const [currentProject, setCurrentProject] = useState({})

  const [numberOfMember, setNumberOfMember] = useState(5)

  const [open, setOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const handleClose = () => {
    setOpen(false);
  };
  const handleToggle = () => {
    setOpen(!open);
  };

  const projectId = localStorage.getItem("projectId")
  const jwtToken = localStorage.getItem("jwtToken")

  // Get current project
  useEffect(() => {
    Axios.get(`http://localhost:9100/pvs-api/project/1/${projectId}`,
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

    let chartDataset = { labels: [], data: { team: [] } }
    for (let month = moment(startMonth); month <= moment(endMonth); month = month.add(1, 'months')) {
      chartDataset.labels.push(month.format("YYYY-MM"))
      chartDataset.data.team.push(commitListData.filter(commit => {
        return moment(commit.committedDate).format("YYYY-MM") === month.format("YYYY-MM")
      }).length)
    }

    setDataForTeamCommitChart(chartDataset)
  }, [commitListData, prop.startMonth, prop.endMonth])

  useEffect(() => {
    const { startMonth, endMonth } = prop

    let chartDataset = {
      labels: [],
      data: {}
    }
    new Set(commitListData.map(commit => commit.authorName)).forEach(author => {
      chartDataset.data[author] = []
    })
    for (let month = moment(startMonth); month <= moment(endMonth); month = month.add(1, 'months')) {
      chartDataset.labels.push(month.format("YYYY-MM"))
      for (const key in chartDataset.data) {
        chartDataset.data[key].push(0)
      }
      commitListData.forEach(commitData => {
        if (moment(commitData.committedDate).format("YYYY-MM") === month.format("YYYY-MM")) {
          chartDataset.data[commitData.authorName][chartDataset.labels.length - 1] += 1
        }
      })
    }
    let temp = Object.keys(chartDataset.data).map(key => [key, chartDataset.data[key]])
    temp.sort((first, second) => second[1].reduce((a, b) => a + b) - first[1].reduce((a, b) => a + b))
    let result = {}
    temp.slice(0, numberOfMember).forEach(x => {
      result[x[0]] = x[1]
    })
    chartDataset.data = result
    setDataForMemberCommitChart(chartDataset)
  }, [commitListData, prop.startMonth, prop.endMonth, numberOfMember])

  if (!projectId) {
    return (
      <Redirect to="/select" />
    )
  }

  //return commit charts
  return (
    <div style={{ marginLeft: "10px" }}>
      <Backdrop className={classes.backdrop} open={open}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <div className={classes.buttonContainer}>

        <span style={{ display: "flex", alignItems: "center" }}>
          {/* Project Avatar*/}
          <ProjectAvatar
            size="small"
            project={currentProject}
          />

          {/* Project Name */}
          <p style={{ margin: "0 1em" }}>
            <h2>{currentProject ? currentProject.projectName : ""}</h2>
          </p>
        </span>

        {/* Reload Button */}
        <Button
          disabled={isLoading}
          onClick={!isLoading ? handleClick : null}
        >
          {isLoading ? 'Loading…' : 'reload commits'}
        </Button>
      </div>

      <div className={classes.root}>
        <div style={{ width: "67%" }}>
          <div>
            <h1>Team</h1>
            <div>
              <DrawingBoard data={dataForTeamCommitChart} id="team-commit-chart" />
            </div>
            <div className={classes.root}>
              <h1>Member</h1>
              <Select
                labelId="number-of-member-label"
                id="number-of-member"
                value={numberOfMember}
                onChange={(e) => setNumberOfMember(e.target.value)}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={15}>15</MenuItem>
              </Select>
            </div>
            <div>
              <DrawingBoard data={dataForMemberCommitChart} id="member-commit-chart" />
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
    endMonth: state.selectedMonth.endMonth,
  }
}

export default connect(mapStateToProps)(CommitsPage);
