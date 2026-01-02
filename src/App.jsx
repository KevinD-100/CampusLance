import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import CreateGig from './pages/CreateGig';        
import PostRequirement from './pages/PostRequirement'; 
import ResetPassword from './pages/ResetPassword';
import EditGig from './pages/EditGig'; 
import UploadPortfolio from './pages/UploadPortfolio';
import Profile from './pages/Profile';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/create-gig" element={<CreateGig />} />
      <Route path="/post-job" element={<PostRequirement />} />
      <Route path="/edit-gig/:id" element={<EditGig />} />
      <Route path="/upload-portfolio" element={<UploadPortfolio />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;