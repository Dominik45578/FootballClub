import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    ArrowLeft, CalendarDays, Users, Briefcase,
    User, Search, Filter, Tag, Hash, Shirt, Eye, Edit, Trash2,
    Crown, Megaphone, Stethoscope, AlertTriangle, X, AlertCircle,
    Save, PlusCircle, XCircle, Settings, CheckCircle2, Shield,
    Check, ListFilter, ChevronDown, ChevronUp, Clock, Ban
} from 'lucide-react'
import { toast } from 'sonner'
import {
    getTeams,
    getTeamDetails,
    getMyProfile,
    updateTeamMember,
    updateTeam,
    removeTeam,
    removeTeamMember,
    type TeamDetails,
    type ManageTeamMemberRequest,
    type UpdateTeamRequestDTO
} from '@/lib/userApi'
import { hasRole } from '@/lib/auth'
import { cn } from '@/lib/utils'

// --- KONFIGURACJA RÓL ---
const ROLE_CONFIG: Record<string, { label: string; icon: any; className: string }> = {
    ROLE_TEAM_CAPTAIN: { label: 'Kapitan', icon: Crown, className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
    ROLE_TEAM_HEAD_COACH: { label: 'Trener Główny', icon: Megaphone, className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
    ROLE_TEAM_ASSISTANT_COACH: { label: 'Asystent', icon: Megaphone, className: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' },
    ROLE_TEAM_MANAGER: { label: 'Manager', icon: Briefcase, className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
    ROLE_TEAM_PHYSIO: { label: 'Fizjoterapeuta', icon: Stethoscope, className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' },
    ROLE_TEAM_PLAYER: { label: 'Zawodnik', icon: User, className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
}

const AVAILABLE_ROLES = Object.keys(ROLE_CONFIG);
const DEFAULT_ROLE_CONFIG = { label: 'Członek', icon: User, className: 'bg-gray-100 text-gray-700 border-gray-200' }

const POSITION_TRANSLATIONS: Record<string, string> = {
    GOALKEEPER: 'Bramkarz', DEFENDER: 'Obrońca', MIDFIELDER: 'Pomocnik', ATTACKER: 'Napastnik', UNKNOWN: '—'
}

// --- KONFIGURACJA KATEGORII ---
const TEAM_CATEGORIES = [
    { value: 'FIRST_TEAM', label: 'Pierwsza Drużyna (Seniorzy)', group: 'SENIOR' },
    { value: 'SENIOR', label: 'Seniorzy (Ogólna)', group: 'SENIOR' },
    { value: 'RESERVES', label: 'Rezerwy (B-Team)', group: 'SENIOR' },
    { value: 'SECOND_TEAM', label: 'Druga Drużyna', group: 'SENIOR' },
    { value: 'THIRD_TEAM', label: 'Trzecia Drużyna', group: 'SENIOR' },
    { value: 'ACADEMY', label: 'Akademia (Cała)', group: 'ACADEMY' },
    { value: 'ACADEMY_ELITE', label: 'Akademia Elite', group: 'ACADEMY' },
    { value: 'ACADEMY_DEVELOPMENT', label: 'Akademia Development', group: 'ACADEMY' },
    { value: 'JUNIOR_OLDER', label: 'Junior Starszy', group: 'YOUTH' },
    { value: 'JUNIOR_YOUNGER', label: 'Junior Młodszy', group: 'YOUTH' },
    { value: 'YOUTH', label: 'Młodzieżowa (Ogólna)', group: 'YOUTH' },
    { value: 'U23', label: 'U-23', group: 'YOUTH' }, { value: 'U21', label: 'U-21', group: 'YOUTH' },
    { value: 'U19', label: 'U-19', group: 'YOUTH' }, { value: 'U18', label: 'U-18', group: 'YOUTH' },
    { value: 'U17', label: 'U-17', group: 'YOUTH' }, { value: 'U16', label: 'U-16', group: 'YOUTH' },
    { value: 'U15', label: 'U-15', group: 'YOUTH' }, { value: 'U14', label: 'U-14', group: 'YOUTH' },
    { value: 'U13', label: 'U-13', group: 'YOUTH' }, { value: 'U12', label: 'U-12', group: 'YOUTH' },
    { value: 'U11', label: 'U-11', group: 'YOUTH' }, { value: 'U10', label: 'U-10', group: 'YOUTH' },
    { value: 'U9', label: 'U-9', group: 'YOUTH' },   { value: 'U8', label: 'U-8', group: 'YOUTH' },
    { value: 'WOMEN_FIRST_TEAM', label: 'Kobiety - Pierwsza Drużyna', group: 'WOMEN' },
    { value: 'WOMEN_RESERVES', label: 'Kobiety - Rezerwy', group: 'WOMEN' },
    { value: 'WOMEN_U19', label: 'Kobiety U-19', group: 'WOMEN' },
    { value: 'WOMEN_U17', label: 'Kobiety U-17', group: 'WOMEN' },
    { value: 'WOMEN_U15', label: 'Kobiety U-15', group: 'WOMEN' },
    { value: 'TRENING', label: 'Grupa Treningowa', group: 'OTHER' }
];

const CATEGORY_FILTERS = [
    { id: 'ALL', label: 'Wszystkie' },
    { id: 'SENIOR', label: 'Seniorzy' },
    { id: 'YOUTH', label: 'Młodzież' },
    { id: 'WOMEN', label: 'Kobiety' },
    { id: 'ACADEMY', label: 'Akademia' }
];

export function TeamDetailsPage() {
    const { teamId } = useParams()
    const navigate = useNavigate()

    // --- Stan Aplikacji ---
    const [teamOverview, setTeamOverview] = useState<any>(null)
    const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null)
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)

    const [loadingOverview, setLoadingOverview] = useState(true)
    const [loadingDetails, setLoadingDetails] = useState(false)

    // --- Global Edit Mode ---
    const [isGlobalEditMode, setIsGlobalEditMode] = useState(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('team_edit_mode') === 'true'
        return false
    })

    // --- Opis Zespołu (Rozwiń/Zwiń) ---
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

    // --- Member Edit State ---
    const [editingMemberId, setEditingMemberId] = useState<number | null>(null)

    // --- Team Edit State ---
    const [teamForm, setTeamForm] = useState<UpdateTeamRequestDTO>({
        id: 0, name: '', description: '', category: '', status: ''
    })

    // --- Modals State ---
    const [isDeleteTeamModalOpen, setIsDeleteTeamModalOpen] = useState(false)
    const [memberToDeleteId, setMemberToDeleteId] = useState<number | null>(null)
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

    // --- Category Modal Logic ---
    const [tempSelectedCategory, setTempSelectedCategory] = useState('')
    const [categorySearch, setCategorySearch] = useState('')
    const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL')

    // --- Filtry ---
    const [searchQuery, setSearchQuery] = useState('')
    const [positionFilter, setPositionFilter] = useState<string>('ALL')
    const [statusFilter, setStatusFilter] = useState<string>('ALL')
    const [roleFilter, setRoleFilter] = useState<string>('ALL')

    // --- Banner Stan ---
    const [isBannerDismissed, setIsBannerDismissed] = useState(false)

    useEffect(() => {
        const prevTitle = document.title
        return () => { document.title = prevTitle }
    }, [])

    useEffect(() => {
        localStorage.setItem('team_edit_mode', String(isGlobalEditMode))
        if (!isGlobalEditMode) {
            setEditingMemberId(null)
            setIsCategoryModalOpen(false)
            setIsDeleteTeamModalOpen(false)
        }
    }, [isGlobalEditMode])

    // --- 1. Pobieranie Profilu ---
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profile = await getMyProfile()
                setCurrentUserProfile(profile)
            } catch (e) { console.error(e) }
        }
        fetchProfile()
    }, [])

    // --- 2. Pobieranie Danych Zespołu ---
    const fetchTeamData = async () => {
        const id = Number(teamId)
        if (!id || isNaN(id)) return

        setLoadingOverview(true)
        try {
            const res = await getTeams({ teamId: id, mode: 'SPECIFIC_TEAM' }, { allowUnauth: true })
            const found = res.items.find((t: any) => t.teamId === id || t.id === id)

            if (found) {
                setTeamOverview(found)
                setTeamForm({
                    id: found.teamId ,
                    name: found.teamName,
                    category: found.category || 'AMATEUR',
                    description: found.description || '',
                    status: found.status || 'ACTIVE'
                })

                document.title = `Zespół: ${found.teamName}`
                const count = found.numberOfMembers ?? 0

                if (count > 0) {
                    setLoadingDetails(true)
                    try {
                        const details = await getTeamDetails(id, { allowUnauth: true })
                        setTeamDetails(details)
                    } catch (err: any) {
                        toast.error('Nie udało się pobrać listy członków')
                    } finally {
                        setLoadingDetails(false)
                    }
                } else {
                    setTeamDetails(null)
                    setLoadingDetails(false)
                }
            } else {
                toast.error('Nie znaleziono zespołu')
                navigate('/dashboard')
            }
        } catch (err: any) {
            console.error(err)
            toast.error('Błąd komunikacji z serwerem')
        } finally {
            setLoadingOverview(false)
        }
    }

    useEffect(() => {
        fetchTeamData()
    }, [teamId, navigate])

    // --- 3. Logika Uprawnień ---
    const canManage = useMemo(() => {
        if (hasRole('ADMIN') || hasRole('ROLE_ADMIN')) return true;
        if (!teamDetails || !currentUserProfile) return false;

        const myMemberRecord = teamDetails.members?.find((m: any) => m.memberId === currentUserProfile.id);
        if (myMemberRecord) {
            const roles = myMemberRecord.roles || [];
            return roles.some((r: string) =>
                r === 'ROLE_TEAM_HEAD_COACH' || r === 'ROLE_TEAM_ASSISTANT_COACH' || r === 'ROLE_TEAM_MANAGER'
            );
        }
        return false;
    }, [teamDetails, currentUserProfile]);

    // --- WYSZUKIWANIE DANYCH MOJEGO CZŁONKOSTWA W TYM ZESPOLE ---
    const myMembershipData = useMemo(() => {
        if (!teamDetails || !currentUserProfile) return null;
        return teamDetails.members?.find((m: any) => m.memberId === currentUserProfile.id);
    }, [teamDetails, currentUserProfile]);

    // Czy jestem kapitanem?
    const isCaptain = useMemo(() => {
        return myMembershipData?.roles?.includes('ROLE_TEAM_CAPTAIN');
    }, [myMembershipData]);

    const isMemberActive = useMemo(() => {
        return myMembershipData?.status === 'ACTIVE';
    }, [myMembershipData]);


    // --- AKCJE ---
    const handleToggleEditMode = () => setIsGlobalEditMode(!isGlobalEditMode)

    const handleDeleteTeamClick = () => setIsDeleteTeamModalOpen(true)

    const confirmDeleteTeam = async () => {
        const id = Number(teamId)
        if (!id) return;
        try {
            await removeTeam(id);
            toast.success("Zespół został pomyślnie usunięty");
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            toast.error("Wystąpił błąd podczas usuwania zespołu");
        } finally {
            setIsDeleteTeamModalOpen(false)
        }
    }

    const handleDeleteMemberClick = (teamMemberId: number) => {
        setMemberToDeleteId(teamMemberId)
    }

    const confirmDeleteMember = async () => {
        if (!memberToDeleteId) return
        try {
            await removeTeamMember(memberToDeleteId);
            toast.success("Członek został usunięty z zespołu");
            fetchTeamData();
        } catch (error) {
            console.error(error);
            toast.error("Nie udało się usunąć członka");
        } finally {
            setMemberToDeleteId(null)
        }
    }

    const handleSaveMember = async (payload: ManageTeamMemberRequest) => {
        try {
            await updateTeamMember(payload);
            toast.success("Dane członka zaktualizowane");
            setEditingMemberId(null);
            fetchTeamData();
        } catch (error) {
            console.error(error);
            toast.error("Wystąpił błąd podczas zapisu zmian");
        }
    }

    const handleSaveTeam = async () => {
        try {
            await updateTeam(teamForm);
            toast.success("Dane zespołu zaktualizowane");
            fetchTeamData();
        } catch (error) {
            console.error(error);
            toast.error("Błąd aktualizacji zespołu");
        }
    }

    // --- MODAL KATEGORII ---
    const openCategoryModal = () => {
        setTempSelectedCategory(teamForm.category || '');
        setCategorySearch('');
        setActiveCategoryFilter('ALL');
        setIsCategoryModalOpen(true);
    }

    const handleCategorySelect = () => {
        setTeamForm({...teamForm, category: tempSelectedCategory});
        setIsCategoryModalOpen(false);
    }

    const filteredCategoriesInModal = useMemo(() => {
        return TEAM_CATEGORIES.filter(c => {
            const matchesSearch = c.label.toLowerCase().includes(categorySearch.toLowerCase());
            const matchesFilter = activeCategoryFilter === 'ALL' || c.group === activeCategoryFilter;
            return matchesSearch && matchesFilter;
        });
    }, [categorySearch, activeCategoryFilter]);

    const getCategoryLabel = (val: string) => TEAM_CATEGORIES.find(c => c.value === val)?.label || val;

    // --- Obliczenia ---
    const pendingCount = useMemo(() => {
        if (!teamDetails?.members) return 0
        return teamDetails.members.filter((m: any) =>
            ['WAITING', 'PENDING', 'WAITING_FOR_VERIFICATION'].includes((m.status || '').toUpperCase())
        ).length
    }, [teamDetails])

    const filteredMembers = useMemo(() => {
        if (!teamDetails?.members) return []
        let members = [...teamDetails.members]

        if (statusFilter !== 'ALL') {
            members = members.filter((m: any) => (m.status || '').toUpperCase() === statusFilter)
        }
        if (positionFilter !== 'ALL') {
            members = members.filter((m: any) => (m.fieldPosition || 'UNKNOWN') === positionFilter)
        }
        if (roleFilter !== 'ALL') {
            members = members.filter((m: any) => m.roles?.includes(roleFilter))
        }
        if (searchQuery.trim()) {
            const lowerQ = searchQuery.toLowerCase()
            members = members.filter((m: any) =>
                (m.firstName?.toLowerCase().includes(lowerQ)) ||
                (m.lastName?.toLowerCase().includes(lowerQ))
            )
        }
        return members
    }, [teamDetails, positionFilter, statusFilter, roleFilter, searchQuery])

    const formatDate = (dateString?: string) => {
        if (!dateString) return '—'
        return new Date(dateString).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
    }

    const getInitials = (name: string) => {
        if (!name) return 'TM'
        return name.substring(0, 2).toUpperCase()
    }

    const renderDescription = () => {
        const text = teamOverview?.description || '';
        const limit = 300;
        const isLong = text.length > limit;

        if (!isLong || isDescriptionExpanded) {
            return (
                <div className="space-y-1">
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{text}</p>
                    {isLong && (
                        <button onClick={() => setIsDescriptionExpanded(false)} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                            Zwiń <ChevronUp className="h-3 w-3" />
                        </button>
                    )}
                </div>
            )
        }

        return (
            <div className="space-y-1">
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {text.slice(0, limit)}...
                </p>
                <button onClick={() => setIsDescriptionExpanded(true)} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                    Rozwiń <ChevronDown className="h-3 w-3" />
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-12 relative">

            {/* --- MODALE (bez zmian) --- */}
            {isDeleteTeamModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-background border border-destructive/30 rounded-lg shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="bg-destructive/10 p-3 rounded-full">
                                <AlertTriangle className="h-8 w-8 text-destructive" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Usunąć zespół?</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Czy na pewno chcesz usunąć zespół <strong>{teamOverview?.teamName}</strong>?
                                    Tej operacji nie można cofnąć.
                                </p>
                            </div>
                            <div className="flex gap-3 w-full pt-2">
                                <Button variant="outline" className="flex-1" onClick={() => setIsDeleteTeamModalOpen(false)}>Anuluj</Button>
                                <Button variant="destructive" className="flex-1" onClick={confirmDeleteTeam}>Usuń Zespół</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {memberToDeleteId !== null && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-background border rounded-lg shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                                <Users className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Usunąć członka?</h3>
                                <p className="text-sm text-muted-foreground mt-1">Czy na pewno chcesz usunąć tego użytkownika?</p>
                            </div>
                            <div className="flex gap-3 w-full pt-2">
                                <Button variant="outline" className="flex-1" onClick={() => setMemberToDeleteId(null)}>Anuluj</Button>
                                <Button variant="destructive" className="flex-1" onClick={confirmDeleteMember}>Usuń</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-background border rounded-xl shadow-2xl w-full max-w-2xl flex flex-col h-[600px] max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b bg-background shrink-0">
                            <h3 className="text-xl font-semibold flex items-center gap-2"><Tag className="h-5 w-5 text-primary" /> Wybierz kategorię zespołu</h3>
                            <Button variant="ghost" size="icon" onClick={() => setIsCategoryModalOpen(false)}><X className="h-5 w-5" /></Button>
                        </div>
                        <div className="p-5 space-y-4 border-b bg-background shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input className="pl-10 h-10 bg-muted/30" placeholder="Wyszukaj kategorię..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} autoFocus />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORY_FILTERS.map(filter => (
                                    <Badge key={filter.id} variant={activeCategoryFilter === filter.id ? "default" : "secondary"} className={cn("cursor-pointer px-4 py-1.5 text-xs font-medium transition-all hover:scale-105", activeCategoryFilter !== filter.id && "hover:bg-secondary/80 bg-muted text-muted-foreground hover:text-foreground")} onClick={() => setActiveCategoryFilter(filter.id)}>{filter.label}</Badge>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-background">
                            {filteredCategoriesInModal.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground"><ListFilter className="h-10 w-10 mb-2 opacity-30" /><p>Brak wyników dla podanych kryteriów</p></div>
                            ) : (
                                filteredCategoriesInModal.map(cat => (
                                    <div key={cat.value} onClick={() => setTempSelectedCategory(cat.value)} className={cn("flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all border", tempSelectedCategory === cat.value ? "bg-primary/5 border-primary/40 text-primary shadow-sm" : "border-transparent hover:bg-secondary/80 hover:text-secondary-foreground")}>
                                        <span className="font-medium">{cat.label}</span>
                                        {tempSelectedCategory === cat.value && <div className="bg-primary text-primary-foreground rounded-full p-0.5"><Check className="h-3 w-3" /></div>}
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 border-t flex justify-end gap-3 bg-muted/10 rounded-b-xl shrink-0">
                            <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Anuluj</Button>
                            <Button onClick={handleCategorySelect} disabled={!tempSelectedCategory} className="px-6">Wybierz kategorię</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- HEADER --- */}
            <header className="border-b bg-card sticky top-0 z-20 shadow-sm bg-[#0f172a]">
                <div className="container flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 overflow-hidden rounded-lg bg-white p-1 border shadow-sm">
                            <img
                                src="/favicon.png"
                                alt="Club Logo"
                                className="h-full w-full object-contain"
                            />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-foreground">Profil zespołu</h1>
                            <p className="text-xs text-muted-foreground hidden sm:block">Zobacz szczegóły zespołu</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {canManage && (
                            <Button
                                variant={isGlobalEditMode ? "default" : "outline"}
                                onClick={handleToggleEditMode}
                                className={cn("gap-2", isGlobalEditMode && "bg-amber-600 hover:bg-amber-700")}
                            >
                                {isGlobalEditMode ? <CheckCircle2 className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
                                {isGlobalEditMode ? "Zakończ Edycję" : "Zarządzaj"}
                            </Button>
                        )}
                        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Dashboard
                        </Button>
                    </div>
                </div>
            </header>

            {/* --- MAIN (POPRAWIONY UKŁAD) --- */}
            <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 max-w-7xl">

                {/* BANNER */}
                {pendingCount > 0 && canManage && !isBannerDismissed && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3 relative animate-in slide-in-from-top-2">
                        <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5 shrink-0" />
                        <div className="pr-8">
                            <h3 className="font-semibold text-blue-800 dark:text-blue-400">Wymagana weryfikacja</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">W tym zespole jest <span className="font-bold">{pendingCount}</span> członków oczekujących na zatwierdzenie.</p>
                        </div>
                        <button onClick={() => setIsBannerDismissed(true)} className="absolute top-1/2 -translate-y-1/2 right-4 p-2 rounded-full text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"><X className="h-5 w-5" /></button>
                    </div>
                )}

                {/* --- GRID UKŁAD --- */}
                {/* Używamy flex-row, lewy panel stały 380px */}
                <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">

                    {/* --- LEWA KOLUMNA: TEAM INFO / EDIT FORM (Stała szerokość 380px) --- */}
                    <aside className="w-full lg:w-[380px] shrink-0 sticky top-24 space-y-6">
                        {loadingOverview ? (
                            <Card><CardContent className="p-8"><Skeleton className="h-64 w-full" /></CardContent></Card>
                        ) : teamOverview ? (
                            <Card className={cn("overflow-hidden shadow-sm transition-all", isGlobalEditMode && "ring-2 ring-amber-500/50 shadow-lg")}>
                                <CardHeader className="text-center pb-2 bg-muted/20 border-b relative">
                                    {/* KOSZ */}
                                    {canManage && isGlobalEditMode && (
                                        <div className="absolute top-4 right-4">
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="h-8 w-8 rounded-full opacity-90 hover:opacity-100 shadow-md transition-all hover:scale-105"
                                                onClick={handleDeleteTeamClick}
                                                title="Usuń zespół trwale"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}

                                    <div className="mx-auto mb-4 relative">
                                        {/* Avatar Kapitana (złota obwódka) */}
                                        <Avatar className={cn("h-40 w-40 border-4 border-background shadow-xl mx-auto", isCaptain && "border-amber-400 ring-4 ring-amber-400/30")}>
                                            <AvatarFallback className="text-5xl bg-[#F05526] text-white font-normal tracking-wide">
                                                {getInitials(teamOverview.teamName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute bottom-2 right-1/2 translate-x-12 bg-background rounded-full p-1.5 shadow-sm border">
                                            <Users className="h-6 w-6 text-primary" />
                                        </div>
                                    </div>

                                    {isGlobalEditMode ? (
                                        <div className="space-y-2 mt-2">
                                            <Input
                                                value={teamForm.name}
                                                onChange={(e) => setTeamForm({...teamForm, name: e.target.value})}
                                                className="text-center text-lg font-bold"
                                                placeholder="Nazwa zespołu"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <CardTitle className="text-2xl font-bold">{teamOverview.teamName}</CardTitle>

                                            {/* PLAKIETKI RÓL DLA ZALOGOWANEGO UŻYTKOWNIKA (TYLKO JEŚLI ACTIVE) */}
                                            {myMembershipData && isMemberActive && myMembershipData.roles && myMembershipData.roles.length > 0 && (
                                                <div className="flex justify-center flex-wrap gap-2 mt-2">
                                                    {myMembershipData.roles.map((role: string) => {
                                                        const conf = ROLE_CONFIG[role]
                                                        if (!conf) return null;
                                                        const Icon = conf.icon
                                                        return (
                                                            <div key={role} className={cn("flex items-center justify-center w-8 h-8 rounded-full border shadow-sm", conf.className)} title={conf.label}>
                                                                <Icon className="h-4 w-4" />
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                            {/* STATUS BADGE JEŚLI NIE JEST ACTIVE */}
                                            {myMembershipData && !isMemberActive && (
                                                <div className="flex justify-center mt-2">
                                                    {myMembershipData.status === 'SUSPENDED' && <Badge className="bg-red-100 text-red-700 border-red-200"><Ban className="w-3 h-3 mr-1"/> Zawieszony</Badge>}
                                                    {(myMembershipData.status === 'WAITING' || myMembershipData.status === 'PENDING') && <Badge className="bg-blue-100 text-blue-700 border-blue-200"><Clock className="w-3 h-3 mr-1"/> Oczekujący</Badge>}
                                                    {myMembershipData.status === 'REJECTED' && <Badge className="bg-gray-100 text-gray-700 border-gray-200"><XCircle className="w-3 h-3 mr-1"/> Odrzucony</Badge>}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-2">
                                        <CalendarDays className="h-4 w-4" />
                                        Założony: {formatDate(teamOverview.createdAt)}
                                    </p>
                                </CardHeader>

                                {/* NOWA SEKCJA: STATUS CZŁONKA (opcjonalnie, skoro mamy badge wyżej, można to usunąć lub zostawić jako info tekstowe) - Zostawiam dla jasności */}
                                {myMembershipData && (
                                    <div className="bg-primary/5 py-3 px-4 text-center border-b border-primary/10">
                                        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-primary">
                                            {myMembershipData.status === 'ACTIVE' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                            {myMembershipData.status === 'ACTIVE' ? 'JESTEŚ CZŁONKIEM' : 'TWOJE CZŁONKOSTWO JEST WERYFIKOWANE'}
                                        </div>
                                    </div>
                                )}

                                <CardContent className="pt-6 space-y-4">
                                    {isGlobalEditMode ? (
                                        <div className="space-y-4 animate-in fade-in">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground">Kategoria</label>
                                                <Button variant="outline" onClick={openCategoryModal} className="w-full justify-between font-normal">
                                                    {teamForm.category ? getCategoryLabel(teamForm.category) : "Wybierz kategorię..."}
                                                    <Tag className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground">Status</label>
                                                <Select value={teamForm.status} onValueChange={(v) => setTeamForm({...teamForm, status: v})}>
                                                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ACTIVE">Aktywny</SelectItem>
                                                        <SelectItem value="SUSPENDED">Zawieszony</SelectItem>
                                                        <SelectItem value="RECRUITING">Rekrutacja</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground">Opis</label>
                                                <textarea
                                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                    value={teamForm.description || ''}
                                                    onChange={(e) => setTeamForm({...teamForm, description: e.target.value})}
                                                    placeholder="Krótki opis zespołu..."
                                                />
                                            </div>
                                            <Button onClick={handleSaveTeam} className="w-full gap-2 mt-2"><Save className="h-4 w-4" /> Zapisz zmiany</Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-3">
                                                <StatRow icon={Users} label="Członkowie" value={teamOverview.numberOfMembers ?? teamOverview.memberCount} unit="" />
                                                {/* ZMIANA: Zawijanie tekstu dla kategorii */}
                                                <StatRow icon={Tag} label="Kategoria" value={getCategoryLabel(teamOverview.category || '')} unit="" valueClass="whitespace-normal text-right break-words text-sm leading-tight" />
                                                {teamOverview.code && <StatRow icon={Hash} label="Kod" value={teamOverview.code} unit="" />}
                                                {teamOverview.status && <StatRow icon={Shield} label="Status" value={teamOverview.status} unit="" />}
                                            </div>

                                            {teamOverview.description && (
                                                <>
                                                    <Separator className="my-4" />
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Briefcase className="w-4 h-4" /> Opis</div>
                                                        {renderDescription()}
                                                    </div>
                                                </>
                                            )}

                                            {pendingCount > 0 && canManage && isBannerDismissed && (
                                                <>
                                                    <Separator className="my-4" />
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 flex items-center gap-3 animate-in fade-in">
                                                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-500 shrink-0" />
                                                        <div className="text-sm">
                                                            <p className="font-semibold text-blue-800 dark:text-blue-400">{pendingCount} oczekujących</p>
                                                            <p className="text-xs text-blue-600 dark:text-blue-300">Wymagana weryfikacja</p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-center">Brak danych</div>
                        )}
                    </aside>

                    {/* --- PRAWA STRONA: LISTA CZŁONKÓW (Zajmuje resztę) --- */}
                    <div className="flex-1 w-full min-w-0 space-y-6">

                        {/* Pasek Filtrów */}
                        <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
                            <div className="relative w-full sm:w-auto sm:flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Szukaj (ID lub Nazwa)..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    disabled={!teamDetails}
                                />
                            </div>

                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                <Select value={roleFilter} onValueChange={setRoleFilter} disabled={!teamDetails}>
                                    <SelectTrigger className="w-[140px]"><Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" /><SelectValue placeholder="Rola" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Wszystkie Role</SelectItem>
                                        {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={statusFilter} onValueChange={setStatusFilter} disabled={!teamDetails}>
                                    <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Status</SelectItem>
                                        <SelectItem value="ACTIVE">Aktywne</SelectItem>
                                        <SelectItem value="WAITING">Oczekujące</SelectItem>
                                        <SelectItem value="SUSPENDED">Zawieszone</SelectItem>
                                        <SelectItem value="ARCHIVED">Zarchiwizowane</SelectItem>
                                        <SelectItem value="REJECTED">Odrzucone</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={positionFilter} onValueChange={setPositionFilter} disabled={!teamDetails}>
                                    <SelectTrigger className="w-[130px]"><SelectValue placeholder="Pozycja" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Pozycja</SelectItem>
                                        <SelectItem value="GOALKEEPER">Bramkarz</SelectItem>
                                        <SelectItem value="DEFENDER">Obrońca</SelectItem>
                                        <SelectItem value="MIDFIELDER">Pomocnik</SelectItem>
                                        <SelectItem value="ATTACKER">Napastnik</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Licznik */}
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-lg font-semibold tracking-tight">Wyniki wyszukiwania</h2>
                            <Badge variant="secondary" className="px-2">{filteredMembers.length}</Badge>
                        </div>

                        {/* LISTA - 2 Kolumny (Szerokie karty) */}
                        <div className="space-y-4">
                            {loadingDetails && (
                                <>
                                    <Skeleton className="h-32 w-full rounded-xl" />
                                    <Skeleton className="h-32 w-full rounded-xl" />
                                </>
                            )}

                            {!loadingDetails && filteredMembers.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl bg-muted/5">
                                    <Shirt className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                    <h3 className="text-lg font-medium">Brak wyników</h3>
                                    <p className="text-muted-foreground">Brak członków spełniających kryteria.</p>
                                </div>
                            )}

                            {!loadingDetails && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredMembers.map((member: any) => (
                                        <TeamMemberCard
                                            key={member.teamMemberId}
                                            member={member}
                                            currentUserProfile={currentUserProfile} // PRZEKAZANIE PROFILU
                                            canManage={canManage}
                                            isGlobalEditMode={isGlobalEditMode}
                                            isEditing={editingMemberId === member.teamMemberId}
                                            onEditStart={() => setEditingMemberId(member.teamMemberId)}
                                            onEditCancel={() => setEditingMemberId(null)}
                                            onSave={(data) => handleSaveMember(data)}
                                            onView={() => navigate(`/member/${member.memberId}`)}
                                            onDelete={() => handleDeleteMemberClick(member.teamMemberId)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

// --- HELPERS ---

function StatRow({ icon: Icon, label, value, unit, valueClass }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-3 shrink-0">
                <div className="p-2 bg-background rounded-full shadow-sm"><Icon className="h-4 w-4 text-primary" /></div>
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>
            {/* ZMIANA: Obsługa customowej klasy dla wartości (np. dla zawijania tekstu) */}
            <span className={cn("text-lg font-bold text-right", valueClass ? valueClass : "truncate max-w-[140px]")}>
                {value != null ? `${value} ${unit}` : '—'}
            </span>
        </div>
    )
}

// --- KARTA CZŁONKA ---
interface TeamMemberCardProps {
    member: any;
    currentUserProfile: any; // Dodany prop
    canManage: boolean;
    isGlobalEditMode: boolean;
    isEditing: boolean;
    onEditStart: () => void;
    onEditCancel: () => void;
    onSave: (data: ManageTeamMemberRequest) => void;
    onView: () => void;
    onDelete: () => void;
}

function TeamMemberCard({ member, currentUserProfile, canManage, isGlobalEditMode, isEditing, onEditStart, onEditCancel, onSave, onView, onDelete }: TeamMemberCardProps) {

    const [editNumber, setEditNumber] = useState(member.number || '')
    const [editPosition, setEditPosition] = useState(member.fieldPosition || 'UNKNOWN')
    const [editStatus, setEditStatus] = useState(member.status || 'ACTIVE')
    const [currentRoles, setCurrentRoles] = useState<string[]>([])

    useEffect(() => {
        if (isEditing) {
            setEditNumber(member.number || '')
            setEditPosition(member.fieldPosition || 'UNKNOWN')
            setEditStatus(member.status || 'ACTIVE')
            setCurrentRoles(member.roles || [])
        }
    }, [isEditing, member])

    const handleSaveClick = () => {
        const originalRoles = new Set(member.roles || []);
        const newRolesSet = new Set(currentRoles);
        const rolesToAdd = currentRoles.filter(r => !originalRoles.has(r));
        const rolesToRemove = (member.roles || []).filter((r: string) => !newRolesSet.has(r));

        const payload: ManageTeamMemberRequest = {
            teamMemberId: member.teamMemberId,
            status: editStatus,
            newFieldPosition: editPosition === 'UNKNOWN' ? null : editPosition,
            number: editNumber ? parseInt(editNumber) : null,
            newRoles: rolesToAdd,
            removedRoles: rolesToRemove
        }
        onSave(payload)
    }

    const toggleRole = (role: string) => {
        if (currentRoles.includes(role)) {
            setCurrentRoles(currentRoles.filter(r => r !== role))
        } else {
            setCurrentRoles([...currentRoles, role])
        }
    }

    const getStatusColor = (status: string) => {
        const s = (status || '').toUpperCase()
        if (s === 'ACTIVE') return 'bg-green-500 shadow-green-200 dark:shadow-green-900/20'
        if (s === 'REJECTED') return 'bg-red-500 shadow-red-200 dark:shadow-red-900/20'
        if (['WAITING', 'PENDING', 'WAITING_FOR_VERIFICATION'].includes(s)) return 'bg-blue-500 shadow-blue-200 dark:shadow-blue-900/20'
        return 'bg-gray-400 shadow-gray-200 dark:shadow-gray-900/20'
    }
    const stripColorClass = getStatusColor(member.status)

    const translatePosition = (pos?: string) => {
        if (!pos) return '—'
        const key = pos.toUpperCase()
        return POSITION_TRANSLATIONS[key] || pos
    }

    // Nowa funkcja helper do odznaki specjalnej
    const getSpecialRoleBadge = (roles: string[]) => {
        if (!roles) return null;
        if (roles.includes('ROLE_TEAM_CAPTAIN')) {
            return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20 gap-1 pl-1.5 pr-2 h-5"><Crown className="h-3 w-3" /> Kapitan</Badge>
        }
        if (roles.includes('ROLE_TEAM_HEAD_COACH')) {
            return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20 gap-1 pl-1.5 pr-2 h-5"><Megaphone className="h-3 w-3" /> Trener</Badge>
        }
        if (roles.includes('ROLE_TEAM_ASSISTANT_COACH')) {
            return <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20 gap-1 pl-1.5 pr-2 h-5"><Megaphone className="h-3 w-3" /> Asystent</Badge>
        }
        if (roles.includes('ROLE_TEAM_MANAGER')) {
            return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 gap-1 pl-1.5 pr-2 h-5"><Briefcase className="h-3 w-3" /> Manager</Badge>
        }
        if (roles.includes('ROLE_TEAM_PHYSIO')) {
            return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 gap-1 pl-1.5 pr-2 h-5"><Stethoscope className="h-3 w-3" /> Fizjo</Badge>
        }
        return null;
    }

    // --- NOWA FUNKCJA STYLIZACJI KARTY ---
    const getCardStyle = () => {
        // 1. Złota obramówka dla zalogowanego użytkownika
        if (currentUserProfile && member.memberId === currentUserProfile.id) {
            return 'border-amber-400 ring-2 ring-amber-400/20 shadow-amber-100 dark:shadow-none bg-amber-50/30 dark:bg-amber-950/10'
        }

        const roles = member.roles || [];

        // 2. Trener Główny
        if (roles.includes('ROLE_TEAM_HEAD_COACH')) {
            return 'border-red-200 bg-red-50/30 dark:border-red-900/50 dark:bg-red-950/10'
        }

        // 3. Fizjo
        if (roles.includes('ROLE_TEAM_PHYSIO')) {
            return 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/10'
        }

        // Domyślny styl
        return 'bg-card border-border hover:shadow-md'
    }

    return (
        <Card className={cn(
            "overflow-hidden transition-all duration-200 group h-full flex flex-col relative",
            isEditing ? "border-white bg-accent/5 shadow-lg ring-1 ring-white/20" : getCardStyle() // Użycie nowej funkcji
        )}>
            {/* BADGE "JA" (lub "TY") */}
            {!isEditing && currentUserProfile && member.memberId === currentUserProfile.id && (
                <div className="absolute top-3 right-28 z-10">
                    <Badge variant="outline" className="bg-white text-[10px] font-bold text-slate-700 border-slate-300 shadow-sm px-1.5 py-0.5">JA</Badge>
                </div>
            )}

            <CardContent className="p-0 flex flex-col h-full">
                <div className="flex h-full min-h-[140px]">
                    <div className={cn("w-2 shrink-0 transition-colors", isEditing ? getStatusColor(editStatus) : stripColorClass)} />

                    <div className="flex flex-1 flex-col sm:flex-row">
                        <div className="flex-1 p-3 space-y-3">

                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-base font-bold text-foreground truncate">{member.firstName} {member.lastName}</h3>
                                        {/* Wyświetlanie specjalnej odznaki */}
                                        {!isEditing && getSpecialRoleBadge(member.roles)}
                                    </div>
                                    {!isEditing && (
                                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                            <CalendarDays className="h-3 w-3" />
                                            Dołączył: {member.sienceDate ? new Date(member.sienceDate).toLocaleDateString('pl-PL') : (member.joinDate ? new Date(member.joinDate).toLocaleDateString('pl-PL') : '—')}
                                        </p>
                                    )}
                                </div>
                                {isEditing ? (
                                    <Select value={editStatus} onValueChange={setEditStatus}>
                                        <SelectTrigger className="h-6 w-[110px] text-[10px] px-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ACTIVE">Aktywny</SelectItem>
                                            <SelectItem value="WAITING">Oczekujący</SelectItem>
                                            <SelectItem value="SUSPENDED">Zawieszony</SelectItem>
                                            <SelectItem value="ARCHIVED">Zarchiwizowany</SelectItem>
                                            <SelectItem value="REJECTED">Odrzucone</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <StatusBadge status={member.status} />
                                )}
                            </div>

                            {/* Grid dla pól numeru i pozycji */}
                            <div className="grid grid-cols-2 gap-2 w-full">
                                <div className={cn("rounded-md p-1.5 flex items-center gap-2 border", isEditing ? "bg-background border-primary/50" : "bg-secondary/10 border-transparent")}>
                                    <div className="bg-background p-1 rounded-md shadow-sm"><Shirt className="h-3 w-3 text-primary" /></div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[9px] uppercase font-bold text-muted-foreground leading-none mb-0.5">NUMER</p>
                                        {isEditing ? (
                                            <Input className="h-5 text-xs px-1 py-0 border-0 focus-visible:ring-0 bg-transparent p-0 font-mono font-bold w-full"
                                                   placeholder="#" value={editNumber} onChange={(e) => setEditNumber(e.target.value)} type="number" />
                                        ) : <p className="font-mono font-bold text-xs truncate">{member.number ? member.number : '-'}</p>}
                                    </div>
                                </div>
                                <div className={cn("rounded-md p-1.5 flex items-center gap-2 border", isEditing ? "bg-background border-primary/50" : "bg-secondary/10 border-transparent")}>
                                    <div className="bg-background p-1 rounded-md shadow-sm"><User className="h-3 w-3 text-primary" /></div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[9px] uppercase font-bold text-muted-foreground leading-none mb-0.5">POZYCJA</p>
                                        {isEditing ? (
                                            <Select value={editPosition} onValueChange={setEditPosition}>
                                                <SelectTrigger className="h-5 p-0 border-0 bg-transparent focus:ring-0 text-xs font-medium w-full"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="UNKNOWN">—</SelectItem>
                                                    <SelectItem value="GOALKEEPER">BR</SelectItem>
                                                    <SelectItem value="DEFENDER">OB</SelectItem>
                                                    <SelectItem value="MIDFIELDER">PO</SelectItem>
                                                    <SelectItem value="ATTACKER">NA</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : <p className="font-medium text-xs truncate">{translatePosition(member.fieldPosition)}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* RENDEROWANIE RÓL Z KOLORAMI */}
                            <div className={cn(isEditing && "space-y-1 pt-1 border-t border-dashed", !isEditing && "pt-1")}>
                                {isEditing && <p className="text-[10px] font-semibold text-muted-foreground">Role</p>}
                                <div className="flex flex-wrap gap-1.5">
                                    {(isEditing ? currentRoles : (member.roles || [])).map((r: string) => {
                                        const config = ROLE_CONFIG[r] || DEFAULT_ROLE_CONFIG
                                        return (
                                            <Badge
                                                key={r}
                                                variant="outline"
                                                className={cn("px-1.5 py-0 text-[10px] font-medium border transition-colors", config.className, isEditing && "cursor-pointer hover:opacity-80 pr-1")}
                                                onClick={isEditing ? () => toggleRole(r) : undefined}
                                            >
                                                {config.label} {isEditing && <XCircle className="h-2.5 w-2.5 ml-1" />}
                                            </Badge>
                                        )
                                    })}
                                </div>
                                {isEditing && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {AVAILABLE_ROLES.filter(r => !currentRoles.includes(r)).map(r => {
                                            const config = ROLE_CONFIG[r] || DEFAULT_ROLE_CONFIG
                                            return (
                                                <Badge key={r} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-1.5 py-0 text-[10px] border-dashed opacity-70 hover:opacity-100" onClick={() => toggleRole(r)}>
                                                    {config.label} <PlusCircle className="h-2.5 w-2.5 ml-1" />
                                                </Badge>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* PASEK AKCJI */}
                        <div className="flex flex-col gap-1 items-center justify-center border-l bg-muted/5 p-1 min-w-[40px]">
                            {isEditing ? (
                                <>
                                    <button onClick={handleSaveClick} className="p-1.5 rounded-md transition-all bg-green-500 text-white hover:bg-green-600 shadow-sm" title="Zapisz"><Save className="h-4 w-4" /></button>
                                    <button onClick={onEditCancel} className="p-1.5 rounded-md transition-all bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-400" title="Anuluj"><X className="h-4 w-4" /></button>
                                </>
                            ) : (
                                <>
                                    <button onClick={onView} className="p-1.5 rounded-md transition-all hover:bg-green-500/10 text-muted-foreground hover:text-green-600 group/btn" title="Zobacz profil"><Eye className="h-4 w-4 group-hover/btn:scale-110 transition-transform" /></button>

                                    {canManage && isGlobalEditMode && (
                                        <>
                                            <button onClick={onEditStart} className="p-1.5 rounded-md transition-all hover:bg-blue-500/10 text-muted-foreground hover:text-blue-600 group/btn" title="Edytuj"><Edit className="h-4 w-4 group-hover/btn:scale-110 transition-transform" /></button>
                                            <button onClick={onDelete} className="p-1.5 rounded-md transition-all hover:bg-red-500/10 text-muted-foreground hover:text-red-600 group/btn" title="Usuń"><Trash2 className="h-4 w-4 group-hover/btn:scale-110 transition-transform" /></button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function StatusBadge({ status }: { status: string }) {
    const s = (status || 'SUSPENDED').toUpperCase()
    let styles = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700'
    if (s === 'ACTIVE') styles = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
    else if (s === 'REJECTED') styles = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
    else if (['WAITING', 'PENDING', 'WAITING_FOR_VERIFICATION'].includes(s)) styles = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'

    const label: Record<string, string> = {
        ACTIVE: 'Aktywny',
        WAITING: 'Oczekujący',
        PENDING: 'Oczekujący',
        WAITING_FOR_VERIFICATION: 'Oczekujący',
        ARCHIVED: 'Zarchiwizowany',
        SUSPENDED: 'Zawieszony',
        REJECTED: 'Odrzucony'
    }
    return <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border font-bold uppercase tracking-wide shadow-sm whitespace-nowrap", styles)}>{label[s] || s}</span>
}

export default TeamDetailsPage