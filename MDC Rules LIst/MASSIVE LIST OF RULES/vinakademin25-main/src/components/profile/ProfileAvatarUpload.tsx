'use client'

import React, { useState, ChangeEvent } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface ProfileAvatarUploadProps {
  userId: string
  currentAvatarUrl?: string | null
  userName?: string // For fallback initials
  onUploadSuccess?: (newAvatarUrl: string) => void // Callback after successful upload
}

// Simulate upload function (Swedish messages)
async function uploadAvatar(
  userId: string,
  file: File,
): Promise<{ success: boolean; message: string; data?: { url: string } }> {
  console.log('Laddar upp profilbild för användare:', userId, file.name)
  await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate network delay

  // Replace with actual API call to Payload backend
  // Example using FormData:
  // const formData = new FormData();
  // formData.append('file', file);
  // formData.append('userId', userId); // Add necessary data
  // const response = await fetch('/api/users/upload-avatar', { // Or directly to Payload endpoint
  //   method: 'POST',
  //   body: formData,
  //   // Add authentication headers if needed
  // });
  // const result = await response.json();
  // return { success: response.ok, message: result.message, data: result.data };

  // Simulation
  if (file.type.startsWith('image/')) {
    const simulatedUrl = URL.createObjectURL(file) // Use blob URL for immediate preview in simulation
    return { success: true, message: 'Profilbild uppdaterad!', data: { url: simulatedUrl } }
  } else {
    return { success: false, message: 'Ogiltig filtyp. Ladda upp en bild.' }
  }
}

export function ProfileAvatarUpload({
  userId,
  currentAvatarUrl,
  userName,
  onUploadSuccess,
}: ProfileAvatarUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Ogiltig fil', description: 'Välj en bildfil.', variant: 'destructive' }) // Swedish
        setSelectedFile(null)
        setPreviewUrl(null)
        return
      }
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setSelectedFile(null)
      setPreviewUrl(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsLoading(true)
    try {
      const result = await uploadAvatar(userId, selectedFile)
      if (result.success && result.data?.url) {
        toast({ title: 'Klart', description: result.message }) // Swedish
        setSelectedFile(null)
        setPreviewUrl(null)
        if (onUploadSuccess) {
          onUploadSuccess(result.data.url)
        }
      } else {
        toast({ title: 'Fel', description: result.message, variant: 'destructive' }) // Swedish
      }
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast({
        title: 'Fel',
        description: 'Kunde inte ladda upp profilbild.',
        variant: 'destructive',
      }) // Swedish
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return 'A' // Användare -> A
    const names = name.trim().split(' ')
    if (names.length === 1 && names[0].length > 0) return names[0][0].toUpperCase()
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return 'A' // Fallback
  }

  const displayUrl = previewUrl || currentAvatarUrl

  return (
    <div className="space-y-4 flex flex-col items-center">
      <Avatar className="h-24 w-24">
        {displayUrl ? (
          <AvatarImage
            src={displayUrl}
            alt={userName ? `${userName} profilbild` : 'Användarprofilbild'}
          /> // Swedish alt
        ) : (
          <AvatarFallback>{getInitials(userName)}</AvatarFallback>
        )}
      </Avatar>

      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="avatar-upload">
          {selectedFile ? `Vald fil: ${selectedFile.name}` : 'Välj en ny profilbild'}{' '}
          {/* Swedish */}
        </Label>
        <Input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isLoading}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
        />
      </div>

      {selectedFile && (
        <Button onClick={handleUpload} disabled={isLoading} className="w-full max-w-sm">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoading ? 'Laddar upp...' : 'Ladda upp ny bild'} {/* Swedish */}
        </Button>
      )}
    </div>
  )
}
