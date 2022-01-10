import {useState} from 'react'
import {makeStyles} from '@material-ui/core/styles'
import Axios from 'axios'
import logo from '../../assets/welcome.png'
import {useHistory} from 'react-router-dom'
import './Login.css'
import {
  TextField,
  Button,
  Backdrop,
  CircularProgress
} from '@material-ui/core'

export default function Login() {

  const useStyles = makeStyles((theme) => ({
    root: {
      '& .MuiTextField-root': {
        margin: theme.spacing(1),
      },
    },
    backdrop: {
      zIndex: theme.zIndex.drawer + 1,
      color: '#fff',
    },
    accountOperationHint: {
      fontSize: '12px',
      color: '#FF0000',
    },
    registerButton: {
      marginRight: '7px',
    },
  }));


  const classes = useStyles()
  const history = useHistory()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [accountOperationHint, setAccountOperationHint] = useState("")
  const [accountChecking, setAccountChecking] = useState(false);
  const accountCheckingEnd = () => {
    setAccountChecking(false);
  };
  const accountCheckingStart = () => {
    setAccountChecking(!accountChecking);
  };

  const login = async () => {
    if (username === "" || password === "") {
      alert("不準啦馬的>///<")
    } else {
      let payload = {
        username: username,
        password: password
      }
      accountCheckingStart()
      const jwt = await getJWTFrom(payload)
      const memberId = await getMemberId()
      if (jwt !== "" && memberId !== "") {
        localStorage.setItem("jwtToken", jwt)
        localStorage.setItem("memberId", memberId)
        accountCheckingEnd()
        goToSelect()
      } else {
        setAccountOperationHint("InvalidAccount")
        accountCheckingEnd()
      }
    }
  }

  const register = async () => {
    accountCheckingStart()
    const passwordRegex = new RegExp("^(?=.*?[0-9])(?=.*?[A-Za-z])(?=.*?[`!@#$%^&*()_+-=[\\]{};'\":\\|,.<>/?~]).{8,}$")
    if (username === "" || password === "") {
      alert("不準啦馬的>///<")
    } else if (!passwordRegex.test(password)) {
      alert("Password should contains: \n 1. More than 8 digits\n 2. At least one uppercase and lowercase character\n 3. At least one number\n 4. At least one symbol")
    } else {
      let payload = {
        username: username,
        password: password
      }
      try {
        const response = await Axios.post(`http://localhost:9100/pvs-api/auth/register`, payload)
        response.data ? setAccountOperationHint("registerSuccess") : setAccountOperationHint("registerFailed")
      } catch (e) {
        alert(e.response?.status)
        console.error(e)
      }
    }
    accountCheckingEnd()
  }

  const getJWTFrom = async (credential) => {
    try {
      const response = await Axios.post(`http://localhost:9100/pvs-api/auth/login`, credential)
      return response.data
    } catch (e) {
      alert(e.response?.status)
      console.error(e)
    }
  }

  const getMemberId = async () => {
    try {
      const response = await Axios.get(`http://localhost:9100/pvs-api/auth/memberId`, {
        params: {
          username
        }
      })
      return response.data
    } catch (e) {
      alert(e.response?.status)
      console.error(e)
    }
  }

  const goToSelect = () => {
    history.push("/select")
  }

  return (
    <div className={classes.root}>
      <Backdrop className={classes.backdrop} open={accountChecking}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo"/>
        { accountOperationHint === "InvalidAccount" &&
          <p className={classes.accountOperationHint}>Invalid username or password</p>
        }
        { accountOperationHint === "registerSuccess" &&
          <p className={classes.accountOperationHint}>Account is registered successfully</p>
        }
        { accountOperationHint === "registerFailed" &&
          <p className={classes.accountOperationHint}>Account already exists</p>
        }
        <TextField
          id="username"
          label="Username"
          type="text"
          variant="outlined"
          background="true"
          onChange={(e) => {
            setUsername(e.target.value)
          }}
        />

        <TextField
          id="password"
          label="Password"
          type="password"
          variant="outlined"
          background="true"
          onChange={(e) => {
            setPassword(e.target.value)
          }}
        />
        <br/>
        <span>
          <Button className={classes.registerButton} variant="contained" onClick={register} color="primary">
            Register
          </Button>
          <Button variant="contained" onClick={login} color="primary">
            Login
          </Button>
        </span>
      </header>
    </div>
  )
}
