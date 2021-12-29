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

  const [loading, setLoading] = useState(false);
  const loadingEnd = () => {
    setLoading(false);
  };
  const isLoading = () => {
    setLoading(true);
  };

  const fetchCurrentProject = async () => {
    try {
      const response = await Axios.get(`http://localhost:9100/pvs-api/project/1/${projectId}`,
      { headers: { "Authorization": `${jwtToken}` } })
      setCurrentProject(response.data)
    } catch (e) {
      alert(e.response?.status)
      console.error(e)
    }
  }

  useEffect(() => {
    fetchCurrentProject()
  }, [])

  const getPullRequestsFromGitHub = async () => {
    const githubRepo = currentProject.repositoryDTOList.find(repo => repo.type === 'github')
    if (githubRepo !== undefined) {
      const query = githubRepo.url.split("github.com/")[1]
      try {
        const response = await Axios.get(`http://localhost:9100/pvs-api/github/pullRequests/${query}`,
        { headers: { "Authorization": `${jwtToken}` } })
        setPullRequestListData(response.data)
      } catch (e) {
        alert(e.response?.status);
        console.error(e)
      }
    }
  }

  useEffect(() => {
    if (Object.keys(currentProject).length !== 0) {
      isLoading()
      getPullRequestsFromGitHub()
      loadingEnd()
    }
  }, [currentProject, prop.startMonth, prop.endMonth])

  // Sort data by the given key
  const getPRListSortedBy = (prList, key) => prList.sort((prev, curr) => prev[key] - curr[key])

  const generateChartDataset = () => {
    const { startMonth, endMonth } = prop
    let chartDataset = { labels: [], data: { merged: [], closed: [], created: [] } };

    for (let month = moment(startMonth); month <= moment(endMonth); month = month.add(1, 'months')) {
      chartDataset.labels.push(month.format("YYYY-MM"))
    }
    
    chartDataset.data.created = getPRCreatedCountArray()
    chartDataset.data.closed = getPRClosedCountArray()
    chartDataset.data.merged = getPRMergedCountArray()

    return chartDataset
  }

  // Generate the pull-request chart
  useEffect(() => {
    const chartDataset = generateChartDataset()
    setDataForPullRequestChart(chartDataset)
  }, [pullRequestListData, prop.startMonth, prop.endMonth])

  const getPRCreatedCountArray = () => {
    const { startMonth, endMonth } = prop
    const prListSortedByCreatedAt = getPRListSortedBy([].slice.call(pullRequestListData), 'createdAt')
    const created = []

    if (prListSortedByCreatedAt.length > 0) {
      // Number of pull requests in each month
      for (let month = moment(startMonth); month <= moment(endMonth); month = month.add(1, 'months')) {
        const prCountInSelectedRange = prListSortedByCreatedAt.findIndex(pullRequest => {
          return moment(pullRequest.createdAt).year() > month.year() || moment(pullRequest.createdAt).year() === month.year() && moment(pullRequest.createdAt).month() > month.month()
        })
        created.push(prCountInSelectedRange === -1 ? pullRequestListData.length : prCountInSelectedRange)
      }
    }

    return created
  }

  const getPRClosedCountArray = () => {
    const { startMonth, endMonth } = prop
    const prListSortedByClosedAt = getPRListSortedBy([].slice.call(pullRequestListData), 'closedAt')
    const closed = []
    let noCloseCount

    if (prListSortedByClosedAt.length > 0) {
      // Number of pull requests in each month
      for (let month = moment(startMonth); month <= moment(endMonth); month = month.add(1, 'months')) {
        noCloseCount = 0 // Number of pull requests without 'closedAt' date
        const prCountInSelectedRange = prListSortedByClosedAt.findIndex(pullRequest => {
          if (pullRequest.closedAt == null) {
            noCloseCount += 1
          }
          return moment(pullRequest.closedAt).year() > month.year() || moment(pullRequest.closedAt).year() === month.year() && moment(pullRequest.closedAt).month() > month.month()
        })
        closed.push(prCountInSelectedRange === -1 ? pullRequestListData.length - noCloseCount : prCountInSelectedRange - noCloseCount)
      }
    }

    return closed
  }

  const getPRMergedCountArray = () => {
    const { startMonth, endMonth } = prop
    const prListSortedByMergedAt = getPRListSortedBy([].slice.call(pullRequestListData), 'mergedAt')
    const merged = []
    let noMergeCount

    if (prListSortedByMergedAt.length > 0) {
      // Number of pull requests in each month
      for (let month = moment(startMonth); month <= moment(endMonth); month = month.add(1, 'months')) {
        noMergeCount = 0 // Number of pull requests without 'mergedAt' date
        const prCountInSelectedRange = prListSortedByMergedAt.findIndex(pullRequest => {
          if (pullRequest.mergedAt == null) {
            noMergeCount += 1
          }
          return moment(pullRequest.mergedAt).year() > month.year() || moment(pullRequest.mergedAt).year() === month.year() && moment(pullRequest.mergedAt).month() > month.month()
        })
        merged.push(prCountInSelectedRange === -1 ? pullRequestListData.length - noMergeCount : prCountInSelectedRange - noMergeCount)
      }
    }

    return merged
  }

  return (
    <div style={{ marginLeft: "10px" }}>
      {/* Loading Animation */}
      <Backdrop className={classes.backdrop} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Project Avatar & Project Name */}
      <div className={classes.root}>
        <ProjectAvatar
          size="small"
          project={currentProject}
        />
        <h2>
          <p>{currentProject.projectName}</p>
        </h2>
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
