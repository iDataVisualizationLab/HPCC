import React, { Suspense, lazy } from 'react'
import _config from './config'
import Data from './container/Data'
import VizData from './component/VizData'
import './App.css';
import Layout from "./container/Layout";

const App = ({ config: appConfig }) => {
    const config = { ...appConfig }
    const { pages, components, containers } = config
    const { Loading = () => <div /> } = components || {}
  return (
      <Suspense fallback={<Loading />}>
          <Data>
              <Layout>
                <VizData/>
              </Layout>
          </Data>
      </Suspense>
  );
}

export default App;
