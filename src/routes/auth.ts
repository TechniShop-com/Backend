import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../db.js';

export const authRouter = Router();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, key] = stored.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

// POST /api/auth/register - Rejestracja nowego użytkownika
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Wypełnij wszystkie pola (imię, email, hasło)' });
    }

    const trimmedName = String(name).trim();
    const normalizedEmail = String(email).toLowerCase().trim();

    if (password.length < 6) {
      return res.status(400).json({ error: 'Hasło musi mieć co najmniej 6 znaków' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Użytkownik o podanym adresie email już istnieje' });
    }

    const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(trimmedName)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

    const newUser = await prisma.user.create({
      data: {
        name: trimmedName,
        email: normalizedEmail,
        password: hashPassword(password),
        avatarUrl,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: 'Rejestracja zakończona sukcesem',
      user: newUser,
    });
  } catch (error) {
    console.error('Błąd rejestracji:', error);
    return res.status(500).json({ error: 'Wystąpił błąd podczas rejestracji użytkownika' });
  }
});

// POST /api/auth/login - Logowanie użytkownika
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Wprowadź adres email i hasło' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Nieprawidłowy adres email lub hasło' });
    }

    return res.json({
      message: 'Logowanie udane',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Błąd logowania:', error);
    return res.status(500).json({ error: 'Wystąpił błąd podczas logowania' });
  }
});

// GET /api/auth/user/:id - Szczegóły profilu użytkownika
authRouter.get('/user/:id', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Nie znaleziono użytkownika' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Błąd pobierania danych użytkownika:', error);
    return res.status(500).json({ error: 'Wystąpił błąd serwera' });
  }
});
