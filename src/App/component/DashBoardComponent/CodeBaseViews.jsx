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
    border: '1px solid #BB3D00',
    backgroundColor: '#FFDAC8',
    color: '#BB3D00',
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

function CodeBaseViews(prop) {
  const classes = useStyles()
  const [jobs, setJobs] = useState([])
  const [currentProject, setCurrentProject] = useState({})
  const [commitListData, setCommitListData] = useState([])
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

  const getCommitFromGitHub = async () => {
    const githubRepo = currentProject.repositoryDTOList.find(repo => repo.type === 'github')
    if (githubRepo !== undefined) {
      const query = githubRepo.url.split("github.com/")[1]
      try {
        await Axios.post(`http://localhost:9100/pvs-api/github/commits/${query}`, "",
          { headers: { "Authorization": `${jwtToken}` } })
        getGitHubCommitFromDB()
      } catch (e) {
        alert(e.response?.status)
        console.error(e)
      }
    }
  }

  const getGitHubCommitFromDB = async () => {
    const githubRepo = currentProject.repositoryDTOList.find(repo => repo.type === 'github')
    if (githubRepo !== undefined) {
      const query = githubRepo.url.split("github.com/")[1]
      try {
        const response = await Axios.get(`http://localhost:9100/pvs-api/github/commits/${query}`,
          { headers: { "Authorization": `${jwtToken}` } })
        setCommitListData(response.data)
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
      getCommitFromGitHub()
    }
  }, [currentProject, prop.startMonth, prop.endMonth])

  // Only triger the page rendering once
  const calculateData = async () => {
    await Promise.all([
      setJobAdditions(),
      setJobDeletions()
    ])
  }

  // Get commits' total additions and deletions
  useEffect(() => {
    calculateData()
  }, [commitListData, prop.startMonth, prop.endMonth])

  const getAdditions = () => {
    const { startMonth, endMonth } = prop

    let additions = 0
    for (let month = moment(startMonth); month <= moment(endMonth); month = month.add(1, 'months')) {
      additions += (commitListData.filter(commit => {
        return moment(commit.committedDate).format("YYYY-MM") === month.format("YYYY-MM")
      })
        .reduce(function (additionSum, currentCommit) {
          return additionSum + currentCommit.additions;
        }, 0))
    }

    return additions
  }

  const getDeletions = () => {
    const { startMonth, endMonth } = prop

    let deletions = 0
    for (let month = moment(startMonth); month <= moment(endMonth); month = month.add(1, 'months')) {
      deletions += (commitListData.filter(commit => {
        return moment(commit.committedDate).format("YYYY-MM") === month.format("YYYY-MM")
      })
        .reduce(function (deletionSum, currentCommit) {
          return deletionSum + currentCommit.deletions;
        }, 0))
    }

    return deletions
  }

  const setJobAdditions = () => {
    const job = { id: '1', job: "Additions", views: getAdditions() }
    setJobs([job])
  }

  const setJobDeletions = () => {
    const job = { id: '2', job: "Deletions", views: getDeletions() }
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
    startMonth: state.selectedMonth.startMonth,
    endMonth: state.selectedMonth.endMonth
  }
}

export default connect(mapStateToProps)(CodeBaseViews);
