import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
// Remove cookies import as we'll use req.headers
// import { cookies } from 'next/headers'
import config from '../../../../payload.config'

// This API route will handle authentication check for protected API routes
export async function GET(req: NextRequest) {
  try {
    // Get the payload instance with config
    const payload = await getPayload({ config })

    // Get the cookie string directly from the incoming request headers
    const cookieString = req.headers.get('cookie') || ''

    // Verify authentication using the payload auth method with headers
    // Pass the raw cookie string in the expected format
    const { user } = await payload.auth({
      headers: new Headers({
        Cookie: cookieString,
      }),
    })

    if (!user) {
      return NextResponse.json(
        {
          authenticated: false,
          message: 'User is not authenticated',
        },
        { status: 401 },
      )
    }

    // Check for account status
    if (user.accountStatus !== 'active') {
      return NextResponse.json(
        {
          authenticated: false,
          message: 'Account is suspended or deactivated',
        },
        { status: 403 },
      )
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        accountStatus: user.accountStatus,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json(
      {
        authenticated: false,
        message: 'Authentication failed',
      },
      { status: 401 },
    )
  }
}
