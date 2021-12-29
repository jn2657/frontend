/**
 * @summary SonarQube Metrics Component.
 *
 * In this metrics component, the following six metrics are included:
 * reliability rating, bugs, code smells, security rating, duplicated blocks, critical violations.
 *
 * Please refer to the SonarCloud official Web API doc {@link https://sonarcloud.io/web_api/api/metrics} for more details.
 *
 * @author TU Lin Xanonymous.
 */

import * as React from "react";
import {useCallback, useEffect, useMemo, useState} from "react";
import axios from "axios";
import {Card, CardActionArea, CardContent, CardMedia, makeStyles, Typography} from "@material-ui/core";
import {randomHash, toUpperCamelCase} from "../../utils";
import {SiSonarqube} from "react-icons/si";

// import type definitions for documentation.
// eslint-disable-next-line no-unused-vars
import {AxiosInstance, AxiosRequestHeaders, AxiosResponse, Method} from 'axios'

/**
 * @summary URL for calling the PVS back-end API.
 *
 * This URL is only used in the development phase,
 * In a real production environment, there is no need to specify the protocol and port number.
 * These actions will be set by the deployed reverse proxy service.
 *
 * @type {string}
 */
const baseURL = 'http://localhost:9100/pvs-api';


/**
 * @summary Json Web Token for PVS backend authorizations.
 *
 * The key used for authentication with the PVS backend,
 * which will be stored in the browser after successful login from the login page.
 * When calling a back-end API that requires authentication,
 * it needs to be added to the authorization block of the request header
 * The header generation function may look like this:
 *
 * @example A function that returns a header with the jwt.
 *  function generateHeader() {
 *    if (jwt) {
 *      return {'Authorization': jwt}
 *    }
 *    return {}
 *  }
 *
 * Or
 *
 * @example Use spread operator to solve the case that jwt is null.
 *  // if the value is null, jwt will not be added to the object.
 *  const generateHeader = () => {...(jwt && {'Authorization': jwt})}
 *
 * @inheritDoc
 * For more information about the spread operator, please refer to the Mozilla MDN Web Docs
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax}
 * for more details.
 *
 * @type {string | null}
 */
const jwt = localStorage.getItem("jwtToken");


/**
 * The path of the PVS backend API, in order to obtain sonarqube metrics.
 * @type {string}
 */
const sonarMetricsProxyApiPath = '/proxy/sonar/metrics';


/**
 * @function createClient
 * @summary Create an axios http client.
 *
 * @param {string} [baseURL] - The base URL of the http request,
 * all request URLs sent by the same client will be based on this base URL.
 * If not provided, each requested URL must be a complete URL.
 * @param {AxiosRequestHeaders} [headers] - HTTP request header.
 * If not provided, an empty object will be sent.
 * @return {AxiosInstance}
 */
const createClient = (baseURL, headers) => {
  return axios.create({baseURL, headers});
};


/**
 * The URL for an icon which will be displayed when the value of a metric is the best value.
 * @type {string}
 */
const bestValueBadgeUrl = 'https://i.imgur.com/iPwxQft.webp';


/**
 * The URL for an icon which will be displayed when the value of a metric is not the best value.
 * @type {string}
 */
const warningValueBadgeUrl = 'https://i.imgur.com/WtPSvXt.webp';


/**
 * @typedef SonarMetricsRecord
 * @type {Object}
 * @property {string} name The metricKey of a Sonar metric.
 * Please refer to the SonarCloud official Web API doc {@link https://sonarcloud.io/web_api/api/metrics} for more details.
 * @property {string} logoUrl An URL of a picture that shows inside the metric.
 */


/**
 * The key of the metric item that needs to be displayed by sonar metrics.
 * @type {Array<SonarMetricsRecord>}
 */
const SONAR_METRICS_KEYS = [
  {
    name: 'reliability_rating',
    logoUrl: 'https://i.imgur.com/RxfGk5l.webp'
  },
  {
    name: 'bugs',
    logoUrl: 'https://i.imgur.com/9fieME5.webp'
  },
  {
    name: 'code_smells',
    logoUrl: 'https://i.imgur.com/ANhJtOM.webp'
  },
  {
    name: 'security_rating',
    logoUrl: 'https://i.imgur.com/JoUXs1o.webp'
  },
  {
    name: 'duplicated_blocks',
    logoUrl: 'https://i.imgur.com/cmxC7ZG.webp'
  },
  {
    name: 'critical_violations',
    logoUrl: 'https://i.imgur.com/mwqZYrI.webp'
  }
];


/**
 * @function sendHttpRequest
 * @summary Send a http request to the provided URL.
 * @async
 *
 * Use the provided http client to send a http request,
 * then return its response body if its response status code is 2xx
 *
 * If the status code of response is not 2xx, an error msg will be shown with a console warning,
 * and a null value will be returned to caller side.
 *
 * @param {AxiosInstance} client - An axios instance for sending request.
 * @param {Method} [method] - The http request method.
 * @param {string} [url] - The request Target URL.
 * @param {any} [params] - The request parameters of this request.
 * @param {any} [data] - The request body of this request.
 * @return {Promise<AxiosResponse.data | null>}
 */
const sendHttpRequest = async (client, method, url, params, data) => {
  try {
    return (await client.request({url, method, params, data}))?.data;
  } catch (e) {
    console.warn(e);
    return null;
  }
}


/**
 * A self-defined hook that will be used to declare the css class name of a JSX component.
 *
 * You should call this hook function to create a style object, for example:
 * @example
 *  const styles = useStyles()
 *
 *  // Then you can use the className in some JSX components:
 *  <div className={styles.className} />
 *
 * @inheritDoc
 * Please refer to this doc {@link https://mui.com/zh/styles/basics/#hook-api} for more details.
 */
const useStyles = makeStyles(() => ({
  metricsTitle: {
    margin: '2rem 0 0 calc(1.5rem + 8px)',
    fontFamily: 'Trebuchet MS'
  },

  metricsContainer: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 20rem), 1fr))',
    gridTemplateRows: 'auto',
    justifyItems: 'center',
    gap: '1.5rem',
    padding: '1.5rem'
  },

  metricCard: {
    width: '100%'
  },

  metricCardHeaderContainer: {
    display: 'flex',
    alignContent: 'center',
    alignItems: 'center',
    margin: '0 0 1em 0'
  },

  metricCardTitle: {
    fontWeight: 'bolder',
    color: 'rgb(82, 104, 116)',
    fontFamily: 'Trebuchet MS'
  },

  metricCardContentContainer: {
    display: 'flex',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  metricCardValue: {
    display: 'inline-block',
    color: '#236a97',
    height: 'auto',
    lineHeight: 'normal',
    verticalAlign: 'middle',
    fontFamily: 'monospace'
  },

  metricCardImg: {
    display: 'inline-block',
    width: '3em',
    height: '3em',
  },

  metricHeaderImg: {
    display: 'inline-block',
    width: '2em',
    height: '2em',
    margin: '0 1em 0 0',
  },

  colorfulDivider: {
    width: '95%',
    height: '7px',
    borderRadius: '10px',
    marginRight: 'auto',
    marginLeft: 'auto',
    position: 'relative',
    background: 'linear-gradient(-45deg,#3ec1d3,#f6f7d7,#ff9a00,#ff165d)'
  }
}));


/**
 * @typedef {sonarComponentName: string} SonarMetricsProps
 */


/**
 * @summary Create the SonarMetrics JSX Component with React Memo.
 * Please refer to this doc {@link https://zh-hant.reactjs.org/docs/react-api.html#reactmemo}
 * for more details about the Memo flow.
 */
const SonarMetrics = React.memo((props) => {
  const httpClientHeaders = useMemo(() => {
    return {
      ...(jwt && {'Authorization': jwt})
    };
  }, [jwt]);

  const httpClient = useMemo(() => createClient(baseURL, httpClientHeaders), [baseURL, httpClientHeaders]);

  /**
   * @function getMetricsData
   * @async
   *
   * Get the required metrics data from `sonarMetricsProxyApiPath` with `params`
   *
   * Please refer to Sonar Cloud API doc {@link https://sonarcloud.io/web_api/api/measures/component} for more details of `param`
   */
  const getMetricsData = useCallback(async () => {
    const params = {
      'metricKeys': SONAR_METRICS_KEYS.map(key => key.name).join(','),
      'component': props.sonarComponentName
    };
    return await sendHttpRequest(httpClient, 'GET', sonarMetricsProxyApiPath, params);
  }, [props.sonarComponentName]);

  const styles = useStyles();
  const [metricsData, setMetricData] = useState();

  useEffect(() => {
    getMetricsData().then((data) => {
      if (!data)
        return;
      setMetricData(data);
    });
  }, [props.sonarComponentName]);

  return (
    <>
      <h1 className={styles.metricsTitle}>
        <SiSonarqube size={24}/> Sonar Metrics
      </h1>
      <div className={styles.colorfulDivider}/>
      {
        metricsData &&
        <div className={styles.metricsContainer}>
          {
            metricsData.component.measures.map((measure) => (
              <Card key={randomHash()} className={styles.metricCard}>
                <CardActionArea>
                  <CardContent>
                    <div className={styles.metricCardHeaderContainer}>
                      <CardMedia
                        className={styles.metricHeaderImg}
                        image={SONAR_METRICS_KEYS.find(key => key.name === measure.metric)?.logoUrl}
                      />
                      <Typography variant="h6" component="div" className={styles.metricCardTitle}>
                        {toUpperCamelCase(measure.metric)}
                      </Typography>
                    </div>
                    <div className={styles.metricCardContentContainer}>
                      <Typography variant="h4" component="span" className={styles.metricCardValue}>
                        {measure.value}
                      </Typography>
                      <CardMedia
                        className={styles.metricCardImg}
                        image={measure.bestValue ? bestValueBadgeUrl : warningValueBadgeUrl}
                      />
                    </div>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))
          }
        </div>
      }
    </>
  )
});

SonarMetrics.displayName = SonarMetrics.name;

export default SonarMetrics;
