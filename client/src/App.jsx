import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ConundrumGame from './pages/ConundrumGame';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ConundrumGame />} />
        <Route path="*" element={<ConundrumGame />} />
      </Routes>
    </Router>
  );
}
