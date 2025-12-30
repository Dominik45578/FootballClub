import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

interface Player {
    id: number
    name: string
    position: string
    goals: number
}

const fetchPlayers = async (): Promise<Player[]> => {
    const res = await fetch('/api/players')
    if (!res.ok) throw new Error('Nie udało się pobrać danych')
    return res.json()
}

export function PlayersTable() {
    const { data: players, isLoading, error } = useQuery({
        queryKey: ['players'],
        queryFn: fetchPlayers,
    })

    if (isLoading) {
        return <Skeleton className="h-96 w-full rounded-lg" />
    }

    if (error) {
        return <div className="text-red-500">Błąd ładowania danych</div>
    }

    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle className="text-2xl">Zawodnicy</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Imię i nazwisko</TableHead>
                            <TableHead>Pozycja</TableHead>
                            <TableHead className="text-right">Bramki</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {players?.map((player) => (
                            <TableRow key={player.id}>
                                <TableCell className="font-medium">{player.name}</TableCell>
                                <TableCell>{player.position}</TableCell>
                                <TableCell className="text-right">{player.goals}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}