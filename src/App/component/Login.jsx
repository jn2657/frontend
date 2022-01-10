import {useState} from 'react'
import {makeStyles} from '@material-ui/core/styles'
import Axios from 'axios'
import logo from '../../assets/welcome.png'
import {useHistory} from 'react-router-dom'
import './Login.css'
import {Backdrop, Button, CircularProgress, TextField} from '@material-ui/core'

const passwordRegex = new RegExp("^(?=.*?[0-9])(?=.*?[A-Za-z])(?=.*?[`!@#$%^&*()_+-=[\\]{};'\":\\|,.<>/?~]).{8,}$")

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
    accountOperationHintSuccess: {
      fontSize: '12px',
      color: '#00dc82',
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
    setPassword('')
    setAccountChecking(false);
  };
  const accountCheckingStart = () => {
    setAccountOperationHint('')
    setAccountChecking(!accountChecking);
  };

  const login = async () => {
    accountCheckingStart()
    if (!(username?.trim()?.length) || !(password?.toString()?.length)) {
      alert("不準啦馬的>///<")
      accountCheckingEnd()
      return
    }

    const credential = {
      username: username.trim(),
      password
    }

    const jwt = await getJWTFrom(credential)
    if (jwt && jwt !== "") {
      localStorage.setItem("jwtToken", jwt)
      Axios.defaults.headers.common['Authorization'] = jwt
      const memberId = await getMemberId()
      if (memberId && memberId !== "") {
        localStorage.setItem("memberId", memberId)
        redirectToProjectSelectPage()
      } else {
        setAccountOperationHint('InvalidAccount')
      }
    } else {
      setAccountOperationHint('InvalidAccount')
    }
    accountCheckingEnd()
  }

  const register = async () => {
    accountCheckingStart()
    if (!(username?.trim()?.length) || !(password?.toString()?.length)) {
      alert("不準啦馬的>///<")
      accountCheckingEnd()
      return
    }

    if (!passwordRegex.test(password)) {
      alert("Password should contains: \n 1. More than 8 digits\n 2. At least one uppercase and lowercase character\n 3. At least one number\n 4. At least one symbol")
      accountCheckingEnd()
      return
    }

    const payload = {
      username: username?.trim(),
      password
    }

    try {
      const {data} = await Axios.post(`http://localhost:9100/pvs-api/auth/register`, payload)
      data?.toString() === 'true' ?
        setAccountOperationHint("registerSuccess") :
        setAccountOperationHint("registerFailed")
    } catch (e) {
      alert(e.response?.status)
      console.error(e)
    }

    accountCheckingEnd()
  }

  const getJWTFrom = async (credential) => {
    try {
      const response = await Axios.post(`http://localhost:9100/pvs-api/auth/login`, credential)
      return response.data
    } catch (e) {
      console.warn(e)
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

  const redirectToProjectSelectPage = () => {
    history.push("/select")
  }

  return (
    <div className={classes.root}>
      <Backdrop className={classes.backdrop} open={accountChecking}>
        <CircularProgress color="inherit"/>
      </Backdrop>
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo"/>
        {accountOperationHint === "InvalidAccount" &&
          <p className={classes.accountOperationHint}>Invalid username or password</p>
        }
        {accountOperationHint === "registerSuccess" &&
          <p className={classes.accountOperationHintSuccess}>Account is registered successfully</p>
        }
        {accountOperationHint === "registerFailed" &&
          <p className={classes.accountOperationHint}>Account already exists</p>
        }
        <TextField
          id="username"
          label="Username"
          type="text"
          variant="outlined"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value)
          }}
        />

        <TextField
          id="password"
          label="Password"
          type="password"
          variant="outlined"
          value={password}
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
