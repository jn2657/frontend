import { useEffect, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import ProjectAvatar from './ProjectAvatar'
import Axios from 'axios'
import { Backdrop, CircularProgress } from '@material-ui/core'
import { connect } from 'react-redux'
import DrawingBoard from './DrawingBoard'
import moment from 'moment'

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

function BugsPage(prop) {
  const classes = useStyles()
  const [currentProject, setCurrentProject] = useState({})
  const [bugUrl, setBugUrl] = useState("")
  const [dataForBugChart, setDataForBugChart] = useState({labels: [], data: {bug: []}})

  const projectId = localStorage.getItem("projectId")
  const jwtToken = localStorage.getItem("jwtToken")
  const memberId = localStorage.getItem("memberId")

  const [isLoading, setLoading] = useState(false)
  const loadingBugDataEnd = () => {
    setLoading(false)
  }
  const loadingBugDataStart = () => {
    setLoading(!isLoading)
  }

  const config = {
    headers: {
      ...(jwtToken && { "Authorization": jwtToken })
    }
  }

  const sendPVSBackendRequest = async (method, url) => {
    const baseURL = 'http://localhost:9100/pvs-api'
    const requestConfig = {
      baseURL,
      url,
      method,
      config
    }
    return (await Axios.request(requestConfig))?.data
  }

  const loadInitialProjectInfo = async () => {
    try {
      const response = await sendPVSBackendRequest('GET', `/project/${memberId}/${projectId}`)
      setCurrentProject(response)
    } catch (e) {
      alert(e.response?.status)
      console.error(e)
    }
  }

  useEffect(() => {
    loadInitialProjectInfo()
  }, [])

  const getBugData = async () => {
    const repositoryDTO = currentProject.repositoryDTOList.find(x => x.type === "sonar")
    const sonarComponent = repositoryDTO.url.split("id=")[1]
    setBugUrl(`https://sonarcloud.io/project/issues?id=${sonarComponent}&resolved=false&types=BUG`)
    try {
      const response = await sendPVSBackendRequest('GET', `/sonar/${sonarComponent}/bug`)
      setBugChart(response)
    } catch (e) {
      alert(e.response?.status)
      console.error(e)
      loadingBugDataEnd()
    }
  }

  const setBugChart = (bugList) => {
    const dataset = {labels: [], data: {bug: []}}
    bugList.forEach(bug => {
      dataset.labels.push(moment(bug.date).format("YYYY-MM-DD HH:mm:ss"))
      dataset.data.bug.push(bug.value)
    })
    setDataForBugChart(dataset)
    loadingBugDataEnd()
  }

  useEffect(() => {
    if (Object.keys(currentProject).length !== 0) {
      loadingBugDataStart()
      getBugData()
    }
  }, [currentProject, prop.startMonth, prop.endMonth])

  return (
    <div className={classes.root}>
      <Backdrop className={classes.backdrop} open={isLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <header className={classes.header}>
        <ProjectAvatar
          size="small"
          project={currentProject}
          className={classes.avatar}
        />
        <h2 className={classes.title}>{currentProject ? currentProject.projectName : ""}</h2>
      </header>
      <h2 id="number-of-sonar">
        <a href={bugUrl} target="blank">{dataForBugChart.data.bug[dataForBugChart.data.bug.length - 1]}</a>
      </h2>
      <div className={classes.chartContainer}>
        <div className={classes.chart}>
          <div>
            <h1>Bugs</h1>
            <div>
              <DrawingBoard data={dataForBugChart} maxBoardY={Math.max(...dataForBugChart.data.bug) + 5} id="bugs-chart"/>
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

export default connect(mapStateToProps)(BugsPage)
