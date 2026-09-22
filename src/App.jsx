import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import { DataProvider } from './context/DataContext.jsx';
import Shell from './components/shell/Shell.jsx';
import './styles/globals.css';
import './styles/components.css';

import Overview from './pages/Overview/index.jsx';
import PredictionMarkets from './pages/PredictionMarkets/index.jsx';
import PerpDex from './pages/PerpDex/index.jsx';
import AIPayments from './pages/AIPayments/index.jsx';
import AIAgents from './pages/AIAgents/index.jsx';
import ReactiveTransactions from './pages/Infrastructure/ReactiveTransactions.jsx';
import RialoStream from './pages/Infrastructure/RialoStream.jsx';
import RialoEdge from './pages/Infrastructure/RialoEdge.jsx';
import RialoIPC from './pages/Infrastructure/RialoIPC.jsx';
import RialoWorkflow from './pages/Infrastructure/RialoWorkflow.jsx';
import Playground from './pages/Ecosystem/Playground.jsx';
import Applications from './pages/Ecosystem/Applications.jsx';
import Developers from './pages/Ecosystem/Developers.jsx';

export default function App() {
  return (
    <AppProvider>
      <DataProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Shell />}>
              <Route index element={<Overview />} />
              <Route path="markets" element={<PredictionMarkets />} />
              <Route path="dex" element={<PerpDex />} />
              <Route path="payments" element={<AIPayments />} />
              <Route path="agents" element={<AIAgents />} />
              <Route path="infra/reactive" element={<ReactiveTransactions />} />
              <Route path="infra/stream" element={<RialoStream />} />
              <Route path="infra/edge" element={<RialoEdge />} />
              <Route path="infra/ipc" element={<RialoIPC />} />
              <Route path="infra/workflow" element={<RialoWorkflow />} />
              <Route path="ecosystem/playground" element={<Playground />} />
              <Route path="ecosystem/apps" element={<Applications />} />
              <Route path="ecosystem/developers" element={<Developers />} />
            </Route>
          </Routes>
        </HashRouter>
      </DataProvider>
    </AppProvider>
  );
}
