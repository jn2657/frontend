import { makeStyles } from '@material-ui/core/styles';
import { useEffect, useState } from 'react'
import Axios from 'axios'
import moment from 'moment'
import { connect } from 'react-redux'

const useStyles = makeStyles(() => ({
  totalJobViewsGrid: {
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
    gap: '2rem',
    padding: 0,
  },
  jobViewsBlock: {
    flexDirection: 'column',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobTitle: {
    marginBottom: '1rem',
    fontWeight: 500,
    display: 'block',
  },
  jobViewsContainer: {
    border: '1px solid #b45309',
    backgroundColor: '#fef3c7',
    color: '#b45309',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1rem',
    borderRadius: '50%',
    width: '6rem',
    height: '6rem',
  },
  jobViews: {
    fontSize: '3rem',
    fontWeight: 600,
  },
}))

function PullRequestsViews(prop) {
  const classes = useStyles()
  const [jobs, setJobs] = useState([])
  const [currentProject, setCurrentProject] = useState({})
  const [pullRequestListData, setPullRequestListData] = useState([])
  const projectId = localStorage.getItem("projectId")
  const jwtToken = localStorage.getItem("jwtToken")
  const memberId = localStorage.getItem("memberId")

  const fetchCurrentProject = async () => {
    try {
      const response = await Axios.get(`http://localhost:9100/pvs-api/project/${memberId}/${projectId}`,
        { headers: { "Authorization": `${jwtToken}` } })
      setCurrentProject(response.data)
    } catch (e) {
      alert(e.response?.status)
      console.error(e)
    }
  }

  const getPullRequestsFromGitHub = async () => {
    const githubRepo = currentProject.repositoryDTOList.find(repo => repo.type === 'github')
    if (githubRepo !== undefined) {
      const query = githubRepo.url.split("github.com/")[1]
      try {
        const response = await Axios.get(`http://localhost:9100/pvs-api/github/pullRequests/${query}`,
          { headers: { "Authorization": `${jwtToken}` } })
        setPullRequestListData(response.data === '' ? [] : response.data)
      } catch (e) {
        alert(e.response?.status);
        console.error(e)
      }
    }
  }

  useEffect(() => {
    fetchCurrentProject()
  }, [])

  useEffect(() => {
    if (Object.keys(currentProject).length !== 0) {
      getPullRequestsFromGitHub()
    }
  }, [currentProject, prop.startMonth, prop.endMonth])

  // Only triger the page rendering once
  const calculateData = async () => {
    await Promise.all([
      setPullRequestCreatedCount(),
      setPullRequestMergedCount()
    ])
  }

  //Get created count and merged count of pull requests
  useEffect(() => {
    calculateData()
  }, [pullRequestListData, prop.startMonth, prop.endMonth])

  // Sort data by the given key
  const getPRListSortedBy = (prList, key) => prList.sort((prev, curr) => prev[key] - curr[key])

  const getPullRequestCreatedCount = () => {
    const { endMonth } = prop

    const month = moment(endMonth)
    const prListSortedByCreatedAt = getPRListSortedBy(pullRequestListData, 'createdAt')
    let created = 0

    // Calculate the number of pull requests for the last month in the selected range
    if (prListSortedByCreatedAt.length > 0) {
      const prCountInSelectedRange = prListSortedByCreatedAt.findIndex(pullRequest => {
        return moment(pullRequest.createdAt).year() > month.year() || moment(pullRequest.createdAt).year() === month.year() && moment(pullRequest.createdAt).month() > month.month()
      })
      created = (prCountInSelectedRange === -1 ? pullRequestListData.length : prCountInSelectedRange)
    }

    return created
  }

  const getPullRequestMergedCount = () => {
    const { endMonth } = prop

    const month = moment(endMonth)
    const prListSortedByMergedAt = getPRListSortedBy(pullRequestListData, 'mergedAt')
    let merged = 0

    // Calculate the number of pull requests for the last month in the selected range
    if (prListSortedByMergedAt.length > 0) {
      let noMergeCount = 0
      const prCountInSelectedRange = prListSortedByMergedAt.findIndex(pullRequest => {
        if (pullRequest.mergedAt == null) {
          noMergeCount += 1
        }
        return moment(pullRequest.mergedAt).year() > month.year() || moment(pullRequest.mergedAt).year() === month.year() && moment(pullRequest.mergedAt).month() > month.month()
      })
      merged = (prCountInSelectedRange === -1 ? pullRequestListData.length - noMergeCount : prCountInSelectedRange - noMergeCount)
    }

    return merged
  }

  const setPullRequestCreatedCount = () => {
    const job = { id: '1', job: "Created", views: getPullRequestCreatedCount() }
    setJobs([job])
  }

  const setPullRequestMergedCount = () => {
    const job = { id: '2', job: "Merged", views: getPullRequestMergedCount() }
    setJobs(prevArray => [...prevArray, job])
  }

  return (
    <div>
      <ul className={classes.totalJobViewsGrid}>
        {jobs?.map(job => {
          return (
            <li className={classes.jobViewsBlock} key={job?.id}>
              <span className={classes.jobTitle}>{job?.job}</span>

              <div className={classes.jobViewsContainer}>
                <span className={classes.jobViews}>{job?.views}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  )
}

const mapStateToProps = (state) => {
  return {
    endMonth: state.selectedMonth.endMonth
  }
}

export default connect(mapStateToProps)(PullRequestsViews);
