import { useEffect, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import ProjectAvatar from './ProjectAvatar'
import DrawingBoard from './DrawingBoard'
import Axios from 'axios'
import moment from 'moment'
import { Backdrop, CircularProgress } from '@material-ui/core'
import { connect } from 'react-redux';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    '& > *': {
      margin: theme.spacing(1),
    },
    minWidth: '30px',
    alignItems: 'center'
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
}))

function IssuesPage(prop) {
  const classes = useStyles()
  const [issueListData, setIssueListData] = useState([])
  const [dataForIssueChart, setDataForIssueChart] = useState({ labels: [], data: { created: [], closed: [] } })

  const [currentProject, setCurrentProject] = useState({})

  const projectId = localStorage.getItem("projectId")
  const jwtToken = localStorage.getItem("jwtToken")

  const [open, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
  };
  const handleToggle = () => {
    setOpen(!open);
  };

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

  const getIssueFromGitHub = () => {
    const githubRepo = currentProject.repositoryDTOList.find(repo => repo.type === 'github')
    if (githubRepo !== undefined) {
      const query = githubRepo.url.split("github.com/")[1]

      // todo need reafctor with async
      Axios.get(`http://localhost:9100/pvs-api/github/issues/${query}`,
        { headers: { "Authorization": `${jwtToken}` } })
        .then((response) => {
          setIssueListData(response.data)
        })
        .catch((e) => {
          alert(e);
          console.error(e)
        })
    }
  }

  const getIssueFromGitLab = () => {
    const gitlabRepo = currentProject.repositoryDTOList.find(repo => repo.type === 'gitlab')
    if (gitlabRepo !== undefined) {
      const query = gitlabRepo.url.split("gitlab.com/")[1]

      // todo need refactor with async
      Axios.get(`http://localhost:9100/pvs-api/gitlab/issues/${query}`,
        { headers: { "Authorization": `${jwtToken}` } })
        .then((response) => {
          if (response?.data) {
            setIssueListData(prevArray => ([...prevArray, ...response.data]))
          }
        })
        .catch((e) => {
          alert(e);
          console.error(e)
        })
    }
  }

  useEffect(() => {
    if (Object.keys(currentProject).length !== 0) {
      handleToggle()
      getIssueFromGitHub()
      getIssueFromGitLab()
      handleClose()
    }
  }, [currentProject, prop.startMonth, prop.endMonth])

  useEffect(() => {
    const { endMonth } = prop
    let chartDataset = { labels: [], data: { created: [], closed: [] } }
    let issueListDataSortedByCreatedAt = issueListData
    let issueListDataSortedByClosedAt = issueListData

    issueListDataSortedByCreatedAt.sort((a, b) => a.createdAt - b.createdAt)
    issueListDataSortedByClosedAt.sort((a, b) => a.closedAt - b.closedAt)

    if (issueListDataSortedByCreatedAt.length > 0) {
      for (let month = moment(issueListDataSortedByCreatedAt[0].createdAt); month <= moment(endMonth).add(1, 'months'); month = month.add(1, 'months')) {
        let index
        chartDataset.labels.push(month.format("YYYY-MM"))

        index = issueListDataSortedByCreatedAt.findIndex(issue => {
          return moment(issue.createdAt).year() > month.year() || moment(issue.createdAt).year() === month.year() && moment(issue.createdAt).month() > month.month()
        })
        chartDataset.data.created.push(index === -1 ? issueListData.length : index)

        index = issueListDataSortedByClosedAt.findIndex(issue => {
          return moment(issue.closedAt).year() > month.year() || moment(issue.closedAt).year() === month.year() && moment(issue.closedAt).month() > month.month()
        })
        chartDataset.data.closed.push(index === -1 ? issueListData.length : index)
      }
    }
    setDataForIssueChart(chartDataset)
  }, [issueListData])

  return (
    <div style={{ marginLeft: "10px" }}>
      <Backdrop className={classes.backdrop} open={open}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <div className={classes.root}>
        <ProjectAvatar
          size="small"
          project={currentProject}
        />
        <p>
          <h2>{currentProject.projectName}</h2>

        </p>
      </div>
      <div className={classes.root}>
        <div style={{ width: "67%" }}>
          <div>
            <h1>Team</h1>
            <div>
              <DrawingBoard data={dataForIssueChart} color='skyblue' id="team-issue-chart" isIssue={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const mapStateToProps = (state) => {
  return {
    endMonth: state.selectedMonth.endMonth
  }
}

export default connect(mapStateToProps)(IssuesPage);
