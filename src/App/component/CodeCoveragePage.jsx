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

function CodeCoveragePage(prop) {
  const classes = useStyles()
  const [currentProject, setCurrentProject] = useState({})
  const [dataForCoverageChart, setDataForCoverageChart] = useState({labels: [], data: {coverage: []}})
  const [coverageUrl, setCoverageUrl] = useState("")

  const projectId = localStorage.getItem("projectId")
  const jwtToken = localStorage.getItem("jwtToken")
  const memberId = localStorage.getItem("memberId")

  const [isLoading, setLoading] = useState(false)
  const loadingCoverageEnd = () => {
    setLoading(false)
  }
  const loadingCoverageStart = () => {
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

  const getCoverageData = async () => {
    const repositoryDTO = currentProject.repositoryDTOList.find(x => x.type === "sonar")
    const sonarComponent = repositoryDTO.url.split("id=")[1]
    setCoverageUrl(`https://sonarcloud.io/component_measures?id=${sonarComponent}&metric=Coverage&view=list`)
    try {
      const response = await sendPVSBackendRequest('GET', `/sonar/${sonarComponent}/coverage`)
      setCoverageChart(response)
    } catch (e) {
      alert(e.response?.status)
      console.error(e)
      loadingCoverageEnd()
    }
  }

  const setCoverageChart = (coverageList) => {
    const dataset = {labels: [], data: {coverage: []}}
    coverageList.forEach(coverage => {
      dataset.labels.push(moment(coverage.date).format("YYYY-MM-DD HH:mm:ss"))
      dataset.data.coverage.push(coverage.value)
    })
    setDataForCoverageChart(dataset)
    loadingCoverageEnd()
  }

  useEffect(() => {
    if (Object.keys(currentProject).length !== 0) {
      loadingCoverageStart()
      getCoverageData()
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
      <h2>
        <a href={coverageUrl} target="blank">{dataForCoverageChart.data.coverage[dataForCoverageChart.data.coverage.length - 1]}%</a>
      </h2>
      <div className={classes.chartContainer}>
        <div className={classes.chart}>
          <div>
            <h1>Code Coverage</h1>
            <div>
              <DrawingBoard data={dataForCoverageChart} maxBoardY={100} id="code-coverage-chart"/>
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

export default connect(mapStateToProps)(CodeCoveragePage)
