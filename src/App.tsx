import { Route, Routes, useLocation } from 'react-router-dom';
import PathScreen from './screens/PathScreen';
import LessonScreen from './screens/LessonScreen';
import PracticeScreen from './screens/PracticeScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import AboutScreen from './screens/AboutScreen';
import { BottomNav } from './components/BottomNav';

export default function App() {
  const { pathname } = useLocation();
  const inLesson = pathname.startsWith('/lesson');
  return (
    <>
      <main id="main">
        <Routes>
          <Route path="/" element={<PathScreen />} />
          <Route path="/lesson/:id" element={<LessonScreen />} />
          <Route path="/practice" element={<PracticeScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/about" element={<AboutScreen />} />
          <Route path="*" element={<PathScreen />} />
        </Routes>
      </main>
      {!inLesson && <BottomNav />}
    </>
  );
}
