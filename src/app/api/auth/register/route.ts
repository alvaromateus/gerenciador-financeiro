import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { UserModel } from '@/models';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    await connectToDatabase();
    
    const existingUser = await UserModel.findOne({ username });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    await UserModel.create({
      id: userId,
      username,
      passwordHash,
    });

    const token = await signToken({ userId, username });

    const response = NextResponse.json({ success: true, user: { id: userId, username } });
    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
