import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../../../lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim().toLowerCase()

    // Query Firestore to check if a user exists with this email
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('email', '==', trimmedEmail))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return NextResponse.json({
        success: false,
        exists: false,
        error: 'No user found with this email address.'
      })
    }

    return NextResponse.json({
      success: true,
      exists: true
    })
  } catch (error) {
    console.error('Error checking email:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred while checking the email address' },
      { status: 500 }
    )
  }
}

