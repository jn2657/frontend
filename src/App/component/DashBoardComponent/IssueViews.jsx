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
    border: '1px solid #7c3aed',
    backgroundColor: '#ede9fe',
    color: '#7c3aed',
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

function IssueViews(prop) {
  const classes = useStyles()
  const [jobs, setJobs] = useState([])
  const [currentProject, setCurrentProject] = useState({})
  const [issueListData, setIssueListData] = useState([])
  const projectId = localStorage.getItem("projectId")
  const jwtToken = localStorage.getItem("jwtToken")

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

  // Get issues(include pull requests) from GitHub
  const getIssueFromGitHub = async () => {
    const githubRepo = currentProject.repositoryDTOList.find(repo => repo.type === 'github')
    if (githubRepo !== undefined) {
      const query = githubRepo.url.split("github.com/")[1]
      try {
        const response = await Axios.get(`http://localhost:9100/pvs-api/github/issues/${query}`,
          { headers: { "Authorization": `${jwtToken}` } })
        setIssueListData(response.data)
      } catch (e) {
        alert(e.response?.status)
        console.error(e)
      }
    }
  }

  useEffect(() => {
    fetchCurrentProject()
  }, [])

  useEffect(() => {
    if (Object.keys(currentProject).length !== 0) {
      getIssueFromGitHub()
    }
  }, [currentProject, prop.startMonth, prop.endMonth])

  // Only triger the page rendering once
  const calculateData = async () => {
    await Promise.all([
      setIssueCreatedCount(),
      setIssueClosedCount()
    ])
  }

  // Get issue created count and closed count
  useEffect(() => {
    calculateData()
  }, [issueListData, prop.startMonth, prop.endMonth])

  // Sort data by the given key
  const getIssueListSortedBy = (issueList, key) => issueList.sort((prev, curr) => prev[key] - curr[key])

  const getIssueCreatedCount = () => {
    const { endMonth } = prop
    let created = 0
    const issueListSortedByCreatedAt = getIssueListSortedBy(issueListData, 'createdAt')

    if (issueListSortedByCreatedAt.length > 0) {
      const month = moment(endMonth)
      const issueCountInSelectedRange = issueListSortedByCreatedAt.findIndex(issue => {
        return moment(issue.createdAt).year() > month.year() || moment(issue.createdAt).year() === month.year() && moment(issue.createdAt).month() > month.month()
      })
      created = (issueCountInSelectedRange === -1 ? issueListData.length : issueCountInSelectedRange)
    }

    return created
  }

  const getIssueClosedCount = () => {
    const { endMonth } = prop
    let closed = 0
    const issueListSortedByClosedAt = getIssueListSortedBy(issueListData, 'closedAt')

    if (issueListSortedByClosedAt.length > 0) {
      const month = moment(endMonth)
      let noCloseCount = 0
      const issueCountInSelectedRange = issueListSortedByClosedAt.findIndex(issue => {
        if (issue.closedAt == null) noCloseCount += 1
        return moment(issue.closedAt).year() > month.year() || moment(issue.closedAt).year() === month.year() && moment(issue.closedAt).month() > month.month()
      })
      closed = (issueCountInSelectedRange === -1 ? issueListData.length - noCloseCount : issueCountInSelectedRange - noCloseCount)
    }

    return closed
  }

  const setIssueCreatedCount = () => {
    const job = { id: '1', job: "Created", views: getIssueCreatedCount() }
    setJobs([job])
  }

  const setIssueClosedCount = () => {
    const job = { id: '2', job: "Closed", views: getIssueClosedCount() }
    setJobs(prevArray => [...prevArray, job])
  }

  return (
    <div>
      <ul className={classes.totalJobViewsGrid}>
        {jobs?.map(job => {
          return (
            <li className={classes.jobViewsBlock} key={job.id}>
              <span className={classes.jobTitle}>{job.job}</span>

              <div className={classes.jobViewsContainer}>
                <span className={classes.jobViews}>{job.views}</span>
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

export default connect(mapStateToProps)(IssueViews);
