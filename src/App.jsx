import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "./pages/Home.jsx";
import { Courses } from "./pages/Courses.jsx";
import { About } from "./pages/About.jsx";
import { Contact } from "./pages/Contact.jsx";
import { Franchises } from "./pages/Franchises.jsx";
import { LearnAbacus } from "./pages/LearnAbacus.jsx";
import { Privacy } from "./pages/Privacy.jsx";
import { Gallery } from "./pages/Gallery.jsx";
import { AptitudeQuiz } from "./pages/AptitudeQuiz.jsx";
import { Admin } from "./pages/Admin.jsx";
import { NotFound } from "./pages/NotFound.jsx";
import { PortalLogin } from "./pages/PortalLogin.jsx";
import { FranchiseDashboard } from "./pages/FranchiseDashboard.jsx";
import { StudentDashboard } from "./pages/StudentDashboard.jsx";
import { PortalRoute } from "./components/portal/PortalRoute.jsx";
import { EnrollModalProvider } from "./contexts/EnrollModalContext.jsx";
import { EnrollModal } from "./components/shared/EnrollModal.jsx";
import { SplashScreen } from "./components/shared/SplashScreen.jsx";
import { MobileActionBar } from "./components/shared/MobileActionBar.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <EnrollModalProvider>
      <SplashScreen />
      <ScrollToTop />
      <EnrollModal />
      <MobileActionBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/about" element={<About />} />
        <Route path="/learn-abacus" element={<LearnAbacus />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/franchises" element={<Franchises />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/quiz" element={<AptitudeQuiz />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/portal/login" element={<PortalLogin />} />
        <Route path="/portal/franchise" element={
          <PortalRoute role="franchise"><FranchiseDashboard /></PortalRoute>
        } />
        <Route path="/portal/student" element={
          <PortalRoute role="student"><StudentDashboard /></PortalRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </EnrollModalProvider>
  );
}
