import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ConundrumGame from './pages/ConundrumGame';
import SoundboardPage from './pages/SoundboardPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ConundrumGame />} />
        <Route path="/soundboard" element={<SoundboardPage />} />
        <Route path="*" element={<ConundrumGame />} />
      </Routes>
    </Router>
  );
}
