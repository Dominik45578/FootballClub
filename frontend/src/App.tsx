import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { StartPage } from './pages/StartPage'
import { RegisterPage } from './pages/RegisterPage'
import { Toaster } from '@/components/ui/sonner'
import { lazy, Suspense, useEffect, useState } from 'react';
import ActivateAccountPage from './pages/ActivateAccountPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { getMemberStatus, type MemberStatus, ensureMemberStatus } from './lib/userApi'

const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: (m as any).default || (m as any).DashboardPage })));
const TeamSearchPage = lazy(() => import('./pages/TeamSearchPage').then(m => ({ default: (m as any).default || (m as any).TeamSearchPage })));
const TeamDetailsPage = lazy(() => import('./pages/TeamDetailsPage').then(m => ({ default: (m as any).default || (m as any).TeamDetailsPage })));
const MemberProfilePage = lazy(() => import('./pages/MemberProfilePage').then(m => ({ default: (m as any).default || (m as any).MemberProfilePage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: (m as any).default || (m as any).ProfilePage })));
const TeamsPage = lazy(() => import('./pages/TeamsPage').then(m => ({ default: (m as any).default || (m as any).TeamsPage })));
const TeamManagementPage = lazy(() => import('./pages/TeamManagementPage').then(m => ({ default: (m as any).default || (m as any).TeamManagementPage })));
const JoinTeamPage = lazy(() => import('./pages/JoinTeamPage').then(m => ({ default: (m as any).default || (m as any).JoinTeamPage })));
const ClubSquadPage = lazy(() => import('./pages/ClubSquadPage').then(m => ({ default: (m as any).default || (m as any).ClubSquadPage })));
const MemberApplyPage = lazy(() => import('./pages/MemberApplyPage').then(m => ({ default: (m as any).default || (m as any).MemberApplyPage })));
const MatchesPage = lazy(() => import('./pages/MatchesPage').then(m => ({ default: (m as any).default || (m as any).MatchesPage })));
const MatchDetailsPage = lazy(() => import('./pages/MatchDetailsPage').then(m => ({ default: (m as any).default || (m as any).MatchDetailsPage })));
const MemberSearchPage = lazy(() => import('./pages/MemberSearchPage').then(m => ({ default: (m as any).default || (m as any).MemberSearchPage })));
const MemberPublicProfilePage = lazy(() => import('./pages/MemberPublicProfilePage').then(m => ({ default: (m as any).default || (m as any).MemberPublicProfilePage })));
const NewPasswordPage = lazy(() => import('./pages/NewPasswordPage').then(m => ({ default: (m as any).default || (m as any).NewPasswordPage })));


const ProfileRoute = ({ children }: { children: React.ReactElement }) => {
    const [status, setStatus] = useState<MemberStatus>(getMemberStatus())
    useEffect(() => {
        ensureMemberStatus().then(setStatus).catch(() => setStatus(getMemberStatus()))
    }, [])
    return status === 'member' ? <Navigate to="/member-profile" replace /> : children
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Dedicated login route */}
                <Route path="/login" element={<LoginPage />} />

                {/* Start page (root) */}
                <Route path="/" element={<StartPage />} />

                {/* Register */}
                <Route path="/register" element={<RegisterPage />} />

                {/* Dashboard */}
                <Route
                    path="/dashboard"
                    element={
                        <Suspense fallback={<div>Ładowanie...</div>}>
                            <DashboardPage />
                        </Suspense>
                    }
                />

                {/* Team and member related pages */}
                <Route path="/team-search" element={<Suspense fallback={<div>Ładowanie...</div>}> <TeamSearchPage /> </Suspense>} />
                <Route path="/team-details/:teamId?" element={<Suspense fallback={<div>Ładowanie...</div>}> <TeamDetailsPage /> </Suspense>} />
                <Route path="/club/:clubId/squad" element={<Suspense fallback={<div>Ładowanie...</div>}> <ClubSquadPage /> </Suspense>} />
                <Route path="/matches" element={<Suspense fallback={<div>Ładowanie...</div>}> <MatchesPage /> </Suspense>} />
                <Route path="/matches/:matchId" element={<Suspense fallback={<div>Ładowanie...</div>}> <MatchDetailsPage /> </Suspense>} />
                <Route path="/member-profile" element={<Suspense fallback={<div>Ładowanie...</div>}> <MemberProfilePage /> </Suspense>} />
                <Route path="/members" element={<Suspense fallback={<div>Ładowanie...</div>}> <MemberSearchPage /> </Suspense>} />
                <Route path="/member/:memberId" element={<Suspense fallback={<div>Ładowanie...</div>}> <MemberPublicProfilePage /> </Suspense>} />
                <Route path="/profile" element={<ProfileRoute><Suspense fallback={<div>Ładowanie...</div>}> <ProfilePage /> </Suspense></ProfileRoute>} />
                <Route path="/new-password" element={<Suspense fallback={<div>Ładowanie...</div>}> <NewPasswordPage /> </Suspense>} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Additional team pages (placeholders) */}
                <Route path="/teams" element={<Suspense fallback={<div>Ładowanie...</div>}> <TeamsPage /> </Suspense>} />
                <Route path="/team-management" element={<Suspense fallback={<div>Ładowanie...</div>}> <TeamManagementPage /> </Suspense>} />
                <Route path="/join-team" element={<Suspense fallback={<div>Ładowanie...</div>}> <JoinTeamPage /> </Suspense>} />
                <Route path="/member-apply" element={<Suspense fallback={<div>Ładowanie...</div>}> <MemberApplyPage /> </Suspense>} />

                {/* Activate Account */}
                <Route path="/activate-account" element={<ActivateAccountPage />} />

                {/* Catch-all: show start page for unknown routes (avoid auto redirect to backend login during frontend-only dev) */}
                <Route path="*" element={<StartPage />} />
            </Routes>
            <Toaster richColors closeButton position="top-right" />
        </BrowserRouter>
    )
}

export default App