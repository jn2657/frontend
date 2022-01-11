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
    width: '100%'
  },
}))

function CodeSmellsPage(prop) {
  const classes = useStyles()
  const [currentProject, setCurrentProject] = useState({})
  const [codeSmellUrl, setCodeSmellUrl] = useState("")
  const [dataForCodeSmellChart, setDataForCodeSmellChart] = useState({labels: [], data: {codeSmell: []}})

  const projectId = localStorage.getItem("projectId")
  const jwtToken = localStorage.getItem("jwtToken")
  const memberId = localStorage.getItem("memberId")

  const [isLoading, setLoading] = useState(false)
  const loadingCodeSmellEnd = () => {
    setLoading(false)
  }
  const loadingCodeSmellStart = () => {
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

  const getCodeSmellData = async () => {
    const repositoryDTO = currentProject.repositoryDTOList.find(x => x.type === "sonar")
    const sonarComponent = repositoryDTO.url.split("id=")[1]
    setCodeSmellUrl(`https://sonarcloud.io/project/issues?id=${sonarComponent}&resolved=false&types=CODE_SMELL`)
    try {
      const response = await sendPVSBackendRequest('GET', `/sonar/${sonarComponent}/code_smell`)
      setCodeSmellChart(response)
    } catch (e) {
      alert(e.response?.status)
      console.error(e)
      loadingCodeSmellEnd()
    }
  }

  const setCodeSmellChart = (codeSmellList) => {
    const dataset = {labels: [], data: {codeSmell: []}}
    codeSmellList.forEach(codeSmell => {
      dataset.labels.push(moment(codeSmell.date).format("YYYY-MM-DD HH:mm:ss"))
      dataset.data.codeSmell.push(codeSmell.value)
    })
    setDataForCodeSmellChart(dataset)
    loadingCodeSmellEnd()
  }

  useEffect(() => {
    if (Object.keys(currentProject).length !== 0) {
      loadingCodeSmellStart()
      getCodeSmellData()
    }
  }, [currentProject, prop.startMonth, prop.endMonth])

  return (
    <div className={classes.root}>
      <Backdrop className={classes.backdrop} open={isLoading}>
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
      </header>
      <h2>
        <a href={codeSmellUrl} target="blank">{dataForCodeSmellChart.data.codeSmell[dataForCodeSmellChart.data.codeSmell.length - 1]}</a>
      </h2>
      <div className={classes.chartContainer}>
        <div className={classes.chart}>
          <div>
            <h1>Code Smells</h1>
            <div>
              <DrawingBoard data={dataForCodeSmellChart}  maxBoardY={Math.max(...dataForCodeSmellChart.data.codeSmell) + 5} id="code-smells-chart"/>
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

export default connect(mapStateToProps)(CodeSmellsPage)
