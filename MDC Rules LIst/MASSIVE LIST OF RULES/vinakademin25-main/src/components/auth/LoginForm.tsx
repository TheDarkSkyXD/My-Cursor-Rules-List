'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Define Zod schema for validation (Swedish messages)
const LoginSchema = z.object({
  email: z.string().email({ message: 'Ogiltig e-postadress.' }),
  password: z.string().min(1, { message: 'Lösenord krävs.' }),
})

type LoginFormValues = z.infer<typeof LoginSchema>

export function LoginForm() {
  const { loginUser, isLoading } = useAuth()
  const router = useRouter()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: LoginFormValues) {
    const success = await loginUser(values)
    if (success) {
      // Redirect to Swedish dashboard path ('My Pages')
      router.push('/mina-sidor')
    }
    // Error handling is done within loginUser via toasts
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Logga in</CardTitle>
        <CardDescription>
          Ange din e-postadress nedan för att logga in på ditt konto.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-post</FormLabel>
                  <FormControl>
                    <Input placeholder="namn@exempel.com" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lösenord</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Loggar in...' : 'Logga in'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
