import {useEffect, useState} from 'react'
import Axios from 'axios'
import InputAdornment from '@material-ui/core/InputAdornment';
import {SiGithub, SiSonarqube, SiGitlab} from 'react-icons/si'

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@material-ui/core'

export default function AddProjectDialog({open, reloadProjects, handleClose}) {
  const [projectName, setProjectName] = useState("")
  const [githubRepositoryURL, setGithubRepositoryURL] = useState("")
  const [sonarRepositoryURL, setSonarRepositoryURL] = useState("")
  const [gitlabRepositoryURL, setGitlabRepositoryURL] = useState("")
  const setIsGithubAvailable = useState(false)[1]
  const setIsGitlabAvailable = useState(false)[1]
  const setIsSonarAvailable = useState(false)[1]
  const jwtToken = localStorage.getItem("jwtToken")

  const createProject = async () => {
    let checker = []
    if (projectName === "") {
      alert("不準啦馬的>///<")
    } else {
      if (githubRepositoryURL !== "") {
        checker.push(checkGithubRepositoryURL());
      }
      if (sonarRepositoryURL !== "") {
        checker.push(checkSonarRepositoryURL());
      }
      if(gitlabRepositoryURL !== "") {
        checker.push(checkGitlabRepositoryURL());
      }

      Promise.all(checker)
        .then((response) => {
          if (response.includes(false) === false) {
            let payload = {
              projectName: projectName,
              githubRepositoryURL: githubRepositoryURL,
              gitlabRepositoryURL: gitlabRepositoryURL,
              sonarRepositoryURL: sonarRepositoryURL
            }

            Axios.post("http://localhost:9100/pvs-api/project", payload,
              {headers: {"Authorization": `${jwtToken}`}})
              .then(() => {
                reloadProjects()
                handleClose()
              })
              .catch((e) => {
                alert(e.response.status)
                console.error(e)
              })
          }
        }).catch((e) => {
        alert(e.response.status)
        console.error(e)
      })
    }

    const payload = {
      projectName,
      githubRepositoryURL: "",
      sonarRepositoryURL: ""
    }

    const config = {
      headers: {
        ...(jwtToken && {"Authorization": jwtToken})
      }
    }

    try {
      await Axios.post("http://localhost:9100/pvs-api/project", payload, config)
    } catch (e) {
      alert(e?.response?.status)
      console.error(e)
    } // 回傳給後端

    reloadProjects()
    handleClose()
  }

  const checkGithubRepositoryURL = () => {
    return Axios.get(`http://localhost:9100/pvs-api/repository/github/check?url=${githubRepositoryURL}`,
      {headers: {"Authorization": `${jwtToken}`}})
      .then(() => {
        setIsGithubAvailable(true);
        return true
      })
      .catch(() => {
        alert("github error")
        return false
      })
  }

  const checkGitlabRepositoryURL = () => {
    return Axios.get(`http://localhost:9100/pvs-api/repository/gitlab/check?url=${gitlabRepositoryURL}`,
      {headers: {"Authorization": `${jwtToken}`}})
      .then(() => {
        setIsGitlabAvailable(true);
        return true
      })
      .catch(() => {
        alert("gitlab error")
        return false
      })
  }

  const checkSonarRepositoryURL = () => {
    return Axios.get(`http://localhost:9100/pvs-api/repository/sonar/check?url=${sonarRepositoryURL}`,
      {headers: {"Authorization": `${jwtToken}`}})
      .then(() => {
        setIsSonarAvailable(true);
        return true
      })
      .catch((e) => {
        alert("sonar error")
        console.error(e)
        return false
      })
  }

  useEffect(() => {
    setProjectName("")
    setGithubRepositoryURL("")
    setGitlabRepositoryURL("")
    setSonarRepositoryURL("")
  }, [open])

  // dialog 介面
  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Create Project</DialogTitle>
      <DialogContent>
        <DialogContentText>
          To create a project, please enter the project name.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="ProjectName"
          label="Project Name"
          type="text"
          fullWidth
          onChange={(e) => {
            setProjectName(e.target.value)
          }}
        />
        <TextField
          margin="dense"
          id="GithubRepositoryURL"
          label="Github Repository URL"
          type="text"
          fullWidth
          onChange={(e) => {
            setGithubRepositoryURL(e.target.value)
          }}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SiGithub/>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          margin="dense"
          id="GitlabRepositoryURL"
          label="Gitlab Repository URL"
          type="text"
          fullWidth
          onChange={(e) => {
            setGitlabRepositoryURL(e.target.value)
          }}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SiGitlab/>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          margin="dense"
          id="SonarRepositoryURL"
          label="Sonar Repository URL"
          type="text"
          fullWidth
          onChange={(e) => {
            setSonarRepositoryURL(e.target.value)
          }}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SiSonarqube/>
              </InputAdornment>
            ),
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          Cancel
        </Button>
        <Button id="CreateProjectBtn" onClick={createProject} color="primary">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  )
}
