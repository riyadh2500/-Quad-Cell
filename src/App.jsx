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
import RealEstate from './pages/RealEstate/index.jsx';
import AssistantPage from './pages/Assistant/index.jsx';

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
              <Route path="realestate" element={<RealEstate />} />
              <Route path="assistant" element={<AssistantPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </DataProvider>
    </AppProvider>
  );
}
