import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const getUser = async () => {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const { user } = await payload.auth({ headers })
    return { user, payload }
  } catch (error) {
    console.error('Error getting user:', error)
    return { user: null, payload: null }
  }
}
