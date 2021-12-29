import {lazy, Suspense, useEffect, useMemo, useState} from 'react'
import {makeStyles} from '@material-ui/core/styles'
import ProjectAvatar from './ProjectAvatar'
import Axios from 'axios'

const SonarMetrics = lazy(() => import('./SonarMetrics'))

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    alignItems: 'flex-start',
    alignContent: 'flex-start',
    flexWrap: 'wrap',
    '& > *': {
      margin: theme.spacing(1),
    },
    minWidth: '30px',
    width: 'auto',
    height: '100vh'
  },
  title: {
    display: 'inline-block',
    marginLeft: '15px',
    marginRight: '15px'
  },
  avatar: {
    display: 'inline-block'
  },
  header: {
    display: 'flex',
    width: '100%'
  },
}))

function DashboardPage() {
  const classes = useStyles()

  const [currentProject, setCurrentProject] = useState({})

  const projectId = localStorage.getItem("projectId")
  const jwtToken = localStorage.getItem("jwtToken")

  const sonarId = useMemo(() => {
    const dto = currentProject?.repositoryDTOList?.find(dto => dto.type === 'sonar')
    return dto?.url && (new URL(dto.url)).searchParams.get('id')
  }, [currentProject])

  useEffect(() => {
    Axios.get(`http://localhost:9100/pvs-api/project/1/${projectId}`,
      {headers: {"Authorization": `${jwtToken}`}})
      .then((response) => {
        if (response?.data) {
          setCurrentProject(response.data)
        }
      })
      .catch((e) => {
        alert(e.response.status)
        console.error(e)
      })
  }, [])

  return (
    <div className={classes.root}>
      <header className={classes.header}>
        <ProjectAvatar
          size="small"
          project={currentProject}
          className={classes.avatar}
        />
        <h2 className={classes.title}>{currentProject ? currentProject.projectName : ""}</h2>
      </header>
      {
        sonarId &&
        <Suspense fallback={<div>Loading Sonar Metrics...</div>}>
          <SonarMetrics sonarComponentName={sonarId}/>
        </Suspense>
      }
    </div>
  )
}

export default DashboardPage
