import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../db.js';
import { sendRegistrationEmail, sendLoginNotificationEmail } from '../services/email.js';

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

    // Wysłanie maila powitalnego o pomyślnej rejestracji (non-blocking)
    sendRegistrationEmail(newUser.email, newUser.name).catch((err) => {
      console.error('Błąd asynchronicznej wysyłki maila rejestracyjnego:', err);
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

    // Wysłanie powiadomienia email o pomyślnym zalogowaniu (non-blocking)
    sendLoginNotificationEmail(user.email, user.name).catch((err) => {
      console.error('Błąd asynchronicznej wysyłki maila o logowaniu:', err);
    });

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

// POST /api/auth/google - Logowanie i rejestracja przez Google
authRouter.post('/google', async (req: Request, res: Response) => {
  try {
    const { email, name, avatarUrl } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Brak adresu email z konta Google' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const displayName = String(name || email.split('@')[0]).trim();

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    let isNewUser = false;

    if (!user) {
      // Rejestracja nowego użytkownika z danymi pobranymi od Google
      isNewUser = true;
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const finalAvatar = avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: displayName,
          password: hashPassword(randomPassword),
          avatarUrl: finalAvatar,
        },
      });

      // Powiadomienie e-mail o rejestracji (non-blocking)
      sendRegistrationEmail(user.email, user.name).catch((err) => {
        console.error('Błąd wysyłki maila powitalnego Google:', err);
      });
    } else {
      // Jeśli użytkownik nie ma jeszcze avatara, a Google go podaje, zaktualizujmy go
      if (!user.avatarUrl && avatarUrl) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl },
        });
      }

      // Powiadomienie e-mail o logowaniu (non-blocking)
      sendLoginNotificationEmail(user.email, user.name).catch((err) => {
        console.error('Błąd wysyłki maila o logowaniu Google:', err);
      });
    }

    return res.json({
      message: isNewUser ? 'Pomyślnie zarejestrowano przez Google' : 'Logowanie przez Google udane',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Błąd logowania przez Google:', error);
    return res.status(500).json({ error: 'Wystąpił błąd podczas logowania przez Google' });
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

// PUT /api/auth/user/:id - Aktualizacja danych profilu użytkownika
authRouter.put('/user/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, avatarUrl, password, newPassword, currentPassword } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Nie znaleziono użytkownika' });
    }

    // Jeśli zmieniany jest email, sprawdzamy unikalność
    if (email && email.toLowerCase() !== existingUser.email.toLowerCase()) {
      const emailTaken = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          NOT: { id },
        },
      });

      if (emailTaken) {
        return res.status(400).json({ error: 'Podany adres email jest już zajęty przez inne konto' });
      }
    }

    const dataToUpdate: Record<string, any> = {};
    if (typeof name === 'string' && name.trim()) {
      dataToUpdate.name = name.trim();
    }
    if (typeof email === 'string' && email.trim()) {
      dataToUpdate.email = email.toLowerCase().trim();
    }
    if (typeof avatarUrl === 'string') {
      dataToUpdate.avatarUrl = avatarUrl;
    }

    const targetPassword = password || newPassword;
    if (targetPassword) {
      if (typeof targetPassword !== 'string' || targetPassword.length < 6) {
        return res.status(400).json({ error: 'Hasło musi mieć co najmniej 6 znaków' });
      }
      if (currentPassword && !verifyPassword(currentPassword, existingUser.password)) {
        return res.status(400).json({ error: 'Aktualne hasło jest niepoprawne' });
      }
      dataToUpdate.password = hashPassword(targetPassword);
    }

    dataToUpdate.updatedAt = new Date();

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({
      message: 'Profil został pomyślnie zaktualizowany',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Błąd aktualizacji danych użytkownika:', error);
    return res.status(500).json({ error: 'Wystąpił błąd podczas aktualizacji danych użytkownika' });
  }
});
