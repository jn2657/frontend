import { useEffect, useState } from 'react'
import Axios from 'axios'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  FormControlLabel,
  FormHelperText
} from '@material-ui/core'

import InputAdornment from '@material-ui/core/InputAdornment';
import { SiGithub, SiSonarqube, SiGitlab, SiTrello } from 'react-icons/si'

export default function AddRepositoryDialog({ open, reloadProjects, handleClose, projectId, hasGitRepo, hasSonar, hasTrello }) {

  const [repoType, setRepoType] = useState("")
  const jwtToken = localStorage.getItem("jwtToken")

  const [showDiv, setShowDiv] = useState(false)

  let repositoryURL = ""

  const addRepository = () => {
    let checker = []
    if (repositoryURL.trim() === "") {
      alert("不準啦馬的>///<")
    } else {

      checker.push(checkRepositoryURL(repositoryURL));

      Promise.all(checker)
        .then((response) => {
          if (response.includes(false) === false) {
            let payload = {
              projectId,
              repositoryURL
            }

            Axios.post(`http://localhost:9100/pvs-api/project/${projectId}/repository/${repoType}`, payload,
              { headers: { "Authorization": `${jwtToken}` } })
              .then(() => {
                reloadProjects()
                handleClose()
              })
              .catch((e) => {
                alert(e.response?.status)
                console.error(e)
              })
          }
        }).catch((e) => {
          alert(e.response?.status)
          console.error(e)
        })
    }
  }

  const checkRepositoryURL = async (url) => {
    if (repoType === "github") {
      try {
        await Axios.get(`http://localhost:9100/pvs-api/repository/github/check?url=${url}`,
          { headers: { "Authorization": `${jwtToken}` } });
        return true;
      } catch (e) {
        alert("github error");
        return false;
      }
    }

    if (repoType === "gitlab") {
      try {
        await Axios.get(`http://localhost:9100/pvs-api/repository/gitlab/check?url=${url}`,
          { headers: { "Authorization": `${jwtToken}` } });
        return true;
      } catch (e) {
        alert("gitlab error");
        return false;
      }
    }

    if (repoType === "sonar") {
      try {
        await Axios.get(`http://localhost:9100/pvs-api/repository/sonar/check?url=${url}`,
          { headers: { "Authorization": `${jwtToken}` } });
        return true;
      } catch (e) {
        alert("sonar error");
        return false;
      }
    }

    if (repoType === "trello") {
      try {
        await Axios.get(`http://localhost:9100/pvs-api/repository/trello/check?url=${url}`,
          { headers: { "Authorization": `${jwtToken}` } });
        return true;
      } catch (e) {
        alert("trello error");
        return false;
      }
    }
  }

  const selected = (e) => {
    setRepoType(e.target.value)
    setShowDiv(e.target.checked)
  }

  const InputDiv = () => {
    return (
      <div>
        <TextField
          margin="dense"
          id="RepositoryURL"
          label="Repository URL"
          type="text"
          fullWidth
          onChange={(e) => {repositoryURL=e.target.value}}
          required
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {repoType === "github" &&
                  <SiGithub />
                }
                {repoType === "gitlab" &&
                  <SiGitlab />
                }
                {repoType === "sonar" &&
                  <SiSonarqube />
                }
                {repoType === "trello" &&
                  <SiTrello />
                }
              </InputAdornment>
            ),
          }}
        />
        <FormHelperText id="helper-text">
          {repoType === "github" &&
            <p>Ex: https://github.com/USER/REPO</p>
          }
          {repoType === "gitlab" &&
            <p>Ex: https://gitlab.com/USER/REPO</p>
          }
          {repoType === "sonar" &&
            <p>Ex: https://sonarcloud.io/project/overview?id=ID</p>
          }
          {repoType === "trello" &&
            <p>Ex: https://trello.com/b/abcdef/BOARD_NAME</p>
          }
        </FormHelperText>
      </div>
    )
  }

  useEffect(() => {
    setRepoType("")
    setShowDiv(false)
  }, [open])

  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Add Repository</DialogTitle>
      <DialogContent>
        <DialogContentText>
          To add a repository, please select a repository type and enter the repository URL.
        </DialogContentText>
        <FormControl component="fieldset">
          <FormLabel component="legend" />
          <RadioGroup row aria-label="repositoryType" name="row-radio-buttons-group">
            <FormControlLabel value="github" disabled={hasGitRepo} control={<Radio />} onChange={selected} label="GitHub" />
            <FormControlLabel value="gitlab" disabled={hasGitRepo} control={<Radio />} onChange={selected} label="GitLab" />
            <FormControlLabel value="sonar"  disabled={hasSonar} control={<Radio />} onChange={selected} label="SonarQube" />
            <FormControlLabel value="trello" disabled={hasTrello} control={<Radio />} onChange={selected} label="Trello" />
            <FormControlLabel
              value="disabled"
              disabled
              control={<Radio />}
              label="other"
            />
          </RadioGroup>
        </FormControl>
        <div>
          {showDiv ? <InputDiv /> : null}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={addRepository} color="primary" id="AddRepositoryBtn">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  )
}
