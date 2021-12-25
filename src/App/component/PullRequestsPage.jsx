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
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
}))

function PullRequestsPage(prop) {
  const classes = useStyles()
  const [pullRequestListData, setPullRequestListData] = useState([])
  const [dataForPullRequestChart, setDataForPullRequestChart] = useState({ labels: [], data: { opened: [], closed: [], merged: [] } })

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

  const getPullRequestsFromGitHub = () => {
    const githubRepo = currentProject.repositoryDTOList.find(repo => repo.type === 'github')
    if (githubRepo !== undefined) {
      const query = githubRepo.url.split("github.com/")[1]

      // todo need reafctor with async
      Axios.get(`http://localhost:9100/pvs-api/github/pullRequests/${query}`,
        { headers: { "Authorization": `${jwtToken}` } })
        .then((response) => {
          if (response?.data) {
            setPullRequestListData(response.data)
          }
        })
        .catch((e) => {
          alert(e.response?.status);
          console.error(e)
        })
    }
  }

  useEffect(() => {
    if (Object.keys(currentProject).length !== 0) {
      handleToggle()
      getPullRequestsFromGitHub()
      handleClose()
    }
  }, [currentProject, prop.startMonth, prop.endMonth])

  // Generate the pull-request chart
  useEffect(() => {
    const { startMonth, endMonth } = prop
    let chartDataset = { labels: [], data: { merged: [], closed: [], opened: [] } }
    let pullRequestListDataSortedByCreatedAt = pullRequestListData
    let pullRequestListDataSortedByClosedAt = pullRequestListData
    let pullRequestListDataSortedByMergedAt = pullRequestListData

    // Sort data by date
    if (pullRequestListData !== undefined) {
      [].slice.call(pullRequestListDataSortedByCreatedAt).sort((a, b) => a.createdAt - b.createdAt);
      [].slice.call(pullRequestListDataSortedByClosedAt).sort((a, b) => a.closedAt - b.closedAt);
      [].slice.call(pullRequestListDataSortedByMergedAt).sort((a, b) => a.mergedAt - b.mergedAt);
    }

    if (pullRequestListDataSortedByCreatedAt.length > 0) {
      // Calculate the number of pull requests for each month in the selected range
      for (let month = moment(startMonth); month < moment(endMonth).add(1, 'months'); month = month.add(1, 'months')) {
        let index
        let noCloseCount = 0  // Number of pull requests without 'closedAt' date
        let noMergeCount = 0  // Number of pull requests without 'mergedAt' date
        chartDataset.labels.push(month.format("YYYY-MM"))

        index = pullRequestListDataSortedByCreatedAt.findIndex(pullRequest => {
          return moment(pullRequest.createdAt).year() > month.year() || moment(pullRequest.createdAt).year() === month.year() && moment(pullRequest.createdAt).month() > month.month()
        })
        chartDataset.data.opened.push(index === -1 ? pullRequestListData.length : index)

        index = pullRequestListDataSortedByClosedAt.findIndex(pullRequest => {
          if (pullRequest.closedAt == null) {
            noCloseCount += 1
          }
          return moment(pullRequest.closedAt).year() > month.year() || moment(pullRequest.closedAt).year() === month.year() && moment(pullRequest.closedAt).month() > month.month()
        })
        chartDataset.data.closed.push(index === -1 ? pullRequestListData.length - noCloseCount : index)

        index = pullRequestListDataSortedByMergedAt.findIndex(pullRequest => {
          console.log(moment(pullRequest.mergedAt).month())
          if (pullRequest.mergedAt == null) {
            noMergeCount += 1
          }
          return moment(pullRequest.mergedAt).year() > month.year() || moment(pullRequest.mergedAt).year() === month.year() && moment(pullRequest.mergedAt).month() > month.month()
        })
        chartDataset.data.merged.push(index === -1 ? pullRequestListData.length - noMergeCount : index)
      }
    }
    setDataForPullRequestChart(chartDataset)
  }, [pullRequestListData, prop.startMonth, prop.endMonth])

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

      {/* Pull-Request Chart */}
      <div className={classes.root}>
        <div style={{ width: "67%" }}>
          <div>
            <h1>Team</h1>
            <div>
              <DrawingBoard data={dataForPullRequestChart} color='skyblue' id="team-pull-request-chart" isIssue={true} />
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

export default connect(mapStateToProps)(PullRequestsPage);
