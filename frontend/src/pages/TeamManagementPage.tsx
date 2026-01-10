import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addMemberManually, TEAM_ROLES } from '@/lib/userApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const schema = z.object({
    teamId: z.coerce.number().int().positive('Podaj poprawne ID zespołu'),
    memberId: z.coerce.number().int().positive('Podaj poprawne ID członka'),
    role: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function TeamManagementPage() {
    useEffect(() => {
        const prev = document.title
        document.title = 'Zarządzanie zespołem'
        return () => { document.title = prev }
    }, [])

    const form = useForm<FormValues>({
        mode: 'onSubmit',
        resolver: zodResolver(schema) as any,
        defaultValues: { teamId: 0, memberId: 0, role: undefined },
    })

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        try {
            await addMemberManually(values.teamId, { memberId: values.memberId, initialRoles: values.role ? [values.role] : undefined })
            toast.success('Dodano członka (ręcznie)')
            form.reset()
        } catch (err: any) {
            toast.error('Nie udało się dodać', { description: err?.message || 'Spróbuj ponownie' })
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold">Zarządzanie zespołem</h1>
                </div>
            </header>
            <main className="container py-8 space-y-8">
                <section className="max-w-xl rounded-lg border bg-card p-6 shadow-sm">
                    <h2 className="text-lg font-semibold">Dodaj członka ręcznie</h2>
                    <p className="text-sm text-muted-foreground mb-4">Wprowadź ID zespołu oraz ID członka. Opcjonalnie wybierz rolę startową.</p>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="teamId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ID zespołu</FormLabel>
                                        <FormControl>
                                            <Input type="number" inputMode="numeric" placeholder="np. 123" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="memberId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ID członka</FormLabel>
                                        <FormControl>
                                            <Input type="number" inputMode="numeric" placeholder="np. 456" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rola (opcjonalnie)</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Wybierz rolę" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {TEAM_ROLES.map((role) => (
                                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex gap-2">
                                <Button type="submit">Dodaj członka</Button>
                                <Button type="button" variant="outline" onClick={() => form.reset()}>Wyczyść</Button>
                            </div>
                        </form>
                    </Form>
                </section>
                <section className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
                    <p>Lista członków zespołu i inne akcje (zatwierdzanie, usuwanie) mogą zostać dodane tutaj później.</p>
                </section>
            </main>
        </div>
    )
}

export default TeamManagementPage
